import { z } from 'zod';

export const transcriptSegmentSchema = z.object({
  segmentIndex: z.number(),
  startTimestampMs: z.number(),
  endTimestampMs: z.number(),
  text: z.string(),
  speaker: z.string(),
  channel: z.string().optional(),
});

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

export const summaryResponseSchema = z.object({
  summary: z.string(),
  transcript: z.array(transcriptSegmentSchema),
});

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
