const pool = require('../config/database');
const AppError = require('../errors/AppError');
const budgetService = require('./budget.service');
const { getPeriodSettings } = require('./period');
const { todayInTimeZone } = require('./recurrence.rules');
const { budgetLevel, financialPeriod, addDays } = require('./notification.rules');

async function preferences(userId) {
  const [rows] = await pool.execute(
    'SELECT budget_enabled, recurrence_enabled, muted_until FROM notification_preferences WHERE user_id = ? LIMIT 1',
    [userId],
  );
  const row = rows[0];
  return {
    budgetEnabled: row ? Boolean(row.budget_enabled) : true,
    recurrenceEnabled: row ? Boolean(row.recurrence_enabled) : true,
    mutedUntil: row?.muted_until ? new Date(row.muted_until).toISOString() : null,
  };
}

async function updatePreferences(userId, input) {
  const { budgetEnabled, recurrenceEnabled, muteDays } = input;
  if (typeof budgetEnabled !== 'boolean' || typeof recurrenceEnabled !== 'boolean'
    || ![0, 1, 7, 30].includes(muteDays)) {
    throw new AppError('Escolha preferências válidas.', 422, 'invalid_notification_preferences');
  }
  await pool.execute(
    `INSERT INTO notification_preferences (user_id, budget_enabled, recurrence_enabled, muted_until)
     VALUES (?, ?, ?, CASE WHEN ? = 0 THEN NULL ELSE DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY) END)
     ON DUPLICATE KEY UPDATE budget_enabled = VALUES(budget_enabled),
       recurrence_enabled = VALUES(recurrence_enabled), muted_until = VALUES(muted_until)`,
    [userId, budgetEnabled, recurrenceEnabled, muteDays, muteDays],
  );
  return preferences(userId);
}

async function insertEvent(userId, eventKey, type, title, message, link) {
  await pool.execute(
    `INSERT IGNORE INTO notifications (user_id, event_key, type, title, message, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, eventKey, type, title, message, link],
  );
}

async function generate(userId, now = new Date()) {
  const prefs = await preferences(userId);
  if (prefs.mutedUntil && new Date(prefs.mutedUntil) > now) return;
  const { startDay, timeZone } = await getPeriodSettings(userId);
  const today = todayInTimeZone(now, timeZone);
  if (prefs.budgetEnabled) {
    const period = financialPeriod(today, startDay);
    const budgets = await budgetService.listByUser(userId, period);
    for (const budget of budgets) {
      const level = budgetLevel(budget.percentageUsed);
      if (!level) continue;
      const suffix = level === 'warning' ? 'atingiu 80% do limite'
        : level === 'limit' ? 'atingiu o limite' : 'ultrapassou o limite';
      await insertEvent(
        userId, `budget:${budget.id}:${period.year}-${period.month}:${level}`, 'BUDGET',
        `Orçamento de ${budget.category.name}`, `${budget.category.name} ${suffix} neste mês financeiro.`, '#planejamento',
      );
    }
  }
  if (prefs.recurrenceEnabled) {
    const [rows] = await pool.execute(
      `SELECT id, description, schedule_version, next_cycle_index,
        DATE_FORMAT(next_run_date, '%Y-%m-%d') AS next_run_date
       FROM recurrences WHERE user_id = ? AND status = 'ACTIVE'
         AND next_run_date >= ? AND next_run_date <= ?`,
      [userId, today, addDays(today, 3)],
    );
    for (const row of rows) {
      await insertEvent(
        userId, `recurrence:${row.id}:${row.schedule_version}:${row.next_cycle_index}`, 'RECURRENCE',
        `Próximo lançamento: ${row.description}`, `Programado para ${row.next_run_date}. Confira em Recorrências.`, '#recorrencias',
      );
    }
  }
}

async function list(userId) {
  const prefs = await preferences(userId);
  if (prefs.mutedUntil && new Date(prefs.mutedUntil) > new Date()) {
    return { notifications: [], unreadCount: 0, preferences: prefs };
  }
  const [rows, countRows] = await Promise.all([
    pool.execute(
    `SELECT id, type, title, message, link, created_at, read_at
     FROM notifications WHERE user_id = ? AND silenced_at IS NULL
     ORDER BY created_at DESC, id DESC LIMIT 50`, [userId],
    ),
    pool.execute('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL AND silenced_at IS NULL', [userId]),
  ]);
  return {
    notifications: rows[0].map((row) => ({
      id: row.id, type: row.type, title: row.title, message: row.message,
      link: row.link, createdAt: row.created_at, read: Boolean(row.read_at),
    })),
    unreadCount: Number(countRows[0][0].total),
    preferences: prefs,
  };
}

async function changeNotification(userId, id, action) {
  const column = action === 'read' ? 'read_at' : 'silenced_at';
  const [result] = await pool.execute(
    `UPDATE notifications SET ${column} = COALESCE(${column}, UTC_TIMESTAMP()) WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  if (!result.affectedRows) throw new AppError('Aviso não encontrado.', 404, 'notification_not_found');
}

async function generateForAllUsers() {
  const [rows] = await pool.execute('SELECT id FROM users');
  for (const row of rows) await generate(row.id);
}

module.exports = { preferences, updatePreferences, generate, generateForAllUsers, list, changeNotification };
