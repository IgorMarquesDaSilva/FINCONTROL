const pool = require('../config/database');
const AppError = require('../errors/AppError');

const TRANSACTION_SELECT = `SELECT
    t.id,
    t.type,
    t.description,
    CAST(t.amount AS CHAR) AS amount,
    DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
    t.created_at,
    t.updated_at,
    c.id AS category_id,
    c.name AS category_name
  FROM transactions t
  INNER JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id`;

function mapTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: Number(row.amount),
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
  };
}

async function findByUser(userId, transactionId, connection = pool) {
  const [rows] = await connection.execute(
    `${TRANSACTION_SELECT}
     WHERE t.id = ? AND t.user_id = ?
     LIMIT 1`,
    [transactionId, userId],
  );

  return rows[0] ? mapTransaction(rows[0]) : null;
}

async function getByUser(userId, transactionId) {
  const transaction = await findByUser(userId, transactionId);

  if (!transaction) {
    throw new AppError('Movimentacao nao encontrada.', 404, 'transaction_not_found');
  }

  return transaction;
}

async function update(userId, transactionId, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [transactionRows] = await connection.execute(
      `SELECT id, type
       FROM transactions
       WHERE id = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [transactionId, userId],
    );
    const currentTransaction = transactionRows[0];

    if (!currentTransaction) {
      throw new AppError('Movimentacao nao encontrada.', 404, 'transaction_not_found');
    }

    const [categoryResult] = await connection.execute(
      `INSERT INTO categories (user_id, name, type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = updated_at`,
      [userId, data.categoryName, currentTransaction.type],
    );

    await connection.execute(
      `UPDATE transactions
       SET category_id = ?, description = ?, amount = ?, transaction_date = ?
       WHERE id = ? AND user_id = ?`,
      [
        categoryResult.insertId,
        data.description,
        data.amount,
        data.transactionDate,
        transactionId,
        userId,
      ],
    );

    const transaction = await findByUser(userId, transactionId, connection);

    if (!transaction) {
      throw new AppError('Nao foi possivel atualizar a movimentacao.', 500, 'transaction_update_failed');
    }

    await connection.commit();
    return transaction;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getByUser, update };
