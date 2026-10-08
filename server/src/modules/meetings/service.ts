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

import { BedrockAgentClient, GetIngestionJobCommand, StartIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';
import { BedrockDataAutomationRuntimeClient, GetDataAutomationStatusCommand } from '@aws-sdk/client-bedrock-data-automation-runtime';
import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../config/env';

const bedrockClient = new BedrockAgentClient({ region: env.AWS_REGION });
const bdaClient = new BedrockDataAutomationRuntimeClient({ region: env.AWS_REGION });
const s3Client = new S3Client({ region: env.AWS_REGION });

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
          // Find the result.json file in the derived bucket
          const prefix = `bda-output/${id}/`;
          const listResponse = await s3Client.send(new ListObjectsV2Command({
            Bucket: env.S3_DERIVED_BUCKET,
            Prefix: prefix,
          }));

          const resultObj = listResponse.Contents?.find(c => c.Key?.endsWith('result.json'));
          if (resultObj && resultObj.Key) {
            // Write the sidecar file
            const sidecarKey = `${resultObj.Key}.metadata.json`;
            const sidecar = {
              metadataAttributes: {
                userId,
                meetingId: id,
                type: 'transcript',
              },
            };
            
            await s3Client.send(new PutObjectCommand({
              Bucket: env.S3_DERIVED_BUCKET,
              Key: sidecarKey,
              Body: JSON.stringify(sidecar),
              ContentType: 'application/json',
            }));

            // Start Ingestion for Derived Bucket
            const dsJob = await bedrockClient.send(new StartIngestionJobCommand({
              knowledgeBaseId: env.BEDROCK_KB_ID,
              dataSourceId: env.BEDROCK_DS_DERIVED_ID,
            }));

            // Update meeting to track the ingestion job
            meeting.ingestionJobId = dsJob.ingestionJob?.ingestionJobId;
            await meeting.save();
          } else {
            meeting.status = 'failed';
            meeting.errorMessage = 'BDA completed but result.json not found';
            await meeting.save();
          }
        } else if (jobStatus === 'ClientError' || jobStatus === 'ServiceError') {
          meeting.status = 'failed';
          meeting.errorMessage = response.errorMessage || 'BDA processing failed';
          await meeting.save();
        }
      } else if (env.BEDROCK_KB_ID) {
        // It's a Knowledge Base Job ID
        // Determine the data source. If it's audio, it's DS_B, otherwise DS_A.
        const isAudio = meeting.files[0]?.originalName?.match(/\.(mp3|wav|flac|mp4|ogg|webm|amr)$/i);
        const dataSourceId = isAudio ? env.BEDROCK_DS_DERIVED_ID : env.BEDROCK_DS_A_ID;

        if (!dataSourceId) {
          console.warn('Missing Data Source ID for file type. Ensure BEDROCK_DS_DERIVED_ID or BEDROCK_DS_A_ID is set.');
          return null;
        }

        const response = await bedrockClient.send(new GetIngestionJobCommand({
          knowledgeBaseId: env.BEDROCK_KB_ID,
          dataSourceId: dataSourceId,
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
