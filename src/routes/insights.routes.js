const express = require('express');
const authenticate = require('../middleware/authenticate');
const insightsService = require('../services/insights.service');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

router.get('/', async (request, response, next) => {
  try {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(request.query.month || ''));
    const year = match ? Number(match[1]) : 0;
    if (!match || year < 2000 || year > 2200) {
      throw new AppError('Informe um mês válido no formato AAAA-MM.', 400, 'invalid_insights_period');
    }

    const insights = await insightsService.monthly(request.user.id, {
      year,
      month: Number(match[2]),
    });
    response.json({ insights });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
