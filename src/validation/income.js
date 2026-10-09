const { validateTransaction } = require('./transaction');

function validateIncome(input = {}) {
  return validateTransaction(input, 'INCOME');
}

module.exports = { validateIncome };
