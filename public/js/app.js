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
const reportSection = document.querySelector('[data-monthly-report]');
const reportMonthInput = document.querySelector('[data-report-month]');
const reportEmpty = document.querySelector('[data-report-empty]');
const reportError = document.querySelector('[data-report-error]');
const budgetPlanning = document.querySelector('[data-budget-planning]');
const budgetMonthInput = document.querySelector('[data-budget-month]');
const budgetForm = document.querySelector('[data-budget-form]');
const budgetCategorySelect = document.querySelector('[data-budget-category]');
const budgetLimitInput = document.querySelector('[data-budget-limit]');
const budgetList = document.querySelector('[data-budget-list]');
const budgetLoading = document.querySelector('[data-budget-loading]');
const budgetError = document.querySelector('[data-budget-error]');
const budgetEmpty = document.querySelector('[data-budget-empty]');
const budgetNoCategories = document.querySelector('[data-budget-no-categories]');
const budgetFormError = document.querySelector('[data-budget-form-error]');
const budgetCancelButton = document.querySelector('[data-budget-cancel]');
const budgetDeleteDialog = document.querySelector('[data-budget-delete-dialog]');
const budgetDeleteForm = document.querySelector('[data-budget-delete-form]');
const editDialog = document.querySelector('[data-edit-dialog]');
const editForm = document.querySelector('[data-edit-transaction-form]');
const editDialogTitle = document.querySelector('[data-edit-dialog-title]');
const editDescriptionLabel = document.querySelector('[data-edit-description-label]');
const deleteDialog = document.querySelector('[data-delete-dialog]');
const deleteForm = document.querySelector('[data-delete-transaction-form]');
const deleteType = document.querySelector('[data-delete-type]');
const deleteDescription = document.querySelector('[data-delete-description]');
const deleteCategory = document.querySelector('[data-delete-category]');
const deleteDate = document.querySelector('[data-delete-date]');
const deleteAmount = document.querySelector('[data-delete-amount]');

let toastTimer;
let incomes = [];
let expenses = [];
let reportRequestId = 0;
let budgetRequestId = 0;
let budgetCategories = [];
let monthlyBudgets = [];

const chartColors = ['#20b981', '#ff9f68', '#6683e8', '#bf83d5', '#e1b44c', '#55a9c4', '#e27483', '#82936e'];

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

    const deleteButton = document.createElement('button');
    deleteButton.className = 'income-item__delete';
    deleteButton.type = 'button';
    deleteButton.dataset.deleteTransaction = transaction.id;
    deleteButton.setAttribute('aria-label', `Excluir ${transactionLabel} ${transaction.description || 'sem descrição'}`);
    deleteButton.textContent = '×';

    actions.append(amount, editButton, deleteButton);
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
    await loadMonthlyReport();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function periodLabel(period) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(period.year, period.month - 1, 1)));
}

function renderReportCategories(categories, expenseTotal) {
  const donut = document.querySelector('[data-category-donut]');
  const legend = document.querySelector('[data-category-legend]');
  const description = document.querySelector('[data-category-description]');
  legend.replaceChildren();

  if (!categories.length || expenseTotal <= 0) {
    donut.style.background = 'conic-gradient(#e8eeec 0 100%)';
    donut.setAttribute('aria-label', 'Sem despesas por categoria neste período.');
    description.textContent = 'Sem despesas por categoria neste período.';
    return;
  }

  let cursor = 0;
  const segments = categories.map((category, index) => {
    const start = cursor;
    cursor += Math.max(0, Number(category.percentage));
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
  });
  donut.style.background = `conic-gradient(${segments.join(', ')})`;
  donut.setAttribute('aria-label', `Distribuição de despesas por categoria: ${categories.map((item) => `${item.name}, ${Number(item.percentage).toFixed(1)} por cento`).join('; ')}.`);
  description.textContent = `Despesas por categoria: ${categories.map((item) => `${item.name}: ${formatCurrency(item.amount)} (${Number(item.percentage).toFixed(1)}%)`).join('; ')}.`;

  categories.forEach((category, index) => {
    const item = document.createElement('li');
    const swatch = document.createElement('i');
    swatch.style.setProperty('--category-color', chartColors[index % chartColors.length]);
    swatch.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = category.name;
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(category.amount);
    const percentage = document.createElement('small');
    percentage.textContent = `${Number(category.percentage).toFixed(0)}%`;
    item.append(swatch, label, amount, percentage);
    legend.append(item);
  });
}

