import { z } from 'zod';
import { meetingStatusSchema } from '../schemas';

export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
