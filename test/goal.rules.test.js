const test = require('node:test');
const assert = require('node:assert/strict');
const { mapGoal } = require('../src/services/goal.rules');

test('meta calcula progresso e valor restante', () => {
  const goal = mapGoal({
    id: 1, name: 'Viagem', description: null, target_amount: '2000', current_amount: '500',
    deadline: '2027-01-01', status: 'ACTIVE', created_at: 'now', updated_at: 'now',
  });
  assert.equal(goal.progressPercentage, 25);
  assert.equal(goal.remainingAmount, 1500);
  assert.equal(goal.description, '');
});
