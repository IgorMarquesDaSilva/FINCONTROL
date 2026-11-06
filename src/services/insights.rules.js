const MIN_TRANSACTIONS_PER_PERIOD = 3;
const MIN_CHANGE_PERCENTAGE = 20;
const MIN_TOTAL_CHANGE = 50;
const MIN_CATEGORY_TRANSACTIONS = 2;
const MIN_CATEGORY_CHANGE = 30;
const MIN_SAVINGS_RATE_CHANGE = 5;

function monthLabel(period) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(period.year, period.month - 1, 1)));
}

function changePercentage(current, previous) {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

function movementEvidence(current, previous, currentLabel, previousLabel) {
  const difference = current - previous;
  const percentage = changePercentage(current, previous);
  return [
    { label: currentLabel, value: current },
    { label: previousLabel, value: previous },
    { label: 'Variação', value: difference, percentage: Math.round(percentage * 10) / 10 },
  ];
}

function makeInsight(period, key, insight) {
  return { id: `${period.year}-${String(period.month).padStart(2, '0')}:${key}`, period, ...insight };
}

function generateInsights({ period, previousPeriod, current, previous, categories = [] }) {
  const currentCount = Number(current.transactionCount) || 0;
  const previousCount = Number(previous.transactionCount) || 0;
  const labels = { current: monthLabel(period), previous: monthLabel(previousPeriod) };

  if (currentCount < MIN_TRANSACTIONS_PER_PERIOD || previousCount < MIN_TRANSACTIONS_PER_PERIOD) {
    return {
      status: 'insufficient_data',
      message: `Ainda não há dados suficientes para comparar ${labels.current} com ${labels.previous}. São necessárias pelo menos ${MIN_TRANSACTIONS_PER_PERIOD} movimentações em cada período.`,
      minimumTransactionsPerPeriod: MIN_TRANSACTIONS_PER_PERIOD,
      periods: { currentTransactions: currentCount, previousTransactions: previousCount },
      insights: [],
    };
  }

  const insights = [];
  const expenseChange = Number(current.expense) - Number(previous.expense);
  const expensePercentage = Math.abs(changePercentage(Number(current.expense), Number(previous.expense)));
  if (Number(previous.expense) > 0
    && Math.abs(expenseChange) >= MIN_TOTAL_CHANGE
    && expensePercentage >= MIN_CHANGE_PERCENTAGE) {
    const increased = expenseChange > 0;
    insights.push(makeInsight(period, 'expense-change', {
      type: increased ? 'spending_increase' : 'spending_decrease',
      title: increased ? 'Seus gastos aumentaram' : 'Seus gastos diminuíram',
      message: `Seus gastos ${increased ? 'aumentaram' : 'diminuíram'} ${expensePercentage.toFixed(0)}% em relação a ${labels.previous}.`,
      suggestion: increased
        ? 'Se fizer sentido para você, revise as categorias com maior crescimento e veja se algum gasto pode ser ajustado.'
        : 'A redução apareceu nos seus registros. Você pode conferir quais categorias contribuíram para essa mudança.',
      evidence: movementEvidence(Number(current.expense), Number(previous.expense), labels.current, labels.previous),
    }));
  }

  const growingCategory = categories
    .filter((category) => Number(category.previousCount) >= MIN_CATEGORY_TRANSACTIONS
      && Number(category.currentCount) >= MIN_CATEGORY_TRANSACTIONS
      && Number(category.previousAmount) > 0
      && Number(category.currentAmount) - Number(category.previousAmount) >= MIN_CATEGORY_CHANGE
      && changePercentage(Number(category.currentAmount), Number(category.previousAmount)) >= MIN_CHANGE_PERCENTAGE)
    .sort((left, right) => (
      (Number(right.currentAmount) - Number(right.previousAmount))
      - (Number(left.currentAmount) - Number(left.previousAmount))
    ))[0];

  if (growingCategory) {
    const difference = Number(growingCategory.currentAmount) - Number(growingCategory.previousAmount);
    const percentage = changePercentage(Number(growingCategory.currentAmount), Number(growingCategory.previousAmount));
    insights.push(makeInsight(period, `category-growth-${growingCategory.categoryId}`, {
      type: 'category_growth',
      title: `${growingCategory.name} teve o maior aumento`,
      message: `Os gastos em ${growingCategory.name} cresceram ${percentage.toFixed(0)}% entre ${labels.previous} e ${labels.current}.`,
      suggestion: 'Confira os lançamentos dessa categoria para entender o que mudou no período.',
      evidence: [
        { label: labels.current, value: Number(growingCategory.currentAmount) },
        { label: labels.previous, value: Number(growingCategory.previousAmount) },
        { label: 'Aumento', value: difference, percentage: Math.round(percentage * 10) / 10 },
        { label: 'Movimentações consideradas', value: `${growingCategory.previousCount} antes · ${growingCategory.currentCount} agora` },
      ],
    }));
  }

  if (Number(previous.income) > 0 && Number(current.income) > 0) {
    const previousSavings = ((Number(previous.income) - Number(previous.expense)) / Number(previous.income)) * 100;
    const currentSavings = ((Number(current.income) - Number(current.expense)) / Number(current.income)) * 100;
    const savingsDifference = currentSavings - previousSavings;
    if (Math.abs(savingsDifference) >= MIN_SAVINGS_RATE_CHANGE) {
      const improved = savingsDifference > 0;
      insights.push(makeInsight(period, 'savings-rate', {
        type: improved ? 'savings_improvement' : 'savings_decline',
        title: improved ? 'Sua taxa de economia melhorou' : 'Sua taxa de economia mudou',
        message: `A parcela da renda que sobrou após as despesas passou de ${previousSavings.toFixed(1)}% para ${currentSavings.toFixed(1)}%.`,
        suggestion: improved
          ? 'Se esse resultado combina com seus planos, você pode decidir como quer usar o valor que sobrou.'
          : 'Uma olhada nas receitas e despesas do período pode ajudar a entender essa mudança.',
        evidence: [
          { label: `${labels.current} · receitas`, value: Number(current.income) },
          { label: `${labels.current} · despesas`, value: Number(current.expense) },
          { label: `${labels.previous} · receitas`, value: Number(previous.income) },
          { label: `${labels.previous} · despesas`, value: Number(previous.expense) },
          { label: 'Taxa de economia', value: `${previousSavings.toFixed(1)}% → ${currentSavings.toFixed(1)}%`, percentagePoints: Math.round(savingsDifference * 10) / 10 },
        ],
      }));
    }
  }

  const incomeChange = Number(current.income) - Number(previous.income);
  const incomePercentage = Math.abs(changePercentage(Number(current.income), Number(previous.income)));
  if (Number(previous.income) > 0
    && Math.abs(incomeChange) >= MIN_TOTAL_CHANGE
    && incomePercentage >= MIN_CHANGE_PERCENTAGE) {
    const increased = incomeChange > 0;
    insights.push(makeInsight(period, 'income-change', {
      type: increased ? 'income_increase' : 'income_decrease',
      title: increased ? 'Sua renda aumentou' : 'Sua renda diminuiu',
      message: `As receitas registradas ${increased ? 'aumentaram' : 'diminuíram'} ${incomePercentage.toFixed(0)}% em relação a ${labels.previous}.`,
      suggestion: 'Confira as fontes de receita registradas para identificar o que contribuiu para essa variação.',
      evidence: movementEvidence(Number(current.income), Number(previous.income), labels.current, labels.previous),
    }));
  }

  return {
    status: 'ready',
    message: insights.length ? '' : `Não encontramos mudanças relevantes entre ${labels.previous} e ${labels.current} com as regras atuais.`,
    minimumTransactionsPerPeriod: MIN_TRANSACTIONS_PER_PERIOD,
    periods: { currentTransactions: currentCount, previousTransactions: previousCount },
    insights,
  };
}

module.exports = {
  MIN_TRANSACTIONS_PER_PERIOD,
  generateInsights,
};
