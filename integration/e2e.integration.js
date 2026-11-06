const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const app = require('../src/app');
const pool = require('../src/config/database');

const password = 'SenhaE2E123';

async function register(baseUrl, email, name) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, passwordConfirmation: password }),
  });
  assert.equal(response.status, 201);
  return { user: (await response.json()).user, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function api(baseUrl, path, cookie, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  return { response, body: await response.json().catch(() => ({})) };
}

test('caminho ponta a ponta cobre sessão, movimentações, orçamento, meta e relatórios', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const suffix = randomUUID();
  const emails = [
    `e2e-owner-${suffix}@fincontrol.local`,
    `e2e-other-${suffix}@fincontrol.local`,
  ];

  try {
    for (const path of ['/api/incomes', '/api/expenses', '/api/transactions', '/api/budgets?year=2026&month=11', '/api/goals', '/api/reports/monthly?month=2026-11']) {
      const blocked = await api(baseUrl, path);
      assert.equal(blocked.response.status, 401, `${path} deve exigir sessão`);
    }

    const owner = await register(baseUrl, emails[0], 'E2E Proprietário');
    const other = await register(baseUrl, emails[1], 'E2E Outro usuário');
    const period = '2026-11';

    const income = await api(baseUrl, '/api/incomes', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ description: 'Renda do mês', amount: '5000', transactionDate: `${period}-02`, categoryName: 'Trabalho' }),
    });
    assert.equal(income.response.status, 201);

    const expense = await api(baseUrl, '/api/expenses', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ description: 'Mercado', amount: '600', transactionDate: `${period}-04`, categoryName: 'Alimentação' }),
    });
    assert.equal(expense.response.status, 201);
    const expenseId = expense.body.expense.id;
    const categoryId = expense.body.expense.category.id;

    const previousExpense = await api(baseUrl, '/api/expenses', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ description: 'Compra anterior', amount: '50', transactionDate: '2026-10-20', categoryName: 'Alimentação' }),
    });
    assert.equal(previousExpense.response.status, 201);

    const foreignExpense = await api(baseUrl, '/api/expenses', other.cookie, {
      method: 'POST',
      body: JSON.stringify({ description: 'Despesa de outra conta', amount: '4000', transactionDate: `${period}-05`, categoryName: 'Alimentação' }),
    });
    assert.equal(foreignExpense.response.status, 201);

    const foreignTransaction = await api(baseUrl, `/api/transactions/${expenseId}`, other.cookie);
    assert.equal(foreignTransaction.response.status, 404);

    const budget = await api(baseUrl, '/api/budgets', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ categoryId, year: 2026, month: 11, amount: '1000' }),
    });
    assert.equal(budget.response.status, 201);
    const budgetId = budget.body.budget.id;
    assert.equal(budget.body.budget.spentAmount, 600);

    const goal = await api(baseUrl, '/api/goals', owner.cookie, {
      method: 'POST',
      body: JSON.stringify({ name: 'Reserva', targetAmount: '1000', currentAmount: '100', deadline: '2027-12-31' }),
    });
    assert.equal(goal.response.status, 201);
    const goalId = goal.body.goal.id;
    const foreignGoal = await api(baseUrl, `/api/goals/${goalId}`, other.cookie);
    assert.equal(foreignGoal.response.status, 404);

    const firstReport = await api(baseUrl, `/api/reports/monthly?month=${period}`, owner.cookie);
    assert.equal(firstReport.response.status, 200);
    assert.equal(firstReport.body.report.current.income, 5000);
    assert.equal(firstReport.body.report.current.expense, 600);
    assert.equal(firstReport.body.report.previous.expense, 50);
    assert.deepEqual(firstReport.body.report.expenseCategories.map((item) => item.amount), [600]);

    const dashboard = await api(baseUrl, `/api/dashboard?month=${period}`, owner.cookie);
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.body.dashboard.balance, 4400);
    assert.equal(dashboard.body.dashboard.transactionCount, 2);

    const update = await api(baseUrl, `/api/transactions/${expenseId}`, owner.cookie, {
      method: 'PUT',
      body: JSON.stringify({ description: 'Mercado do mês', amount: '850', transactionDate: `${period}-04`, categoryName: 'Alimentação' }),
    });
    assert.equal(update.response.status, 200);

    const updatedBudget = await api(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(updatedBudget.body.budget.spentAmount, 850);
    assert.equal(updatedBudget.body.budget.status, 'attention');

    const updatedReport = await api(baseUrl, `/api/reports/monthly?month=${period}`, owner.cookie);
    assert.equal(updatedReport.body.report.current.expense, 850);
    assert.equal(updatedReport.body.report.current.balance, 4150);
    assert.equal(updatedReport.body.report.expenseCategories[0].amount, 850);

    const contribution = await api(baseUrl, `/api/goals/${goalId}/contributions`, owner.cookie, {
      method: 'POST', body: JSON.stringify({ amount: '250' }),
    });
    assert.equal(contribution.response.status, 200);
    assert.equal(contribution.body.goal.currentAmount, 350);
    assert.equal(contribution.body.goal.progressPercentage, 35);

    const deletion = await api(baseUrl, `/api/transactions/${expenseId}`, owner.cookie, { method: 'DELETE' });
    assert.equal(deletion.response.status, 200);
    const afterDeletion = await api(baseUrl, `/api/budgets/${budgetId}`, owner.cookie);
    assert.equal(afterDeletion.body.budget.spentAmount, 0);
    assert.equal(afterDeletion.body.budget.status, 'normal');

    const reportAfterDeletion = await api(baseUrl, `/api/reports/monthly?month=${period}`, owner.cookie);
    assert.equal(reportAfterDeletion.body.report.current.income, 5000);
    assert.equal(reportAfterDeletion.body.report.current.expense, 0);
    assert.equal(reportAfterDeletion.body.report.current.balance, 5000);
    assert.deepEqual(reportAfterDeletion.body.report.expenseCategories, []);

    const dashboardAfterDeletion = await api(baseUrl, `/api/dashboard?month=${period}`, owner.cookie);
    assert.equal(dashboardAfterDeletion.body.dashboard.balance, 5000);
    assert.equal(dashboardAfterDeletion.body.dashboard.transactionCount, 1);

    const expenseHistoryAfterDeletion = await api(
      baseUrl,
      `/api/transactions?type=EXPENSE&dateFrom=${period}-01&dateTo=${period}-30`,
      owner.cookie,
    );
    assert.equal(expenseHistoryAfterDeletion.response.status, 200);
    assert.deepEqual(expenseHistoryAfterDeletion.body.transactions, []);

    const logout = await api(baseUrl, '/api/auth/logout', owner.cookie, { method: 'POST', body: '{}' });
    assert.equal(logout.response.status, 200);
    assert.match(logout.response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    const staleSession = await api(baseUrl, '/api/auth/me');
    assert.equal(staleSession.response.status, 401);
  } finally {
    try {
      await pool.query('DELETE FROM budgets WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM financial_goals WHERE user_id IN (SELECT id FROM users WHERE email IN (?))', [emails]);
      await pool.query('DELETE FROM users WHERE email IN (?)', [emails]);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  }
});
