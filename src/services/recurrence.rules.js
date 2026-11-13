function dateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function cycleDate(startDate, frequency, index) {
  const [year, month, day] = startDate.split('-').map(Number);
  let date;
  if (frequency === 'WEEKLY') {
    date = new Date(Date.UTC(year, month - 1, day + 7 * index));
  } else {
    const base = frequency === 'MONTHLY'
      ? new Date(Date.UTC(year, month - 1 + index, 1))
      : new Date(Date.UTC(year + index, month - 1, 1));
    const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
    date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(day, lastDay)));
  }
  return dateKey(date);
}

function nextIndexOnOrAfter(startDate, frequency, targetDate) {
  let index = 0;
  while (cycleDate(startDate, frequency, index) < targetDate) index += 1;
  return index;
}

function todayInTimeZone(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

module.exports = { cycleDate, nextIndexOnOrAfter, todayInTimeZone };
