import { z } from 'zod';

export const ALLOWED_AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/ogg', 'audio/amr'];
export const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr'];
export const MAX_AUDIO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().refine((val) => ALLOWED_AUDIO_MIMES.includes(val), {
    message: 'Invalid file type. Only audio files are allowed in this phase.',
  }),
  fileSize: z.number().max(MAX_AUDIO_SIZE_BYTES, 'File size exceeds 500MB limit'),
});
