const express = require('express');
const authenticate = require('../middleware/authenticate');
const incomeService = require('../services/income.service');
const AppError = require('../errors/AppError');
const { validateIncome } = require('../validation/income');

const router = express.Router();

function ensureValid(validation) {
  if (Object.keys(validation.errors).length > 0) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
}

router.use(authenticate);

router.get('/', async (request, response, next) => {
  try {
    const incomes = await incomeService.listByUser(request.user.id);
    response.json({ incomes });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const validation = validateIncome(request.body);
    ensureValid(validation);
    const income = await incomeService.create(request.user.id, validation.data);

    response.status(201).json({ message: 'Receita cadastrada com sucesso.', income });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
