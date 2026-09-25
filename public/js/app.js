const authView = document.querySelector('[data-auth-view]');
const dashboardView = document.querySelector('[data-dashboard-view]');
const loginForm = document.querySelector('[data-login-form]');
const registerForm = document.querySelector('[data-register-form]');
const loginHeading = document.querySelector('[data-login-heading]');
const registerHeading = document.querySelector('[data-register-heading]');
const toast = document.querySelector('[data-toast]');
const sidebar = document.querySelector('[data-sidebar]');

let toastTimer;

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Não foi possível concluir a solicitação.');
    error.fields = payload.error?.fields || {};
    error.status = response.status;
    throw error;
  }

  return payload;
}

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function clearErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-error-for]').forEach((element) => { element.textContent = ''; });
}

function displayErrors(form, errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const input = form.elements.namedItem(name);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    input?.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  });

  form.querySelector('[aria-invalid="true"]')?.focus();
}

function setLoading(form, loading) {
  const button = form.querySelector('[type="submit"]');
  button.disabled = loading;
  button.classList.toggle('is-loading', loading);
  form.setAttribute('aria-busy', String(loading));
}

function showAuth(mode = 'login') {
  const isRegister = mode === 'register';
  authView.hidden = false;
  dashboardView.hidden = true;
  loginForm.hidden = isRegister;
  loginHeading.hidden = isRegister;
  registerForm.hidden = !isRegister;
  registerHeading.hidden = !isRegister;
  document.title = `${isRegister ? 'Criar conta' : 'Entrar'} — FINCONTROL`;
  clearErrors(loginForm);
  clearErrors(registerForm);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => (isRegister ? registerForm : loginForm).querySelector('input')?.focus(), 50);
}

function showDashboard(user) {
  const name = user.name?.trim() || 'Usuário';
  const firstName = name.split(/\s+/)[0];
  document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = name; });
  document.querySelectorAll('[data-first-name]').forEach((element) => { element.textContent = firstName; });
  document.querySelectorAll('[data-user-initial]').forEach((element) => { element.textContent = firstName[0].toUpperCase(); });
  authView.hidden = true;
  dashboardView.hidden = false;
  document.title = `Visão geral — FINCONTROL`;
}

document.querySelectorAll('[data-show-register]').forEach((button) => {
  button.addEventListener('click', () => showAuth('register'));
});

document.querySelectorAll('[data-show-login]').forEach((button) => {
  button.addEventListener('click', () => showAuth('login'));
});

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const showPassword = input.type === 'password';
    input.type = showPassword ? 'text' : 'password';
    button.setAttribute('aria-label', showPassword ? 'Ocultar senha' : 'Mostrar senha');
  });
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(loginForm);
  const formData = new FormData(loginForm);

  try {
    setLoading(loginForm, true);
    const payload = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }),
    });
    loginForm.reset();
    showDashboard(payload.user);
    showToast(`Bem-vindo de volta, ${payload.user.name.split(' ')[0]}!`);
  } catch (error) {
    displayErrors(loginForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(loginForm, false);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(registerForm);
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());
  const clientErrors = {};

  if (!formData.get('terms')) clientErrors.terms = 'Você precisa aceitar os termos para continuar.';
  if (data.password !== data.passwordConfirmation) clientErrors.passwordConfirmation = 'As senhas não coincidem.';

  if (Object.keys(clientErrors).length) {
    displayErrors(registerForm, clientErrors);
    return;
  }

  try {
    setLoading(registerForm, true);
    const payload = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
      }),
    });
    registerForm.reset();
    showDashboard(payload.user);
    showToast('Conta criada! Sua jornada financeira começou.');
  } catch (error) {
    displayErrors(registerForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(registerForm, false);
  }
});

document.querySelector('[data-logout]').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch (_error) {
    // A interface encerra a sessão mesmo se a resposta for interrompida.
  }
  showAuth('login');
  showToast('Você saiu da sua conta.');
});

function setMenu(open) {
  sidebar.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

document.querySelector('[data-menu-open]').addEventListener('click', () => setMenu(true));
document.querySelectorAll('[data-menu-close]').forEach((button) => button.addEventListener('click', () => setMenu(false)));
document.querySelectorAll('.sidebar-link').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => showToast('Essa função entra na próxima etapa do projeto.'));
});

async function restoreSession() {
  try {
    const payload = await api('/api/auth/me');
    showDashboard(payload.user);
  } catch (_error) {
    showAuth('login');
  }
}

restoreSession();
