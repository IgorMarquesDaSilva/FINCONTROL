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

function validatePassword(input = {}, { tokenRequired = false, currentPasswordRequired = false } = {}) {
  const token = String(input.token || '').trim();
  const currentPassword = String(input.currentPassword || '');
  const password = String(input.password || '');
  const passwordConfirmation = String(input.passwordConfirmation || '');
  const errors = {};

  if (tokenRequired && !/^[a-f\d]{64}$/i.test(token)) {
    errors.token = 'O link de recuperação é inválido ou está incompleto.';
  }
  if (currentPasswordRequired && !currentPassword) {
    errors.currentPassword = 'Informe sua senha atual.';
  }
  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Use ao menos 8 caracteres, com maiúscula, minúscula e número.';
  }
  if (password !== passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas não coincidem.';
  }
  if (currentPasswordRequired && currentPassword && password === currentPassword) {
    errors.password = 'Escolha uma senha diferente da atual.';
  }

  return {
    data: { token, currentPassword, password, passwordConfirmation },
    errors,
  };
}

function validatePasswordReset(input = {}) {
  return validatePassword(input, { tokenRequired: true });
}

function validatePasswordChange(input = {}) {
  return validatePassword(input, { currentPasswordRequired: true });
}

function validatePasswordResetRequest(input = {}) {
  const email = String(input.email || '').trim().toLowerCase();
  const errors = {};
  if (email.length > 191 || !EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.';
  return { data: { email }, errors };
}

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
};
