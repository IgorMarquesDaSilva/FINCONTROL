const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCIES = ['BRL', 'USD', 'EUR'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

function validateProfile(input = {}) {
  const name = String(input.name || '').trim().replace(/\s+/g, ' ');
  const email = String(input.email || '').trim().toLowerCase();
  const currency = String(input.currency || '');
  const dateFormat = String(input.dateFormat || '');
  const timeZone = String(input.timeZone || '');
  const monthStartDay = Number(input.monthStartDay);
  const currentPassword = String(input.currentPassword || '');
  const errors = {};

  if (name.length < 2 || name.length > 120) errors.name = 'Informe um nome entre 2 e 120 caracteres.';
  if (email.length > 191 || !EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.';
  if (!CURRENCIES.includes(currency)) errors.currency = 'Escolha uma moeda disponível.';
  if (!DATE_FORMATS.includes(dateFormat)) errors.dateFormat = 'Escolha um formato de data disponível.';
  try {
    if (timeZone.length > 64 || (timeZone !== 'UTC' && !Intl.supportedValuesOf('timeZone').includes(timeZone))) throw new Error();
  } catch (_error) {
    errors.timeZone = 'Escolha um fuso horário válido.';
  }
  if (!Number.isInteger(monthStartDay) || monthStartDay < 1 || monthStartDay > 28) {
    errors.monthStartDay = 'Escolha um dia de 1 a 28.';
  }
  return { data: { name, email, currency, dateFormat, timeZone, monthStartDay, currentPassword }, errors };
}

module.exports = { validateProfile };
