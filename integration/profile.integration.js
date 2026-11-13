const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

test('perfil protege troca de e-mail e persiste preferências da conta', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const seed = Date.now();
  const original = `perfil-${seed}@fincontrol.local`;
  const another = `perfil-outro-${seed}@fincontrol.local`;
  const changed = `perfil-novo-${seed}@fincontrol.local`;
  const password = 'SenhaTeste123';
  const register = (email) => fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pessoa Teste', email, password, passwordConfirmation: password }),
  });
  const update = (cookie, data) => fetch(`${base}/api/profile`, {
    method: 'PUT', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const data = {
    name: 'Pessoa Atualizada', email: changed, currency: 'USD', dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/Manaus', monthStartDay: 10,
  };
  try {
    const first = await register(original);
    assert.equal(first.status, 201);
    const cookie = first.headers.get('set-cookie').split(';')[0];
    assert.equal((await register(another)).status, 201);

    const withoutPassword = await update(cookie, data);
    assert.equal(withoutPassword.status, 401);
    assert.equal((await withoutPassword.json()).error.code, 'invalid_current_password');

    const duplicate = await update(cookie, { ...data, email: another, currentPassword: password });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, 'email_in_use');

    const saved = await update(cookie, { ...data, currentPassword: password });
    assert.equal(saved.status, 200);
    const body = await saved.json();
    assert.equal(body.profile.email, changed);
    assert.equal(body.profile.preferences.monthStartDay, 10);
    assert.doesNotMatch(JSON.stringify(body), /password_hash|session_version|currentPassword/);
    const newCookie = saved.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(`${base}/api/profile`, { headers: { Cookie: cookie } })).status, 401);
    const reloaded = await fetch(`${base}/api/profile`, { headers: { Cookie: newCookie } });
    assert.equal(reloaded.status, 200);
    assert.equal((await reloaded.json()).profile.preferences.currency, 'USD');
    const [category] = await pool.execute(
      "INSERT INTO categories (user_id, name, type) VALUES (?, 'Teste de período', 'EXPENSE')",
      [body.profile.id],
    );
    await pool.execute(
      `INSERT INTO transactions (user_id, category_id, type, description, amount, transaction_date)
       VALUES (?, ?, 'EXPENSE', 'Antes do início', 12, '2026-11-05'),
              (?, ?, 'EXPENSE', 'Depois do início', 34, '2026-11-10')`,
      [body.profile.id, category.insertId, body.profile.id, category.insertId],
    );
    const november = await fetch(`${base}/api/dashboard?month=2026-11`, { headers: { Cookie: newCookie } });
    assert.equal((await november.json()).dashboard.expense, 34);
    const october = await fetch(`${base}/api/dashboard?month=2026-10`, { headers: { Cookie: newCookie } });
    assert.equal((await october.json()).dashboard.expense, 12);
  } finally {
    await pool.execute('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))', [original, another, changed]);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [original, another, changed]);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
