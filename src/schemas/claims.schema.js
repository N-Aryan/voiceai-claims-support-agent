const { z } = require('zod');

const getClaimStatusSchema = z.object({
  customer_id: z.string({ required_error: 'customer_id is required.' }).trim().min(1),
});

module.exports = { getClaimStatusSchema };
