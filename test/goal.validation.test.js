const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContribution, validateGoal, validateGoalStatus } = require('../src/validation/goal');

test('meta normaliza dados validos', () => {
  const result = validateGoal({
    name: '  Reserva   de emergência ', description: ' Segurança financeira ',
    targetAmount: '5000,00', currentAmount: '500', deadline: '2027-12-31',
  });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    name: 'Reserva de emergência', description: 'Segurança financeira',
    targetAmount: '5000.00', currentAmount: '500.00', deadline: '2027-12-31',
  });
});

test('meta rejeita acumulado superior ao alvo e dados invalidos', () => {
  const result = validateGoal({ name: 'A', targetAmount: '100', currentAmount: '101', deadline: '2026-02-30' });
  assert.deepEqual(Object.keys(result.errors).sort(), ['currentAmount', 'deadline', 'name']);
  assert.ok(validateContribution({ amount: '0' }).errors.amount);
  assert.ok(validateGoalStatus({ status: 'UNKNOWN' }).errors.status);
});
