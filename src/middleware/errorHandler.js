const AppError = require('../errors/AppError');

function notFound(request, _response, next) {
  next(new AppError(`Rota ${request.method} ${request.path} nao encontrada.`, 404, 'not_found'));
}

function errorHandler(error, _request, response, _next) {
  const expected = error instanceof AppError;
  const statusCode = expected ? error.statusCode : 500;

  if (!expected) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: {
      code: expected ? error.code : 'internal_error',
      message: expected ? error.message : 'Nao foi possivel concluir a solicitacao.',
      ...(expected && error.details ? { fields: error.details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
