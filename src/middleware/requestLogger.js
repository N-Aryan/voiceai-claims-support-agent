const morgan = require('morgan');

const { maskSensitiveData } = require('../utils/mask');

morgan.token('sanitized-body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return '-';
  }

  try {
    return JSON.stringify(maskSensitiveData(req.body));
  } catch (error) {
    return '[unserializable body]';
  }
});

const requestLogger = morgan(':method :url :status :response-time ms body=:sanitized-body');

module.exports = requestLogger;
