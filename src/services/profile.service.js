const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const AppError = require('../errors/AppError');

const DEFAULTS = {
  currency: 'BRL', dateFormat: 'DD/MM/YYYY', timeZone: 'America/Sao_Paulo', monthStartDay: 1,
};

async function get(userId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.created_at, u.session_version,
      p.currency, p.date_format, p.time_zone, p.month_start_day
     FROM users u LEFT JOIN user_preferences p ON p.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId],
  );
  const row = rows[0];
  if (!row) throw new AppError('Conta não encontrada.', 404, 'user_not_found');
  return {
    id: row.id, name: row.name, email: row.email, createdAt: row.created_at,
    session_version: row.session_version,
    preferences: {
      currency: row.currency || DEFAULTS.currency,
      dateFormat: row.date_format || DEFAULTS.dateFormat,
      timeZone: row.time_zone || DEFAULTS.timeZone,
      monthStartDay: Number(row.month_start_day || DEFAULTS.monthStartDay),
    },
  };
}

async function update(userId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT name, email, password_hash FROM users WHERE id = ? LIMIT 1 FOR UPDATE', [userId],
    );
    const existing = rows[0];
    if (!existing) throw new AppError('Conta não encontrada.', 404, 'user_not_found');
    const emailChanged = existing.email !== data.email;
    if (emailChanged && (!data.currentPassword || !(await bcrypt.compare(data.currentPassword, existing.password_hash)))) {
      throw new AppError('Confirme sua senha atual para trocar o e-mail.', 401, 'invalid_current_password', {
        currentPassword: 'Confira sua senha atual.',
      });
    }
    await connection.execute(
      `UPDATE users SET name = ?, email = ?, session_version = session_version + ? WHERE id = ?`,
      [data.name, data.email, emailChanged ? 1 : 0, userId],
    );
    await connection.execute(
      `INSERT INTO user_preferences (user_id, currency, date_format, time_zone, month_start_day)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE currency = VALUES(currency), date_format = VALUES(date_format),
         time_zone = VALUES(time_zone), month_start_day = VALUES(month_start_day)`,
      [userId, data.currency, data.dateFormat, data.timeZone, data.monthStartDay],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('Este e-mail já está em uso.', 409, 'email_in_use', { email: 'Escolha outro e-mail.' });
    }
    throw error;
  } finally {
    connection.release();
  }
  return get(userId);
}

module.exports = { get, update, DEFAULTS };
