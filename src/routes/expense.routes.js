const express = require('express');
const authenticate = require('../middleware/authenticate');
const expenseService = require('../services/expense.service');
const AppError = require('../errors/AppError');
const { validateExpense } = require('../validation/expense');

const router = express.Router();

function ensureValid(validation) {
  if (Object.keys(validation.errors).length > 0) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
}

router.use(authenticate);

router.get('/', async (request, response, next) => {
  try {
    const expenses = await expenseService.listByUser(request.user.id);
    response.json({ expenses });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const validation = validateExpense(request.body);
    ensureValid(validation);
    const expense = await expenseService.create(request.user.id, validation.data);

    response.status(201).json({ message: 'Despesa cadastrada com sucesso.', expense });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
