const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  GOOGLE_SHEET_ID: z.string().trim().optional().transform((value) => value || ''),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || ''),
  GOOGLE_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((value) => (value ? value.replace(/\\n/g, '\n') : '')),
  GEMINI_API_KEY: z.string().trim().optional().transform((value) => value || ''),
  GEMINI_EMBEDDING_MODEL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || 'gemini-embedding-2'),
  GEMINI_GENERATION_MODEL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || 'gemini-2.5-flash'),
});

const parsed = envSchema.parse(process.env);
const googleServiceAccountPath = path.resolve(process.cwd(), 'secrets/google-service-account.json');
const hasLocalGoogleCredentials = fs.existsSync(googleServiceAccountPath);
const hasEnvGoogleCredentials =
  Boolean(parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL) && Boolean(parsed.GOOGLE_PRIVATE_KEY);

const env = {
  ...parsed,
  googleServiceAccountPath,
  googleConfigured: Boolean(parsed.GOOGLE_SHEET_ID) && (hasLocalGoogleCredentials || hasEnvGoogleCredentials),
  llmConfigured: Boolean(parsed.GEMINI_API_KEY),
};

module.exports = { env };
