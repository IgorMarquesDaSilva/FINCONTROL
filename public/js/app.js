const authView = document.querySelector('[data-auth-view]');
const dashboardView = document.querySelector('[data-dashboard-view]');
const loginForm = document.querySelector('[data-login-form]');
const registerForm = document.querySelector('[data-register-form]');
const loginHeading = document.querySelector('[data-login-heading]');
const registerHeading = document.querySelector('[data-register-heading]');
const forgotForm = document.querySelector('[data-forgot-form]');
const forgotHeading = document.querySelector('[data-forgot-heading]');
const resetForm = document.querySelector('[data-reset-form]');
const resetHeading = document.querySelector('[data-reset-heading]');
const passwordChangeDialog = document.querySelector('[data-password-dialog]');
const passwordChangeForm = document.querySelector('[data-password-change-form]');
const passwordChangeError = document.querySelector('[data-password-change-error]');
const passwordResetToken = new URLSearchParams(window.location.search).get('resetToken') || '';
const toast = document.querySelector('[data-toast]');
const sidebar = document.querySelector('[data-sidebar]');
const dashboardShell = document.querySelector('.dashboard-shell');
const dashboardContent = document.querySelector('.dashboard-content');
const incomeForm = document.querySelector('[data-income-form]');
const incomeList = document.querySelector('[data-income-list]');
const expenseForm = document.querySelector('[data-expense-form]');
const expenseList = document.querySelector('[data-expense-list]');
const transactionList = document.querySelector('[data-transaction-list]');
const transactionCount = document.querySelector('[data-transaction-count]');
const transactionFilterForm = document.querySelector('[data-transaction-filters]');
const transactionCategorySelect = document.querySelector('[data-transaction-category]');
const transactionError = document.querySelector('[data-transaction-error]');
const transactionPagination = document.querySelector('[data-transaction-pagination]');
const balanceTotal = document.querySelector('[data-balance-total]');
const balanceHelper = document.querySelector('[data-balance-helper]');
const monthIncomeTotal = document.querySelector('[data-month-income-total]');
const incomeHelper = document.querySelector('[data-income-helper]');
const monthExpenseTotal = document.querySelector('[data-month-expense-total]');
const expenseHelper = document.querySelector('[data-expense-helper]');
const dashboardMonthInput = document.querySelector('[data-dashboard-month]');
const dashboardError = document.querySelector('[data-dashboard-error]');
const insightsSection = document.querySelector('[data-insights-section]');
const insightsList = document.querySelector('[data-insights-list]');
const insightsStatus = document.querySelector('[data-insights-status]');
const insightsError = document.querySelector('[data-insights-error]');
const insightsPeriod = document.querySelector('[data-insights-period]');
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
const goalsSection = document.querySelector('[data-goals-section]');
const simulatorForm = document.querySelector('[data-simulator-form]');
const simulatorError = document.querySelector('[data-simulator-error]');
const simulatorEmpty = document.querySelector('[data-simulator-empty]');
const simulatorResults = document.querySelector('[data-simulation-results]');
const simulatorChart = document.querySelector('[data-simulator-chart]');
const simulatorChartDescription = document.querySelector('[data-simulator-chart-description]');
const simulatorTableBody = document.querySelector('[data-simulator-table-body]');
const simulatorConversion = document.querySelector('[data-simulator-conversion]');
const simulatorLimitMessage = document.querySelector('[data-simulator-limit-message]');
const useSimulationButton = document.querySelector('[data-use-simulation]');
const goalsList = document.querySelector('[data-goals-list]');
const goalsLoading = document.querySelector('[data-goals-loading]');
const goalsError = document.querySelector('[data-goals-error]');
const goalsEmpty = document.querySelector('[data-goals-empty]');
const goalForm = document.querySelector('[data-goal-form]');
const goalFormError = document.querySelector('[data-goal-form-error]');
const goalCancelButton = document.querySelector('[data-goal-cancel]');
const contributionDialog = document.querySelector('[data-goal-contribution-dialog]');
const contributionForm = document.querySelector('[data-goal-contribution-form]');
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
let transactions = [];
let historyTransactions = [];
let transactionPage = 1;
let incomes = [];
let expenses = [];
let dashboardRequestId = 0;
let insightsRequestId = 0;
let currentUserId = null;
let currentInsights = [];
let reportRequestId = 0;
let budgetRequestId = 0;
let budgetCategories = [];
let monthlyBudgets = [];
let goals = [];
let currentSimulation = null;

const simulatorFinal = document.querySelector('[data-simulator-final]');
const simulatorContributions = document.querySelector('[data-simulator-contributions]');
const simulatorEarnings = document.querySelector('[data-simulator-earnings]');
const simulatorStatus = document.querySelector('[data-simulator-status]');

const dashboardPages = [
  { route: 'visao-geral', title: 'Visão geral', description: 'Seu resumo financeiro, insights e relatório mensal.', selectors: ['.welcome-row', '.metric-grid', '[data-dashboard-error]', '[data-insights-section]', '[data-monthly-report]'] },
  { route: 'movimentacoes', title: 'Movimentações', description: 'Consulte e filtre suas receitas e despesas.', selectors: ['#movimentacoes'] },
  { route: 'receitas', title: 'Receitas', description: 'Registre e acompanhe o dinheiro que entra.', selectors: ['.income-card'] },
  { route: 'despesas', title: 'Despesas', description: 'Registre e acompanhe o dinheiro que sai.', selectors: ['.expense-card'] },
  { route: 'planejamento', title: 'Planejamento', description: 'Defina limites mensais e acompanhe seus gastos.', selectors: ['[data-budget-planning]'] },
  { route: 'metas', title: 'Metas', description: 'Organize seus objetivos, simule aportes e acompanhe seu progresso.', selectors: ['[data-goal-simulator]', '[data-goals-section]'] },
  { route: 'aprenda', title: 'Aprenda', description: 'Conceitos financeiros explicados de forma simples.' },
];

