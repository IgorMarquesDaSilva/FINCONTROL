const pool = require('../config/database');
const { generateInsights } = require('./insights.rules');

function shiftMonth(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function dateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function periodStart(period) {
  return `${period.year}-${String(period.month).padStart(2, '0')}-01`;
}

function periodEnd(period) {
  const next = shiftMonth(period.year, period.month, 1);
  return `${next.year}-${String(next.month).padStart(2, '0')}-01`;
}

function periodWindow(period, now = new Date()) {
  const currentMonth = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const selectedIsFuture = period.year > currentMonth.year
    || (period.year === currentMonth.year && period.month > currentMonth.month);
  if (selectedIsFuture) return null;

  const previousPeriod = shiftMonth(period.year, period.month, -1);
  const selectedIsCurrent = period.year === currentMonth.year && period.month === currentMonth.month;
  if (!selectedIsCurrent) {
    return {
      previousPeriod,
      currentStart: periodStart(period),
      currentEnd: periodEnd(period),
      previousStart: periodStart(previousPeriod),
      previousEnd: periodStart(period),
    };
  }

  const currentDay = now.getUTCDate();
  const previousLastDay = new Date(Date.UTC(previousPeriod.year, previousPeriod.month, 0)).getUTCDate();
  const previousCutoff = Math.min(currentDay, previousLastDay);
  const currentEndDate = new Date(Date.UTC(period.year, period.month - 1, currentDay + 1));
  const previousEndDate = new Date(Date.UTC(previousPeriod.year, previousPeriod.month - 1, previousCutoff + 1));

  return {
    previousPeriod,
    currentStart: periodStart(period),
    currentEnd: dateString(currentEndDate),
    previousStart: periodStart(previousPeriod),
    previousEnd: dateString(previousEndDate),
  };
}

function emptyTotals() {
  return { income: 0, expense: 0, transactionCount: 0 };
}

async function monthly(userId, period, now = new Date()) {
  const window = periodWindow(period, now);
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
