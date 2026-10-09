const authView = document.querySelector('[data-auth-view]');
const dashboardView = document.querySelector('[data-dashboard-view]');
const loginForm = document.querySelector('[data-login-form]');
const registerForm = document.querySelector('[data-register-form]');
const loginHeading = document.querySelector('[data-login-heading]');
const registerHeading = document.querySelector('[data-register-heading]');
const toast = document.querySelector('[data-toast]');
const sidebar = document.querySelector('[data-sidebar]');
const incomeForm = document.querySelector('[data-income-form]');
const incomeList = document.querySelector('[data-income-list]');
const balanceTotal = document.querySelector('[data-balance-total]');
const balanceHelper = document.querySelector('[data-balance-helper]');
const monthIncomeTotal = document.querySelector('[data-month-income-total]');
const incomeHelper = document.querySelector('[data-income-helper]');
const editDialog = document.querySelector('[data-edit-dialog]');
const editForm = document.querySelector('[data-edit-transaction-form]');
const editDialogTitle = document.querySelector('[data-edit-dialog-title]');

let toastTimer;
let incomes = [];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

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

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function todayIsoDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function pluralizeIncome(count) {
  return `${count} receita${count === 1 ? '' : 's'} cadastrada${count === 1 ? '' : 's'}`;
}

function setDefaultIncomeDate() {
  const dateInput = incomeForm.elements.namedItem('transactionDate');
  if (!dateInput.value) dateInput.value = todayIsoDate();
}

function updateIncomeSummary() {
  const total = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
  const monthKey = currentMonthKey();
  const monthTotal = incomes
    .filter((income) => String(income.transactionDate || '').startsWith(monthKey))
    .reduce((sum, income) => sum + Number(income.amount || 0), 0);

  balanceTotal.textContent = formatCurrency(total);
  monthIncomeTotal.textContent = formatCurrency(monthTotal);
  balanceHelper.textContent = incomes.length ? pluralizeIncome(incomes.length) : 'Comece adicionando uma receita';
  incomeHelper.textContent = monthTotal > 0 ? 'Receitas registradas neste mês' : 'Nenhuma entrada neste mês';
}

function renderIncomes() {
  incomeList.replaceChildren();

  if (!incomes.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state empty-state--compact';
    emptyState.innerHTML = '<span aria-hidden="true">↕</span><h3>Seu histórico começa aqui</h3><p>Cadastre sua primeira receita para acompanhar quanto entra no mês.</p>';
    incomeList.append(emptyState);
    updateIncomeSummary();
    return;
  }

  incomes.forEach((income) => {
    const item = document.createElement('div');
    item.className = 'income-item';

    const details = document.createElement('div');
    const description = document.createElement('strong');
    const meta = document.createElement('small');
    const category = document.createElement('span');
    description.textContent = income.description;
    category.className = 'income-item__category';
    category.textContent = income.category?.name || 'Receita';
    meta.append(category, ` - ${formatDate(income.transactionDate)}`);
    details.append(description, meta);

    const actions = document.createElement('div');
    actions.className = 'income-item__actions';

    const amount = document.createElement('span');
    amount.className = 'income-item__amount';
    amount.textContent = formatCurrency(income.amount);

    const editButton = document.createElement('button');
    editButton.className = 'income-item__edit';
    editButton.type = 'button';
    editButton.dataset.editTransaction = income.id;
    editButton.setAttribute('aria-label', `Editar receita ${income.description}`);
    editButton.textContent = 'Editar';

    actions.append(amount, editButton);
    item.append(details, actions);
    incomeList.append(item);
  });

  updateIncomeSummary();
}

