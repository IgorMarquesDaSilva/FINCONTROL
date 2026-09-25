const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/auth.service');
const authenticate = require('../middleware/authenticate');
const AppError = require('../errors/AppError');
const env = require('../config/env');
const { validateRegistration, validateLogin } = require('../validation/auth');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'too_many_requests',
      message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    },
  },
});

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
};

function ensureValid(validation) {
  if (Object.keys(validation.errors).length > 0) {
    throw new AppError('Revise os campos destacados.', 422, 'validation_error', validation.errors);
  }
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const validation = validateRegistration(request.body);
    ensureValid(validation);
    const user = await authService.register(validation.data);
    const token = authService.createToken(user);

    response.cookie('fincontrol_session', token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.status(201).json({ message: 'Conta criada com sucesso.', user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const validation = validateLogin(request.body);
    ensureValid(validation);
    const user = await authService.login(validation.data);
    const token = authService.createToken(user);

    response.cookie('fincontrol_session', token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    response.json({ message: 'Login realizado com sucesso.', user });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, (request, response) => {
  response.json({ user: request.user });
});

router.post('/logout', (_request, response) => {
  response.clearCookie('fincontrol_session', cookieOptions);
  response.json({ message: 'Sessao encerrada.' });
});

module.exports = router;
