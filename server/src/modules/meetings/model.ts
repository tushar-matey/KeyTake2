import { Schema, model } from 'mongoose';

export interface IMeetingFile {
  originalName: string;
  s3Key: string;
  contentType: string;
  sizeBytes: number;
  type: 'audio' | 'memo' | 'doc';
}

export interface IMeeting {
  userId: string;
  title: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  files: IMeetingFile[];
  audioHash?: string;
  ingestionJobId?: string;
  errorMessage?: string;
  summary?: string;
  transcript?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, maxlength: 200 },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'failed'],
    default: 'uploaded',
  },
  files: [{
    originalName: String,
    s3Key: String,
    contentType: String,
    sizeBytes: Number,
    type: { type: String, enum: ['audio', 'memo', 'doc'] },
  }],
  audioHash: { type: String, index: true },
  ingestionJobId: String,
  errorMessage: String,
  summary: { type: String },
  transcript: [{
    segmentIndex: Number,
    startTimestampMs: Number,
    endTimestampMs: Number,
    text: String,
    speaker: String,
    channel: String,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

meetingSchema.index({ userId: 1, createdAt: -1 });
meetingSchema.index({ userId: 1, _id: 1 });

export const Meeting = model<IMeeting>('Meeting', meetingSchema);
