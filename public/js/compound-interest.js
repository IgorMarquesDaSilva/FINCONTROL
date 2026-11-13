(function initializeCompoundInterest(root, factory) {
  const calculator = factory();
  if (typeof module === 'object' && module.exports) module.exports = calculator;
  else root.FincontrolCompoundInterest = calculator;
}(typeof globalThis === 'undefined' ? this : globalThis, () => {
  const MAX_AMOUNT = 9_999_999_999_999.99;
  const MAX_MONTHS = 600;
  const MAX_RATE_PERCENT = 100;

  function validateSimulation(input = {}) {
    const values = {
      initialAmount: Number(input.initialAmount),
      monthlyContribution: Number(input.monthlyContribution),
      durationMonths: Number(input.durationMonths),
      ratePercent: Number(input.ratePercent),
      ratePeriod: String(input.ratePeriod || ''),
    };
    const errors = {};

    ['initialAmount', 'monthlyContribution'].forEach((field) => {
      if (!Number.isFinite(values[field]) || values[field] < 0 || values[field] > MAX_AMOUNT) {
        errors[field] = 'Informe um valor entre R$ 0,00 e R$ 9.999.999.999.999,99.';
      }
    });
    if (!Number.isInteger(values.durationMonths) || values.durationMonths < 1 || values.durationMonths > MAX_MONTHS) {
      errors.durationMonths = 'Informe um prazo entre 1 e 600 meses.';
    }
    if (!Number.isFinite(values.ratePercent) || values.ratePercent < 0 || values.ratePercent > MAX_RATE_PERCENT) {
      errors.ratePercent = 'Informe uma taxa entre 0% e 100% por período.';
    }
    if (!['monthly', 'annual'].includes(values.ratePeriod)) {
      errors.ratePeriod = 'Escolha se a taxa é mensal ou anual.';
    }

    return { data: values, errors };
  }

  function getMonthlyRate(ratePercent, ratePeriod) {
    const periodRate = ratePercent / 100;
    return ratePeriod === 'annual'
      ? ((1 + periodRate) ** (1 / 12)) - 1
      : periodRate;
  }

  function simulate(input = {}) {
    const { data, errors } = validateSimulation(input);
    if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));

    const monthlyRate = getMonthlyRate(data.ratePercent, data.ratePeriod);
    const timeline = [{
      month: 0,
      balance: data.initialAmount,
      contributions: data.initialAmount,
      earnings: 0,
    }];
    let balance = data.initialAmount;

    for (let month = 1; month <= data.durationMonths; month += 1) {
      // The monthly contribution is deposited at the end of each month.
      balance = (balance * (1 + monthlyRate)) + data.monthlyContribution;
      if (!Number.isFinite(balance)) throw new RangeError('O resultado excede o limite numérico desta simulação.');
      const contributions = data.initialAmount + (data.monthlyContribution * month);
      timeline.push({
        month,
        balance,
        contributions,
        earnings: balance - contributions,
      });
    }

    const finalPeriod = timeline[timeline.length - 1];
    return {
      ...data,
      monthlyRate,
      totalContributions: finalPeriod.contributions,
      finalBalance: finalPeriod.balance,
      totalEarnings: finalPeriod.earnings,
      timeline,
    };
  }

  return { MAX_AMOUNT, MAX_MONTHS, MAX_RATE_PERCENT, validateSimulation, getMonthlyRate, simulate };
}));
