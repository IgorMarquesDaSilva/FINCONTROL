const express = require('express');
const authenticate = require('../middleware/authenticate');
const reportService = require('../services/report.service');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

router.get('/monthly', async (request, response, next) => {
  try {
    const value = String(request.query.month || '');
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (!match || Number(match[1]) < 2000 || Number(match[1]) > 2200) {
      throw new AppError('Informe um mês válido no formato AAAA-MM.', 400, 'invalid_report_period');
    }

    const report = await reportService.monthly(request.user.id, {
      year: Number(match[1]),
      month: Number(match[2]),
    });
    response.json({ report });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
