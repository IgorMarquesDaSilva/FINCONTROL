function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeAmount(value) {
  const rawValue = String(value || '').trim().replace(',', '.');

  if (!rawValue) {
    return { amount: null, error: 'Informe o valor da receita.' };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(rawValue)) {
    return { amount: null, error: 'Informe um valor valido, com ate duas casas decimais.' };
  }

  const amount = Number(rawValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount: null, error: 'O valor da receita deve ser maior que zero.' };
  }

  if (amount > 9999999999999.99) {
    return { amount: null, error: 'O valor informado e muito alto.' };
  }

  return { amount: amount.toFixed(2), error: null };
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateIncome(input = {}) {
  const description = normalizeText(input.description);
  const categoryName = normalizeText(input.categoryName);
  const transactionDate = String(input.transactionDate || '').trim();
  const amountResult = normalizeAmount(input.amount);
  const errors = {};

  if (description.length < 2 || description.length > 180) {
    errors.description = 'Informe uma descricao entre 2 e 180 caracteres.';
  }

  if (!amountResult.amount) {
    errors.amount = amountResult.error;
  }

  if (!isValidIsoDate(transactionDate)) {
    errors.transactionDate = 'Informe uma data valida.';
  }

  if (categoryName.length < 2 || categoryName.length > 80) {
    errors.categoryName = 'Informe uma categoria entre 2 e 80 caracteres.';
  }

  return {
    data: {
      description,
      amount: amountResult.amount,
      transactionDate,
      categoryName,
    },
    errors,
  };
}

module.exports = { validateIncome };
