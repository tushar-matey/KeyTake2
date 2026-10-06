import { z } from 'zod';

export const meetingStatusSchema = z.enum(['uploaded', 'processing', 'ready', 'failed']);

export const fileSchema = z.object({
  originalName: z.string(),
  s3Key: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  type: z.enum(['audio', 'memo', 'doc']),
});

export const meetingResponseSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  title: z.string(),
  status: meetingStatusSchema,
  files: z.array(fileSchema),
  audioHash: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
});

export const presignedUrlRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z.number().positive(),
  hash: z.string(),
});

export const presignedUrlResponseSchema = z.object({
  uploadId: z.string().optional(),
  presignedUrl: z.string().optional(),
  parts: z.array(z.object({
    PartNumber: z.number(),
    Url: z.string(),
  })).optional(),
});

export const completeUploadSchema = z.object({
  uploadId: z.string(),
  parts: z.array(z.object({
    PartNumber: z.number(),
    ETag: z.string(),
  })),
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z.number(),
  hash: z.string(),
});

export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type Meeting = z.infer<typeof meetingResponseSchema>;
