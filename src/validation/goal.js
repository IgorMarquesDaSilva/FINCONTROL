const VALID_STATUSES = new Set(['ACTIVE', 'COMPLETED', 'CANCELLED']);

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeMoney(value, { allowZero = false } = {}) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0)) return null;
  if (amount > 9999999999999.99) return null;
  return amount.toFixed(2);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateGoal(input = {}) {
  const name = normalizeText(input.name);
  const description = normalizeText(input.description);
  const targetAmount = normalizeMoney(input.targetAmount);
  const currentAmount = normalizeMoney(input.currentAmount ?? '0', { allowZero: true });
  const deadline = String(input.deadline || '').trim() || null;
  const errors = {};

  if (name.length < 2 || name.length > 120) errors.name = 'Informe um nome entre 2 e 120 caracteres.';
  if (description.length > 255) errors.description = 'A descricao deve ter no maximo 255 caracteres.';
  if (!targetAmount) errors.targetAmount = 'Informe um valor-alvo maior que zero.';
  if (currentAmount === null) errors.currentAmount = 'Informe um valor acumulado valido.';
  if (targetAmount && currentAmount !== null && Number(currentAmount) > Number(targetAmount)) {
    errors.currentAmount = 'O valor acumulado nao pode superar o valor-alvo.';
  }
  if (deadline && !validDate(deadline)) errors.deadline = 'Informe uma data valida.';

  return {
    data: { name, description, targetAmount, currentAmount, deadline },
    errors,
  };
}

function validateContribution(input = {}) {
  const amount = normalizeMoney(input.amount);
  return {
    data: { amount },
    errors: amount ? {} : { amount: 'Informe um aporte maior que zero.' },
  };
}

function validateGoalStatus(input = {}) {
  const status = String(input.status || '').trim().toUpperCase();
  return {
    data: { status },
    errors: VALID_STATUSES.has(status) ? {} : { status: 'Informe um status valido.' },
  };
}

module.exports = { validateContribution, validateGoal, validateGoalStatus };
