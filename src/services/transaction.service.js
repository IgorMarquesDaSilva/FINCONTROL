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
    t.recurrence_id,
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
    recurrenceId: row.recurrence_id,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
  };
}

function listConditions(userId, filters) {
  const conditions = ['t.user_id = ?'];
  const parameters = [userId];
  if (filters.type) { conditions.push('t.type = ?'); parameters.push(filters.type); }
  if (filters.categoryId) { conditions.push('t.category_id = ?'); parameters.push(filters.categoryId); }
  if (filters.dateFrom) { conditions.push('t.transaction_date >= ?'); parameters.push(filters.dateFrom); }
  if (filters.dateTo) { conditions.push('t.transaction_date <= ?'); parameters.push(filters.dateTo); }
  if (filters.minAmount !== null) { conditions.push('t.amount >= ?'); parameters.push(filters.minAmount); }
  if (filters.maxAmount !== null) { conditions.push('t.amount <= ?'); parameters.push(filters.maxAmount); }
  if (filters.search) { conditions.push('LOWER(t.description) LIKE LOWER(?)'); parameters.push(`%${filters.search}%`); }
  return { sql: conditions.join(' AND '), parameters };
}

async function listByUser(userId, filters) {
  const { sql, parameters } = listConditions(userId, filters);
  const sortColumn = filters.sort === 'amount' ? 't.amount' : 't.transaction_date';
  const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';
  const offset = (filters.page - 1) * filters.pageSize;
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM transactions t WHERE ${sql}`,
    parameters,
  );
  const totalItems = Number(countRows[0].total);
  const [rows] = await pool.execute(
    `${TRANSACTION_SELECT}
     WHERE ${sql}
     ORDER BY ${sortColumn} ${sortOrder}, t.transaction_date ${sortOrder}, t.id ${sortOrder}
     LIMIT ${filters.pageSize} OFFSET ${offset}`,
    parameters,
  );
  const totalPages = Math.ceil(totalItems / filters.pageSize);

  return {
    transactions: rows.map(mapTransaction),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      totalItems,
      totalPages,
      hasPrevious: filters.page > 1,
      hasNext: filters.page < totalPages,
    },
  };
}

async function listCategoriesByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name, type FROM categories
     WHERE user_id = ? ORDER BY name ASC, id ASC`,
    [userId],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, type: row.type }));
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

async function remove(userId, transactionId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const transaction = await findByUser(userId, transactionId, connection);

    if (!transaction) {
      throw new AppError('Movimentacao nao encontrada.', 404, 'transaction_not_found');
    }

    const [result] = await connection.execute(
      `DELETE FROM transactions
       WHERE id = ? AND user_id = ?`,
      [transactionId, userId],
    );

    if (result.affectedRows !== 1) {
      throw new AppError('Nao foi possivel excluir a movimentacao.', 409, 'transaction_delete_conflict');
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

module.exports = { getByUser, listByUser, listCategoriesByUser, remove, update };
