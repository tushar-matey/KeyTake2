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

import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { ChatMessageModel } from '../chat/model';

async function deleteS3Prefix(bucket: string, prefix: string) {
  try {
    let continuationToken: string | undefined;
    do {
      const listRes = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      
      if (listRes.Contents && listRes.Contents.length > 0) {
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: listRes.Contents.map(c => ({ Key: c.Key! })),
          }
        }));
      }
      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);
  } catch (e) {
    console.error(`Failed to delete S3 prefix ${prefix} from ${bucket}:`, e);
  }
}

export const deleteMeeting = async (userId: string, id: string) => {
  // Delete from RAW bucket
  await deleteS3Prefix(env.S3_RAW_BUCKET, `data-source-a/users/${userId}/meetings/${id}/`);
  await deleteS3Prefix(env.S3_RAW_BUCKET, `data-source-b/users/${userId}/meetings/${id}/`);
  
  // Delete from DERIVED bucket
  if (env.S3_DERIVED_BUCKET) {
    await deleteS3Prefix(env.S3_DERIVED_BUCKET, `bda-output/${id}/`);
  }
  
  // Sync the knowledge bases so the vectors are removed
  const dataSourcesToTry = [
    env.BEDROCK_DS_DERIVED_ID,
    env.BEDROCK_DS_A_ID,
    env.BEDROCK_DS_B_ID
  ].filter(Boolean) as string[];

  for (const dsId of dataSourcesToTry) {
    try {
      await bedrockClient.send(new StartIngestionJobCommand({
        knowledgeBaseId: env.BEDROCK_KB_ID,
        dataSourceId: dsId,
      }));
    } catch (e) {
      console.error(`Failed to sync data source ${dsId} on deletion:`, e);
    }
  }

  // Delete associated chat messages
  await ChatMessageModel.deleteMany({ meetingId: id, userId });

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

  if (meeting.status === 'processing') {
    let allComplete = true;
    let anyFailed = false;
    let newJobIds = [...(meeting.jobIds || [])];
    
    if (newJobIds.length === 0 && meeting.ingestionJobId) {
      newJobIds.push(meeting.ingestionJobId);
    }

    if (newJobIds.length === 0) return meeting;

    try {
      for (const jobId of [...newJobIds]) {
        if (jobId.startsWith('arn:aws:bedrock:')) {
          // BDA Job
          const response = await bdaClient.send(new GetDataAutomationStatusCommand({
            invocationArn: jobId
          }));
          const jobStatus = response.status;
          
          if (jobStatus === 'Success') {
            const prefix = `bda-output/${id}/`;
            const listResponse = await s3Client.send(new ListObjectsV2Command({
              Bucket: env.S3_DERIVED_BUCKET,
              Prefix: prefix,
            }));

            const resultObj = listResponse.Contents?.find(c => c.Key?.endsWith('result.json'));
            if (resultObj && resultObj.Key) {
              const sidecarKey = `${resultObj.Key}.metadata.json`;
              const sidecar = {
                metadataAttributes: { userId, meetingId: id, type: 'transcript' }
              };
              await s3Client.send(new PutObjectCommand({
                Bucket: env.S3_DERIVED_BUCKET,
                Key: sidecarKey,
                Body: JSON.stringify(sidecar),
                ContentType: 'application/json',
              }));

              const dsJob = await bedrockClient.send(new StartIngestionJobCommand({
                knowledgeBaseId: env.BEDROCK_KB_ID,
                dataSourceId: env.BEDROCK_DS_DERIVED_ID,
              }));

              newJobIds = newJobIds.filter(j => j !== jobId);
              if (dsJob.ingestionJob?.ingestionJobId) {
                newJobIds.push(dsJob.ingestionJob.ingestionJobId);
              }
              allComplete = false; // Newly queued job means not complete
            } else {
              anyFailed = true;
              meeting.errorMessage = 'BDA completed but result.json not found';
            }
          } else if (jobStatus === 'ClientError' || jobStatus === 'ServiceError') {
            anyFailed = true;
            meeting.errorMessage = response.errorMessage || 'BDA processing failed';
          } else {
            allComplete = false; // Still processing
          }
        } else if (env.BEDROCK_KB_ID) {
          // KB Job
          const dataSourcesToTry = [
            env.BEDROCK_DS_DERIVED_ID,
            env.BEDROCK_DS_A_ID,
            env.BEDROCK_DS_B_ID
          ].filter(Boolean) as string[];

          let found = false;
          let jobStatus: string | undefined;

          for (const dsId of dataSourcesToTry) {
            try {
              const response = await bedrockClient.send(new GetIngestionJobCommand({
                knowledgeBaseId: env.BEDROCK_KB_ID,
                dataSourceId: dsId,
                ingestionJobId: jobId,
              }));
              jobStatus = response.ingestionJob?.status;
              found = true;
              break;
            } catch (e: any) {
              continue;
            }
          }

          if (!found) {
            console.warn('Ingestion job not found in any data source for', jobId);
            anyFailed = true;
          } else {
            if (jobStatus === 'FAILED') {
              anyFailed = true;
              meeting.errorMessage = 'KB Ingestion failed for a file';
            } else if (jobStatus !== 'COMPLETE') {
              allComplete = false;
            }
          }
        }
      }

      meeting.jobIds = newJobIds;
      if (anyFailed) {
        meeting.status = 'failed';
      } else if (allComplete) {
        meeting.status = 'ready';
      }
      
      await meeting.save();
    } catch (err) {
      console.error('Failed to get ingestion/BDA job status:', err);
    }
  }

  return meeting;
};
