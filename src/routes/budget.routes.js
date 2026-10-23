const express = require('express');
const authenticate = require('../middleware/authenticate');
const budgetService = require('../services/budget.service');
const AppError = require('../errors/AppError');
const { positiveInteger, validateBudget, validateBudgetPeriod } = require('../validation/budget');

const router = express.Router();
router.use(authenticate);

function ensureValid(validation) {
  if (Object.keys(validation.errors).length) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
}

function parseBudgetId(value) {
  const budgetId = positiveInteger(value);
  if (!budgetId) throw new AppError('Identificador de orçamento inválido.', 400, 'invalid_budget_id');
  return budgetId;
}

router.get('/', async (request, response, next) => {
  try {
    const validation = validateBudgetPeriod(request.query.year, request.query.month);
    ensureValid(validation);
    const budgets = await budgetService.listByUser(request.user.id, validation.data);
    response.json({ budgets });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    const budgetId = parseBudgetId(request.params.id);
    const budget = await budgetService.getByUser(request.user.id, budgetId);
    response.json({ budget });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const validation = validateBudget(request.body);
    ensureValid(validation);
    const budget = await budgetService.create(request.user.id, validation.data);
    response.status(201).json({ message: 'Orçamento criado com sucesso.', budget });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    const budgetId = parseBudgetId(request.params.id);
    const validation = validateBudget(request.body);
    ensureValid(validation);
    const budget = await budgetService.update(request.user.id, budgetId, validation.data);
    response.json({ message: 'Orçamento atualizado com sucesso.', budget });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const budgetId = parseBudgetId(request.params.id);
    await budgetService.remove(request.user.id, budgetId);
    response.json({ message: 'Orçamento excluído com sucesso.', budgetId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
