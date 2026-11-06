function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= maximum ? number : null;
}

function isoDate(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === normalized
    ? normalized
    : undefined;
}

function money(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 && number <= 9999999999999.99
    ? number.toFixed(2)
    : undefined;
}

function validateTransactionQuery(query = {}) {
  const page = positiveInteger(query.page, 1);
  const pageSize = positiveInteger(query.pageSize, 10, 50);
  const categoryId = positiveInteger(query.categoryId, null);
  const type = String(query.type || '').trim().toUpperCase() || null;
  const dateFrom = isoDate(query.dateFrom);
  const dateTo = isoDate(query.dateTo);
  const minAmount = money(query.minAmount);
  const maxAmount = money(query.maxAmount);
  const search = String(query.search || '').trim().replace(/\s+/g, ' ');
  const sort = String(query.sort || 'date').trim().toLowerCase();
  const order = String(query.order || 'desc').trim().toLowerCase();
  const errors = {};

  if (!page) errors.page = 'Informe uma pagina valida.';
  if (!pageSize) errors.pageSize = 'Use entre 1 e 50 itens por pagina.';
  if (query.categoryId && !categoryId) errors.categoryId = 'Informe uma categoria valida.';
  if (type && !['INCOME', 'EXPENSE'].includes(type)) errors.type = 'Informe um tipo valido.';
  if (dateFrom === undefined) errors.dateFrom = 'Informe uma data inicial valida.';
  if (dateTo === undefined) errors.dateTo = 'Informe uma data final valida.';
  if (dateFrom && dateTo && dateFrom > dateTo) errors.dateTo = 'A data final deve ser igual ou posterior a inicial.';
  if (minAmount === undefined) errors.minAmount = 'Informe um valor minimo valido.';
  if (maxAmount === undefined) errors.maxAmount = 'Informe um valor maximo valido.';
  if (minAmount !== null && maxAmount !== null && Number(minAmount) > Number(maxAmount)) {
    errors.maxAmount = 'O valor maximo deve ser igual ou maior que o minimo.';
  }
  if (search.length > 180) errors.search = 'A busca deve ter no maximo 180 caracteres.';
  if (!['date', 'amount'].includes(sort)) errors.sort = 'Informe uma ordenacao valida.';
  if (!['asc', 'desc'].includes(order)) errors.order = 'Informe uma direcao valida.';

  return {
    data: { page, pageSize, categoryId, type, dateFrom, dateTo, minAmount, maxAmount, search, sort, order },
    errors,
  };
}

module.exports = { validateTransactionQuery };