function appendComparisonRow(container, label, current, previous, kind) {
  const row = document.createElement('div');
  row.className = 'comparison-row';
  const name = document.createElement('span');
  name.textContent = label;
  const values = document.createElement('div');
  values.className = 'comparison-row__values';
  const currentValue = document.createElement('strong');
  currentValue.textContent = formatCurrency(current);
  const previousValue = document.createElement('small');
  previousValue.textContent = `antes ${formatCurrency(previous)}`;
  const change = document.createElement('span');
  const delta = current - previous;
  const ratio = previous ? Math.abs(delta / previous) * 100 : (current ? 100 : 0);
  const isBetter = kind === 'expense' ? delta <= 0 : delta >= 0;
  change.className = `comparison-change ${isBetter ? 'is-positive' : 'is-negative'}`;
  change.textContent = `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${formatCurrency(Math.abs(delta))} · ${previous ? `${ratio.toFixed(0)}%` : current ? 'novo' : '0%'}`;
  values.append(currentValue, previousValue);
  row.append(name, values, change);
  container.append(row);
}

function renderMonthlyReport(report) {
  const { current, previous, period, previousPeriod, expenseCategories, topExpenses } = report;
  const totalTransactions = Number(current.transactionCount);
  const hasTransactions = totalTransactions > 0;
  reportEmpty.hidden = hasTransactions;
  reportSection.querySelectorAll('.report-kpis, .report-charts, .report-bottom-grid')
    .forEach((element) => { element.hidden = !hasTransactions; });

  monthIncomeTotal.textContent = formatCurrency(current.income);
  monthExpenseTotal.textContent = formatCurrency(current.expense);
  incomeHelper.textContent = current.income > 0 ? `Receitas em ${periodLabel(period)}` : `Nenhuma entrada em ${periodLabel(period)}`;
  expenseHelper.textContent = current.expense > 0 ? `Despesas em ${periodLabel(period)}` : `Nenhuma despesa em ${periodLabel(period)}`;

  document.querySelector('[data-report-income]').textContent = formatCurrency(current.income);
  document.querySelector('[data-report-expense]').textContent = formatCurrency(current.expense);
  document.querySelector('[data-report-balance]').textContent = formatCurrency(current.balance);
  document.querySelector('[data-report-transaction-count]').textContent = pluralizeTransaction(totalTransactions);
  document.querySelector('[data-report-income-change]').textContent = previous.income
    ? `${current.income >= previous.income ? '↑' : '↓'} ${Math.abs((current.income - previous.income) / previous.income * 100).toFixed(0)}% vs. mês anterior`
    : (current.income ? 'Primeiras receitas do período' : 'Sem receitas no período anterior');
  document.querySelector('[data-report-expense-change]').textContent = previous.expense
    ? `${current.expense <= previous.expense ? '↓' : '↑'} ${Math.abs((current.expense - previous.expense) / previous.expense * 100).toFixed(0)}% vs. mês anterior`
    : (current.expense ? 'Primeiras despesas do período' : 'Sem despesas no período anterior');

  const flowChart = document.querySelector('[data-flow-chart]');
  const max = Math.max(current.income, current.expense, 1);
  flowChart.replaceChildren();
  [['Receitas', current.income, 'flow-bar--income'], ['Despesas', current.expense, 'flow-bar--expense']].forEach(([label, amount, className]) => {
    const column = document.createElement('div');
    column.className = 'flow-column';
    const value = document.createElement('strong');
    value.textContent = formatCurrency(amount);
    const track = document.createElement('div');
    track.className = 'flow-track';
    const bar = document.createElement('span');
    bar.className = `flow-bar ${className}`;
    bar.style.height = `${amount ? Math.max(4, Number(amount) / max * 100) : 0}%`;
    track.append(bar);
    const caption = document.createElement('span');
    caption.textContent = label;
    column.append(value, track, caption);
    flowChart.append(column);
  });
  document.querySelector('[data-flow-description]').textContent = `Neste mês, receitas de ${formatCurrency(current.income)} e despesas de ${formatCurrency(current.expense)}.`;
  renderReportCategories(expenseCategories, current.expense);

  document.querySelector('[data-previous-month-label]').textContent = periodLabel(previousPeriod);
  const comparisonValues = document.querySelector('[data-comparison-values]');
  comparisonValues.replaceChildren();
  appendComparisonRow(comparisonValues, 'Receitas', current.income, previous.income, 'income');
  appendComparisonRow(comparisonValues, 'Despesas', current.expense, previous.expense, 'expense');
  appendComparisonRow(comparisonValues, 'Saldo', current.balance, previous.balance, 'income');
  document.querySelector('[data-comparison-note]').textContent = previous.transactionCount
    ? `${previous.transactionCount} movimentações em ${periodLabel(previousPeriod)}.`
    : `Não há movimentações em ${periodLabel(previousPeriod)} para comparar.`;

  const topList = document.querySelector('[data-top-expenses]');
  topList.replaceChildren();
  topExpenses.forEach((expense) => {
    const item = document.createElement('li');
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = expense.description || 'Sem descrição';
    const meta = document.createElement('small');
    meta.textContent = `${expense.category} · ${formatDate(expense.transactionDate)}`;
    const amount = document.createElement('span');
    amount.textContent = formatCurrency(expense.amount);
    details.append(title, meta);
    item.append(details, amount);
    topList.append(item);
  });
  if (!topExpenses.length) {
    const item = document.createElement('li');
    item.className = 'top-expenses-empty';
    item.textContent = 'Nenhuma despesa registrada neste mês.';
    topList.append(item);
  }
}

