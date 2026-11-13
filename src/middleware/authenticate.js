const authService = require('../services/auth.service');
const AppError = require('../errors/AppError');
const recurrenceService = require('../services/recurrence.service');

async function authenticate(request, _response, next) {
  const token = request.cookies.fincontrol_session;

  if (!token) {
    return next(new AppError('Faca login para continuar.', 401, 'authentication_required'));
  }

  let payload;
  try {
    payload = authService.verifyToken(token);
  } catch (_error) {
    return next(new AppError('Sua sessao expirou. Entre novamente.', 401, 'invalid_session'));
  }

  try {
    const user = await authService.findUserById(payload.sub);

    if (!user || Number(payload.sv || 0) !== Number(user.session_version || 0)) {
      return next(new AppError('Sua sessao nao e mais valida.', 401, 'invalid_session'));
    }

    delete user.session_version;
    request.user = user;
    await recurrenceService.generateDue(user.id);
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
