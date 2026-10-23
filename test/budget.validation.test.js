const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBudget, validateBudgetPeriod } = require('../src/validation/budget');

test('orçamento normaliza categoria, período e limite', () => {
  const result = validateBudget({
    categoryId: '12',
    year: '2026',
    month: '10',
    amount: '250,50',
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    categoryId: 12,
    year: 2026,
    month: 10,
    amount: '250.50',
  });
});

test('orçamento rejeita categoria, período e limite inválidos', () => {
  const result = validateBudget({ categoryId: '1.2', year: '1999', month: '13', amount: '0' });

  assert.deepEqual(Object.keys(result.errors).sort(), ['amount', 'categoryId', 'month', 'year']);
});

test('período exige ano de quatro dígitos e mês válido', () => {
  const result = validateBudgetPeriod('026', '00');

  assert.deepEqual(Object.keys(result.errors).sort(), ['month', 'year']);
});

test('limite aceita até duas casas decimais e rejeita excesso de precisão', () => {
  assert.equal(validateBudget({ categoryId: 1, year: 2026, month: 1, amount: '1.239' }).errors.amount,
    'Informe um limite válido, com até duas casas decimais.');
});
