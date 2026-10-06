import { S3Event } from 'aws-lambda';
import { config } from './config';
import { parseS3Key } from './utils/s3';
import { getMeeting, updateMeetingStatus } from './utils/mongo';
import { startIngestion } from './utils/bedrock';

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
    
    if (dataSource !== 'data-source-a') {
      console.log(`Skipping unhandled prefix/dataSource: ${dataSource}`);
      continue;
    }

    // 4. IDEMPOTENCY: Check meeting status in Mongo
    const meeting = await getMeeting(meetingId, userId);
    if (!meeting) {
      console.error(`Meeting not found for ${meetingId} and ${userId}`);
      continue;
    }

    if (meeting.status === 'processing' || meeting.status === 'ready') {
      console.log(`Meeting ${meetingId} already processing or ready (status: ${meeting.status}). Skipping.`);
      continue;
    }

    console.log(`Processing meeting: ${meetingId} for user: ${userId}`);

    // 5. Update status to 'processing'
    await updateMeetingStatus(meetingId, userId, 'processing');

    // 6. Determine data source by extension
    //    Audio/PDF -> Data Source A (BDA)
    //    We only process audio/PDF now via Data Source A.
    
    // 7. Start ingestion job
    try {
      const jobId = await startIngestion(config.BEDROCK_KB_ID, config.BEDROCK_DS_A_ID, key);
      console.log(`Ingestion job started for ${meetingId} with Job ID ${jobId}`);
      if (jobId) {
        await updateMeetingStatus(meetingId, userId, 'processing', jobId);
      }
    } catch (err) {
      console.error(`Failed to start ingestion job for ${meetingId}`, err);
      // Let it throw to the DLQ and retry mechanisms
      throw err;
    }
  }
};
