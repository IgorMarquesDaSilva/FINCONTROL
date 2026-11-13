const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
} = require('../src/validation/auth');

test('cadastro normaliza nome e e-mail validos', () => {
  const result = validateRegistration({
    name: '  Ana   Souza  ',
    email: ' ANA@EXEMPLO.COM ',
    password: 'Senha123',
    passwordConfirmation: 'Senha123',
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.data.name, 'Ana Souza');
  assert.equal(result.data.email, 'ana@exemplo.com');
});

test('cadastro rejeita dados fracos e senhas diferentes', () => {
  const result = validateRegistration({
    name: 'A',
    email: 'invalido',
    password: '123',
    passwordConfirmation: '456',
  });

  assert.deepEqual(Object.keys(result.errors).sort(), [
    'email',
    'name',
    'password',
    'passwordConfirmation',
  ]);
});

test('login exige e-mail valido e senha', () => {
  const result = validateLogin({ email: 'sem-arroba', password: '' });

  assert.ok(result.errors.email);
  assert.ok(result.errors.password);
});

test('solicitacao de recuperacao normaliza e valida e-mail', () => {
  const valid = validatePasswordResetRequest({ email: '  ANA@EXEMPLO.COM ' });
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.data.email, 'ana@exemplo.com');
  assert.ok(validatePasswordResetRequest({ email: 'invalido' }).errors.email);
});

test('redefinicao exige token de uso unico e senha forte confirmada', () => {
  const invalid = validatePasswordReset({ token: 'invalido', password: 'senha', passwordConfirmation: 'diferente' });
  assert.ok(invalid.errors.token);
  assert.ok(invalid.errors.password);
  assert.ok(invalid.errors.passwordConfirmation);

  const valid = validatePasswordReset({
    token: 'a'.repeat(64), password: 'NovaSenha123', passwordConfirmation: 'NovaSenha123',
  });
  assert.deepEqual(valid.errors, {});
});

test('alteracao autenticada exige senha atual e não aceita repeti-la como nova', () => {
  const invalid = validatePasswordChange({ currentPassword: 'SenhaAtual123', password: 'SenhaAtual123', passwordConfirmation: 'OutraSenha123' });
  assert.ok(invalid.errors.password);
  assert.ok(invalid.errors.passwordConfirmation);

  const valid = validatePasswordChange({
    currentPassword: 'SenhaAtual123', password: 'NovaSenha123', passwordConfirmation: 'NovaSenha123',
  });
  assert.deepEqual(valid.errors, {});
});
