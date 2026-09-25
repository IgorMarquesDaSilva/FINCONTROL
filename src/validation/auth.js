const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(input = {}) {
  const name = String(input.name || '').trim().replace(/\s+/g, ' ');
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const passwordConfirmation = String(input.passwordConfirmation || '');
  const errors = {};

  if (name.length < 2 || name.length > 120) {
    errors.name = 'Informe um nome entre 2 e 120 caracteres.';
  }

  if (email.length > 191 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use ao menos 8 caracteres, com maiuscula, minuscula e numero.';
  }

  if (password !== passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas nao coincidem.';
  }

  return { data: { name, email, password }, errors };
}

function validateLogin(input = {}) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const errors = {};

  if (email.length > 191 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (!password) {
    errors.password = 'Informe sua senha.';
  }

  return { data: { email, password }, errors };
}

module.exports = { validateRegistration, validateLogin };
