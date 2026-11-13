const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/auth.service');
const authenticate = require('../middleware/authenticate');
const AppError = require('../errors/AppError');
const env = require('../config/env');
const {
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordChange,
} = require('../validation/auth');

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
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'too_many_reset_requests',
      message: 'Muitas solicitações de recuperação. Aguarde alguns minutos e tente novamente.',
    },
  },
});
const sessionCookieMaxAge = 7 * 24 * 60 * 60 * 1000;

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

function setSessionCookie(response, user) {
  const token = authService.createToken(user);
  response.cookie('fincontrol_session', token, { ...cookieOptions, maxAge: sessionCookieMaxAge });
}

router.post('/register', authLimiter, async (request, response, next) => {
  try {
    const validation = validateRegistration(request.body);
    ensureValid(validation);
    const user = await authService.register(validation.data);
    setSessionCookie(response, user);
    const { session_version: _sessionVersion, ...publicUser } = user;
    response.status(201).json({ message: 'Conta criada com sucesso.', user: publicUser });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, async (request, response, next) => {
  try {
    const validation = validateLogin(request.body);
    ensureValid(validation);
    const user = await authService.login(validation.data);
    setSessionCookie(response, user);
    const { session_version: _sessionVersion, ...publicUser } = user;
    response.json({ message: 'Login realizado com sucesso.', user: publicUser });
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

router.post('/password/forgot', passwordResetLimiter, async (request, response, next) => {
  try {
    const validation = validatePasswordResetRequest(request.body);
    ensureValid(validation);
    const delivery = await authService.requestPasswordReset(validation.data.email);
    if (delivery) {
      response.once('finish', () => {
        setImmediate(() => { void authService.deliverPasswordReset(delivery); });
      });
    }
    response.json({
      message: 'Se o e-mail corresponder a uma conta, você receberá instruções para redefinir sua senha.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/password/reset', authLimiter, async (request, response, next) => {
  try {
    const validation = validatePasswordReset(request.body);
    ensureValid(validation);
    await authService.resetPassword(validation.data);
    response.clearCookie('fincontrol_session', cookieOptions);
    response.json({ message: 'Senha redefinida. Entre novamente com sua nova senha.' });
  } catch (error) {
    next(error);
  }
});

router.post('/password/change', authenticate, authLimiter, async (request, response, next) => {
  try {
    const validation = validatePasswordChange(request.body);
    ensureValid(validation);
    const user = await authService.changePassword(request.user.id, validation.data);
    setSessionCookie(response, user);
    const { session_version: _sessionVersion, ...publicUser } = user;
    response.json({ message: 'Senha alterada. As outras sessões foram encerradas.', user: publicUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
