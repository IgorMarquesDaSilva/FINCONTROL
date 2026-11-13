const express = require('express');
const authenticate = require('../middleware/authenticate');
const service = require('../services/education.service');

const router = express.Router();
router.use(authenticate);

router.get('/', async (request, response, next) => {
  try { response.json({ learning: await service.catalog(request.user.id) }); }
  catch (error) { next(error); }
});

router.post('/articles/:id/read', async (request, response, next) => {
  try { response.json(await service.markRead(request.user.id, request.params.id)); }
  catch (error) { next(error); }
});

router.post('/articles/:id/quiz', async (request, response, next) => {
  try { response.json(await service.answerQuiz(request.user.id, request.params.id, request.body.answerIndex)); }
  catch (error) { next(error); }
});

router.post('/challenges/:id/complete', async (request, response, next) => {
  try { response.json(await service.completeChallenge(request.user.id, request.params.id)); }
  catch (error) { next(error); }
});

module.exports = router;
