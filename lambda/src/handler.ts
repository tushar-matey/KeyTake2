import { S3Event } from 'aws-lambda';
import { config } from './config';
import { parseS3Key } from './utils/s3';
import { getMeeting, updateMeetingStatus } from './utils/mongo';
import { startIngestion, startDataAutomation } from './utils/bedrock';
import { ALLOWED_AUDIO_EXTS } from '@keytake/shared';

function getDataSourceId(ext: string): string {
  const dsAExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr', '.pdf'];
  const dsBExtensions = ['.docx', '.txt', '.md'];

  if (dsAExtensions.includes(ext.toLowerCase())) return config.BEDROCK_DS_A_ID;
  if (dsBExtensions.includes(ext.toLowerCase())) return config.BEDROCK_DS_B_ID;
  throw new Error(`Unsupported file extension: ${ext}`);
}

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // 1. SAFETY: Verify this is the raw bucket, not derived
    if (bucket !== config.S3_RAW_BUCKET) {
      console.log(`Skipping event from derived/other bucket: ${bucket}`);
      continue;
    }

    // 2. SAFETY: Skip .metadata.json files (prevent loops)
    if (key.endsWith('.metadata.json')) {
      console.log(`Skipping sidecar file: ${key}`);
      continue;
    }

    // 3. Parse userId and meetingId from key
    const parsedInfo = parseS3Key(key);
    if (!parsedInfo) {
      console.error(`Invalid S3 key format: ${key}`);
      continue;
    }

    const { dataSource, userId, meetingId, ext } = parsedInfo;
    
    // 4. IDEMPOTENCY: Check meeting status in Mongo
    const meeting = await getMeeting(meetingId, userId);
    if (!meeting) {
      console.error(`Meeting not found for ${meetingId} and ${userId}`);
      continue;
    }

    console.log(`Processing meeting: ${meetingId} for user: ${userId}`);

    // 5. Update status to 'processing'
    await updateMeetingStatus(meetingId, userId, 'processing');

    // 5. Determine data source by extension
    const isAudio = ALLOWED_AUDIO_EXTS.includes(`.${ext.toLowerCase()}` as any);
    const dsId = getDataSourceId(`.${ext}`);
    
    // 6. Start ingestion job or BDA depending on type
    try {
      if (isAudio) {
        const inputS3Uri = `s3://${bucket}/${key}`;
        const invocationArn = await startDataAutomation(inputS3Uri, meetingId);
        console.log(`BDA job started for ${meetingId} with Invocation ARN ${invocationArn}`);
        if (invocationArn) {
          // We store the invocation ARN instead of KB job ID
          await updateMeetingStatus(meetingId, userId, 'processing', invocationArn);
        }
      } else {
        const jobId = await startIngestion(config.BEDROCK_KB_ID, dsId, key);
        console.log(`Ingestion job started for DS ${dsId} and meeting ${meetingId} with Job ID ${jobId}`);
        if (jobId) {
          await updateMeetingStatus(meetingId, userId, 'processing', jobId);
        }
      }
    } catch (err: any) {
      if (err.name === 'ConflictException' && err.message.includes('A sync job is already running')) {
        console.log(`Sync job already running for DS ${dsId}. Skipping.`);
      } else {
        console.error(`Failed to start processing job for ${meetingId}`, err);
        throw err;
      }
    }
  }
};