function addLearningContent(container) {
  const cards = [
    ['Comece pelo essencial', 'Anote o que entra e o que sai. Um registro simples já ajuda a entender seus hábitos e tomar decisões com mais clareza.'],
    ['Planeje com flexibilidade', 'Use limites mensais como referência. Se um gasto mudar, ajuste o plano sem culpa e escolha o próximo passo possível.'],
    ['Construa uma reserva aos poucos', 'Guardar um valor pequeno com regularidade pode ajudar a lidar com despesas inesperadas. Escolha um ritmo que caiba no seu orçamento.'],
  ];
  const grid = document.createElement('div');
  grid.className = 'learning-grid';
  cards.forEach(([title, description], index) => {
    const card = document.createElement('article');
    card.className = 'learning-card';
    const number = document.createElement('span');
    number.className = 'learning-card__number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = `0${index + 1}`;
    const heading = document.createElement('h2');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = description;
    card.append(number, heading, text);
    grid.append(card);
  });
  container.append(grid);
}

function initializeDashboardPages() {
  const oldGrid = dashboardContent.querySelector('.dashboard-grid');
  if (oldGrid) {
    [...oldGrid.children].forEach((content) => dashboardContent.append(content));
    oldGrid.remove();
  }

  dashboardPages.forEach((page) => {
    const panel = document.createElement('section');
    panel.className = 'dashboard-page';
    panel.id = `page-${page.route}`;
    panel.dataset.dashboardPage = page.route;
    panel.setAttribute('aria-labelledby', `page-title-${page.route}`);
    panel.hidden = true;

    const heading = document.createElement('header');
    heading.className = 'dashboard-page__heading';
    const title = document.createElement('h1');
    title.id = `page-title-${page.route}`;
    title.tabIndex = -1;
    title.textContent = page.title;
    const description = document.createElement('p');
    description.textContent = page.description;
    heading.append(title, description);
    const body = document.createElement('div');
    body.className = 'dashboard-page__body';
    panel.append(heading, body);
    dashboardContent.append(panel);

    page.selectors?.forEach((selector) => {
      const content = dashboardContent.querySelector(selector);
      if (content) body.append(content);
    });
    if (page.route === 'aprenda') addLearningContent(body);
  });

  const welcomeTitle = dashboardContent.querySelector('.welcome-row h1');
  if (welcomeTitle) {
    const subheading = document.createElement('h2');
    subheading.className = welcomeTitle.className;
    subheading.innerHTML = welcomeTitle.innerHTML;
    welcomeTitle.replaceWith(subheading);
  }
}

function navigateDashboardPage(route, { focus = true } = {}) {
  const page = dashboardPages.find((candidate) => candidate.route === route) || dashboardPages[0];
  document.querySelectorAll('[data-dashboard-page]').forEach((panel) => {
    panel.hidden = panel.dataset.dashboardPage !== page.route;
  });
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const active = link.hash === `#${page.route}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${page.title} — FINCONTROL`;
  setMenu(false);
  if (focus) {
    document.querySelector(`#page-title-${page.route}`)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

initializeDashboardPages();
document.querySelectorAll('form [data-error-for]').forEach((error, index) => {
  error.id ||= `form-error-${index + 1}`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'assertive');
  const field = error.closest('form')?.elements.namedItem(error.dataset.errorFor);
  if (field) {
    const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    describedBy.add(error.id);
    field.setAttribute('aria-describedby', [...describedBy].join(' '));
  }
});
window.addEventListener('hashchange', () => {
  if (!dashboardView.hidden) navigateDashboardPage(window.location.hash.slice(1));
});

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

function renderSimulationChart(simulation) {
  const namespace = 'http://www.w3.org/2000/svg';
  const width = 640;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 32, left: 76 };
  const rows = simulation.timeline;
  const maxValue = Math.max(1, ...rows.map((row) => row.balance));
  const x = (index) => padding.left + (index / Math.max(1, rows.length - 1)) * (width - padding.left - padding.right);
  const y = (value) => height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
  simulatorChart.replaceChildren();
  const add = (tag, attrs) => {
    const element = document.createElementNS(namespace, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    simulatorChart.append(element);
    return element;
  };
  for (let step = 0; step <= 4; step += 1) {
    const value = maxValue * step / 4;
    const gridY = y(value);
    add('line', { x1: padding.left, y1: gridY, x2: width - padding.right, y2: gridY, class: 'simulator-chart__grid' });
    const label = add('text', { x: padding.left - 8, y: gridY + 4, 'text-anchor': 'end', class: 'simulator-chart__label' });
    label.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  const line = (key, className) => add('polyline', {
    points: rows.map((row, index) => `${x(index)},${y(row[key])}`).join(' '),
    class: className,
  });
  line('contributions', 'simulator-chart__series simulator-chart__series--contributions');
  line('balance', 'simulator-chart__series simulator-chart__series--balance');
  [0, rows.length - 1].forEach((index) => {
    const label = add('text', { x: x(index), y: height - 8, 'text-anchor': index ? 'end' : 'start', class: 'simulator-chart__label' });
    label.textContent = `Mês ${rows[index].month}`;
  });
  simulatorChartDescription.textContent = `No mês ${simulation.durationMonths}, o saldo estimado é ${formatCurrency(simulation.finalBalance)} e o total aportado é ${formatCurrency(simulation.totalContributions)}. O rendimento estimado é ${formatCurrency(simulation.totalEarnings)}. A evolução completa está na tabela a seguir.`;
}

function renderSimulation(simulation, input) {
  currentSimulation = { ...simulation, input };
  simulatorEmpty.hidden = true;
  simulatorResults.hidden = false;
  simulatorError.hidden = true;
  simulatorFinal.textContent = formatCurrency(simulation.finalBalance);
  simulatorContributions.textContent = formatCurrency(simulation.totalContributions);
  simulatorEarnings.textContent = formatCurrency(simulation.totalEarnings);
  const rateLabel = input.ratePeriod === 'annual' ? 'anual efetiva' : 'mensal';
  const monthlyRate = window.FincontrolCompoundInterest.getMonthlyRate(Number(input.ratePercent), input.ratePeriod);
  simulatorStatus.textContent = `Projeção para ${simulation.durationMonths} meses com taxa de ${input.ratePercent}% ${rateLabel} (equivalente a ${(monthlyRate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}% ao mês).`;
  simulatorTableBody.replaceChildren();
  simulation.timeline.forEach((row) => {
    const tr = document.createElement('tr');
    [String(row.month), formatCurrency(row.contributions), formatCurrency(row.earnings), formatCurrency(row.balance)].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      tr.append(cell);
    });
    simulatorTableBody.append(tr);
  });
  renderSimulationChart(simulation);
  const withinLimit = simulation.finalBalance >= 0.01 && simulation.finalBalance <= 9_999_999_999_999.99;
  useSimulationButton.hidden = !withinLimit;
  simulatorLimitMessage.hidden = withinLimit;
  simulatorLimitMessage.textContent = withinLimit ? '' : 'Este resultado está fora do limite aceito para criação de uma meta.';
  simulatorConversion.textContent = withinLimit
    ? 'Você pode preencher o formulário de metas com esta projeção e revisar os dados antes de salvar.'
    : '';
}

