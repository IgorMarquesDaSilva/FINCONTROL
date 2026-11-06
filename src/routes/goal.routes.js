const express = require('express');
const authenticate = require('../middleware/authenticate');
const goalService = require('../services/goal.service');
const AppError = require('../errors/AppError');
const { validateContribution, validateGoal, validateGoalStatus } = require('../validation/goal');

const router = express.Router();
router.use(authenticate);

function goalId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(id) || id <= 0) {
    throw new AppError('Identificador de meta invalido.', 400, 'invalid_goal_id');
  }
  return id;
}

function valid(validation) {
  if (Object.keys(validation.errors).length) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
  return validation.data;
}

router.get('/', async (request, response, next) => {
  try {
    response.json({ goals: await goalService.listByUser(request.user.id) });
  } catch (error) { next(error); }
});

router.get('/:id', async (request, response, next) => {
  try {
    response.json({ goal: await goalService.getByUser(request.user.id, goalId(request.params.id)) });
  } catch (error) { next(error); }
});

router.post('/', async (request, response, next) => {
  try {
    const goal = await goalService.create(request.user.id, valid(validateGoal(request.body)));
    response.status(201).json({ message: 'Meta criada com sucesso.', goal });
  } catch (error) { next(error); }
});

router.put('/:id', async (request, response, next) => {
  try {
    const goal = await goalService.update(request.user.id, goalId(request.params.id), valid(validateGoal(request.body)));
    response.json({ message: 'Meta atualizada com sucesso.', goal });
  } catch (error) { next(error); }
});

router.post('/:id/contributions', async (request, response, next) => {
  try {
    const data = valid(validateContribution(request.body));
    const goal = await goalService.contribute(request.user.id, goalId(request.params.id), data.amount);
    response.json({ message: goal.status === 'COMPLETED' ? 'Parabens! Meta concluida.' : 'Aporte registrado com sucesso.', goal });
  } catch (error) { next(error); }
});

router.patch('/:id/status', async (request, response, next) => {
  try {
    const data = valid(validateGoalStatus(request.body));
    const goal = await goalService.setStatus(request.user.id, goalId(request.params.id), data.status);
    response.json({ message: 'Status da meta atualizado.', goal });
  } catch (error) { next(error); }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const removed = await goalService.remove(request.user.id, goalId(request.params.id));
    response.json({ message: 'Meta excluida com sucesso.', goalId: removed.id });
  } catch (error) { next(error); }
});

module.exports = router;
