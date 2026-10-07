import { BedrockAgentClient, StartIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';
import { BedrockDataAutomationRuntimeClient, InvokeDataAutomationAsyncCommand } from "@aws-sdk/client-bedrock-data-automation-runtime";
import { config } from '../config';

const agentClient = new BedrockAgentClient({ region: config.AWS_REGION });
const bdaClient = new BedrockDataAutomationRuntimeClient({ region: config.AWS_REGION });

export const startIngestion = async (kbId: string, dsId: string, s3Key: string) => {
  const response = await agentClient.send(new StartIngestionJobCommand({
    knowledgeBaseId: kbId,
    dataSourceId: dsId,
  }));
  return response.ingestionJob?.ingestionJobId;
};

export const startDataAutomation = async (inputS3Uri: string, meetingId: string) => {
  const response = await bdaClient.send(new InvokeDataAutomationAsyncCommand({
    inputConfiguration: { s3Uri: inputS3Uri },
    outputConfiguration: { s3Uri: `s3://${config.S3_DERIVED_BUCKET}/bda-output/${meetingId}/` },
    dataAutomationConfiguration: {
      dataAutomationProjectArn: config.BDA_PROJECT_ARN,
    },
    dataAutomationProfileArn: config.BDA_PROFILE_ARN,
  }));
  return response.invocationArn;
};

