const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');
const service = require('../src/services/notification.service');
const { todayInTimeZone } = require('../src/services/recurrence.rules');
const { financialPeriod, addDays } = require('../src/services/notification.rules');

test('avisos são únicos por evento, respeitam preferências e pertencem ao usuário', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const emails = [`alert-a-${Date.now()}@fincontrol.local`, `alert-b-${Date.now()}@fincontrol.local`];
  let userId;
  const register = async (email) => {
    const response = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pessoa Alerta', email, password: 'SenhaTeste123', passwordConfirmation: 'SenhaTeste123' }),
    });
    assert.equal(response.status, 201);
    return { cookie: response.headers.get('set-cookie').split(';')[0], id: (await response.json()).user.id };
  };
  try {
    const first = await register(emails[0]);
    const second = await register(emails[1]);
    userId = first.id;
    const now = new Date();
    const today = todayInTimeZone(now, 'America/Sao_Paulo');
    const period = financialPeriod(today, 1);
    const [category] = await pool.execute(
      "INSERT INTO categories (user_id, name, type) VALUES (?, 'Moradia', 'EXPENSE')", [userId],
    );
    await pool.execute(
      'INSERT INTO budgets (user_id, category_id, reference_year, reference_month, amount) VALUES (?, ?, ?, ?, 100)',
      [userId, category.insertId, period.year, period.month],
    );
    const [transaction] = await pool.execute(
      `INSERT INTO transactions (user_id, category_id, type, description, amount, transaction_date)
       VALUES (?, ?, 'EXPENSE', 'Gasto', 80, ?)`, [userId, category.insertId, today],
    );
    await service.generate(userId, now);
    await service.generate(userId, now);
    let notices = await service.list(userId);
    assert.equal(notices.notifications.length, 1);
    assert.match(notices.notifications[0].message, /80%/);
    assert.equal(notices.notifications[0].link, '#planejamento');

    await pool.execute('UPDATE transactions SET amount = 100 WHERE id = ?', [transaction.insertId]);
    await service.generate(userId, now);
    await pool.execute('UPDATE transactions SET amount = 110 WHERE id = ?', [transaction.insertId]);
    await service.generate(userId, now);
    notices = await service.list(userId);
    assert.equal(notices.notifications.length, 3);

    const nextDate = addDays(today, 2);
    await pool.execute(
      `INSERT INTO recurrences (user_id, category_id, type, description, amount, frequency,
         start_date, next_run_date) VALUES (?, ?, 'EXPENSE', 'Assinatura', 10, 'MONTHLY', ?, ?)`,
      [userId, category.insertId, nextDate, nextDate],
    );
    await service.generate(userId, now);
    await service.generate(userId, now);
    notices = await service.list(userId);
    assert.equal(notices.notifications.length, 4);
    assert.equal(notices.notifications[0].link, '#recorrencias');
    assert.equal((await service.list(second.id)).notifications.length, 0);

    const prefs = await fetch(`${base}/api/notifications/preferences`, {
      method: 'PUT', headers: { Cookie: first.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgetEnabled: false, recurrenceEnabled: false, muteDays: 1 }),
    });
    assert.equal(prefs.status, 200);
    assert.equal((await prefs.json()).preferences.budgetEnabled, false);
    await pool.execute('UPDATE transactions SET amount = 120 WHERE id = ?', [transaction.insertId]);
    await service.generate(userId, now);
    assert.equal((await service.list(userId)).notifications.length, 0);
    const [stored] = await pool.execute('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?', [userId]);
    assert.equal(stored[0].total, 4);
    await service.updatePreferences(userId, { budgetEnabled: false, recurrenceEnabled: false, muteDays: 0 });

    const target = notices.notifications[0].id;
    const silence = await fetch(`${base}/api/notifications/${target}/silence`, {
      method: 'POST', headers: { Cookie: first.cookie, 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(silence.status, 200);
    assert.equal((await service.list(userId)).notifications.length, 3);
    assert.equal((await fetch(`${base}/api/notifications`, { headers: { Cookie: second.cookie } })).status, 200);
  } finally {
    if (userId) {
      await pool.execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM recurrences WHERE user_id = ?', [userId]);
    }
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', emails);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
