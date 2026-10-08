import { s3 } from '../../config/aws';
import { env } from '../../config/env';
import { 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  PutObjectCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_EXPIRY = 5 * 60; // 5 minutes

const getDataSourcePrefix = (fileName: string): string => {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  const dsAExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr', '.pdf'];
  const dsBExtensions = ['.docx', '.txt', '.md'];

  if (dsAExtensions.includes(ext)) return 'data-source-a';
  if (dsBExtensions.includes(ext)) return 'data-source-b';
  throw new Error(`Unsupported file extension: ${ext}`);
};

export const createMultipartUpload = async (userId: string, meetingId: string, fileName: string, contentType: string, fileSize: number) => {
  const dsPrefix = getDataSourcePrefix(fileName);
  const s3Key = `${dsPrefix}/users/${userId}/meetings/${meetingId}/${fileName}`;
  
  const command = new CreateMultipartUploadCommand({
    Bucket: env.S3_RAW_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });
  
  const response = await s3.send(command);
  const uploadId = response.UploadId!;
  
  // Calculate parts
  const partSize = 5 * 1024 * 1024; // 5MB per part
  const numParts = Math.ceil(fileSize / partSize);
  const parts = [];
  
  for (let i = 1; i <= numParts; i++) {
    const partCommand = new UploadPartCommand({
      Bucket: env.S3_RAW_BUCKET,
      Key: s3Key,
      UploadId: uploadId,
      PartNumber: i,
    });
    const url = await getSignedUrl(s3, partCommand, { expiresIn: UPLOAD_EXPIRY });
    parts.push({ PartNumber: i, Url: url });
  }
  
  return { uploadId, parts, s3Key };
};

export const completeUpload = async (userId: string, meetingId: string, fileName: string, uploadId: string, parts: { PartNumber: number, ETag: string }[]) => {
  const dsPrefix = getDataSourcePrefix(fileName);
  const s3Key = `${dsPrefix}/users/${userId}/meetings/${meetingId}/${fileName}`;
  
  const command = new CompleteMultipartUploadCommand({
    Bucket: env.S3_RAW_BUCKET,
    Key: s3Key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  
  await s3.send(command);
  return s3Key;
};

export const writeSidecar = async (userId: string, meetingId: string, fileName: string, type: string) => {
  const dsPrefix = getDataSourcePrefix(fileName);
  const sidecarKey = `${dsPrefix}/users/${userId}/meetings/${meetingId}/${fileName}.metadata.json`;
  
  const sidecar = {
    metadataAttributes: {
      userId,
      meetingId,
      type,
    },
  };
  
  const command = new PutObjectCommand({
    Bucket: env.S3_RAW_BUCKET,
    Key: sidecarKey,
    Body: JSON.stringify(sidecar),
    ContentType: 'application/json',
  });
  
  await s3.send(command);
};
