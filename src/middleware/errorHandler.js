const { createDebugId } = require('../utils/errors');
const { maskSensitiveData } = require('../utils/mask');

function errorHandler(err, req, res, next) {
  const debugId = createDebugId();

  if (err.type === 'entity.parse.failed') {
    console.error(`[${debugId}] Invalid JSON payload`, {
      method: req.method,
      path: req.originalUrl,
      body: maskSensitiveData(req.body),
      error: err.message,
    });

    return res.status(400).json({
      error: true,
      message: 'Invalid JSON payload.',
      debug_id: debugId,
    });
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const shouldExposeMessage = err.expose === true || (statusCode < 500 && err.expose !== false);
  const message = shouldExposeMessage
    ? err.message || 'Request failed.'
    : 'Something went wrong while processing the request.';

  console.error(`[${debugId}] Request failed`, {
    method: req.method,
    path: req.originalUrl,
    body: maskSensitiveData(req.body),
    statusCode,
    error: err.message,
    details: err.details,
    stack: err.stack,
    cause: err.cause ? err.cause.message : undefined,
  });

  return res.status(statusCode).json({
    error: true,
    message,
    debug_id: debugId,
  });
}

module.exports = errorHandler;
