import { Meeting, IMeetingFile } from './model';

export const createMeeting = async (userId: string, title: string) => {
  return await Meeting.create({ userId, title });
};

export const listMeetings = async (userId: string) => {
  return await Meeting.find({ userId }).sort({ createdAt: -1 });
};

export const getMeeting = async (userId: string, id: string) => {
  return await Meeting.findOne({ _id: id, userId });
};

export const deleteMeeting = async (userId: string, id: string) => {
  // We need to also delete S3 files. For now, just delete the Mongo document.
  // Full deletion is handled in Phase 9.
  return await Meeting.findOneAndDelete({ _id: id, userId });
};

export const addMeetingFile = async (userId: string, id: string, file: IMeetingFile, audioHash?: string) => {
  const update: any = { $push: { files: file } };
  if (audioHash) {
    update.$set = { audioHash };
  }
  return await Meeting.findOneAndUpdate(
    { _id: id, userId },
    update,
    { new: true }
  );
};

export const checkHashExists = async (audioHash: string) => {
  return await Meeting.findOne({ audioHash });
};

import { BedrockAgentClient, GetIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';
import { BedrockDataAutomationRuntimeClient, GetDataAutomationStatusCommand } from '@aws-sdk/client-bedrock-data-automation-runtime';
import { env } from '../../config/env';

const bedrockClient = new BedrockAgentClient({ region: env.AWS_REGION });
const bdaClient = new BedrockDataAutomationRuntimeClient({ region: env.AWS_REGION });

export const getMeetingStatus = async (userId: string, id: string) => {
  const meeting = await Meeting.findOne({ _id: id, userId });
  if (!meeting) return null;

  if (meeting.status === 'processing' && meeting.ingestionJobId) {
    try {
      if (meeting.ingestionJobId.startsWith('arn:aws:bedrock:')) {
        // It's a BDA Invocation ARN (Audio)
        const response = await bdaClient.send(new GetDataAutomationStatusCommand({
          invocationArn: meeting.ingestionJobId
        }));
        
        const jobStatus = response.status;
        if (jobStatus === 'Success') {
          meeting.status = 'ready';
          await meeting.save();
        } else if (jobStatus === 'ClientError' || jobStatus === 'ServiceError') {
          meeting.status = 'failed';
          meeting.errorMessage = response.errorMessage || 'BDA processing failed';
          await meeting.save();
        }
      } else if (env.BEDROCK_KB_ID && env.BEDROCK_DS_A_ID) {
        // It's a Knowledge Base Job ID (PDFs)
        const response = await bedrockClient.send(new GetIngestionJobCommand({
          knowledgeBaseId: env.BEDROCK_KB_ID,
          dataSourceId: env.BEDROCK_DS_A_ID,
          ingestionJobId: meeting.ingestionJobId,
        }));

        const jobStatus = response.ingestionJob?.status;
        if (jobStatus === 'COMPLETE') {
          meeting.status = 'ready';
          await meeting.save();
        } else if (jobStatus === 'FAILED') {
          meeting.status = 'failed';
          meeting.errorMessage = response.ingestionJob?.failureReasons?.join(', ');
          await meeting.save();
        }
      }
    } catch (err) {
      console.error('Failed to get ingestion/BDA job status:', err);
    }
  }

  return meeting;
};