async function loadMonthlyReport() {
  if (!reportMonthInput.value) reportMonthInput.value = currentMonthKey();
  const requestId = ++reportRequestId;
  reportSection.setAttribute('aria-busy', 'true');
  reportError.hidden = true;
  try {
    const payload = await api(`/api/reports/monthly?month=${encodeURIComponent(reportMonthInput.value)}`);
    if (requestId !== reportRequestId) return;
    renderMonthlyReport(payload.report);
  } catch (error) {
    if (requestId !== reportRequestId) return;
    reportError.textContent = error.message;
    reportError.hidden = false;
  } finally {
    if (requestId === reportRequestId) reportSection.setAttribute('aria-busy', 'false');
  }
}

function selectedBudgetPeriod() {
  const [year, month] = (budgetMonthInput.value || currentMonthKey()).split('-').map(Number);
  return { year, month };
}

function budgetPeriodQuery() {
  const period = selectedBudgetPeriod();
  return `year=${period.year}&month=${String(period.month).padStart(2, '0')}`;
}

function populateBudgetCategories(selectedCategoryId = '') {
  const editingId = budgetForm.dataset.budgetId;
  const reservedCategories = new Set(
    monthlyBudgets
      .filter((budget) => String(budget.id) !== String(editingId || ''))
      .map((budget) => String(budget.category.id)),
  );
  const availableCategories = budgetCategories.filter((category) => (
    !reservedCategories.has(String(category.id)) || String(category.id) === String(selectedCategoryId)
  ));
  budgetCategorySelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = availableCategories.length ? 'Selecione uma categoria' : 'Todas as categorias já têm limite';
  budgetCategorySelect.append(placeholder);
  availableCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    budgetCategorySelect.append(option);
  });
  budgetCategorySelect.value = selectedCategoryId ? String(selectedCategoryId) : '';
  budgetCategorySelect.disabled = !availableCategories.length;
  document.querySelector('[data-budget-submit]').disabled = !availableCategories.length;
}

function renderBudgetSummary(report, budgets) {
  const current = report.current;
  const planned = budgets.reduce((sum, budget) => sum + Number(budget.limitAmount), 0);
  document.querySelector('[data-budget-income]').textContent = formatCurrency(current.income);
  document.querySelector('[data-budget-planned]').textContent = formatCurrency(planned);
  document.querySelector('[data-budget-spent]').textContent = formatCurrency(current.expense);
  document.querySelector('[data-budget-available]').textContent = formatCurrency(current.balance);
  document.querySelector('[data-budget-planned-helper]').textContent = `${budgets.length} limite${budgets.length === 1 ? '' : 's'} por categoria`;
}

