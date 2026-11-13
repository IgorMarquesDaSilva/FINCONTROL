const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

test('trilhas e desafios salvam progresso só na conta autenticada', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const emails = [`learn-a-${Date.now()}@fincontrol.local`, `learn-b-${Date.now()}@fincontrol.local`];
  const register = async (email) => {
    const response = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pessoa Aprendiz', email, password: 'SenhaTeste123', passwordConfirmation: 'SenhaTeste123' }),
    });
    assert.equal(response.status, 201);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const get = (cookie) => fetch(`${base}/api/education`, { headers: { Cookie: cookie } });
  const post = (cookie, path, body = {}) => fetch(`${base}/api/education${path}`, {
    method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const first = await register(emails[0]);
    const second = await register(emails[1]);
    assert.equal((await get('')).status, 401);
    const catalog = (await (await get(first)).json()).learning;
    assert.equal(catalog.tracks.length, 2);
    assert.equal(catalog.quizzes['primeiro-orcamento'].correctIndex, undefined);

    const wrong = await post(first, '/articles/primeiro-orcamento/quiz', { answerIndex: 1 });
    assert.equal(wrong.status, 200);
    const feedback = await wrong.json();
    assert.equal(feedback.correct, false);
    assert.match(feedback.explanation, /registro/i);
    assert.equal((await (await get(first)).json()).learning.progress['primeiro-orcamento'], undefined);

    assert.equal((await post(first, '/articles/primeiro-orcamento/read')).status, 200);
    const correct = await post(first, '/articles/primeiro-orcamento/quiz', { answerIndex: 0 });
    assert.equal((await correct.json()).correct, true);
    assert.equal((await post(first, '/challenges/sete-dias/complete')).status, 200);
    assert.equal((await post(first, '/challenges/sete-dias/complete')).status, 200);
    const firstProgress = (await (await get(first)).json()).learning;
    assert.equal(firstProgress.progress['primeiro-orcamento'].quizPassed, true);
    assert.deepEqual(firstProgress.challengesCompleted, ['sete-dias']);
    const secondProgress = (await (await get(second)).json()).learning;
    assert.deepEqual(secondProgress.progress, {});
    assert.deepEqual(secondProgress.challengesCompleted, []);
    assert.equal((await post(first, '/challenges/inventado/complete')).status, 404);
    const [transactions] = await pool.execute(
      'SELECT COUNT(*) AS total FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))', emails,
    );
    assert.equal(transactions[0].total, 0);
  } finally {
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', emails);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
