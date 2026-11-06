const test = require('node:test');
const assert = require('node:assert/strict');
const { generateInsights } = require('../src/services/insights.rules');

const comparison = {
  period: { year: 2024, month: 2 },
  previousPeriod: { year: 2024, month: 1 },
};

test('não gera conclusões quando algum período tem poucas movimentações', () => {
  const result = generateInsights({
    ...comparison,
    current: { income: 1000, expense: 100, transactionCount: 2 },
    previous: { income: 1000, expense: 50, transactionCount: 3 },
  });

  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.insights.length, 0);
  assert.match(result.message, /pelo menos 3 movimentações/);
});

test('gera variações, crescimento de categoria e taxa de economia com evidências', () => {
  const result = generateInsights({
    ...comparison,
    current: { income: 700, expense: 350, transactionCount: 4 },
    previous: { income: 1000, expense: 200, transactionCount: 3 },
    categories: [
      { categoryId: 4, name: 'Alimentação', currentAmount: 250, currentCount: 2, previousAmount: 100, previousCount: 2 },
      { categoryId: 9, name: 'Lazer', currentAmount: 140, currentCount: 2, previousAmount: 100, previousCount: 2 },
      { categoryId: 8, name: 'Transporte', currentAmount: 100, currentCount: 1, previousAmount: 100, previousCount: 1 },
    ],
  });

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.insights.map((insight) => insight.type), [
    'spending_increase', 'category_growth', 'savings_decline', 'income_decrease',
  ]);
  const categoryInsight = result.insights.find((insight) => insight.type === 'category_growth');
  assert.match(categoryInsight.message, /Alimentação/);
  assert.ok(categoryInsight.evidence.some((fact) => fact.value === 250));
  assert.ok(result.insights.every((insight) => insight.suggestion && insight.evidence.length >= 3));
});

test('ignora variações pequenas e aumentos de categoria sem amostra suficiente', () => {
  const result = generateInsights({
    ...comparison,
    current: { income: 1020, expense: 220, transactionCount: 3 },
    previous: { income: 1000, expense: 200, transactionCount: 3 },
    categories: [
      { categoryId: 4, name: 'Alimentação', currentAmount: 250, currentCount: 1, previousAmount: 100, previousCount: 2 },
    ],
  });

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.insights, []);
  assert.match(result.message, /Não encontramos mudanças relevantes/);
});

test('não compara uma renda anterior inexistente nem categoria sem histórico', () => {
  const result = generateInsights({
    ...comparison,
    current: { income: 500, expense: 0, transactionCount: 3 },
    previous: { income: 0, expense: 0, transactionCount: 3 },
    categories: [
      { categoryId: 4, name: 'Alimentação', currentAmount: 100, currentCount: 3, previousAmount: 0, previousCount: 0 },
    ],
  });

  assert.deepEqual(result.insights, []);
});
