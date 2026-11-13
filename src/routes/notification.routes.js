const express = require('express');
const authenticate = require('../middleware/authenticate');
const service = require('../services/notification.service');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

router.get('/', async (request, response, next) => {
  try {
    await service.generate(request.user.id);
    response.json(await service.list(request.user.id));
  } catch (error) { next(error); }
});

router.put('/preferences', async (request, response, next) => {
  try { response.json({ preferences: await service.updatePreferences(request.user.id, request.body) }); }
  catch (error) { next(error); }
});

router.post('/:id/:action', async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    if (!Number.isSafeInteger(id) || id <= 0 || !['read', 'silence'].includes(request.params.action)) {
      throw new AppError('Aviso ou ação inválida.', 400, 'invalid_notification_action');
    }
    await service.changeNotification(request.user.id, id, request.params.action);
    response.json({ message: 'Aviso atualizado.' });
  } catch (error) { next(error); }
});

module.exports = router;
