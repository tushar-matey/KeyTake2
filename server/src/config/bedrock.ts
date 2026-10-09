import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { env } from './env';

// This client is used for calling Converse API (Amazon Nova Lite)
export const bedrockRuntimeClient = new BedrockRuntimeClient({
  region: env.AWS_REGION,
});
