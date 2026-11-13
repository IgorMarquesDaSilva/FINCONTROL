const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');
const service = require('../src/services/recurrence.service');

test('geração recorrente é idempotente e pausar/cancelar preserva o histórico', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const email = `recurrence-${Date.now()}@fincontrol.local`;
  let userId;
  const post = (cookie, path, data = {}) => fetch(`${base}/api/recurrences${path}`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  try {
    const registration = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pessoa Recorrente', email, password: 'SenhaTeste123', passwordConfirmation: 'SenhaTeste123' }),
    });
    assert.equal(registration.status, 201);
    userId = (await registration.json()).user.id;
    const cookie = registration.headers.get('set-cookie').split(';')[0];

    const monthly = await post(cookie, '/', {
      type: 'EXPENSE', description: 'Aluguel', amount: '300.00', categoryName: 'Moradia',
      frequency: 'MONTHLY', startDate: '2027-01-31', endDate: '2027-03-31',
    });
    assert.equal(monthly.status, 201);
    const monthlyId = (await monthly.json()).recurrence.id;
    await service.generateDue(userId, new Date('2027-01-31T02:59:00Z'));
    const [beforeLocalMidnight] = await pool.execute('SELECT COUNT(*) AS total FROM transactions WHERE recurrence_id = ?', [monthlyId]);
    assert.equal(beforeLocalMidnight[0].total, 0);
    await service.generateDue(userId, new Date('2027-01-31T03:00:00Z'));
    const [afterLocalMidnight] = await pool.execute('SELECT COUNT(*) AS total FROM transactions WHERE recurrence_id = ?', [monthlyId]);
    assert.equal(afterLocalMidnight[0].total, 1);
    await Promise.all([
      service.generateDue(userId, new Date('2027-04-01T03:00:00Z')),
      service.generateDue(userId, new Date('2027-04-01T03:00:00Z')),
    ]);
    const [monthlyRows] = await pool.execute(
      `SELECT DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date
       FROM transactions WHERE recurrence_id = ? ORDER BY transaction_date`, [monthlyId],
    );
    assert.deepEqual(monthlyRows.map((row) => row.date), ['2027-01-31', '2027-02-28', '2027-03-31']);
    assert.equal((await service.get(userId, monthlyId)).status, 'COMPLETED');

    const weekly = await post(cookie, '/', {
      type: 'INCOME', description: 'Mesada', amount: '25.00', categoryName: 'Mesada',
      frequency: 'WEEKLY', startDate: '2027-05-01', endDate: '',
    });
    assert.equal(weekly.status, 201);
    const weeklyId = (await weekly.json()).recurrence.id;
    assert.equal((await post(cookie, `/${weeklyId}/pause`)).status, 200);
    await service.generateDue(userId, new Date('2027-05-09T03:00:00Z'));
    const [pausedRows] = await pool.execute('SELECT COUNT(*) AS total FROM transactions WHERE recurrence_id = ?', [weeklyId]);
    assert.equal(pausedRows[0].total, 0);
    await service.changeStatus(userId, weeklyId, 'resume', new Date('2027-05-08T03:00:00Z'));
    await service.generateDue(userId, new Date('2027-05-08T03:00:00Z'));
    assert.equal((await service.get(userId, weeklyId)).nextRunDate, '2027-05-15');
    const edited = await fetch(`${base}/api/recurrences/${weeklyId}`, {
      method: 'PUT', headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'INCOME', description: 'Mesada ajustada', amount: '30.00',
        categoryName: 'Mesada', frequency: 'WEEKLY', startDate: '2027-05-01', endDate: '' }),
    });
    assert.equal(edited.status, 200);
    await service.generateDue(userId, new Date('2027-05-15T03:00:00Z'));
    const [amounts] = await pool.execute(
      'SELECT CAST(amount AS CHAR) AS amount FROM transactions WHERE recurrence_id = ? ORDER BY transaction_date', [weeklyId],
    );
    assert.deepEqual(amounts.map((row) => Number(row.amount)), [25, 30]);
    assert.equal((await post(cookie, `/${weeklyId}/cancel`)).status, 200);
    await service.generateDue(userId, new Date('2027-06-01T03:00:00Z'));
    const [afterCancel] = await pool.execute('SELECT COUNT(*) AS total FROM transactions WHERE recurrence_id = ?', [weeklyId]);
    assert.equal(afterCancel[0].total, 2);
    assert.equal((await service.get(userId, weeklyId)).status, 'CANCELED');
  } finally {
    if (userId) {
      await pool.execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM recurrences WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    }
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
