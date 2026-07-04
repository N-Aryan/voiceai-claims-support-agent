const fs = require('fs');
const { google } = require('googleapis');

const { env } = require('./env');
const { AppError } = require('../utils/errors');

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let sheetsClient;

function createGoogleAuth() {
  if (!env.GOOGLE_SHEET_ID) {
    throw new AppError(503, 'Claims data is unavailable right now. Please try again later.');
  }

  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: env.GOOGLE_PRIVATE_KEY,
      },
      scopes: [GOOGLE_SHEETS_SCOPE],
    });
  }

  if (fs.existsSync(env.googleServiceAccountPath)) {
    return new google.auth.GoogleAuth({
      keyFile: env.googleServiceAccountPath,
      scopes: [GOOGLE_SHEETS_SCOPE],
    });
  }

  throw new AppError(503, 'Claims data is unavailable right now. Please try again later.');
}

function getSheetsClient() {
  if (!sheetsClient) {
    const auth = createGoogleAuth();
    sheetsClient = google.sheets({
      version: 'v4',
      auth,
    });
  }

  return sheetsClient;
}

module.exports = { getSheetsClient };