function createBudgetAction(label, className, action, budget) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset[action] = budget.id;
  button.textContent = label;
  button.setAttribute('aria-label', `${label} o limite de ${budget.category.name}`);
  return button;
}

function renderBudgetList(budgets, categories) {
  budgetList.replaceChildren();
  document.querySelector('[data-budget-list-count]').textContent = budgets.length
    ? `${budgets.length} limite${budgets.length === 1 ? '' : 's'}`
    : '';
  budgetEmpty.hidden = budgets.length > 0 || categories.length === 0;
  budgetNoCategories.hidden = categories.length > 0;

  budgets.forEach((budget) => {
    const card = document.createElement('article');
    card.className = `budget-item budget-item--${budget.status}`;
    const top = document.createElement('div');
    top.className = 'budget-item__top';
    const details = document.createElement('div');
    const name = document.createElement('h4');
    name.textContent = budget.category.name;
    const caption = document.createElement('p');
    caption.textContent = `${formatCurrency(budget.spentAmount)} gastos de ${formatCurrency(budget.limitAmount)}`;
    details.append(name, caption);
    const badge = document.createElement('span');
    badge.className = 'budget-status';
    badge.textContent = budget.statusLabel;
    top.append(details, badge);

    const progress = document.createElement('progress');
    progress.className = 'budget-progress';
    progress.max = 100;
    progress.value = Math.min(100, Math.max(0, Number(budget.percentageUsed)));
    progress.setAttribute('aria-label', `${budget.category.name}: ${Number(budget.percentageUsed).toFixed(0)}% do limite utilizado`);

    const foot = document.createElement('div');
    foot.className = 'budget-item__foot';
    const percentage = document.createElement('strong');
    percentage.textContent = `${Number(budget.percentageUsed).toFixed(0)}% utilizado`;
    const remaining = document.createElement('span');
    remaining.textContent = budget.remainingAmount >= 0
      ? `${formatCurrency(budget.remainingAmount)} disponíveis`
      : `${formatCurrency(Math.abs(budget.remainingAmount))} acima do limite`;
    foot.append(percentage, remaining);

    const actions = document.createElement('div');
    actions.className = 'budget-item__actions';
    actions.append(
      createBudgetAction('Editar', 'budget-action', 'editBudget', budget),
      createBudgetAction('Excluir', 'budget-action budget-action--delete', 'deleteBudget', budget),
    );
    card.append(top, progress, foot, actions);
    budgetList.append(card);
  });
  populateBudgetCategories(budgetForm.dataset.categoryId || '');
}

async function loadBudgetPlanning() {
  if (!budgetMonthInput.value) budgetMonthInput.value = currentMonthKey();
  const requestId = ++budgetRequestId;
  budgetPlanning.setAttribute('aria-busy', 'true');
  budgetLoading.hidden = false;
  budgetList.hidden = true;
  budgetError.hidden = true;
  budgetEmpty.hidden = true;
  budgetNoCategories.hidden = true;

  try {
    const [categoryPayload, budgetPayload, reportPayload] = await Promise.all([
      api('/api/budgets/categories'),
      api(`/api/budgets?${budgetPeriodQuery()}`),
      api(`/api/reports/monthly?month=${encodeURIComponent(budgetMonthInput.value)}`),
    ]);
    if (requestId !== budgetRequestId) return;
    budgetCategories = categoryPayload.categories || [];
    monthlyBudgets = budgetPayload.budgets || [];
    renderBudgetSummary(reportPayload.report, monthlyBudgets);
    renderBudgetList(monthlyBudgets, budgetCategories);
    budgetList.hidden = false;
  } catch (error) {
    if (requestId !== budgetRequestId) return;
    budgetError.textContent = error.message;
    budgetError.hidden = false;
  } finally {
    if (requestId === budgetRequestId) {
      budgetLoading.hidden = true;
      budgetPlanning.setAttribute('aria-busy', 'false');
    }
  }
}

