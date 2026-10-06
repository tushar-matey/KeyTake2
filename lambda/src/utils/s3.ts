import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

export const s3Client = new S3Client({ region: config.AWS_REGION });

// Helper to parse the key: data-source-a/users/{userId}/meetings/{meetingId}/{fileName}
export const parseS3Key = (key: string) => {
  const parts = key.split('/');
  // parts = ['data-source-a', 'users', userId, 'meetings', meetingId, fileName]
  if (parts.length < 6) return null;

  const dataSource = parts[0];
  const userId = parts[2];
  const meetingId = parts[4];
  const fileName = parts.slice(5).join('/');
  
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  return { dataSource, userId, meetingId, fileName, ext };
};
