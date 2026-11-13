const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const app = require('../src/app');
const pool = require('../src/config/database');

test('recuperação e alteração de senha usam token único e encerram sessões antigas', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const email = `teste-senha-${Date.now()}@fincontrol.local`;
  const originalPassword = 'SenhaOriginal123';
  const resetPassword = 'SenhaRedefinida123';
  const changedPassword = 'SenhaAlterada123';
  const originalInfo = console.info;
  let capturedResetLink = '';

  const post = (path, body, cookie) => fetch(`${baseUrl}/api/auth${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const waitForResetLink = async () => {
    for (let attempt = 0; attempt < 50 && !capturedResetLink; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return capturedResetLink;
  };

  try {
    const registration = await post('/register', {
      name: 'Teste Recuperação',
      email,
      password: originalPassword,
      passwordConfirmation: originalPassword,
    });
    assert.equal(registration.status, 201);
    const oldCookie = registration.headers.get('set-cookie')?.split(';')[0];
    assert.match(oldCookie, /^fincontrol_session=/);

    const unknown = await post('/password/forgot', { email: 'nao-existe@fincontrol.local' });
    const unknownPayload = await unknown.json();
    assert.equal(unknown.status, 200);

    console.info = (...values) => {
      capturedResetLink = values.join(' ').match(/https?:\/\/\S+/)?.[0] || '';
    };
    const requested = await post('/password/forgot', { email: email.toUpperCase() });
    const requestedPayload = await requested.json();
    assert.equal(requested.status, unknown.status);
    assert.deepEqual(requestedPayload, unknownPayload);
    const deliveredLink = await waitForResetLink();
    const token = new URL(deliveredLink).searchParams.get('resetToken');
    assert.match(token, /^[a-f\d]{64}$/);
    assert.doesNotMatch(JSON.stringify(requestedPayload), new RegExp(token));

    const reset = await post('/password/reset', {
      token,
      password: resetPassword,
      passwordConfirmation: resetPassword,
    });
    assert.equal(reset.status, 200);
    assert.match(reset.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);

    const reused = await post('/password/reset', {
      token,
      password: 'OutraSenha123',
      passwordConfirmation: 'OutraSenha123',
    });
    assert.equal(reused.status, 400);
    assert.equal((await reused.json()).error.code, 'invalid_reset_token');

    const oldSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: oldCookie } });
    assert.equal(oldSession.status, 401);

    const oldLogin = await post('/login', { email, password: originalPassword });
    assert.equal(oldLogin.status, 401);
    const newLogin = await post('/login', { email, password: resetPassword });
    assert.equal(newLogin.status, 200);
    const resetSessionCookie = newLogin.headers.get('set-cookie')?.split(';')[0];

    const wrongCurrent = await post('/password/change', {
      currentPassword: 'SenhaIncorreta123',
      password: changedPassword,
      passwordConfirmation: changedPassword,
    }, resetSessionCookie);
    assert.equal(wrongCurrent.status, 401);

    const change = await post('/password/change', {
      currentPassword: resetPassword,
      password: changedPassword,
      passwordConfirmation: changedPassword,
    }, resetSessionCookie);
    assert.equal(change.status, 200);
    assert.doesNotMatch(JSON.stringify(await change.json()), /session_version/);
    const activeCookie = change.headers.get('set-cookie')?.split(';')[0];

    const previousSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: resetSessionCookie } });
    assert.equal(previousSession.status, 401);
    const activeSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: activeCookie } });
    assert.equal(activeSession.status, 200);

    capturedResetLink = '';
    await post('/password/forgot', { email });
    const expiredLink = await waitForResetLink();
    const expiringToken = new URL(expiredLink).searchParams.get('resetToken');
    const tokenHash = crypto.createHash('sha256').update(expiringToken).digest('hex');
    await pool.execute(
      'UPDATE password_reset_tokens SET expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE) WHERE token_hash = ?',
      [tokenHash],
    );
    const expired = await post('/password/reset', {
      token: expiringToken,
      password: 'SenhaExpirada123',
      passwordConfirmation: 'SenhaExpirada123',
    });
    assert.equal(expired.status, 400);
    assert.equal((await expired.json()).error.code, 'invalid_reset_token');
  } finally {
    console.info = originalInfo;
    await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
