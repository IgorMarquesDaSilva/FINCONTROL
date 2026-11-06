const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTransactionQuery } = require('../src/validation/transaction-query');

test('consulta de movimentacoes normaliza filtros combinados', () => {
  const result = validateTransactionQuery({
    page: '2', pageSize: '25', type: 'expense', categoryId: '7',
    dateFrom: '2026-01-01', dateTo: '2026-12-31', minAmount: '10,50', maxAmount: '500',
    search: '  curso   online ', sort: 'amount', order: 'asc',
  });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    page: 2, pageSize: 25, type: 'EXPENSE', categoryId: 7,
    dateFrom: '2026-01-01', dateTo: '2026-12-31', minAmount: '10.50', maxAmount: '500.00',
    search: 'curso online', sort: 'amount', order: 'asc',
  });
});

test('consulta rejeita pagina, periodo, faixa e ordenacao invalidos', () => {
  const result = validateTransactionQuery({
    page: '0', pageSize: '100', type: 'transfer', dateFrom: '2026-02-30',
    dateTo: '2025-01-01', minAmount: '20', maxAmount: '10', sort: 'name', order: 'sideways',
  });
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'dateFrom', 'maxAmount', 'order', 'page', 'pageSize', 'sort', 'type',
  ]);
});
