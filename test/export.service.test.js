const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTransactionsCsv, formatDate } = require('../src/services/export.service');

test('CSV usa separador de planilha, BOM e protege células contra fórmulas', () => {
  const csv = buildTransactionsCsv([{ type: 'EXPENSE', description: '=SUM(1,2)', amount: 10.5,
    transactionDate: '2026-11-13', category: { name: 'Alimentação' } }],
  { currency: 'BRL', dateFormat: 'DD/MM/YYYY' });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Data";"Tipo";"Descrição";"Categoria";"Valor"/);
  assert.match(csv, /"'=SUM\(1,2\)"/);
  assert.match(csv, /"13\/11\/2026"/);
  assert.match(csv, /R\$\s10,50/);
  assert.equal(formatDate('2026-11-13', { dateFormat: 'MM/DD/YYYY' }), '11/13/2026');
});
