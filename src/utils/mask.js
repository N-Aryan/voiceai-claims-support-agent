const { normalizePhone } = require('./normalize');

function maskPhone(phone) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return '';
  }

  if (normalizedPhone.length <= 4) {
    return '*'.repeat(normalizedPhone.length);
  }

  return `${'*'.repeat(normalizedPhone.length - 4)}${normalizedPhone.slice(-4)}`;
}

function maskEmail(email) {
  const value = String(email || '').trim();
  const [localPart, domain] = value.split('@');

  if (!localPart || !domain) {
    return value;
  }

  const visibleStart = localPart.slice(0, 1);
  return `${visibleStart}${'*'.repeat(Math.max(localPart.length - 1, 1))}@${domain}`;
}

function maskSensitiveValue(key, value) {
  if (typeof value !== 'string') {
    return value;
  }

  if (key.includes('phone')) {
    return maskPhone(value);
  }

  if (key.includes('dob')) {
    return '****-**-**';
  }

  if (key.includes('email')) {
    return maskEmail(value);
  }

  if (key.includes('private_key')) {
    return '[redacted]';
  }

  return value;
}

function maskSensitiveData(value, key = '') {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveData(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        maskSensitiveData(entryValue, String(entryKey).toLowerCase()),
      ]),
    );
  }

  return maskSensitiveValue(key, value);
}

module.exports = { maskPhone, maskSensitiveData };