async function loadIncomes() {
  try {
    const payload = await api('/api/incomes');
    incomes = payload.incomes || [];
    renderIncomes();
  } catch (error) {
    showToast(error.message, 'error');
  }
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

function transactionFormData(form) {
  const formData = new FormData(form);

  return {
    description: String(formData.get('description') || '').trim(),
    amount: String(formData.get('amount') || '').trim(),
    transactionDate: String(formData.get('transactionDate') || '').trim(),
    categoryName: String(formData.get('categoryName') || '').trim(),
  };
}

function validateTransactionForm(data, transactionLabel) {
  const errors = {};

  if (data.description.length < 2) errors.description = 'Informe uma descricao.';
  if (!data.amount || Number(data.amount) <= 0) errors.amount = 'Informe um valor maior que zero.';
  if (!data.transactionDate) errors.transactionDate = `Informe a data da ${transactionLabel}.`;
  if (data.categoryName.length < 2) errors.categoryName = 'Informe uma categoria.';

  return errors;
}

async function openTransactionEditor(transactionId) {
  try {
    const payload = await api(`/api/transactions/${transactionId}`);
    const { transaction } = payload;
    const transactionLabel = transaction.type === 'EXPENSE' ? 'despesa' : 'receita';

    clearErrors(editForm);
    editForm.dataset.transactionType = transaction.type;
    editForm.elements.namedItem('transactionId').value = transaction.id;
    editForm.elements.namedItem('description').value = transaction.description;
    editForm.elements.namedItem('amount').value = Number(transaction.amount).toFixed(2);
    editForm.elements.namedItem('transactionDate').value = transaction.transactionDate;
    editForm.elements.namedItem('categoryName').value = transaction.category?.name || '';
    editDialogTitle.textContent = `Editar ${transactionLabel}`;
    editDialog.showModal();
    editForm.elements.namedItem('description').focus();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function closeTransactionEditor() {
  if (editDialog.open) editDialog.close();
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
  setDefaultIncomeDate();
  void loadIncomes();
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

incomeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(incomeForm);
  const data = transactionFormData(incomeForm);
  const clientErrors = validateTransactionForm(data, 'receita');

  if (Object.keys(clientErrors).length) {
    displayErrors(incomeForm, clientErrors);
    return;
  }

  try {
    setLoading(incomeForm, true);
    const payload = await api('/api/incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    incomes = [payload.income, ...incomes.filter((income) => income.id !== payload.income.id)].slice(0, 20);
    incomeForm.reset();
    setDefaultIncomeDate();
    renderIncomes();
    showToast('Receita cadastrada com sucesso.');
  } catch (error) {
    displayErrors(incomeForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(incomeForm, false);
  }
});

incomeList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-transaction]');
  if (editButton) void openTransactionEditor(editButton.dataset.editTransaction);
});

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(editForm);
  const transactionId = editForm.elements.namedItem('transactionId').value;
  const transactionLabel = editForm.dataset.transactionType === 'EXPENSE' ? 'despesa' : 'receita';
  const data = transactionFormData(editForm);
  const clientErrors = validateTransactionForm(data, transactionLabel);

  if (Object.keys(clientErrors).length) {
    displayErrors(editForm, clientErrors);
    return;
  }

  try {
    setLoading(editForm, true);
    const payload = await api(`/api/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (payload.transaction.type === 'INCOME') {
      incomes = incomes.map((income) => (
        Number(income.id) === Number(payload.transaction.id) ? payload.transaction : income
      ));
      renderIncomes();
    }

    closeTransactionEditor();
    showToast(payload.message);
  } catch (error) {
    displayErrors(editForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(editForm, false);
  }
});

document.querySelectorAll('[data-close-edit-dialog]').forEach((button) => {
  button.addEventListener('click', closeTransactionEditor);
});

editDialog.addEventListener('click', (event) => {
  if (event.target === editDialog) closeTransactionEditor();
});

editDialog.addEventListener('close', () => {
  editForm.reset();
  delete editForm.dataset.transactionType;
  clearErrors(editForm);
});

document.querySelector('[data-logout]').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch (_error) {
    // A interface encerra a sessão mesmo se a resposta for interrompida.
  }
  incomes = [];
  renderIncomes();
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
document.querySelectorAll('[data-focus-income-form]').forEach((button) => {
  button.addEventListener('click', () => {
    setMenu(false);
    incomeForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    incomeForm.elements.namedItem('description')?.focus();
  });
});
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
