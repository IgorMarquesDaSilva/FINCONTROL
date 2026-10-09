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
const expenseForm = document.querySelector('[data-expense-form]');
const expenseList = document.querySelector('[data-expense-list]');
const balanceTotal = document.querySelector('[data-balance-total]');
const balanceHelper = document.querySelector('[data-balance-helper]');
const monthIncomeTotal = document.querySelector('[data-month-income-total]');
const incomeHelper = document.querySelector('[data-income-helper]');
const monthExpenseTotal = document.querySelector('[data-month-expense-total]');
const expenseHelper = document.querySelector('[data-expense-helper]');
const editDialog = document.querySelector('[data-edit-dialog]');
const editForm = document.querySelector('[data-edit-transaction-form]');
const editDialogTitle = document.querySelector('[data-edit-dialog-title]');
const editDescriptionLabel = document.querySelector('[data-edit-description-label]');

let toastTimer;
let incomes = [];
let expenses = [];

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

function pluralizeTransaction(count) {
  return `${count} movimentaç${count === 1 ? 'ão' : 'ões'} cadastrada${count === 1 ? '' : 's'}`;
}

function setDefaultTransactionDates() {
  [incomeForm, expenseForm].forEach((form) => {
    const dateInput = form.elements.namedItem('transactionDate');
    if (!dateInput.value) dateInput.value = todayIsoDate();
  });
}

function updateFinancialSummary() {
  const incomeTotal = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const monthKey = currentMonthKey();
  const monthIncome = incomes
    .filter((income) => String(income.transactionDate || '').startsWith(monthKey))
    .reduce((sum, income) => sum + Number(income.amount || 0), 0);
  const monthExpense = expenses
    .filter((expense) => String(expense.transactionDate || '').startsWith(monthKey))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const transactionCount = incomes.length + expenses.length;

  balanceTotal.textContent = formatCurrency(incomeTotal - expenseTotal);
  monthIncomeTotal.textContent = formatCurrency(monthIncome);
  monthExpenseTotal.textContent = formatCurrency(monthExpense);
  balanceHelper.textContent = transactionCount
    ? pluralizeTransaction(transactionCount)
    : 'Cadastre sua primeira movimentação';
  incomeHelper.textContent = monthIncome > 0 ? 'Receitas registradas neste mês' : 'Nenhuma entrada neste mês';
  expenseHelper.textContent = monthExpense > 0 ? 'Despesas registradas neste mês' : 'Nenhuma despesa neste mês';
}

function renderTransactions(listElement, transactions, type) {
  const isExpense = type === 'EXPENSE';
  const transactionLabel = isExpense ? 'despesa' : 'receita';
  listElement.replaceChildren();

  if (!transactions.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state empty-state--compact';
    emptyState.innerHTML = isExpense
      ? '<span aria-hidden="true">↘</span><h3>Nenhuma despesa ainda</h3><p>Registre um gasto para acompanhar para onde seu dinheiro está indo.</p>'
      : '<span aria-hidden="true">↕</span><h3>Seu histórico começa aqui</h3><p>Cadastre sua primeira receita para acompanhar quanto entra no mês.</p>';
    listElement.append(emptyState);
    updateFinancialSummary();
    return;
  }

  transactions.forEach((transaction) => {
    const item = document.createElement('div');
    item.className = `income-item${isExpense ? ' income-item--expense' : ''}`;

    const details = document.createElement('div');
    const description = document.createElement('strong');
    const meta = document.createElement('small');
    const category = document.createElement('span');
    description.textContent = transaction.description || 'Sem descrição';
    category.className = 'income-item__category';
    category.textContent = transaction.category?.name || (isExpense ? 'Despesa' : 'Receita');
    meta.append(category, ` - ${formatDate(transaction.transactionDate)}`);
    details.append(description, meta);

    const actions = document.createElement('div');
    actions.className = 'income-item__actions';

    const amount = document.createElement('span');
    amount.className = 'income-item__amount';
    amount.textContent = `${isExpense ? '- ' : ''}${formatCurrency(transaction.amount)}`;

    const editButton = document.createElement('button');
    editButton.className = 'income-item__edit';
    editButton.type = 'button';
    editButton.dataset.editTransaction = transaction.id;
    editButton.setAttribute('aria-label', `Editar ${transactionLabel} ${transaction.description || 'sem descrição'}`);
    editButton.textContent = 'Editar';

    actions.append(amount, editButton);
    item.append(details, actions);
    listElement.append(item);
  });

  updateFinancialSummary();
}

