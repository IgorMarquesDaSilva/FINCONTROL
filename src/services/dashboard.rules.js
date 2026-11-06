function buildDashboardSummary(incomeValue, expenseValue, transactionCountValue) {
  const income = Number(incomeValue) || 0;
  const expense = Number(expenseValue) || 0;
  const transactionCount = Number(transactionCountValue) || 0;
  const balance = income - expense;
  const savingsPercentage = income > 0
    ? Math.round((balance / income) * 10000) / 100
    : 0;

  return { income, expense, balance, savingsPercentage, transactionCount };
}

module.exports = { buildDashboardSummary };
