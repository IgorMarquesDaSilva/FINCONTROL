const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIncome } = require('../src/validation/income');

test('receita normaliza dados validos', () => {
  const result = validateIncome({
    description: '  Salario   mensal  ',
    amount: '2500,50',
    transactionDate: '2026-09-25',
    categoryName: '  Trabalho  ',
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    description: 'Salario mensal',
    amount: '2500.50',
    transactionDate: '2026-09-25',
    categoryName: 'Trabalho',
  });
});

test('receita rejeita valor, data e textos invalidos', () => {
  const result = validateIncome({
    description: 'A',
    amount: '0',
    transactionDate: '2026-02-31',
    categoryName: '',
  });

  assert.deepEqual(Object.keys(result.errors).sort(), [
    'amount',
    'categoryName',
    'description',
    'transactionDate',
  ]);
});
