const pool = require('../config/database');
const AppError = require('../errors/AppError');
const { getPeriodSettings } = require('./period');
const { cycleDate, nextIndexOnOrAfter, todayInTimeZone } = require('./recurrence.rules');

const SELECT = `SELECT r.id, r.user_id, r.type, r.description, CAST(r.amount AS CHAR) AS amount,
  r.frequency, DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date,
  DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date,
  r.schedule_version, r.next_cycle_index,
  DATE_FORMAT(r.next_run_date, '%Y-%m-%d') AS next_run_date,
  r.status, c.id AS category_id, c.name AS category_name
  FROM recurrences r INNER JOIN categories c ON c.id = r.category_id AND c.user_id = r.user_id`;

function map(row) {
  return {
    id: row.id, type: row.type, description: row.description, amount: Number(row.amount),
    frequency: row.frequency, startDate: row.start_date, endDate: row.end_date,
    nextRunDate: row.next_run_date, status: row.status,
    category: { id: row.category_id, name: row.category_name },
  };
}

async function list(userId) {
  const [rows] = await pool.execute(`${SELECT} WHERE r.user_id = ? ORDER BY r.created_at DESC, r.id DESC`, [userId]);
  return rows.map(map);
}

async function get(userId, id) {
  const [rows] = await pool.execute(`${SELECT} WHERE r.user_id = ? AND r.id = ? LIMIT 1`, [userId, id]);
  if (!rows[0]) throw new AppError('Recorrência não encontrada.', 404, 'recurrence_not_found');
  return map(rows[0]);
}

async function categoryIdFor(connection, userId, data) {
  const [result] = await connection.execute(
    `INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = updated_at`,
    [userId, data.categoryName, data.type],
  );
  return result.insertId;
}

async function create(userId, data) {
  const connection = await pool.getConnection();
  let id;
  try {
    await connection.beginTransaction();
    const categoryId = await categoryIdFor(connection, userId, data);
    const [result] = await connection.execute(
      `INSERT INTO recurrences (user_id, category_id, type, description, amount, frequency,
        start_date, end_date, next_run_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, categoryId, data.type, data.description, data.amount, data.frequency,
        data.startDate, data.endDate, data.startDate],
    );
    id = result.insertId;
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  await generateDue(userId);
  return get(userId, id);
}

async function update(userId, id, data) {
  const { timeZone } = await getPeriodSettings(userId);
  const today = todayInTimeZone(new Date(), timeZone);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `${SELECT} WHERE r.user_id = ? AND r.id = ? LIMIT 1 FOR UPDATE`, [userId, id],
    );
    const old = rows[0];
    if (!old) throw new AppError('Recorrência não encontrada.', 404, 'recurrence_not_found');
    if (old.status === 'CANCELED') throw new AppError('Uma recorrência cancelada não pode ser editada.', 409, 'recurrence_canceled');
    const categoryId = await categoryIdFor(connection, userId, data);
    const scheduleChanged = old.start_date !== data.startDate || old.frequency !== data.frequency;
    const index = scheduleChanged
      ? nextIndexOnOrAfter(data.startDate, data.frequency, today)
      : old.next_cycle_index;
    const nextDate = cycleDate(data.startDate, data.frequency, index);
    const status = data.endDate && nextDate > data.endDate ? 'COMPLETED'
      : old.status === 'COMPLETED' ? 'ACTIVE' : old.status;
    await connection.execute(
      `UPDATE recurrences SET category_id = ?, type = ?, description = ?, amount = ?, frequency = ?,
        start_date = ?, end_date = ?, schedule_version = schedule_version + ?,
        next_cycle_index = ?, next_run_date = ?, status = ? WHERE id = ? AND user_id = ?`,
      [categoryId, data.type, data.description, data.amount, data.frequency,
        data.startDate, data.endDate, scheduleChanged ? 1 : 0,
        index, nextDate, status, id, userId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  await generateDue(userId);
  return get(userId, id);
}

async function changeStatus(userId, id, action, now = new Date()) {
  const { timeZone } = await getPeriodSettings(userId);
  const today = todayInTimeZone(now, timeZone);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `${SELECT} WHERE r.user_id = ? AND r.id = ? LIMIT 1 FOR UPDATE`, [userId, id],
    );
    const row = rows[0];
    if (!row) throw new AppError('Recorrência não encontrada.', 404, 'recurrence_not_found');
    if (row.status === 'CANCELED') throw new AppError('Esta recorrência já foi cancelada.', 409, 'recurrence_canceled');
    let status = row.status;
    let index = row.next_cycle_index;
    let nextDate = row.next_run_date;
    let versionIncrement = 0;
    if (action === 'pause' && row.status === 'ACTIVE') status = 'PAUSED';
    if (action === 'cancel') status = 'CANCELED';
    if (action === 'resume' && row.status === 'PAUSED') {
      index = Math.max(Number(row.next_cycle_index), nextIndexOnOrAfter(row.start_date, row.frequency, today));
      nextDate = cycleDate(row.start_date, row.frequency, index);
      versionIncrement = 1;
      status = row.end_date && nextDate > row.end_date ? 'COMPLETED' : 'ACTIVE';
    }
    await connection.execute(
      `UPDATE recurrences SET status = ?, next_cycle_index = ?, next_run_date = ?,
        schedule_version = schedule_version + ? WHERE id = ? AND user_id = ?`,
      [status, index, nextDate, versionIncrement, id, userId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return get(userId, id);
}

async function generateDue(userId, now = new Date()) {
  const { timeZone } = await getPeriodSettings(userId);
  const today = todayInTimeZone(now, timeZone);
  const [dueRows] = await pool.execute(
    `SELECT id FROM recurrences WHERE user_id = ? AND status = 'ACTIVE' AND next_run_date <= ?
     ORDER BY next_run_date, id LIMIT 50`, [userId, today],
  );
  for (const due of dueRows) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        `${SELECT} WHERE r.user_id = ? AND r.id = ? LIMIT 1 FOR UPDATE`, [userId, due.id],
      );
      const row = rows[0];
      if (!row || row.status !== 'ACTIVE') { await connection.commit(); continue; }
      let index = Number(row.next_cycle_index);
      let nextDate = row.next_run_date;
      let count = 0;
      while (nextDate <= today && (!row.end_date || nextDate <= row.end_date) && count < 120) {
        await connection.execute(
          `INSERT IGNORE INTO transactions (user_id, category_id, type, description, amount,
            transaction_date, recurrence_id, recurrence_schedule_version, recurrence_cycle_index)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE recurrence_id = ? AND transaction_date = ?)`,
          [userId, row.category_id, row.type, row.description, row.amount,
            nextDate, row.id, row.schedule_version, index, row.id, nextDate],
        );
        index += 1;
        count += 1;
        nextDate = cycleDate(row.start_date, row.frequency, index);
      }
      const status = row.end_date && nextDate > row.end_date ? 'COMPLETED' : 'ACTIVE';
      await connection.execute(
        'UPDATE recurrences SET next_cycle_index = ?, next_run_date = ?, status = ? WHERE id = ? AND user_id = ?',
        [index, nextDate, status, row.id, userId],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  }
}

async function generateDueForAllUsers() {
  const [rows] = await pool.execute("SELECT DISTINCT user_id FROM recurrences WHERE status = 'ACTIVE'");
  for (const row of rows) await generateDue(row.user_id);
}

module.exports = { list, get, create, update, changeStatus, generateDue, generateDueForAllUsers };
