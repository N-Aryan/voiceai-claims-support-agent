const { findCustomerByPhone, verifyCustomerIdentity } = require('../services/customer.service');
const { maskPhone } = require('../utils/mask');

async function lookupCustomer(req, res) {
  const customer = await findCustomerByPhone(req.body.phone);

  if (!customer) {
    return res.json({
      found: false,
      message:
        'No customer was found for this phone number. Please confirm the number or offer representative support.',
    });
  }

  return res.json({
    found: true,
    customer_id: customer.customer_id,
    name: customer.name,
    masked_phone: maskPhone(req.body.phone),
    message: 'Customer found. Please verify identity before sharing claim details.',
  });
}

async function verifyCustomer(req, res) {
  const customer = await verifyCustomerIdentity(req.body);

  if (!customer) {
    return res.json({
      authenticated: false,
      message: 'Identity verification failed. Do not share claim details.',
    });
  }

  return res.json({
    authenticated: true,
    customer_id: customer.customer_id,
    name: customer.name,
    message: 'Customer identity verified.',
  });
}

module.exports = { lookupCustomer, verifyCustomer };
