const { z } = require('zod');

const { phoneSchema } = require('./customer.schema');

const escalateSchema = z.object({
  customer_id: z.string({ required_error: 'customer_id is required.' }).trim().min(1),
  phone: phoneSchema,
  reason: z.string({ required_error: 'reason is required.' }).trim().min(5),
});

module.exports = { escalateSchema };
