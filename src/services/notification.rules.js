function budgetLevel(percentage) {
  if (percentage > 100) return 'over';
  if (percentage >= 100) return 'limit';
  if (percentage >= 80) return 'warning';
  return null;
}

function financialPeriod(today, startDay) {
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day < startDay ? 0 : 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function addDays(dateKey, count) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

module.exports = { budgetLevel, financialPeriod, addDays };
