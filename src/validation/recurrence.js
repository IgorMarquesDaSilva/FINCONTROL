const { validateTransaction } = require('./transaction');

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateRecurrence(input = {}) {
  const type = String(input.type || '');
  const startDate = String(input.startDate || '');
  const endDate = input.endDate ? String(input.endDate) : null;
  const frequency = String(input.frequency || '');
  const base = validateTransaction({
    description: input.description, amount: input.amount,
    categoryName: input.categoryName, transactionDate: startDate,
  }, ['INCOME', 'EXPENSE'].includes(type) ? type : 'INCOME');
  const errors = { ...base.errors };
  if (!['INCOME', 'EXPENSE'].includes(type)) errors.type = 'Escolha receita ou despesa.';
  if (base.data.description.length < 2) errors.description = 'Descreva a movimentação recorrente.';
  if (!['WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) errors.frequency = 'Escolha uma frequência válida.';
  if (!validDate(startDate)) errors.startDate = 'Informe uma data inicial válida.';
  if (endDate && (!validDate(endDate) || endDate < startDate)) errors.endDate = 'A data final deve ser igual ou posterior à inicial.';
  delete errors.transactionDate;
  return {
    data: {
      type, description: base.data.description, amount: base.data.amount,
      categoryName: base.data.categoryName, frequency, startDate, endDate,
    },
    errors,
  };
}

module.exports = { validateRecurrence };
