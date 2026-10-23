const pool = require('../config/database');

function shiftMonth(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function periodBounds({ year, month }) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const next = shiftMonth(year, month, 1);
  return { start, end: `${next.year}-${String(next.month).padStart(2, '0')}-01` };
}

async function totalsForPeriod(userId, period) {
  const { start, end } = periodBounds(period);
  const [rows] = await pool.execute(
    `SELECT t.type, COUNT(*) AS transaction_count,
        CAST(COALESCE(SUM(t.amount), 0) AS CHAR) AS total
      FROM transactions t
      WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?
      GROUP BY t.type`,
    [userId, start, end],
  );
  const totals = { income: 0, expense: 0, transactionCount: 0 };
  rows.forEach((row) => {
    totals[row.type === 'INCOME' ? 'income' : 'expense'] = Number(row.total);
    totals.transactionCount += Number(row.transaction_count);
  });
  return totals;
}

async function monthly(userId, period) {
  const previousPeriod = shiftMonth(period.year, period.month, -1);
  const { start, end } = periodBounds(period);
  const [current, previous, categoryResult, topResult] = await Promise.all([
    totalsForPeriod(userId, period),
    totalsForPeriod(userId, previousPeriod),
    pool.execute(
      `SELECT c.name AS category, CAST(SUM(t.amount) AS CHAR) AS total, COUNT(*) AS transaction_count
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
        WHERE t.user_id = ? AND t.type = 'EXPENSE'
          AND t.transaction_date >= ? AND t.transaction_date < ?
        GROUP BY c.id, c.name
        ORDER BY SUM(t.amount) DESC, c.name ASC`,
      [userId, start, end],
    ),
    pool.execute(
      `SELECT t.id, t.description, CAST(t.amount AS CHAR) AS amount,
          DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
          c.name AS category
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
        WHERE t.user_id = ? AND t.type = 'EXPENSE'
          AND t.transaction_date >= ? AND t.transaction_date < ?
        ORDER BY t.amount DESC, t.transaction_date DESC, t.id DESC
        LIMIT 5`,
      [userId, start, end],
    ),
  ]);
  const [categories] = categoryResult;
  const [topExpenses] = topResult;
  const mappedCategories = categories.map((row) => ({
    name: row.category,
    amount: Number(row.total),
    transactionCount: Number(row.transaction_count),
  }));

  return {
    period,
    previousPeriod,
    current: { ...current, balance: current.income - current.expense },
    previous: { ...previous, balance: previous.income - previous.expense },
    expenseCategories: mappedCategories.map((item) => ({
      ...item,
      percentage: current.expense ? (item.amount / current.expense) * 100 : 0,
    })),
    topExpenses: topExpenses.map((row) => ({
      id: row.id,
      description: row.description || 'Sem descrição',
      amount: Number(row.amount),
      transactionDate: row.transaction_date,
      category: row.category,
    })),
  };
}

module.exports = { monthly };
