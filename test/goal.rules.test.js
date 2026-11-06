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

test('meta limita progresso a cem por cento e mantém a descrição', () => {
  const goal = mapGoal({
    id: 2, name: 'Notebook', description: 'Equipamento para estudo', target_amount: '1000', current_amount: '1200',
    deadline: null, status: 'COMPLETED', created_at: 'now', updated_at: 'now',
  });
  assert.equal(goal.progressPercentage, 100);
  assert.equal(goal.remainingAmount, 0);
  assert.equal(goal.description, 'Equipamento para estudo');
});

test('meta com alvo vazio mantém progresso em zero', () => {
  const goal = mapGoal({
    id: 3, name: 'Meta sem alvo', description: null, target_amount: '0', current_amount: '0',
    deadline: null, status: 'ACTIVE', created_at: 'now', updated_at: 'now',
  });
  assert.equal(goal.progressPercentage, 0);
  assert.equal(goal.remainingAmount, 0);
});
