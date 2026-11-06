const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

async function register(baseUrl, suffix) {
  const email = `teste-meta-${suffix}-${Date.now()}@fincontrol.local`;
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Meta ${suffix}`, email, password: 'SenhaTeste123', passwordConfirmation: 'SenhaTeste123',
    }),
  });
  assert.equal(response.status, 201);
  return { email, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function request(baseUrl, cookie, path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Cookie: cookie, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
}

test('CRUD e aportes de metas respeitam regras e usuario autenticado', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const emails = [];

  try {
    const owner = await register(baseUrl, 'Owner');
    const other = await register(baseUrl, 'Other');
    emails.push(owner.email, other.email);

    const creation = await request(baseUrl, owner.cookie, '/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Reserva', description: 'Emergencias', targetAmount: '1000', currentAmount: '100', deadline: '2027-12-31',
      }),
    });
    assert.equal(creation.status, 201);
    const goal = (await creation.json()).goal;
    assert.equal(goal.progressPercentage, 10);
    assert.equal(goal.remainingAmount, 900);

    const ownerList = await request(baseUrl, owner.cookie, '/api/goals');
    assert.equal(ownerList.status, 200);
    assert.equal((await ownerList.json()).goals.length, 1);
    const otherList = await request(baseUrl, other.cookie, '/api/goals');
    assert.deepEqual((await otherList.json()).goals, []);

    const forbidden = await request(baseUrl, other.cookie, `/api/goals/${goal.id}`);
    assert.equal(forbidden.status, 404);

    const contribution = await request(baseUrl, owner.cookie, `/api/goals/${goal.id}/contributions`, {
      method: 'POST', body: JSON.stringify({ amount: '400' }),
    });
    assert.equal(contribution.status, 200);
    assert.equal((await contribution.json()).goal.progressPercentage, 50);

    const excessive = await request(baseUrl, owner.cookie, `/api/goals/${goal.id}/contributions`, {
      method: 'POST', body: JSON.stringify({ amount: '501' }),
    });
    assert.equal(excessive.status, 422);

    const completion = await request(baseUrl, owner.cookie, `/api/goals/${goal.id}/contributions`, {
      method: 'POST', body: JSON.stringify({ amount: '500' }),
    });
    const completedGoal = (await completion.json()).goal;
    assert.equal(completedGoal.status, 'COMPLETED');
    assert.equal(completedGoal.progressPercentage, 100);

    const contributionAfterCompletion = await request(baseUrl, owner.cookie, `/api/goals/${goal.id}/contributions`, {
      method: 'POST', body: JSON.stringify({ amount: '1' }),
    });
    assert.equal(contributionAfterCompletion.status, 409);

    const secondCreation = await request(baseUrl, owner.cookie, '/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Curso', targetAmount: '2000', currentAmount: '0', deadline: '' }),
    });
    const secondGoal = (await secondCreation.json()).goal;
    const cancellation = await request(baseUrl, owner.cookie, `/api/goals/${secondGoal.id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert.equal((await cancellation.json()).goal.status, 'CANCELLED');
    const reactivation = await request(baseUrl, owner.cookie, `/api/goals/${secondGoal.id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert.equal((await reactivation.json()).goal.status, 'ACTIVE');

    const forbiddenDelete = await request(baseUrl, other.cookie, `/api/goals/${secondGoal.id}`, { method: 'DELETE' });
    assert.equal(forbiddenDelete.status, 404);
    const deletion = await request(baseUrl, owner.cookie, `/api/goals/${secondGoal.id}`, { method: 'DELETE' });
    assert.equal(deletion.status, 200);
  } finally {
    try {
      if (emails.length) await pool.query('DELETE FROM users WHERE email IN (?)', [emails]);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    }
  }
});
