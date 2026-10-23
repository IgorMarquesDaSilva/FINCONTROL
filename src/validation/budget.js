function positiveInteger(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function validateBudgetPeriod(yearValue, monthValue) {
  const yearText = String(yearValue ?? '').trim();
  const monthText = String(monthValue ?? '').trim();
  const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
  const month = /^\d{1,2}$/.test(monthText) ? Number(monthText) : null;
  const errors = {};

  if (!year || year < 2000 || year > 2200) errors.year = 'Informe um ano entre 2000 e 2200.';
  if (!month || month < 1 || month > 12) errors.month = 'Informe um mês entre 1 e 12.';

  return { data: { year, month }, errors };
}

function validateBudget(input = {}) {
  const period = validateBudgetPeriod(input.year, input.month);
  const categoryId = positiveInteger(input.categoryId);
  const rawAmount = String(input.amount ?? '').trim().replace(',', '.');
  const errors = { ...period.errors };

  if (!categoryId) errors.categoryId = 'Informe uma categoria válida.';

  let amount = null;
  if (!/^\d+(\.\d{1,2})?$/.test(rawAmount)) {
    errors.amount = 'Informe um limite válido, com até duas casas decimais.';
  } else {
    const numericAmount = Number(rawAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      errors.amount = 'O limite deve ser maior que zero.';
    } else if (numericAmount > 9999999999999.99) {
      errors.amount = 'O limite informado é muito alto.';
    } else {
      amount = numericAmount.toFixed(2);
    }
  }

  return {
    data: { ...period.data, categoryId, amount },
    errors,
  };
}

module.exports = { positiveInteger, validateBudget, validateBudgetPeriod };
