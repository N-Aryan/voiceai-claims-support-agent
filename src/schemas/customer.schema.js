const { z } = require('zod');

const { normalizePhone } = require('../utils/normalize');

const phoneSchema = z
  .string({ required_error: 'Phone is required.' })
  .trim()
  .min(1, 'Phone is required.')
  .transform(normalizePhone)
  .refine((value) => value.length === 10, 'Phone must include 10 digits.');

const dobSchema = z
  .string({ required_error: 'DOB is required.' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must use YYYY-MM-DD format.');

const lookupCustomerSchema = z.object({
  phone: phoneSchema,
});

const verifyCustomerSchema = z.object({
  phone: phoneSchema,
  dob: dobSchema,
});

module.exports = {
  phoneSchema,
  dobSchema,
  lookupCustomerSchema,
  verifyCustomerSchema,
};