function useSimulationForGoal() {
  if (!currentSimulation) return;
  const { input, finalBalance } = currentSimulation;
  resetGoalForm();
  const goalName = String(new FormData(simulatorForm).get('goalName') || '').trim();
  goalForm.elements.namedItem('name').value = goalName || 'Minha meta simulada';
  goalForm.elements.namedItem('targetAmount').value = finalBalance.toFixed(2);
  goalForm.elements.namedItem('currentAmount').value = Number(input.initialAmount).toFixed(2);
  const deadline = new Date();
  deadline.setDate(1);
  deadline.setMonth(deadline.getMonth() + Number(input.durationMonths) + 1);
  deadline.setDate(0);
  goalForm.elements.namedItem('deadline').value = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;
  const ratePeriod = input.ratePeriod === 'annual' ? 'anual efetiva' : 'mensal';
  goalForm.elements.namedItem('description').value = `Projeção de ${input.durationMonths} meses, aporte mensal de ${formatCurrency(input.monthlyContribution)}, taxa ${input.ratePercent}% ${ratePeriod}. Rendimento estimado, sem garantia.`.slice(0, 255);
  goalForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  goalForm.elements.namedItem('name').focus({ preventScroll: true });
  showToast('Dados preenchidos na meta. Revise e salve quando quiser.');
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

function transactionSortValue(transaction) {
  return `${transaction.transactionDate || ''}|${transaction.createdAt || ''}|${String(transaction.id).padStart(20, '0')}`;
}

function replaceTransactions(nextTransactions) {
  transactions = [...nextTransactions].sort((left, right) => (
    transactionSortValue(right).localeCompare(transactionSortValue(left))
  ));
  incomes = transactions.filter((transaction) => transaction.type === 'INCOME');
  expenses = transactions.filter((transaction) => transaction.type === 'EXPENSE');
}

function createMovementAction(label, className, dataName, transaction, visibleLabel = label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset[dataName] = transaction.id;
  button.textContent = visibleLabel;
  button.setAttribute('aria-label', `${label} ${transaction.type === 'EXPENSE' ? 'despesa' : 'receita'} ${transaction.description || 'sem descrição'}`);
  return button;
}

function renderMovementHistory(displayedTransactions = historyTransactions) {
  transactionList.replaceChildren();
  transactionCount.textContent = displayedTransactions.length
    ? `${displayedTransactions.length} movimentaç${displayedTransactions.length === 1 ? 'ão' : 'ões'}`
    : '';

  if (!displayedTransactions.length) {
    const empty = document.createElement('div');
    empty.className = 'movement-history__empty';
    empty.innerHTML = '<span aria-hidden="true">⇅</span><h3>Nenhuma movimentação cadastrada</h3><p>Registre uma receita ou despesa para começar seu histórico.</p>';
    transactionList.append(empty);
    return;
  }

  displayedTransactions.forEach((transaction) => {
    const isExpense = transaction.type === 'EXPENSE';
    const row = document.createElement('article');
    row.className = `movement-row${isExpense ? ' movement-row--expense' : ''}`;

    const main = document.createElement('div');
    main.className = 'movement-row__main';
    const icon = document.createElement('span');
    icon.className = 'movement-row__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = isExpense ? '↘' : '↗';
    const details = document.createElement('div');
    details.className = 'movement-row__details';
    const description = document.createElement('strong');
    description.textContent = transaction.description || 'Sem descrição';
    const meta = document.createElement('small');
    const type = document.createElement('span');
    type.className = 'movement-row__type';
    type.textContent = isExpense ? 'Despesa' : 'Receita';
    meta.append(type, `${transaction.category?.name || 'Sem categoria'} · ${formatDate(transaction.transactionDate)}`);
    details.append(description, meta);
    main.append(icon, details);

    const amount = document.createElement('strong');
    amount.className = 'movement-row__amount';
    amount.textContent = `${isExpense ? '- ' : '+ '}${formatCurrency(transaction.amount)}`;

    const actions = document.createElement('div');
    actions.className = 'movement-row__actions';
    actions.append(
      createMovementAction('Editar', 'income-item__edit', 'editTransaction', transaction),
      createMovementAction('Excluir', 'income-item__delete', 'deleteTransaction', transaction, '×'),
    );
    row.append(main, amount, actions);
    transactionList.append(row);
  });
}

function savingsHelper(dashboard) {
  if (!dashboard.transactionCount) return 'Nenhuma movimentação neste mês';
  if (!dashboard.income) return 'Cadastre uma receita para medir sua economia';
  if (dashboard.savingsPercentage < 0) {
    return `Despesas superaram a renda em ${formatCurrency(Math.abs(dashboard.balance))}`;
  }
  return `${dashboard.savingsPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% da renda preservada`;
}

async function loadDashboardSummary() {
  dashboardMonthInput.value ||= currentMonthKey();
  void loadInsights();
  const requestId = ++dashboardRequestId;
  dashboardError.hidden = true;

  try {
    const payload = await api(`/api/dashboard?month=${encodeURIComponent(dashboardMonthInput.value)}`);
    if (requestId !== dashboardRequestId) return;
    const { dashboard } = payload;
    balanceTotal.textContent = formatCurrency(dashboard.balance);
    monthIncomeTotal.textContent = formatCurrency(dashboard.income);
    monthExpenseTotal.textContent = formatCurrency(dashboard.expense);
    balanceHelper.textContent = savingsHelper(dashboard);
    incomeHelper.textContent = dashboard.income > 0 ? 'Receitas registradas neste mês' : 'Nenhuma entrada neste mês';
    expenseHelper.textContent = dashboard.expense > 0 ? 'Despesas registradas neste mês' : 'Nenhuma despesa neste mês';
  } catch (error) {
    if (requestId !== dashboardRequestId) return;
    dashboardError.textContent = `Não foi possível carregar a visão geral: ${error.message}`;
    dashboardError.hidden = false;
  }
}

function dismissedInsightsStorageKey(month = dashboardMonthInput.value) {
  return `fincontrol:dismissed-insights:${currentUserId}:${month}`;
}

function readDismissedInsights() {
  if (!currentUserId) return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(dismissedInsightsStorageKey()) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (_error) {
    return [];
  }
}

function renderInsights(result) {
  currentInsights = result.insights || [];
  insightsList.replaceChildren();
  insightsPeriod.textContent = periodLabel(result.period);
  const dismissed = new Set(readDismissedInsights());
  const visibleInsights = currentInsights.filter((insight) => !dismissed.has(insight.id));

  if (!visibleInsights.length) {
    insightsStatus.textContent = currentInsights.length
      ? 'Você dispensou os insights deste período.'
      : result.message;
    insightsStatus.hidden = false;
    return;
  }

  insightsStatus.textContent = '';
  insightsStatus.hidden = true;
  visibleInsights.forEach((insight) => {
    const card = document.createElement('article');
    card.className = `insight-card insight-card--${insight.type}`;
    const header = document.createElement('div');
    header.className = 'insight-card__header';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = 'Com base nos seus registros';
    const title = document.createElement('h3');
    title.textContent = insight.title;
    heading.append(eyebrow, title);
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'insight-dismiss';
    dismiss.dataset.dismissInsight = insight.id;
    dismiss.textContent = 'Dispensar';
    dismiss.setAttribute('aria-label', `Dispensar insight: ${insight.title}`);
    header.append(heading, dismiss);

    const message = document.createElement('p');
    message.className = 'insight-card__message';
    message.textContent = insight.message;
    const evidenceTitle = document.createElement('strong');
    evidenceTitle.className = 'insight-card__evidence-title';
    evidenceTitle.textContent = 'Dados que motivaram esta orientação';
    const evidence = document.createElement('ul');
    evidence.className = 'insight-evidence';
    (insight.evidence || []).forEach((fact) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = fact.label;
      const value = document.createElement('strong');
      if (typeof fact.value === 'number') {
        value.textContent = formatCurrency(fact.value);
        if (typeof fact.percentage === 'number') {
          value.textContent += ` (${fact.percentage > 0 ? '+' : ''}${fact.percentage.toLocaleString('pt-BR')}%)`;
        }
      } else {
        value.textContent = fact.value;
      }
      if (typeof fact.percentagePoints === 'number') {
        value.textContent += ` (${fact.percentagePoints > 0 ? '+' : ''}${fact.percentagePoints.toLocaleString('pt-BR')} p.p.)`;
      }
      item.append(label, value);
      evidence.append(item);
    });
    const suggestion = document.createElement('p');
    suggestion.className = 'insight-card__suggestion';
    suggestion.textContent = insight.suggestion;
    card.append(header, message, evidenceTitle, evidence, suggestion);
    insightsList.append(card);
  });
}

