const { z } = require('zod');

const { phoneSchema } = require('./customer.schema');

const optionalPhoneSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value;
}, phoneSchema.optional());

const escalateSchema = z.object({
  customer_id: z.string().trim().min(1).optional(),
  phone: optionalPhoneSchema,
  reason: z.string({ required_error: 'reason is required.' }).trim().min(5),
});

module.exports = { escalateSchema };
