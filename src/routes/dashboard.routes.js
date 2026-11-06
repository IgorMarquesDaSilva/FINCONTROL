const express = require('express');
const authenticate = require('../middleware/authenticate');
const dashboardService = require('../services/dashboard.service');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

function parsePeriod(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(value || ''));
  const year = match ? Number(match[1]) : 0;

  if (!match || year < 2000 || year > 2200) {
    throw new AppError('Informe um mes valido no formato AAAA-MM.', 400, 'invalid_dashboard_period');
  }

  return { year, month: Number(match[2]) };
}

router.get('/', async (request, response, next) => {
  try {
    const dashboard = await dashboardService.monthly(request.user.id, parsePeriod(request.query.month));
    response.json({ dashboard });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
