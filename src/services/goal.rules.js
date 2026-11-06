function mapGoal(row) {
  const targetAmount = Number(row.target_amount);
  const currentAmount = Number(row.current_amount);
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const progressPercentage = targetAmount > 0
    ? Math.min(100, Math.round((currentAmount / targetAmount) * 10000) / 100)
    : 0;

  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    targetAmount,
    currentAmount,
    remainingAmount,
    progressPercentage,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { mapGoal };
