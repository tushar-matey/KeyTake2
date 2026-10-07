import { z } from 'zod';

const envSchema = z.object({
  BEDROCK_KB_ID: z.string().min(1),
  BEDROCK_DS_A_ID: z.string().min(1),
  BDA_PROJECT_ARN: z.string().min(1),
  BDA_PROFILE_ARN: z.string().min(1),
  S3_RAW_BUCKET: z.string().min(1),
  S3_DERIVED_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  MONGODB_URI: z.string().min(1),
});

export const config = envSchema.parse(process.env);
