import { Request, Response } from 'express';
import { createMultipartUpload, completeUpload, writeSidecar } from './service';
import { getMeeting, addMeetingFile, checkHashExists } from '../meetings/service';
import { checkUploadQuota, incrementUploadQuota } from '../quotas/service';
import { presignedUrlRequestSchema, completeUploadSchema, uploadFileSchema } from '@keytake/shared';

export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: meetingId } = req.params;
    
    // Validate request body
    const body = presignedUrlRequestSchema.parse(req.body);
    uploadFileSchema.parse({ fileName: body.fileName, contentType: body.contentType, fileSize: body.fileSize });
    
    // Check meeting ownership
    const meeting = await getMeeting(userId, meetingId);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    
    // Check quota
    const hasQuota = await checkUploadQuota(userId);
    if (!hasQuota) return res.status(429).json({ error: 'Daily upload quota exceeded' });
    
    // Check hash deduplication
    const hashExists = await checkHashExists(body.hash);
    if (hashExists) return res.status(409).json({ error: 'This audio file has already been uploaded' });
    
    // Generate S3 multipart upload presigned URLs
    const result = await createMultipartUpload(userId, meetingId, body.fileName, body.contentType, body.fileSize);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to generate upload URL' });
  }
};

export const finishUpload = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: meetingId } = req.params;
    
    // Validate request body
    const body = completeUploadSchema.parse(req.body);
    
    // Complete multipart upload
    const s3Key = await completeUpload(userId, meetingId, body.fileName, body.uploadId, body.parts);
    
    // Write sidecar
    await writeSidecar(userId, meetingId, body.fileName, 'audio');
    
    // Add file to meeting record and update hash
    const file = {
      originalName: body.fileName,
      s3Key,
      contentType: body.contentType,
      sizeBytes: body.fileSize,
      type: 'audio' as const,
    };
    await addMeetingFile(userId, meetingId, file, body.hash);
    
    // Increment quota usage
    await incrementUploadQuota(userId);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to complete upload' });
  }
};
