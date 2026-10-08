import mongoose, { Document, Schema } from 'mongoose';
import { Citation, ChatMessage } from '@keytake/shared';

export interface IChatMessage extends Omit<ChatMessage, '_id'>, Document {
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  userId: { type: String, required: true, index: true },
  meetingId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  citations: [{
    file: String,
    speaker: String,
    timestamp: String,
    text: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ userId: 1, meetingId: 1, createdAt: 1 });

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