function renderIncomes() {
  renderTransactions(incomeList, incomes, 'INCOME');
}

function renderExpenses() {
  renderTransactions(expenseList, expenses, 'EXPENSE');
}

async function loadFinancialData() {
  try {
    const [incomePayload, expensePayload] = await Promise.all([
      api('/api/incomes'),
      api('/api/expenses'),
    ]);
    incomes = incomePayload.incomes || [];
    expenses = expensePayload.expenses || [];
    renderIncomes();
    renderExpenses();
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

function validateTransactionForm(data, transactionLabel, descriptionRequired = true) {
  const errors = {};

  if ((descriptionRequired && data.description.length < 2) || data.description.length === 1) {
    errors.description = descriptionRequired
      ? 'Informe uma descricao.'
      : 'Use ao menos dois caracteres ou deixe a descricao vazia.';
  }
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
    editForm.elements.namedItem('description').required = transaction.type === 'INCOME';
    editDescriptionLabel.textContent = transaction.type === 'EXPENSE' ? 'Descrição (opcional)' : 'Descrição';
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
  setDefaultTransactionDates();
  void loadFinancialData();
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
    setDefaultTransactionDates();
    renderIncomes();
    showToast('Receita cadastrada com sucesso.');
  } catch (error) {
    displayErrors(incomeForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(incomeForm, false);
  }
});

expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(expenseForm);
  const data = transactionFormData(expenseForm);
  const clientErrors = validateTransactionForm(data, 'despesa', false);

  if (Object.keys(clientErrors).length) {
    displayErrors(expenseForm, clientErrors);
    return;
  }

  try {
    setLoading(expenseForm, true);
    const payload = await api('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    expenses = [payload.expense, ...expenses.filter((expense) => expense.id !== payload.expense.id)].slice(0, 20);
    expenseForm.reset();
    setDefaultTransactionDates();
    renderExpenses();
    showToast('Despesa cadastrada com sucesso.');
  } catch (error) {
    displayErrors(expenseForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(expenseForm, false);
  }
});

[incomeList, expenseList].forEach((listElement) => {
  listElement.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-transaction]');
    if (editButton) void openTransactionEditor(editButton.dataset.editTransaction);
  });
});

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(editForm);
  const transactionId = editForm.elements.namedItem('transactionId').value;
  const transactionLabel = editForm.dataset.transactionType === 'EXPENSE' ? 'despesa' : 'receita';
  const data = transactionFormData(editForm);
  const clientErrors = validateTransactionForm(
    data,
    transactionLabel,
    editForm.dataset.transactionType !== 'EXPENSE',
  );

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
    } else {
      expenses = expenses.map((expense) => (
        Number(expense.id) === Number(payload.transaction.id) ? payload.transaction : expense
      ));
      renderExpenses();
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
  editForm.elements.namedItem('description').required = false;
  editDescriptionLabel.textContent = 'Descrição';
  clearErrors(editForm);
});

document.querySelector('[data-logout]').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch (_error) {
    // A interface encerra a sessão mesmo se a resposta for interrompida.
  }
  incomes = [];
  expenses = [];
  renderIncomes();
  renderExpenses();
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
document.querySelectorAll('[data-focus-expense-form]').forEach((button) => {
  button.addEventListener('click', () => {
    setMenu(false);
    expenseForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    expenseForm.elements.namedItem('amount')?.focus();
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
