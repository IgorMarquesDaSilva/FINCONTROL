const test = require('node:test');
const assert = require('node:assert/strict');
const { cycleDate, nextIndexOnOrAfter, todayInTimeZone } = require('../src/services/recurrence.rules');

test('recorrências mensais mantêm o dia âncora após mês curto', () => {
  assert.equal(cycleDate('2027-01-31', 'MONTHLY', 1), '2027-02-28');
  assert.equal(cycleDate('2027-01-31', 'MONTHLY', 2), '2027-03-31');
  assert.equal(cycleDate('2024-02-29', 'YEARLY', 1), '2025-02-28');
  assert.equal(cycleDate('2024-02-29', 'YEARLY', 4), '2028-02-29');
  assert.equal(cycleDate('2027-05-01', 'WEEKLY', 1), '2027-05-08');
});

test('próximo ciclo e data local respeitam o fuso configurado', () => {
  assert.equal(nextIndexOnOrAfter('2027-05-01', 'WEEKLY', '2027-05-08'), 1);
  assert.equal(todayInTimeZone(new Date('2027-03-01T02:59:00Z'), 'America/Sao_Paulo'), '2027-02-28');
  assert.equal(todayInTimeZone(new Date('2027-03-01T03:00:00Z'), 'America/Sao_Paulo'), '2027-03-01');
});