function clearBudgetFormErrors() {
  clearErrors(budgetForm);
  budgetFormError.hidden = true;
  budgetFormError.textContent = '';
}

function resetBudgetForm() {
  budgetForm.reset();
  delete budgetForm.dataset.budgetId;
  delete budgetForm.dataset.categoryId;
  document.querySelector('[data-budget-form-eyebrow]').textContent = 'Novo limite';
  document.querySelector('[data-budget-form-title]').textContent = 'Planeje uma categoria';
  document.querySelector('[data-budget-form-description]').textContent = 'Defina um valor mensal para acompanhar seus gastos.';
  document.querySelector('[data-budget-submit] [data-button-label]').textContent = 'Adicionar limite';
  budgetCancelButton.hidden = true;
  clearBudgetFormErrors();
  populateBudgetCategories();
}

function editBudget(budgetId) {
  const budget = monthlyBudgets.find((item) => String(item.id) === String(budgetId));
  if (!budget) return;
  clearBudgetFormErrors();
  budgetForm.dataset.budgetId = budget.id;
  budgetForm.dataset.categoryId = budget.category.id;
  document.querySelector('[data-budget-form-eyebrow]').textContent = 'Editar limite';
  document.querySelector('[data-budget-form-title]').textContent = `Limite de ${budget.category.name}`;
  document.querySelector('[data-budget-form-description]').textContent = `Ajuste o valor planejado para ${periodLabel({ year: budget.year, month: budget.month })}.`;
  document.querySelector('[data-budget-submit] [data-button-label]').textContent = 'Salvar alterações';
  budgetCancelButton.hidden = false;
  populateBudgetCategories(budget.category.id);
  budgetCategorySelect.value = String(budget.category.id);
  budgetLimitInput.value = Number(budget.limitAmount).toFixed(2);
  budgetForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  budgetCategorySelect.focus();
}

function openBudgetDeletion(budgetId) {
  const budget = monthlyBudgets.find((item) => String(item.id) === String(budgetId));
  if (!budget) return;
  budgetDeleteForm.elements.namedItem('budgetId').value = budget.id;
  document.querySelector('[data-budget-delete-category]').textContent = budget.category.name;
  budgetDeleteDialog.showModal();
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

async function openTransactionDeletion(transactionId) {
  try {
    const payload = await api(`/api/transactions/${transactionId}`);
    const { transaction } = payload;
    const isExpense = transaction.type === 'EXPENSE';

    deleteForm.elements.namedItem('transactionId').value = transaction.id;
    deleteForm.elements.namedItem('transactionType').value = transaction.type;
    deleteType.textContent = isExpense ? 'despesa' : 'receita';
    deleteDescription.textContent = transaction.description || 'Sem descrição';
    deleteCategory.textContent = transaction.category?.name || (isExpense ? 'Despesa' : 'Receita');
    deleteDate.textContent = formatDate(transaction.transactionDate);
    deleteAmount.textContent = `${isExpense ? '- ' : ''}${formatCurrency(transaction.amount)}`;
    deleteDialog.showModal();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function closeTransactionDeletion() {
  if (deleteDialog.open) deleteDialog.close();
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
  reportMonthInput.value ||= currentMonthKey();
  setDefaultTransactionDates();
  void loadFinancialData();
  void loadBudgetPlanning();
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
    void loadMonthlyReport();
    void loadBudgetPlanning();
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
    void loadMonthlyReport();
    void loadBudgetPlanning();
  } catch (error) {
    displayErrors(expenseForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(expenseForm, false);
  }
});

budgetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearBudgetFormErrors();
  const period = selectedBudgetPeriod();
  const categoryId = budgetCategorySelect.value;
  const amount = budgetLimitInput.value.trim();
  const errors = {};
  if (!categoryId) errors.categoryId = 'Selecione uma categoria.';
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    errors.amount = 'Informe um limite maior que zero.';
  }
  if (Object.keys(errors).length) {
    displayErrors(budgetForm, errors);
    return;
  }

  const budgetId = budgetForm.dataset.budgetId;
  try {
    setLoading(budgetForm, true);
    await api(budgetId ? `/api/budgets/${budgetId}` : '/api/budgets', {
      method: budgetId ? 'PUT' : 'POST',
      body: JSON.stringify({ categoryId: Number(categoryId), year: period.year, month: period.month, amount }),
    });
    resetBudgetForm();
    await loadBudgetPlanning();
    showToast(budgetId ? 'Limite atualizado com sucesso.' : 'Limite adicionado com sucesso.');
  } catch (error) {
    if (Object.keys(error.fields || {}).length) displayErrors(budgetForm, error.fields);
    else {
      budgetFormError.textContent = error.message;
      budgetFormError.hidden = false;
    }
    showToast(error.message, 'error');
  } finally {
    setLoading(budgetForm, false);
  }
});

