import { z } from 'zod';

export const meetingStatusSchema = z.enum(["uploaded", "processing", "ready", "failed"]);
