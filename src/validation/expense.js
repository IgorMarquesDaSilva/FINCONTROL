const { validateTransaction } = require('./transaction');

function validateExpense(input = {}) {
  return validateTransaction(input, 'EXPENSE');
}

module.exports = { validateExpense };
