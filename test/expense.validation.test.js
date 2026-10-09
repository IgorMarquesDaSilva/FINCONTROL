const test = require('node:test');
const assert = require('node:assert/strict');
const { validateExpense } = require('../src/validation/expense');

test('despesa aceita descricao vazia e normaliza os demais campos', () => {
  const result = validateExpense({
    description: '   ',
    amount: '125,75',
    transactionDate: '2026-10-09',
    categoryName: '  Alimentacao  ',
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    description: '',
    amount: '125.75',
    transactionDate: '2026-10-09',
    categoryName: 'Alimentacao',
  });
});

test('despesa rejeita valor, data, categoria e descricao de um caractere', () => {
  const result = validateExpense({
    description: 'A',
    amount: '0',
    transactionDate: '2026-02-30',
    categoryName: '',
  });

  assert.deepEqual(Object.keys(result.errors).sort(), [
    'amount',
    'categoryName',
    'description',
    'transactionDate',
  ]);
});
