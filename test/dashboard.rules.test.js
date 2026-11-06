const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDashboardSummary } = require('../src/services/dashboard.rules');

test('resumo calcula saldo e percentual economizado', () => {
  assert.deepEqual(buildDashboardSummary('2500.00', '1000.00', 7), {
    income: 2500,
    expense: 1000,
    balance: 1500,
    savingsPercentage: 60,
    transactionCount: 7,
  });
});

test('resumo sem receitas evita divisao por zero', () => {
  assert.deepEqual(buildDashboardSummary(0, 300, 1), {
    income: 0,
    expense: 300,
    balance: -300,
    savingsPercentage: 0,
    transactionCount: 1,
  });
});
