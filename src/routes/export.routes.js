const express = require('express');
const authenticate = require('../middleware/authenticate');
const transactionService = require('../services/transaction.service');
const reportService = require('../services/report.service');
const profileService = require('../services/profile.service');
const { validateTransactionQuery } = require('../validation/transaction-query');
const { buildTransactionsCsv, buildMonthlyPdf } = require('../services/export.service');
const AppError = require('../errors/AppError');

const router = express.Router();
router.use(authenticate);

router.get('/transactions.csv', async (request, response, next) => {
  try {
    const validation = validateTransactionQuery(request.query);
    if (Object.keys(validation.errors).length) {
      throw new AppError('Revise os filtros da exportação.', 422, 'validation_error', validation.errors);
    }
    const [transactions, profile] = await Promise.all([
      transactionService.exportByUser(request.user.id, validation.data),
      profileService.get(request.user.id),
    ]);
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fincontrol-movimentacoes.csv"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(buildTransactionsCsv(transactions, profile.preferences));
  } catch (error) { next(error); }
});

router.get('/monthly.pdf', async (request, response, next) => {
  try {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(request.query.month || ''));
    if (!match || Number(match[1]) < 2000 || Number(match[1]) > 2200) {
      throw new AppError('Informe um mês válido no formato AAAA-MM.', 400, 'invalid_report_period');
    }
    const period = { year: Number(match[1]), month: Number(match[2]) };
    const [report, profile] = await Promise.all([
      reportService.monthly(request.user.id, period),
      profileService.get(request.user.id),
    ]);
    const pdf = await buildMonthlyPdf(report, profile.preferences);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fincontrol-${request.query.month}.pdf"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(pdf);
  } catch (error) { next(error); }
});

module.exports = router;
