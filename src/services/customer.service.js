const { getSheetRows } = require('./sheets.service');
const { normalizeDob, normalizePhone } = require('../utils/normalize');

async function findCustomerByPhone(phone) {
  const customers = await getSheetRows('customers');
  const normalizedPhone = normalizePhone(phone);

  return customers.find((customer) => normalizePhone(customer.phone) === normalizedPhone) || null;
}

async function verifyCustomerIdentity({ phone, dob }) {
  const customer = await findCustomerByPhone(phone);

  if (!customer) {
    return null;
  }

  return normalizeDob(customer.dob) === normalizeDob(dob) ? customer : null;
}

module.exports = { findCustomerByPhone, verifyCustomerIdentity };
