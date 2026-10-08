import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_RAW_BUCKET: z.string().min(1),
  S3_DERIVED_BUCKET: z.string().min(1),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  BEDROCK_KB_ID: z.string().optional(),
  BEDROCK_DS_A_ID: z.string().optional(),
  BEDROCK_DS_B_ID: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('apac.amazon.nova-lite-v1:0'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const env = serverEnvSchema.parse(process.env);

export function validateEnv() {
  // Just here for backward compatibility if called
  return env;
}