async function loadInsights() {
  if (!currentUserId) return;
  const month = dashboardMonthInput.value || currentMonthKey();
  const requestId = ++insightsRequestId;
  insightsSection.setAttribute('aria-busy', 'true');
  insightsError.hidden = true;
  insightsStatus.hidden = false;
  insightsStatus.textContent = 'Analisando seus registros…';
  try {
    const payload = await api(`/api/insights?month=${encodeURIComponent(month)}`);
    if (requestId !== insightsRequestId) return;
    renderInsights(payload.insights);
  } catch (error) {
    if (requestId !== insightsRequestId) return;
    insightsList.replaceChildren();
    insightsStatus.hidden = true;
    insightsError.textContent = `Não foi possível carregar os insights: ${error.message}`;
    insightsError.hidden = false;
  } finally {
    if (requestId === insightsRequestId) insightsSection.setAttribute('aria-busy', 'false');
  }
}

insightsList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-dismiss-insight]');
  if (!button) return;
  const dismissed = new Set(readDismissedInsights());
  dismissed.add(button.dataset.dismissInsight);
  try {
    window.localStorage.setItem(dismissedInsightsStorageKey(), JSON.stringify([...dismissed]));
  } catch (_error) {
    // A dispensa continua válida na tela atual se o armazenamento local estiver indisponível.
  }
  renderInsights({ insights: currentInsights, period: { year: Number(dashboardMonthInput.value.slice(0, 4)), month: Number(dashboardMonthInput.value.slice(5, 7)) }, message: '' });
});

function renderAllTransactions() {
  renderIncomes();
  renderExpenses();
}

