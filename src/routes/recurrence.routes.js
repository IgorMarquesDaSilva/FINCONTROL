const express = require('express');
const authenticate = require('../middleware/authenticate');
const service = require('../services/recurrence.service');
const { validateRecurrence } = require('../validation/recurrence');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

function idFrom(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Recorrência inválida.', 400, 'invalid_recurrence_id');
  return id;
}

function validated(input) {
  const result = validateRecurrence(input);
  if (Object.keys(result.errors).length) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', result.errors);
  }
  return result.data;
}

router.get('/', async (request, response, next) => {
  try { response.json({ recurrences: await service.list(request.user.id) }); }
  catch (error) { next(error); }
});

router.post('/', async (request, response, next) => {
  try {
    const recurrence = await service.create(request.user.id, validated(request.body));
    response.status(201).json({ message: 'Recorrência criada.', recurrence });
  } catch (error) { next(error); }
});

router.put('/:id', async (request, response, next) => {
  try {
    const recurrence = await service.update(request.user.id, idFrom(request.params.id), validated(request.body));
    response.json({ message: 'Recorrência atualizada.', recurrence });
  } catch (error) { next(error); }
});

router.post('/:id/:action', async (request, response, next) => {
  try {
    if (!['pause', 'resume', 'cancel'].includes(request.params.action)) {
      throw new AppError('Ação inválida.', 400, 'invalid_recurrence_action');
    }
    const recurrence = await service.changeStatus(request.user.id, idFrom(request.params.id), request.params.action);
    response.json({ message: 'Recorrência atualizada.', recurrence });
  } catch (error) { next(error); }
});

module.exports = router;
