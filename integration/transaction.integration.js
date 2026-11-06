const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

async function register(baseUrl, suffix) {
  const email = `teste-movimentacao-${suffix}-${Date.now()}@fincontrol.local`;
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
  const body = await response.json();

  return {
    email,
    user: body.user,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}

test('cadastra, edita e exclui movimentacoes sem permitir acesso entre usuarios', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const testUsers = [];

  try {
    const owner = await register(baseUrl, 'Proprietario');
    const otherUser = await register(baseUrl, 'OutroUsuario');
    testUsers.push(owner.email, otherUser.email);

    const creation = await fetch(`${baseUrl}/api/incomes`, {
      method: 'POST',
      headers: { Cookie: owner.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Bolsa inicial',
        amount: '800.00',
        transactionDate: '2026-10-01',
        categoryName: 'Estudos',
      }),
    });
    assert.equal(creation.status, 201);
    const income = (await creation.json()).income;

    const loadedIncome = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(loadedIncome.status, 200);
    assert.equal((await loadedIncome.json()).transaction.description, 'Bolsa inicial');

    const incomeUpdate = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      method: 'PUT',
      headers: { Cookie: owner.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Bolsa atualizada',
        amount: '950,50',
        transactionDate: '2026-10-02',
        categoryName: 'Renda academica',
      }),
    });
    assert.equal(incomeUpdate.status, 200);
    const updatedIncome = (await incomeUpdate.json()).transaction;
    assert.equal(updatedIncome.type, 'INCOME');
    assert.equal(updatedIncome.amount, 950.5);
    assert.equal(updatedIncome.category.name, 'Renda academica');

    const expenseCreation = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: { Cookie: owner.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '',
        amount: '12.00',
        transactionDate: '2026-10-03',
        categoryName: 'Transporte',
      }),
    });
    assert.equal(expenseCreation.status, 201);
    const expense = (await expenseCreation.json()).expense;
    assert.equal(expense.type, 'EXPENSE');
    assert.equal(expense.description, '');

    const expenseList = await fetch(`${baseUrl}/api/expenses`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(expenseList.status, 200);
    assert.equal((await expenseList.json()).expenses[0].id, expense.id);

    const expenseUpdate = await fetch(`${baseUrl}/api/transactions/${expense.id}`, {
      method: 'PUT',
      headers: { Cookie: owner.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Passe mensal',
        amount: '120.00',
        transactionDate: '2026-10-04',
        categoryName: 'Mobilidade',
      }),
    });
    assert.equal(expenseUpdate.status, 200);
    const updatedExpense = (await expenseUpdate.json()).transaction;
    assert.equal(updatedExpense.type, 'EXPENSE');
    assert.equal(updatedExpense.description, 'Passe mensal');
    assert.equal(updatedExpense.category.name, 'Mobilidade');

    const movementList = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(movementList.status, 200);
    const movements = (await movementList.json()).transactions;
    assert.equal(movements.length, 2);
    assert.deepEqual(movements.map((transaction) => transaction.type), ['EXPENSE', 'INCOME']);
    assert.deepEqual(movements.map((transaction) => transaction.transactionDate), ['2026-10-04', '2026-10-02']);

    const firstPage = await fetch(`${baseUrl}/api/transactions?page=1&pageSize=1`, {
      headers: { Cookie: owner.cookie },
    });
    const firstPageBody = await firstPage.json();
    assert.equal(firstPageBody.transactions.length, 1);
    assert.equal(firstPageBody.pagination.totalItems, 2);
    assert.equal(firstPageBody.pagination.hasNext, true);

    const filteredMovements = await fetch(
      `${baseUrl}/api/transactions?type=EXPENSE&search=Passe&minAmount=100&maxAmount=150&sort=amount&order=asc`,
      { headers: { Cookie: owner.cookie } },
    );
    assert.equal(filteredMovements.status, 200);
    const filteredBody = await filteredMovements.json();
    assert.equal(filteredBody.transactions.length, 1);
    assert.equal(filteredBody.transactions[0].description, 'Passe mensal');

    const categoryList = await fetch(`${baseUrl}/api/transactions/categories`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(categoryList.status, 200);
    assert.ok((await categoryList.json()).categories.some((category) => category.name === 'Mobilidade'));

    const invalidQuery = await fetch(`${baseUrl}/api/transactions?pageSize=99`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(invalidQuery.status, 422);

    const otherUserMovements = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: otherUser.cookie },
    });
    assert.equal(otherUserMovements.status, 200);
    assert.deepEqual((await otherUserMovements.json()).transactions, []);

    const forbiddenRead = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      headers: { Cookie: otherUser.cookie },
    });
    assert.equal(forbiddenRead.status, 404);

    const invalidUpdate = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      method: 'PUT',
      headers: { Cookie: owner.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '',
        amount: '0',
        transactionDate: '2026-02-30',
        categoryName: '',
      }),
    });
    assert.equal(invalidUpdate.status, 422);
    assert.deepEqual(
      Object.keys((await invalidUpdate.json()).error.fields).sort(),
      ['amount', 'categoryName', 'description', 'transactionDate'],
    );

    const forbiddenDelete = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      method: 'DELETE',
      headers: { Cookie: otherUser.cookie },
    });
    assert.equal(forbiddenDelete.status, 404);

    const expenseDelete = await fetch(`${baseUrl}/api/transactions/${expense.id}`, {
      method: 'DELETE',
      headers: { Cookie: owner.cookie },
    });
    assert.equal(expenseDelete.status, 200);
    const deletedExpense = (await expenseDelete.json()).transaction;
    assert.equal(deletedExpense.id, expense.id);
    assert.equal(deletedExpense.type, 'EXPENSE');

    const deletedExpenseRead = await fetch(`${baseUrl}/api/transactions/${expense.id}`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(deletedExpenseRead.status, 404);

    const incomeDelete = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      method: 'DELETE',
      headers: { Cookie: owner.cookie },
    });
    assert.equal(incomeDelete.status, 200);
    assert.equal((await incomeDelete.json()).transaction.type, 'INCOME');

    const emptyIncomes = await fetch(`${baseUrl}/api/incomes`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(emptyIncomes.status, 200);
    assert.deepEqual((await emptyIncomes.json()).incomes, []);

    const repeatedDelete = await fetch(`${baseUrl}/api/transactions/${income.id}`, {
      method: 'DELETE',
      headers: { Cookie: owner.cookie },
    });
    assert.equal(repeatedDelete.status, 404);

    const emptyMovements = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: owner.cookie },
    });
    assert.equal(emptyMovements.status, 200);
    assert.deepEqual((await emptyMovements.json()).transactions, []);
  } finally {
    try {
      if (testUsers.length) {
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
