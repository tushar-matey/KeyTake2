import { z } from 'zod';

export const citationSchema = z.object({
  file: z.string().optional(),
  speaker: z.string().optional(),
  timestamp: z.string().optional(),
  text: z.string().optional(),
});

export const chatMessageSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  meetingId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  citations: z.array(citationSchema).optional(),
  createdAt: z.string().or(z.date()).optional(),
});

export type Citation = z.infer<typeof citationSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatRequestSchema = z.object({
  message: z.string().min(1),
});

// SSE event types we will send
export type SSEEvent = 
  | { type: 'token'; text: string }
  | { type: 'citation'; data: Citation }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };
