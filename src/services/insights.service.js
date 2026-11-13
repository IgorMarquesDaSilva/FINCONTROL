const pool = require('../config/database');
const { generateInsights } = require('./insights.rules');
const { shiftMonth, periodBounds, getPeriodSettings } = require('./period');

function dateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function periodWindow(period, now = new Date(), startDay = 1, timeZone = 'UTC') {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type) => Number(dateParts.find((item) => item.type === type).value);
  const localYear = part('year');
  const localMonth = part('month');
  const localDay = part('day');
  const currentMonth = localDay < startDay
    ? shiftMonth(localYear, localMonth, -1)
    : { year: localYear, month: localMonth };
  const selectedIsFuture = period.year > currentMonth.year
    || (period.year === currentMonth.year && period.month > currentMonth.month);
  if (selectedIsFuture) return null;

  const previousPeriod = shiftMonth(period.year, period.month, -1);
  const currentBounds = periodBounds(period.year, period.month, startDay);
  const previousBounds = periodBounds(previousPeriod.year, previousPeriod.month, startDay);
  const selectedIsCurrent = period.year === currentMonth.year && period.month === currentMonth.month;
  if (!selectedIsCurrent) {
    return {
      previousPeriod,
      currentStart: currentBounds.start,
      currentEnd: currentBounds.end,
      previousStart: previousBounds.start,
      previousEnd: previousBounds.end,
    };
  }

  const currentStartDate = new Date(`${currentBounds.start}T00:00:00.000Z`);
  const previousStartDate = new Date(`${previousBounds.start}T00:00:00.000Z`);
  const todayDate = new Date(Date.UTC(localYear, localMonth - 1, localDay));
  const elapsedDays = Math.round((todayDate - currentStartDate) / 86400000) + 1;
  const currentEndDate = new Date(Math.min(todayDate.getTime() + 86400000, new Date(`${currentBounds.end}T00:00:00.000Z`).getTime()));
  const previousEndDate = new Date(Math.min(previousStartDate.getTime() + elapsedDays * 86400000, new Date(`${previousBounds.end}T00:00:00.000Z`).getTime()));

  return {
    previousPeriod,
    currentStart: currentBounds.start,
    currentEnd: dateString(currentEndDate),
    previousStart: previousBounds.start,
    previousEnd: dateString(previousEndDate),
  };
}

function emptyTotals() {
  return { income: 0, expense: 0, transactionCount: 0 };
}

async function monthly(userId, period, now = new Date()) {
  const { startDay, timeZone } = await getPeriodSettings(userId);
  const window = periodWindow(period, now, startDay, timeZone);
  if (!window) {
    return {
      status: 'insufficient_data',
      message: 'O mês selecionado ainda não começou, então não há dados para comparar.',
      minimumTransactionsPerPeriod: 3,
      periods: { currentTransactions: 0, previousTransactions: 0 },
      insights: [],
      period,
      previousPeriod: shiftMonth(period.year, period.month, -1),
    };
  }

  const [rows] = await pool.execute(
    `SELECT
        CASE WHEN t.transaction_date >= ? THEN 'current' ELSE 'previous' END AS period_key,
        t.type,
        c.id AS category_id,
        c.name AS category_name,
        COUNT(*) AS transaction_count,
        CAST(SUM(t.amount) AS CHAR) AS total
      FROM transactions t
      INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
      WHERE t.user_id = ?
        AND ((t.transaction_date >= ? AND t.transaction_date < ?)
          OR (t.transaction_date >= ? AND t.transaction_date < ?))
      GROUP BY period_key, t.type, c.id, c.name`,
    [window.currentStart, userId, window.previousStart, window.previousEnd, window.currentStart, window.currentEnd],
  );

  const current = emptyTotals();
  const previous = emptyTotals();
  const categoryMap = new Map();
  rows.forEach((row) => {
    const target = row.period_key === 'current' ? current : previous;
    const amount = Number(row.total);
    const count = Number(row.transaction_count);
    target[row.type === 'INCOME' ? 'income' : 'expense'] += amount;
    target.transactionCount += count;

    if (row.type !== 'EXPENSE') return;
    const key = String(row.category_id);
    const category = categoryMap.get(key) || {
      categoryId: row.category_id,
      name: row.category_name,
      currentAmount: 0,
      currentCount: 0,
      previousAmount: 0,
      previousCount: 0,
    };
    if (row.period_key === 'current') {
      category.currentAmount = amount;
      category.currentCount = count;
    } else {
      category.previousAmount = amount;
      category.previousCount = count;
    }
    categoryMap.set(key, category);
  });

  const result = generateInsights({
    period,
    previousPeriod: window.previousPeriod,
    current,
    previous,
    categories: [...categoryMap.values()],
  });
  return { ...result, period, previousPeriod: window.previousPeriod };
}

module.exports = { monthly, periodWindow };
