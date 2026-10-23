const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

async function register(baseUrl, suffix) {
  const email = `teste-orcamento-${suffix}-${Date.now()}@fincontrol.local`;
  const password = 'SenhaTeste123';
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Teste ${suffix}`,
      email,
      password,
      passwordConfirmation: password,
    }),
  });

  assert.equal(response.status, 201);
  return { email, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function request(baseUrl, path, cookie, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Cookie: cookie,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  return { response, body: await response.json() };
}

test('gerencia orçamentos por usuário e recalcula consumo pelas despesas atuais', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const testUsers = [];
  let secondExpenseId;
  let budgetId;

  try {
    const owner = await register(baseUrl, 'Proprietario');
    const otherUser = await register(baseUrl, 'OutroUsuario');
    testUsers.push(owner.email, otherUser.email);

    const unauthenticated = await fetch(`${baseUrl}/api/budgets?year=2026&month=10`);
    assert.equal(unauthenticated.status, 401);

    const firstExpenseResult = await request(baseUrl, '/api/expenses', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Transporte inicial', amount: '40.00', transactionDate: '2026-10-05', categoryName: 'Transporte',
      }),
    });
    assert.equal(firstExpenseResult.response.status, 201);

    const otherExpenseResult = await request(baseUrl, '/api/expenses', otherUser.cookie, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Categoria privada', amount: '10.00', transactionDate: '2026-10-05', categoryName: 'Privada',
      }),
    });
    assert.equal(otherExpenseResult.response.status, 201);
    const foreignCategoryId = otherExpenseResult.body.expense.category.id;
    const categoryId = firstExpenseResult.body.expense.category.id;

    const income = await request(baseUrl, '/api/incomes', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Bolsa de estudos', amount: '500.00', transactionDate: '2026-10-05', categoryName: 'Renda',
      }),
    });
    assert.equal(income.response.status, 201);

    const foreignCategory = await request(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId: foreignCategoryId, year: 2026, month: 10, amount: 100 }),
    });
    assert.equal(foreignCategory.response.status, 404);

    const incomeCategory = await request(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId: income.body.income.category.id, year: 2026, month: 10, amount: 100 }),
    });
    assert.equal(incomeCategory.response.status, 422);

    const createdBudget = await request(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId, year: 2026, month: 10, amount: '100.00' }),
    });
    assert.equal(createdBudget.response.status, 201);
    budgetId = createdBudget.body.budget.id;
    assert.equal(createdBudget.body.budget.spentAmount, 40);
    assert.equal(createdBudget.body.budget.status, 'normal');

    const duplicate = await request(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId, year: 2026, month: 10, amount: 150 }),
    });
    assert.equal(duplicate.response.status, 409);

    const foreignRead = await request(baseUrl, `/api/budgets/${budgetId}`, otherUser.cookie);
    assert.equal(foreignRead.response.status, 404);
    const foreignUpdate = await request(baseUrl, `/api/budgets/${budgetId}`, otherUser.cookie, {
      method: 'PUT',
      body: JSON.stringify({ categoryId: foreignCategoryId, year: 2026, month: 10, amount: 150 }),
    });
    assert.equal(foreignUpdate.response.status, 404);
    const foreignDelete = await request(baseUrl, `/api/budgets/${budgetId}`, otherUser.cookie, { method: 'DELETE' });
    assert.equal(foreignDelete.response.status, 404);

    const secondExpense = await request(baseUrl, '/api/expenses', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Transporte adicional', amount: '45.00', transactionDate: '2026-10-12', categoryName: 'Transporte',
      }),
    });
    assert.equal(secondExpense.response.status, 201);
    secondExpenseId = secondExpense.body.expense.id;
    const attentionState = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(attentionState.body.budget.spentAmount, 85);
    assert.equal(attentionState.body.budget.status, 'attention');

    const updatedExpense = await request(baseUrl, `/api/transactions/${secondExpenseId}`, owner.cookie, {
      method: 'PUT',
      body: JSON.stringify({
        description: 'Transporte adicional', amount: '70.00', transactionDate: '2026-10-12', categoryName: 'Transporte',
      }),
    });
    assert.equal(updatedExpense.response.status, 200);
    const exceededState = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(exceededState.body.budget.spentAmount, 110);
    assert.equal(exceededState.body.budget.status, 'exceeded');

    const nextMonthExpense = await request(baseUrl, '/api/expenses', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Transporte do próximo mês', amount: '90.00', transactionDate: '2026-11-02', categoryName: 'Transporte',
      }),
    });
    assert.equal(nextMonthExpense.response.status, 201);
    const novemberBudget = await request(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId, year: 2026, month: 11, amount: 200 }),
    });
    assert.equal(novemberBudget.response.status, 201);
    assert.equal(novemberBudget.body.budget.spentAmount, 90);

    const updatedBudget = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie, {
      method: 'PUT',
      body: JSON.stringify({ categoryId, year: 2026, month: 10, amount: 200 }),
    });
    assert.equal(updatedBudget.response.status, 200);
    assert.equal(updatedBudget.body.budget.limitAmount, 200);

    const deletedExpense = await request(baseUrl, `/api/transactions/${secondExpenseId}`, owner.cookie, { method: 'DELETE' });
    assert.equal(deletedExpense.response.status, 200);
    const recalculatedState = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(recalculatedState.body.budget.spentAmount, 40);
    assert.equal(recalculatedState.body.budget.status, 'normal');

    const list = await request(baseUrl, '/api/budgets?year=2026&month=10', owner.cookie);
    assert.equal(list.response.status, 200);
    assert.equal(list.body.budgets.length, 1);
    assert.equal(list.body.budgets[0].id, budgetId);

    const invalidPeriod = await request(baseUrl, '/api/budgets?year=2026&month=13', owner.cookie);
    assert.equal(invalidPeriod.response.status, 422);

    const deletedBudget = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie, { method: 'DELETE' });
    assert.equal(deletedBudget.response.status, 200);
    const missingBudget = await request(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(missingBudget.response.status, 404);
  } finally {
    try {
      if (testUsers.length) {
        await pool.query(
          'DELETE FROM budgets WHERE user_id IN (SELECT id FROM users WHERE email IN (?))',
          [testUsers],
        );
        await pool.query(
          'DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?))',
          [testUsers],
        );
        await pool.query(
          'DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email IN (?))',
          [testUsers],
        );
        await pool.query('DELETE FROM users WHERE email IN (?)', [testUsers]);
      }
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  }
});
