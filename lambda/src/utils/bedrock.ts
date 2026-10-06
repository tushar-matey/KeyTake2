import { BedrockAgentClient, StartIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';
import { config } from '../config';

const client = new BedrockAgentClient({ region: config.AWS_REGION });

export const startIngestion = async (kbId: string, dsId: string, s3Key: string) => {
  const response = await client.send(new StartIngestionJobCommand({
    knowledgeBaseId: kbId,
    dataSourceId: dsId,
  }));
  return response.ingestionJob?.ingestionJobId;
};
