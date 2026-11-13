const pool = require('../config/database');

function shiftMonth(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function periodBounds(year, month, startDay = 1) {
  const next = shiftMonth(year, month, 1);
  return { start: dateKey(year, month, startDay), end: dateKey(next.year, next.month, startDay) };
}

async function getPeriodSettings(userId) {
  const [rows] = await pool.execute(
    'SELECT month_start_day, time_zone FROM user_preferences WHERE user_id = ? LIMIT 1', [userId],
  );
  return {
    startDay: Number(rows[0]?.month_start_day || 1),
    timeZone: rows[0]?.time_zone || 'America/Sao_Paulo',
  };
}

module.exports = { shiftMonth, dateKey, periodBounds, getPeriodSettings };
