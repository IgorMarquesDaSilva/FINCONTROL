const authService = require('../services/auth.service');
const AppError = require('../errors/AppError');

async function authenticate(request, _response, next) {
  const token = request.cookies.fincontrol_session;

  if (!token) {
    return next(new AppError('Faca login para continuar.', 401, 'authentication_required'));
  }

  try {
    const payload = authService.verifyToken(token);
    const user = await authService.findUserById(payload.sub);

    if (!user) {
      return next(new AppError('Sua sessao nao e mais valida.', 401, 'invalid_session'));
    }

    request.user = user;
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Sua sessao expirou. Entre novamente.', 401, 'invalid_session'));
  }
}

module.exports = authenticate;
