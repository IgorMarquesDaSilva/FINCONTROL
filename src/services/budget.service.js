const pool = require('../config/database');
const AppError = require('../errors/AppError');
const { mapBudget } = require('./budget.rules');

function periodBounds(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextDate = new Date(Date.UTC(year, month, 1));
  const end = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { start, end };
}

const BUDGET_SELECT = `SELECT b.id, b.user_id, b.category_id,
    b.reference_year, b.reference_month,
    CAST(b.amount AS CHAR) AS limit_amount,
    CAST(COALESCE(SUM(t.amount), 0) AS CHAR) AS spent_amount,
    b.created_at, b.updated_at, c.name AS category_name
  FROM budgets b
  INNER JOIN categories c ON c.id = b.category_id AND c.user_id = b.user_id
  LEFT JOIN transactions t ON t.category_id = b.category_id
    AND t.user_id = b.user_id AND t.type = 'EXPENSE'
    AND t.transaction_date >= ? AND t.transaction_date < ?`;

function budgetFromRows(rows) {
  return rows[0] ? mapBudget(rows[0]) : null;
}

async function listByUser(userId, { year, month }) {
  const { start, end } = periodBounds(year, month);
  const [rows] = await pool.execute(
    `${BUDGET_SELECT}
     WHERE b.user_id = ? AND b.reference_year = ? AND b.reference_month = ?
     GROUP BY b.id, c.name
     ORDER BY c.name ASC, b.id ASC`,
    [start, end, userId, year, month],
  );
  return rows.map(mapBudget);
}

async function listExpenseCategoriesByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name FROM categories
     WHERE user_id = ? AND type IN ('EXPENSE', 'BOTH')
     ORDER BY name ASC, id ASC`,
    [userId],
  );
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

async function getByUser(userId, budgetId) {
  const [periodRows] = await pool.execute(
    `SELECT reference_year, reference_month
     FROM budgets WHERE id = ? AND user_id = ? LIMIT 1`,
    [budgetId, userId],
  );
  const budgetPeriod = periodRows[0];
  if (!budgetPeriod) throw new AppError('Orçamento não encontrado.', 404, 'budget_not_found');

  const { start, end } = periodBounds(Number(budgetPeriod.reference_year), Number(budgetPeriod.reference_month));
  const [rows] = await pool.execute(
    `${BUDGET_SELECT}
     WHERE b.id = ? AND b.user_id = ?
     GROUP BY b.id, c.name
     LIMIT 1`,
    [start, end, budgetId, userId],
  );
  const budget = budgetFromRows(rows);
  if (!budget) throw new AppError('Orçamento não encontrado.', 404, 'budget_not_found');
  return budget;
}

async function ensureExpenseCategory(userId, categoryId) {
  const [rows] = await pool.execute(
    `SELECT id, name, type FROM categories WHERE id = ? AND user_id = ? LIMIT 1`,
    [categoryId, userId],
  );
  const category = rows[0];
  if (!category) throw new AppError('Categoria não encontrada.', 404, 'budget_category_not_found');
  if (category.type !== 'EXPENSE' && category.type !== 'BOTH') {
    throw new AppError('Selecione uma categoria de despesas.', 422, 'budget_category_type_invalid');
  }
}

function isDuplicateEntry(error) {
  return error.code === 'ER_DUP_ENTRY';
}

async function create(userId, data) {
  await ensureExpenseCategory(userId, data.categoryId);
  let result;
  try {
    [result] = await pool.execute(
      `INSERT INTO budgets (user_id, category_id, reference_year, reference_month, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, data.categoryId, data.year, data.month, data.amount],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new AppError('Já existe um orçamento para esta categoria e período.', 409, 'budget_period_conflict');
    }
    throw error;
  }
  return getByUser(userId, result.insertId);
}

async function update(userId, budgetId, data) {
  const [existingRows] = await pool.execute(
    'SELECT id FROM budgets WHERE id = ? AND user_id = ? LIMIT 1',
    [budgetId, userId],
  );
  if (!existingRows[0]) throw new AppError('Orçamento não encontrado.', 404, 'budget_not_found');
  await ensureExpenseCategory(userId, data.categoryId);

  try {
    await pool.execute(
      `UPDATE budgets
       SET category_id = ?, reference_year = ?, reference_month = ?, amount = ?
       WHERE id = ? AND user_id = ?`,
      [data.categoryId, data.year, data.month, data.amount, budgetId, userId],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw new AppError('Já existe um orçamento para esta categoria e período.', 409, 'budget_period_conflict');
    }
    throw error;
  }
  return getByUser(userId, budgetId);
}

async function remove(userId, budgetId) {
  const [result] = await pool.execute(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    [budgetId, userId],
  );
  if (result.affectedRows !== 1) throw new AppError('Orçamento não encontrado.', 404, 'budget_not_found');
  return { id: budgetId };
}

module.exports = { create, getByUser, listByUser, listExpenseCategoriesByUser, remove, update };
