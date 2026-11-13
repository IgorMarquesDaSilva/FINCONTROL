const test = require('node:test');
const assert = require('node:assert/strict');
const { getMonthlyRate, simulate, validateSimulation } = require('../public/js/compound-interest');

test('simulador sem juros soma aporte inicial e aportes mensais no fim do período', () => {
  const result = simulate({
    initialAmount: 100,
    monthlyContribution: 20,
    durationMonths: 3,
    ratePercent: 0,
    ratePeriod: 'monthly',
  });

  assert.equal(result.finalBalance, 160);
  assert.equal(result.totalContributions, 160);
  assert.equal(result.totalEarnings, 0);
  assert.equal(result.timeline.length, 4);
});

test('simulador aplica taxa mensal composta e deposita o aporte mensal no fim do mês', () => {
  const result = simulate({
    initialAmount: 100,
    monthlyContribution: 20,
    durationMonths: 2,
    ratePercent: 1,
    ratePeriod: 'monthly',
  });

  assert.equal(result.timeline[1].balance, 121);
  assert.equal(result.finalBalance, 142.21);
  assert.equal(result.totalContributions, 140);
  assert.ok(Math.abs(result.totalEarnings - 2.21) < 1e-10);
});

test('taxa anual efetiva é convertida para uma taxa mensal equivalente', () => {
  const monthlyRate = getMonthlyRate(12, 'annual');
  const result = simulate({
    initialAmount: 1200,
    monthlyContribution: 0,
    durationMonths: 12,
    ratePercent: 12,
    ratePeriod: 'annual',
  });

  assert.ok(Math.abs(monthlyRate - 0.009488792934583046) < 1e-12);
  assert.ok(Math.abs(result.finalBalance - 1344) < 1e-8);
  assert.equal(result.totalContributions, 1200);
});

test('validação limita valores, prazo, taxa e identificador do período', () => {
  const { errors } = validateSimulation({
    initialAmount: -1,
    monthlyContribution: 10_000_000_000_000,
    durationMonths: 601,
    ratePercent: 101,
    ratePeriod: 'daily',
  });

  assert.deepEqual(Object.keys(errors).sort(), [
    'durationMonths', 'initialAmount', 'monthlyContribution', 'ratePercent', 'ratePeriod',
  ]);
  assert.throws(() => simulate({
    initialAmount: 0, monthlyContribution: 0, durationMonths: 0, ratePercent: 0, ratePeriod: 'annual',
  }), RangeError);
});
