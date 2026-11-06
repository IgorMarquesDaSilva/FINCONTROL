const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const app = require('../src/app');
const pool = require('../src/config/database');

async function register(baseUrl, email) {
  const password = 'SenhaInsights123';
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Teste Insights', email, password, passwordConfirmation: password }),
  });
  assert.equal(response.status, 201);
  return response.headers.get('set-cookie')?.split(';')[0];
}

async function createTransaction(baseUrl, cookie, endpoint, transaction) {
  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  assert.equal(response.status, 201);
  return response.json();
}

test('insights usam apenas dados próprios e explicam as mudanças identificadas', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const suffix = randomUUID();
  const emails = [`insights-owner-${suffix}@fincontrol.local`, `insights-other-${suffix}@fincontrol.local`];

  try {
    const unauthenticated = await fetch(`${baseUrl}/api/insights?month=2024-02`);
    assert.equal(unauthenticated.status, 401);

    const ownerCookie = await register(baseUrl, emails[0]);
    const otherCookie = await register(baseUrl, emails[1]);

    const lowData = await fetch(`${baseUrl}/api/insights?month=2024-02`, { headers: { Cookie: otherCookie } });
    assert.equal(lowData.status, 200);
    const lowDataPayload = (await lowData.json()).insights;
    assert.equal(lowDataPayload.status, 'insufficient_data');
    assert.deepEqual(lowDataPayload.insights, []);

    await createTransaction(baseUrl, ownerCookie, 'incomes', {
      description: 'Renda anterior', amount: '1000', transactionDate: '2024-01-02', categoryName: 'Trabalho',
    });
    await createTransaction(baseUrl, ownerCookie, 'expenses', {
      description: 'Mercado anterior', amount: '50', transactionDate: '2024-01-03', categoryName: 'Alimentação',
    });
    await createTransaction(baseUrl, ownerCookie, 'expenses', {
      description: 'Feira anterior', amount: '50', transactionDate: '2024-01-04', categoryName: 'Alimentação',
    });
    await createTransaction(baseUrl, ownerCookie, 'incomes', {
      description: 'Renda do mês', amount: '700', transactionDate: '2024-02-02', categoryName: 'Trabalho',
    });
    await createTransaction(baseUrl, ownerCookie, 'expenses', {
      description: 'Mercado do mês', amount: '125', transactionDate: '2024-02-03', categoryName: 'Alimentação',
    });
    await createTransaction(baseUrl, ownerCookie, 'expenses', {
      description: 'Feira do mês', amount: '125', transactionDate: '2024-02-04', categoryName: 'Alimentação',
    });
    await createTransaction(baseUrl, otherCookie, 'expenses', {
      description: 'Dados de outra conta', amount: '9999', transactionDate: '2024-02-05', categoryName: 'Alimentação',
    });

    const response = await fetch(`${baseUrl}/api/insights?month=2024-02`, { headers: { Cookie: ownerCookie } });
    assert.equal(response.status, 200);
    const payload = (await response.json()).insights;
    assert.equal(payload.status, 'ready');
    assert.equal(payload.periods.currentTransactions, 3);
    assert.equal(payload.periods.previousTransactions, 3);
    assert.deepEqual(payload.insights.map((insight) => insight.type), [
      'spending_increase', 'category_growth', 'savings_decline', 'income_decrease',
    ]);

    const categoryInsight = payload.insights.find((insight) => insight.type === 'category_growth');
    assert.equal(categoryInsight.evidence[0].value, 250);
    assert.equal(categoryInsight.evidence[1].value, 100);
    assert.ok(payload.insights.every((insight) => (
      insight.evidence.length > 0 && insight.suggestion && !JSON.stringify(insight).includes('9999')
    )));

    const invalidPeriod = await fetch(`${baseUrl}/api/insights?month=2024-13`, { headers: { Cookie: ownerCookie } });
    assert.equal(invalidPeriod.status, 400);
  } finally {
    try {
      await pool.query('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM users WHERE email IN (?)', [emails]);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  }
});
