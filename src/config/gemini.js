const { env } = require('./env');
const { AppError } = require('../utils/errors');

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function assertGeminiConfigured() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      503,
      'Knowledge search is unavailable right now. Please offer representative support.',
    );
  }
}

function getGeminiModelPath(modelName, methodName) {
  assertGeminiConfigured();
  return `${GEMINI_API_BASE_URL}/models/${modelName}:${methodName}`;
}

function getGeminiHeaders() {
  assertGeminiConfigured();

  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': env.GEMINI_API_KEY,
  };
}

module.exports = {
  assertGeminiConfigured,
  getGeminiHeaders,
  getGeminiModelPath,
};
