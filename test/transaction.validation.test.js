const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTransaction } = require('../src/validation/transaction');

test('edicao normaliza os campos de uma despesa', () => {
  const result = validateTransaction({
    description: '  Curso   online  ',
    amount: '89,90',
    transactionDate: '2026-10-09',
    categoryName: '  Educacao  ',
  }, 'EXPENSE');

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    description: 'Curso online',
    amount: '89.90',
    transactionDate: '2026-10-09',
    categoryName: 'Educacao',
  });
});

test('edicao aplica as validacoes de cadastro para receitas e despesas', () => {
  const incomeResult = validateTransaction({
    description: 'A',
    amount: '-1',
    transactionDate: '2026-02-30',
    categoryName: '',
  }, 'INCOME');
  const expenseResult = validateTransaction({ amount: '0' }, 'EXPENSE');

  assert.deepEqual(Object.keys(incomeResult.errors).sort(), [
    'amount',
    'categoryName',
    'description',
    'transactionDate',
  ]);
  assert.equal(expenseResult.errors.amount, 'O valor da despesa deve ser maior que zero.');
});

test('edicao rejeita tipos de movimentacao desconhecidos', () => {
  assert.throws(
    () => validateTransaction({}, 'TRANSFER'),
    { name: 'TypeError', message: 'Tipo de movimentacao invalido.' },
  );
});