function transactionFilterQuery(page = 1) {
  const data = new FormData(transactionFilterForm);
  const query = new URLSearchParams({ page: String(page), pageSize: '10' });
  ['search', 'type', 'categoryId', 'dateFrom', 'dateTo', 'minAmount', 'maxAmount', 'sort', 'order']
    .forEach((name) => {
      const value = String(data.get(name) || '').trim();
      if (value && !(name === 'sort' && value === 'date') && !(name === 'order' && value === 'desc')) {
        query.set(name, value);
      }
    });
  return query;
}

function preserveTransactionFilters(query) {
  const url = new URL(window.location.href);
  [...url.searchParams.keys()].filter((key) => key.startsWith('tx_')).forEach((key) => url.searchParams.delete(key));
  query.forEach((value, key) => {
    if (key !== 'pageSize' && !(key === 'page' && value === '1')) url.searchParams.set(`tx_${key}`, value);
  });
  window.history.replaceState({}, '', url);
}

function restoreTransactionFilters() {
  const params = new URLSearchParams(window.location.search);
  params.forEach((value, key) => {
    if (!key.startsWith('tx_')) return;
    const name = key.slice(3);
    const field = transactionFilterForm.elements.namedItem(name);
    if (name === 'categoryId') transactionCategorySelect.dataset.restoreValue = value;
    else if (field) field.value = value;
  });
  transactionPage = Number(params.get('tx_page')) || 1;
}

function renderTransactionPagination(pagination) {
  transactionPage = pagination.page;
  transactionPagination.hidden = pagination.totalPages <= 1;
  document.querySelector('[data-transaction-page]').textContent = pagination.totalPages
    ? `Página ${pagination.page} de ${pagination.totalPages}`
    : 'Nenhum resultado';
  document.querySelector('[data-transaction-previous]').disabled = !pagination.hasPrevious;
  document.querySelector('[data-transaction-next]').disabled = !pagination.hasNext;
}

async function loadTransactionCategories() {
  const payload = await api('/api/transactions/categories');
  const selected = transactionCategorySelect.value || transactionCategorySelect.dataset.restoreValue || '';
  transactionCategorySelect.replaceChildren(new Option('Todas', ''));
  (payload.categories || []).forEach((category) => {
    transactionCategorySelect.append(new Option(category.name, category.id));
  });
  transactionCategorySelect.value = selected;
  delete transactionCategorySelect.dataset.restoreValue;
}

async function loadTransactionHistory(page = transactionPage) {
  const query = transactionFilterQuery(page);
  transactionError.hidden = true;
  try {
    const payload = await api(`/api/transactions?${query.toString()}`);
    historyTransactions = payload.transactions || [];
    renderMovementHistory();
    renderTransactionPagination(payload.pagination);
    preserveTransactionFilters(query);
  } catch (error) {
    transactionError.textContent = error.message;
    transactionError.hidden = false;
  }
}

