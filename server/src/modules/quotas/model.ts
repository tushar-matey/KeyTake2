import { Schema, model } from 'mongoose';

export interface IQuota {
  userId: string;
  date: string; // YYYY-MM-DD
  uploadCount: number;
  chatRequestCount: number;
  tokenCount: number;
}

const quotaSchema = new Schema<IQuota>({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  uploadCount: { type: Number, default: 0 },
  chatRequestCount: { type: Number, default: 0 },
  tokenCount: { type: Number, default: 0 },
});

// Compound index to quickly find a user's quota for a specific day
quotaSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Quota = model<IQuota>('Quota', quotaSchema);
