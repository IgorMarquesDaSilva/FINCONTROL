const test = require('node:test');
const assert = require('node:assert/strict');
const { budgetLevel, financialPeriod, addDays } = require('../src/services/notification.rules');

test('níveis distinguem 80%, 100% e orçamento ultrapassado', () => {
  assert.equal(budgetLevel(79.99), null);
  assert.equal(budgetLevel(80), 'warning');
  assert.equal(budgetLevel(100), 'limit');
  assert.equal(budgetLevel(100.01), 'over');
});

test('mês financeiro e prazo de aviso atravessam meses corretamente', () => {
  assert.deepEqual(financialPeriod('2027-01-09', 10), { year: 2026, month: 12 });
  assert.deepEqual(financialPeriod('2027-01-10', 10), { year: 2027, month: 1 });
  assert.equal(addDays('2027-01-30', 3), '2027-02-02');
});
