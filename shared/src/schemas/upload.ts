import { z } from 'zod';

export const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr'];
export const MAX_AUDIO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().refine((val) => val.startsWith('audio/') || val === 'video/mp4' || val === 'application/ogg' || !val, {
    message: 'Invalid file type. Please upload a valid audio file.',
  }),
  fileSize: z.number().max(MAX_AUDIO_SIZE_BYTES, 'File size exceeds 500MB limit'),
});
