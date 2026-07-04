const { z } = require('zod');

const { phoneSchema } = require('./customer.schema');

const sentimentSchema = z.enum(['positive', 'neutral', 'negative', 'unknown']);
const outcomeSchema = z.enum([
  'claim_status_shared',
  'documents_required',
  'auth_failed',
  'customer_not_found',
  'escalated',
  'faq_answered',
  'unsupported_question',
  'emergency',
  'system_error',
]);

const booleanSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const logCallSchema = z.object({
  timestamp: z.string().trim().min(1).optional(),
  caller_name: z.string({ required_error: 'caller_name is required.' }).trim().min(1),
  phone: phoneSchema,
  customer_id: z.string().trim().optional().default(''),
  claim_id: z.string().trim().optional().default(''),
  call_summary: z.string({ required_error: 'call_summary is required.' }).trim().min(1),
  sentiment: sentimentSchema,
  outcome: outcomeSchema,
  escalated: booleanSchema,
});

module.exports = {
  sentimentSchema,
  outcomeSchema,
  logCallSchema,
};
