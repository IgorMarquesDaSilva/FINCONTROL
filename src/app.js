const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const transactionRoutes = require('./routes/transaction.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const publicDirectory = path.resolve(__dirname, '..', 'public');

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'FINCONTROL API' });
});
app.use('/api/auth', authRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use(express.static(publicDirectory, { extensions: ['html'] }));

app.use('/api', notFound);
app.get('*splat', (_request, response) => {
  response.sendFile(path.join(publicDirectory, 'index.html'));
});
app.use(errorHandler);

module.exports = app;