async function loadFinancialData() {
  try {
    const [incomePayload, expensePayload] = await Promise.all([
      api('/api/incomes'), api('/api/expenses'), loadTransactionCategories(),
    ]);
    replaceTransactions([...(incomePayload.incomes || []), ...(expensePayload.expenses || [])]);
    renderAllTransactions();
    await Promise.all([loadDashboardSummary(), loadMonthlyReport(), loadTransactionHistory()]);
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

function goalStatusLabel(status) {
  return { ACTIVE: 'Em andamento', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' }[status] || status;
}

function goalAction(label, action, goal, modifier = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `goal-action${modifier ? ` ${modifier}` : ''}`;
  button.dataset[action] = goal.id;
  button.textContent = label;
  button.setAttribute('aria-label', `${label} na meta ${goal.name}`);
  return button;
}

function renderGoals() {
  goalsList.replaceChildren();
  document.querySelector('[data-goals-count]').textContent = goals.length
    ? `${goals.length} meta${goals.length === 1 ? '' : 's'}`
    : '';
  goalsEmpty.hidden = goals.length > 0;

  goals.forEach((goal) => {
    const card = document.createElement('article');
    card.className = `goal-item goal-item--${goal.status.toLowerCase()}`;
    const top = document.createElement('div');
    top.className = 'goal-item__top';
    const copy = document.createElement('div');
    const name = document.createElement('h4');
    name.textContent = goal.name;
    const description = document.createElement('p');
    description.textContent = goal.description || (goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : 'Sem prazo definido');
    copy.append(name, description);
    const status = document.createElement('span');
    status.className = 'goal-item__status';
    status.textContent = goalStatusLabel(goal.status);
    top.append(copy, status);

    const progress = document.createElement('progress');
    progress.max = 100;
    progress.value = goal.progressPercentage;
    progress.setAttribute('aria-label', `${goal.name}: ${goal.progressPercentage}% concluída`);
    const numbers = document.createElement('div');
    numbers.className = 'goal-item__numbers';
    const accumulated = document.createElement('span');
    accumulated.innerHTML = `<strong>${formatCurrency(goal.currentAmount)}</strong> de ${formatCurrency(goal.targetAmount)}`;
    const remaining = document.createElement('span');
    remaining.textContent = goal.status === 'COMPLETED' ? 'Objetivo alcançado' : `${formatCurrency(goal.remainingAmount)} restantes`;
    numbers.append(accumulated, remaining);

    const actions = document.createElement('div');
    actions.className = 'goal-item__actions';
    if (goal.status === 'ACTIVE') {
      actions.append(
        goalAction('Registrar aporte', 'contributeGoal', goal, 'goal-action--primary'),
        goalAction('Editar', 'editGoal', goal),
        goalAction('Cancelar meta', 'cancelGoal', goal, 'goal-action--danger'),
      );
    } else if (goal.status === 'CANCELLED') {
      actions.append(goalAction('Reativar meta', 'reactivateGoal', goal));
    }
    card.append(top, progress, numbers, actions);
    goalsList.append(card);
  });
}

async function loadGoals() {
  goalsSection.setAttribute('aria-busy', 'true');
  goalsLoading.hidden = false;
  goalsError.hidden = true;
  try {
    const payload = await api('/api/goals');
    goals = payload.goals || [];
    renderGoals();
  } catch (error) {
    goalsError.textContent = error.message;
    goalsError.hidden = false;
  } finally {
    goalsLoading.hidden = true;
    goalsSection.setAttribute('aria-busy', 'false');
  }
}

function resetGoalForm() {
  goalForm.reset();
  delete goalForm.dataset.goalId;
  document.querySelector('[data-goal-form-eyebrow]').textContent = 'Nova meta';
  document.querySelector('[data-goal-form-title]').textContent = 'Comece um objetivo';
  goalForm.querySelector('[data-button-label]').textContent = 'Criar meta';
  goalCancelButton.hidden = true;
  goalFormError.hidden = true;
  clearErrors(goalForm);
}

function editGoal(goalId) {
  const goal = goals.find((item) => String(item.id) === String(goalId));
  if (!goal) return;
  goalForm.dataset.goalId = goal.id;
  goalForm.elements.namedItem('name').value = goal.name;
  goalForm.elements.namedItem('description').value = goal.description;
  goalForm.elements.namedItem('targetAmount').value = goal.targetAmount.toFixed(2);
  goalForm.elements.namedItem('currentAmount').value = goal.currentAmount.toFixed(2);
  goalForm.elements.namedItem('deadline').value = goal.deadline || '';
  document.querySelector('[data-goal-form-eyebrow]').textContent = 'Editar meta';
  document.querySelector('[data-goal-form-title]').textContent = goal.name;
  goalForm.querySelector('[data-button-label]').textContent = 'Salvar alterações';
  goalCancelButton.hidden = false;
  clearErrors(goalForm);
  goalForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  goalForm.elements.namedItem('name').focus();
}

function openContribution(goalId) {
  const goal = goals.find((item) => String(item.id) === String(goalId));
  if (!goal) return;
  contributionForm.elements.namedItem('goalId').value = goal.id;
  document.querySelector('[data-contribution-goal-name]').textContent = goal.name;
  document.querySelector('[data-contribution-helper]').textContent = `Faltam ${formatCurrency(goal.remainingAmount)} para concluir.`;
  contributionForm.elements.namedItem('amount').max = goal.remainingAmount;
  contributionDialog.showModal();
  contributionForm.elements.namedItem('amount').focus();
}

async function changeGoalStatus(goalId, status) {
  try {
    const payload = await api(`/api/goals/${goalId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
    showToast(payload.message);
    await loadGoals();
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

  [...form.querySelectorAll('[aria-invalid="true"]')]
    .find((field) => field.getClientRects().length > 0)?.focus();
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
  const views = {
    login: { heading: loginHeading, form: loginForm, title: 'Entrar' },
    register: { heading: registerHeading, form: registerForm, title: 'Criar conta' },
    forgot: { heading: forgotHeading, form: forgotForm, title: 'Recuperar senha' },
    reset: { heading: resetHeading, form: resetForm, title: 'Definir nova senha' },
  };
  const activeView = views[mode] || views.login;
  currentUserId = null;
  currentInsights = [];
  insightsList.replaceChildren();
  insightsStatus.textContent = '';
  insightsStatus.hidden = true;
  insightsError.hidden = true;
  authView.hidden = false;
  dashboardView.hidden = true;
  Object.values(views).forEach(({ heading, form }) => {
    heading.hidden = heading !== activeView.heading;
    form.hidden = form !== activeView.form;
    clearErrors(form);
  });
  resetForm.elements.namedItem('token').value = passwordResetToken;
  passwordChangeError.hidden = true;
  document.title = `${activeView.title} — FINCONTROL`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => activeView.form.querySelector('input:not([type="hidden"])')?.focus(), 50);
}

function showDashboard(user) {
  currentUserId = String(user.id);
  const name = user.name?.trim() || 'Usuário';
  const firstName = name.split(/\s+/)[0];
  document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = name; });
  document.querySelectorAll('[data-first-name]').forEach((element) => { element.textContent = firstName; });
  document.querySelectorAll('[data-user-initial]').forEach((element) => { element.textContent = firstName[0].toUpperCase(); });
  authView.hidden = true;
  dashboardView.hidden = false;
  document.title = `Visão geral — FINCONTROL`;
  const requestedRoute = window.location.hash.slice(1);
  const route = dashboardPages.some((page) => page.route === requestedRoute) ? requestedRoute : 'visao-geral';
  if (window.location.hash !== `#${route}`) window.history.replaceState(null, '', `#${route}`);
  navigateDashboardPage(route, { focus: false });
  reportMonthInput.value ||= currentMonthKey();
  dashboardMonthInput.value ||= currentMonthKey();
  setDefaultTransactionDates();
  restoreTransactionFilters();
  void loadFinancialData();
  void loadBudgetPlanning();
  void loadGoals();
}

document.querySelectorAll('[data-show-register]').forEach((button) => {
  button.addEventListener('click', () => showAuth('register'));
});

document.querySelectorAll('[data-show-login]').forEach((button) => {
  button.addEventListener('click', () => showAuth('login'));
});

document.querySelector('[data-show-forgot]').addEventListener('click', () => showAuth('forgot'));

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

forgotForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(forgotForm);
  try {
    setLoading(forgotForm, true);
    const payload = await api('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email: forgotForm.elements.namedItem('email').value }),
    });
    forgotForm.reset();
    showToast(payload.message);
    showAuth('login');
  } catch (error) {
    displayErrors(forgotForm, error.fields);
    if (!Object.keys(error.fields || {}).length) showToast(error.message, 'error');
  } finally {
    setLoading(forgotForm, false);
  }
});

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(resetForm);
  const password = resetForm.elements.namedItem('password').value;
  const passwordConfirmation = resetForm.elements.namedItem('passwordConfirmation').value;
  if (password !== passwordConfirmation) {
    displayErrors(resetForm, { passwordConfirmation: 'As senhas não coincidem.' });
    return;
  }
  try {
    setLoading(resetForm, true);
    const payload = await api('/api/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({
        token: resetForm.elements.namedItem('token').value,
        password,
        passwordConfirmation,
      }),
    });
    window.history.replaceState(null, '', window.location.pathname);
    resetForm.reset();
    showAuth('login');
    showToast(payload.message);
  } catch (error) {
    displayErrors(resetForm, error.fields);
    if (!Object.keys(error.fields || {}).length) showToast(error.message, 'error');
  } finally {
    setLoading(resetForm, false);
  }
});

