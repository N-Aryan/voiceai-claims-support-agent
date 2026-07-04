const { z } = require('zod');

const knowledgeSearchSchema = z.object({
  query: z.string({ required_error: 'query is required.' }).trim().min(3, 'query is required.'),
});

module.exports = { knowledgeSearchSchema };
