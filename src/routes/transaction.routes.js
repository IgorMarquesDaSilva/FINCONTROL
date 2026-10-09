const express = require('express');
const authenticate = require('../middleware/authenticate');
const transactionService = require('../services/transaction.service');
const AppError = require('../errors/AppError');
const { validateTransaction } = require('../validation/transaction');

const router = express.Router();

function parseTransactionId(value) {
  if (!/^\d+$/.test(String(value))) {
    throw new AppError('Identificador de movimentacao invalido.', 400, 'invalid_transaction_id');
  }

  const transactionId = Number(value);

  if (!Number.isSafeInteger(transactionId) || transactionId <= 0) {
    throw new AppError('Identificador de movimentacao invalido.', 400, 'invalid_transaction_id');
  }

  return transactionId;
}

function ensureValid(validation) {
  if (Object.keys(validation.errors).length > 0) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
}

router.use(authenticate);

router.get('/:id', async (request, response, next) => {
  try {
    const transactionId = parseTransactionId(request.params.id);
    const transaction = await transactionService.getByUser(request.user.id, transactionId);
    response.json({ transaction });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    const transactionId = parseTransactionId(request.params.id);
    const currentTransaction = await transactionService.getByUser(request.user.id, transactionId);
    const validation = validateTransaction(request.body, currentTransaction.type);
    ensureValid(validation);

    const transaction = await transactionService.update(
      request.user.id,
      transactionId,
      validation.data,
    );
    const transactionLabel = transaction.type === 'EXPENSE' ? 'Despesa' : 'Receita';

    response.json({ message: `${transactionLabel} atualizada com sucesso.`, transaction });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