document.querySelector('[data-open-password-change]').addEventListener('click', () => {
  passwordChangeError.hidden = true;
  clearErrors(passwordChangeForm);
  passwordChangeDialog.showModal();
  passwordChangeForm.elements.namedItem('currentPassword').focus();
});
document.querySelectorAll('[data-close-password-dialog]').forEach((button) => {
  button.addEventListener('click', () => passwordChangeDialog.close());
});
passwordChangeDialog.addEventListener('click', (event) => {
  if (event.target === passwordChangeDialog) passwordChangeDialog.close();
});
passwordChangeDialog.addEventListener('close', () => {
  passwordChangeForm.reset();
  clearErrors(passwordChangeForm);
  passwordChangeError.hidden = true;
});
passwordChangeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(passwordChangeForm);
  passwordChangeError.hidden = true;
  const password = passwordChangeForm.elements.namedItem('password').value;
  const passwordConfirmation = passwordChangeForm.elements.namedItem('passwordConfirmation').value;
  const errors = {};
  if (password !== passwordConfirmation) errors.passwordConfirmation = 'As senhas não coincidem.';
  if (Object.keys(errors).length) {
    displayErrors(passwordChangeForm, errors);
    return;
  }
  try {
    setLoading(passwordChangeForm, true);
    const payload = await api('/api/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordChangeForm.elements.namedItem('currentPassword').value,
        password,
        passwordConfirmation,
      }),
    });
    passwordChangeDialog.close();
    showToast(payload.message);
  } catch (error) {
    displayErrors(passwordChangeForm, error.fields);
    passwordChangeError.textContent = error.message;
    passwordChangeError.hidden = false;
  } finally {
    setLoading(passwordChangeForm, false);
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
    replaceTransactions([payload.income, ...transactions.filter((transaction) => transaction.id !== payload.income.id)]);
    incomeForm.reset();
    setDefaultTransactionDates();
    renderAllTransactions();
    showToast('Receita cadastrada com sucesso.');
    void loadTransactionCategories().then(() => loadTransactionHistory(1));
    void loadDashboardSummary();
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
    replaceTransactions([payload.expense, ...transactions.filter((transaction) => transaction.id !== payload.expense.id)]);
    expenseForm.reset();
    setDefaultTransactionDates();
    renderAllTransactions();
    showToast('Despesa cadastrada com sucesso.');
    void loadTransactionCategories().then(() => loadTransactionHistory(1));
    void loadDashboardSummary();
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

[incomeList, expenseList, transactionList].forEach((listElement) => {
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

    replaceTransactions(transactions.map((transaction) => (
      Number(transaction.id) === Number(payload.transaction.id) ? payload.transaction : transaction
    )));
    renderAllTransactions();

    closeTransactionEditor();
    showToast(payload.message);
    void loadTransactionCategories().then(() => loadTransactionHistory());
    void loadDashboardSummary();
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

  try {
    setLoading(deleteForm, true);
    const payload = await api(`/api/transactions/${transactionId}`, { method: 'DELETE' });

    replaceTransactions(transactions.filter((transaction) => Number(transaction.id) !== Number(transactionId)));
    renderAllTransactions();

    closeTransactionDeletion();
    showToast(payload.message);
    void loadTransactionHistory();
    void loadDashboardSummary();
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
  replaceTransactions([]);
  historyTransactions = [];
  transactionPage = 1;
  budgetCategories = [];
  monthlyBudgets = [];
  goals = [];
  budgetList.replaceChildren();
  goalsList.replaceChildren();
  resetBudgetForm();
  renderAllTransactions();
  renderMovementHistory();
  transactionPagination.hidden = true;
  showAuth('login');
  showToast('Você saiu da sua conta.');
});

function setMenu(open) {
  const wasOpen = sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  document.querySelector('[data-menu-open]')?.setAttribute('aria-expanded', String(open));
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  dashboardShell.inert = open && isMobile;
  if (open && isMobile) document.querySelector('[data-menu-close]')?.focus();
  else if (!open && wasOpen && isMobile) document.querySelector('[data-menu-open]')?.focus();
}

document.querySelector('[data-menu-open]').addEventListener('click', () => setMenu(true));
document.querySelectorAll('[data-menu-close]').forEach((button) => button.addEventListener('click', () => setMenu(false)));
document.querySelectorAll('.sidebar-link').forEach((link) => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('resize', () => {
  if (sidebar.classList.contains('is-open')) {
    dashboardShell.inert = window.matchMedia('(max-width: 900px)').matches;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenu(false);
    return;
  }
  if (event.key !== 'Tab' || !sidebar.classList.contains('is-open') || !window.matchMedia('(max-width: 900px)').matches) return;
  const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
    .filter((element) => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});
document.querySelectorAll('[data-focus-income-form]').forEach((button) => {
  button.addEventListener('click', () => {
    if (window.location.hash !== '#receitas') window.location.hash = 'receitas';
    else navigateDashboardPage('receitas');
    requestAnimationFrame(() => incomeForm.elements.namedItem('description')?.focus());
  });
});
document.querySelectorAll('[data-focus-expense-form]').forEach((button) => {
  button.addEventListener('click', () => {
    if (window.location.hash !== '#despesas') window.location.hash = 'despesas';
    else navigateDashboardPage('despesas');
    requestAnimationFrame(() => expenseForm.elements.namedItem('amount')?.focus());
  });
});
document.querySelectorAll('[data-demo-action]').forEach((button) => {
  button.addEventListener('click', () => showToast('Essa função entra na próxima etapa do projeto.'));
});

transactionFilterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  void loadTransactionHistory(1);
});
document.querySelector('[data-clear-transaction-filters]').addEventListener('click', () => {
  transactionFilterForm.reset();
  void loadTransactionHistory(1);
});
document.querySelector('[data-transaction-previous]').addEventListener('click', () => {
  if (transactionPage > 1) void loadTransactionHistory(transactionPage - 1);
});
document.querySelector('[data-transaction-next]').addEventListener('click', () => {
  void loadTransactionHistory(transactionPage + 1);
});

simulatorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  simulatorError.hidden = true;
  simulatorForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('title');
  });
  const raw = Object.fromEntries(new FormData(simulatorForm));
  const { data, errors } = window.FincontrolCompoundInterest.validateSimulation(raw);
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([name, message]) => {
      const field = simulatorForm.elements.namedItem(name);
      field?.setAttribute('aria-invalid', 'true');
      if (field) field.title = message;
    });
    simulatorError.textContent = Object.values(errors).join(' ');
    simulatorError.hidden = false;
    simulatorForm.elements.namedItem(Object.keys(errors)[0])?.focus();
    return;
  }
  try {
    const simulation = window.FincontrolCompoundInterest.simulate(data);
    renderSimulation(simulation, { ...data, goalName: String(raw.goalName || '').trim() });
  } catch (error) {
    simulatorError.textContent = error.message;
    simulatorError.hidden = false;
  }
});