budgetList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-budget]');
  const deleteButton = event.target.closest('[data-delete-budget]');
  if (editButton) editBudget(editButton.dataset.editBudget);
  if (deleteButton) openBudgetDeletion(deleteButton.dataset.deleteBudget);
});

budgetMonthInput.addEventListener('change', () => {
  resetBudgetForm();
  void loadBudgetPlanning();
});

budgetCancelButton.addEventListener('click', resetBudgetForm);

budgetDeleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const budgetId = budgetDeleteForm.elements.namedItem('budgetId').value;
  try {
    setLoading(budgetDeleteForm, true);
    await api(`/api/budgets/${budgetId}`, { method: 'DELETE' });
    budgetDeleteDialog.close();
    resetBudgetForm();
    await loadBudgetPlanning();
    showToast('Limite removido com sucesso.');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(budgetDeleteForm, false);
  }
});

document.querySelectorAll('[data-close-budget-delete]').forEach((button) => {
  button.addEventListener('click', () => budgetDeleteDialog.close());
});

budgetDeleteDialog.addEventListener('click', (event) => {
  if (event.target === budgetDeleteDialog) budgetDeleteDialog.close();
});

budgetDeleteDialog.addEventListener('close', () => budgetDeleteForm.reset());

[incomeList, expenseList].forEach((listElement) => {
  listElement.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-transaction]');
    const deleteButton = event.target.closest('[data-delete-transaction]');

    if (editButton) void openTransactionEditor(editButton.dataset.editTransaction);
    if (deleteButton) void openTransactionDeletion(deleteButton.dataset.deleteTransaction);
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
    void loadMonthlyReport();
    void loadBudgetPlanning();
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

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const transactionId = deleteForm.elements.namedItem('transactionId').value;
  const transactionType = deleteForm.elements.namedItem('transactionType').value;

  try {
    setLoading(deleteForm, true);
    const payload = await api(`/api/transactions/${transactionId}`, { method: 'DELETE' });

    if (transactionType === 'EXPENSE') {
      expenses = expenses.filter((expense) => Number(expense.id) !== Number(transactionId));
      renderExpenses();
    } else {
      incomes = incomes.filter((income) => Number(income.id) !== Number(transactionId));
      renderIncomes();
    }

    closeTransactionDeletion();
    showToast(payload.message);
    void loadMonthlyReport();
    void loadBudgetPlanning();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(deleteForm, false);
  }
});

document.querySelectorAll('[data-close-delete-dialog]').forEach((button) => {
  button.addEventListener('click', closeTransactionDeletion);
});

deleteDialog.addEventListener('click', (event) => {
  if (event.target === deleteDialog) closeTransactionDeletion();
});

deleteDialog.addEventListener('close', () => {
  deleteForm.reset();
});

document.querySelector('[data-logout]').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch (_error) {
    // A interface encerra a sessão mesmo se a resposta for interrompida.
  }
  incomes = [];
  expenses = [];
  budgetCategories = [];
  monthlyBudgets = [];
  budgetList.replaceChildren();
  resetBudgetForm();
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

reportMonthInput.addEventListener('change', () => { void loadMonthlyReport(); });

async function restoreSession() {
  try {
    const payload = await api('/api/auth/me');
    showDashboard(payload.user);
  } catch (_error) {
    showAuth('login');
  }
}

restoreSession();
