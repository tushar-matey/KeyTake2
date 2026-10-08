import { z } from 'zod';

export const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr'];
export const MAX_AUDIO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
];
export const ALLOWED_DOC_EXTS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_DOC_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_PDF_PAGES = 20;

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().refine((val) => {
    const isAudio = val.startsWith('audio/') || val === 'video/mp4' || val === 'application/ogg' || !val;
    const isDoc = ALLOWED_DOC_MIMES.includes(val);
    return isAudio || isDoc;
  }, {
    message: 'Invalid file type. Please upload a valid audio or document file.',
  }),
  fileSize: z.number().max(MAX_AUDIO_SIZE_BYTES, 'File size exceeds 500MB limit'),
});
