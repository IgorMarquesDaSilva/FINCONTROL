const pool = require('../config/database');
const AppError = require('../errors/AppError');

function mapIncome(row) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
  };
}

async function listByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
        t.id,
        t.description,
        CAST(t.amount AS CHAR) AS amount,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        t.created_at,
        c.id AS category_id,
        c.name AS category_name
      FROM transactions t
      INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
      WHERE t.user_id = ? AND t.type = 'INCOME'
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 20`,
    [userId],
  );

  return rows.map(mapIncome);
}

async function create(userId, income) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [categoryResult] = await connection.execute(
      `INSERT INTO categories (user_id, name, type)
       VALUES (?, ?, 'INCOME')
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = updated_at`,
      [userId, income.categoryName],
    );

    const categoryId = categoryResult.insertId;
    const [transactionResult] = await connection.execute(
      `INSERT INTO transactions (user_id, category_id, type, description, amount, transaction_date)
       VALUES (?, ?, 'INCOME', ?, ?, ?)`,
      [userId, categoryId, income.description, income.amount, income.transactionDate],
    );

    const [rows] = await connection.execute(
      `SELECT
          t.id,
          t.description,
          CAST(t.amount AS CHAR) AS amount,
          DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
          t.created_at,
          c.id AS category_id,
          c.name AS category_name
        FROM transactions t
        INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
        WHERE t.id = ? AND t.user_id = ?
        LIMIT 1`,
      [transactionResult.insertId, userId],
    );

    if (!rows[0]) {
      throw new AppError('Nao foi possivel cadastrar a receita.', 500, 'income_create_failed');
    }

    await connection.commit();
    return mapIncome(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { create, listByUser };
