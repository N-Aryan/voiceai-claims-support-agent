function normalizePhone(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '');

  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }

  return digitsOnly;
}

function normalizeDob(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const slashMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawValue;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function normalizeValue(value) {
  return String(value || '').trim();
}

function toSortableTimestamp(value) {
  const normalizedDate = normalizeDob(value);
  const parsedValue = Date.parse(
    /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)
      ? `${normalizedDate}T00:00:00Z`
      : String(value || ''),
  );

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

module.exports = {
  normalizePhone,
  normalizeDob,
  normalizeHeader,
  normalizeValue,
  toSortableTimestamp,
};
