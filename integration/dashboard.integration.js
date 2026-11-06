const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

async function register(baseUrl, suffix) {
  const email = `teste-dashboard-${suffix}-${Date.now()}@fincontrol.local`;
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Dashboard ${suffix}`,
      email,
      password: 'SenhaTeste123',
      passwordConfirmation: 'SenhaTeste123',
    }),
  });
  assert.equal(response.status, 201);
  return {
    email,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}

async function createTransaction(baseUrl, cookie, endpoint, data) {
  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 201);
}

test('dashboard consolida o mes sem misturar usuarios ou periodos', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const testUsers = [];

  try {
    const owner = await register(baseUrl, 'Owner');
    const other = await register(baseUrl, 'Other');
    testUsers.push(owner.email, other.email);

    await createTransaction(baseUrl, owner.cookie, 'incomes', {
      description: 'Salario', amount: '3000', transactionDate: '2026-11-02', categoryName: 'Trabalho',
    });
    await createTransaction(baseUrl, owner.cookie, 'expenses', {
      description: 'Aluguel', amount: '1200', transactionDate: '2026-11-05', categoryName: 'Moradia',
    });
    await createTransaction(baseUrl, owner.cookie, 'expenses', {
      description: 'Mes anterior', amount: '500', transactionDate: '2026-10-20', categoryName: 'Moradia',
    });
    await createTransaction(baseUrl, other.cookie, 'expenses', {
      description: 'Outro usuario', amount: '900', transactionDate: '2026-11-06', categoryName: 'Lazer',
    });

    const response = await fetch(`${baseUrl}/api/dashboard?month=2026-11`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(response.status, 200);
    const dashboard = (await response.json()).dashboard;
    assert.deepEqual(
      {
        income: dashboard.income,
        expense: dashboard.expense,
        balance: dashboard.balance,
        savingsPercentage: dashboard.savingsPercentage,
        transactionCount: dashboard.transactionCount,
      },
      { income: 3000, expense: 1200, balance: 1800, savingsPercentage: 60, transactionCount: 2 },
    );
    assert.deepEqual(dashboard.recentTransactions.map((item) => item.description), ['Aluguel', 'Salario']);

    const invalidPeriod = await fetch(`${baseUrl}/api/dashboard?month=2026-13`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(invalidPeriod.status, 400);
  } finally {
    try {
      if (testUsers.length) {
        await pool.query('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [testUsers]);
        await pool.query('DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [testUsers]);
        await pool.query('DELETE FROM users WHERE email IN (?)', [testUsers]);
      }
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  }
});