useSimulationButton.addEventListener('click', useSimulationForGoal);

goalForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(goalForm);
  goalFormError.hidden = true;
  const formData = new FormData(goalForm);
  const data = {
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    targetAmount: String(formData.get('targetAmount') || '').trim(),
    currentAmount: String(formData.get('currentAmount') || '0').trim() || '0',
    deadline: String(formData.get('deadline') || '').trim(),
  };
  const errors = {};
  if (data.name.length < 2) errors.name = 'Informe um nome para a meta.';
  if (!data.targetAmount || Number(data.targetAmount) <= 0) errors.targetAmount = 'Informe um valor-alvo maior que zero.';
  if (Number(data.currentAmount) < 0) errors.currentAmount = 'O valor guardado não pode ser negativo.';
  if (Number(data.currentAmount) > Number(data.targetAmount)) errors.currentAmount = 'O valor guardado não pode superar o valor-alvo.';
  if (Object.keys(errors).length) {
    displayErrors(goalForm, errors);
    return;
  }

  const goalId = goalForm.dataset.goalId;
  try {
    setLoading(goalForm, true);
    const payload = await api(goalId ? `/api/goals/${goalId}` : '/api/goals', {
      method: goalId ? 'PUT' : 'POST', body: JSON.stringify(data),
    });
    showToast(payload.message);
    resetGoalForm();
    await loadGoals();
  } catch (error) {
    displayErrors(goalForm, error.fields);
    goalFormError.textContent = error.message;
    goalFormError.hidden = false;
  } finally {
    setLoading(goalForm, false);
  }
});

goalCancelButton.addEventListener('click', resetGoalForm);

goalsList.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-goal]');
  const contributionButton = event.target.closest('[data-contribute-goal]');
  const cancelButton = event.target.closest('[data-cancel-goal]');
  const reactivateButton = event.target.closest('[data-reactivate-goal]');
  if (editButton) editGoal(editButton.dataset.editGoal);
  if (contributionButton) openContribution(contributionButton.dataset.contributeGoal);
  if (cancelButton) void changeGoalStatus(cancelButton.dataset.cancelGoal, 'CANCELLED');
  if (reactivateButton) void changeGoalStatus(reactivateButton.dataset.reactivateGoal, 'ACTIVE');
});

document.querySelectorAll('[data-goal-suggestion]').forEach((button) => {
  button.addEventListener('click', () => {
    goalForm.elements.namedItem('name').value = button.dataset.goalSuggestion;
    goalForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    goalForm.elements.namedItem('targetAmount').focus();
  });
});

contributionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(contributionForm);
  const goalId = contributionForm.elements.namedItem('goalId').value;
  const amount = contributionForm.elements.namedItem('amount').value;
  if (!amount || Number(amount) <= 0) {
    displayErrors(contributionForm, { amount: 'Informe um aporte maior que zero.' });
    return;
  }
  try {
    setLoading(contributionForm, true);
    const payload = await api(`/api/goals/${goalId}/contributions`, {
      method: 'POST', body: JSON.stringify({ amount }),
    });
    contributionDialog.close();
    showToast(payload.message);
    await loadGoals();
  } catch (error) {
    displayErrors(contributionForm, error.fields);
    showToast(error.message, 'error');
  } finally {
    setLoading(contributionForm, false);
  }
});

document.querySelectorAll('[data-close-goal-contribution]').forEach((button) => {
  button.addEventListener('click', () => contributionDialog.close());
});
contributionDialog.addEventListener('click', (event) => {
  if (event.target === contributionDialog) contributionDialog.close();
});
contributionDialog.addEventListener('close', () => {
  contributionForm.reset();
  clearErrors(contributionForm);
});

reportMonthInput.addEventListener('change', () => { void loadMonthlyReport(); });
dashboardMonthInput.addEventListener('change', () => { void loadDashboardSummary(); });

async function restoreSession() {
  try {
    const payload = await api('/api/auth/me');
    showDashboard(payload.user);
  } catch (_error) {
    showAuth('login');
  }
}

if (passwordResetToken) showAuth('reset');
else restoreSession();
