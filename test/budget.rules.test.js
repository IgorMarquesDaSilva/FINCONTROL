const test = require('node:test');
const assert = require('node:assert/strict');
const { getBudgetStatus, mapBudget } = require('../src/services/budget.rules');

test('orçamento fica normal abaixo de 80 por cento', () => {
  assert.deepEqual(getBudgetStatus(79.99, 100), { status: 'normal', statusLabel: 'Normal' });
});

test('orçamento sinaliza atenção entre 80 e 100 por cento', () => {
  assert.deepEqual(getBudgetStatus(80, 100), { status: 'attention', statusLabel: 'Atenção' });
  assert.deepEqual(getBudgetStatus(99.99, 100), { status: 'attention', statusLabel: 'Atenção' });
});

test('orçamento fica excedido ao alcançar ou ultrapassar o limite', () => {
  assert.deepEqual(getBudgetStatus(100, 100), { status: 'exceeded', statusLabel: 'Excedido' });
  assert.deepEqual(getBudgetStatus(125, 100), { status: 'exceeded', statusLabel: 'Excedido' });
});

test('resposta calcula consumo, saldo e percentual com dados agregados', () => {
  const result = mapBudget({
    id: 9,
    category_id: 4,
    category_name: 'Transporte',
    reference_year: 2026,
    reference_month: 10,
    limit_amount: '100.00',
    spent_amount: '85.00',
    created_at: '2026-10-01 10:00:00',
    updated_at: '2026-10-01 10:00:00',
  });

  assert.equal(result.limitAmount, 100);
  assert.equal(result.spentAmount, 85);
  assert.equal(result.remainingAmount, 15);
  assert.equal(result.percentageUsed, 85);
  assert.equal(result.status, 'attention');
  assert.deepEqual(result.category, { id: 4, name: 'Transporte' });
});
