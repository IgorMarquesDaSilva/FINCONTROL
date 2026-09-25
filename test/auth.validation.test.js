const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration, validateLogin } = require('../src/validation/auth');

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
