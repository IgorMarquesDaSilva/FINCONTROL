const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

test('fluxo completo de cadastro, sessao, logout e login', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const email = `teste-integracao-${Date.now()}@fincontrol.local`;
  const password = 'SenhaTeste123';

  try {
    const registration = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Teste Integracao',
        email,
        password,
        passwordConfirmation: password,
      }),
    });

    assert.equal(registration.status, 201);
    const registrationBody = await registration.json();
    assert.equal(registrationBody.user.email, email);
    assert.ok(registrationBody.user.id);

    const cookie = registration.headers.get('set-cookie')?.split(';')[0];
    assert.match(cookie, /^fincontrol_session=/);

    const currentUser = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(currentUser.status, 200);
    assert.equal((await currentUser.json()).user.email, email);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).user.email, email);
  } finally {
    await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
