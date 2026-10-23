function getBudgetStatus(spentAmount, limitAmount) {
  const spent = Number(spentAmount) || 0;
  const limit = Number(limitAmount) || 0;

  if (spent >= limit) return { status: 'exceeded', statusLabel: 'Excedido' };
  if (spent >= limit * 0.8) return { status: 'attention', statusLabel: 'Atenção' };
  return { status: 'normal', statusLabel: 'Normal' };
}

function mapBudget(row) {
  const limitAmount = Number(row.limit_amount);
  const spentAmount = Number(row.spent_amount);
  const status = getBudgetStatus(spentAmount, limitAmount);

  return {
    id: row.id,
    category: { id: row.category_id, name: row.category_name },
    year: Number(row.reference_year),
    month: Number(row.reference_month),
    limitAmount,
    spentAmount,
    remainingAmount: limitAmount - spentAmount,
    percentageUsed: limitAmount ? Math.round((spentAmount / limitAmount) * 10000) / 100 : 0,
    ...status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { getBudgetStatus, mapBudget };
