const { env } = require('../config/env');
const { getSheetsClient } = require('../config/googleSheets');
const { AppError } = require('../utils/errors');
const { normalizeHeader, normalizeValue } = require('../utils/normalize');

function ensureSheetsConfigured() {
  if (!env.googleConfigured) {
    throw new AppError(503, 'Claims data is unavailable right now. Please try again later.');
  }
}

async function getSheetRows(sheetName) {
  ensureSheetsConfigured();

  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      return [];
    }

    const [rawHeaders, ...rawRows] = values;
    const headers = rawHeaders.map(normalizeHeader);

    return rawRows
      .filter((row) => row.some((cell) => normalizeValue(cell) !== ''))
      .map((row) => {
        const record = {};

        headers.forEach((header, index) => {
          if (header) {
            record[header] = normalizeValue(row[index]);
          }
        });

        return record;
      });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, 'Claims data is unavailable right now. Please try again later.', {
      cause: error,
    });
  }
}

async function appendSheetRow(sheetName, values) {
  ensureSheetsConfigured();

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, 'Unable to save the call record right now. Please try again later.', {
      cause: error,
    });
  }
}

module.exports = { getSheetRows, appendSheetRow };
