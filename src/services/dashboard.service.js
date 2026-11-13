const pool = require('../config/database');
const { buildDashboardSummary } = require('./dashboard.rules');
const { periodBounds, getPeriodSettings } = require('./period');

async function monthly(userId, { year, month }) {
  const { startDay } = await getPeriodSettings(userId);
  const { start, end } = periodBounds(year, month, startDay);
  const [summaryResult, transactionResult] = await Promise.all([
    pool.execute(
      `SELECT
          CAST(COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS CHAR) AS income,
          CAST(COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS CHAR) AS expense,
          COUNT(*) AS transaction_count
        FROM transactions
        WHERE user_id = ? AND transaction_date >= ? AND transaction_date < ?`,
      [userId, start, end],
    ),
    pool.execute(
      `SELECT t.id, t.type, t.description, CAST(t.amount AS CHAR) AS amount,
          DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
          t.created_at, t.updated_at, c.id AS category_id, c.name AS category_name
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
        WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?
        ORDER BY t.transaction_date DESC, t.created_at DESC, t.id DESC
        LIMIT 8`,
      [userId, start, end],
    ),
  ]);
  const summaryRow = summaryResult[0][0];
  const recentRows = transactionResult[0];

  return {
    period: { year, month },
    ...buildDashboardSummary(summaryRow.income, summaryRow.expense, summaryRow.transaction_count),
    recentTransactions: recentRows.map((row) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      amount: Number(row.amount),
      transactionDate: row.transaction_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: { id: row.category_id, name: row.category_name },
    })),
  };
}

module.exports = { monthly };
