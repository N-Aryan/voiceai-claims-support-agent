const { randomBytes } = require('crypto');

class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = options.details;
    this.cause = options.cause;
    this.expose = options.expose !== undefined ? options.expose : true;
  }
}

function createDebugId() {
  return randomBytes(4).toString('hex');
}

module.exports = { AppError, createDebugId };
