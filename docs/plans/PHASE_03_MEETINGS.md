# Phase 3 — Audio Meetings Module

## Goal and Scope
Build the meetings CRUD module scoped by `userId`, implement direct browser upload to S3 via multipart presigned URLs with progress tracking, file validation, server-side hash deduplication, and backend-written metadata sidecars.

## Out of Scope
- Ingestion/processing (Phase 4), summary (Phase 5), chat (Phase 6).
- Document uploads — PDF, DOCX, TXT, MD (Phase 8). Only audio files in this phase.
- Meeting detail page UI beyond a basic list (Phase 7).

## Prerequisites
- Phase 2 complete.
- `docs/AWS_SETUP.md` Section 3 (S3 buckets) complete: raw bucket created with CORS, Block Public Access, lifecycle rules.
- `S3_RAW_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` set in `server/.env`.

## Files to Create or Modify

### `shared/`
| File | Purpose |
|---|---|
| `src/schemas/meeting.ts` | Full meeting schema: `createMeetingSchema`, `meetingResponseSchema`, `presignedUrlRequestSchema`, `presignedUrlResponseSchema`, `completeUploadSchema` |
| `src/schemas/upload.ts` | `uploadFileSchema` (name, size, type validation), `ALLOWED_AUDIO_TYPES`, `MAX_AUDIO_SIZE_BYTES` |

### `server/`
| File | Purpose |
|---|---|
| `src/modules/meetings/model.ts` | Mongoose `Meeting` model with userId, title, status, files[], audioHash, indexes |
| `src/modules/meetings/routes.ts` | Meeting CRUD + upload routes |
| `src/modules/meetings/controller.ts` | Request handlers |
| `src/modules/meetings/service.ts` | Business logic: create, list, get, delete, hash check |
| `src/modules/upload/routes.ts` | Presigned URL routes |
| `src/modules/upload/controller.ts` | Request handlers |
| `src/modules/upload/service.ts` | S3 presigned URL generation (single and multipart), sidecar writing, hash dedupe |
| `src/modules/quotas/model.ts` | Mongoose `Quota` model for daily upload limits |
| `src/modules/quotas/service.ts` | Check and increment daily upload count |
| `src/config/aws.ts` | S3 client setup |

### `client/`
| File | Purpose |
|---|---|
| `src/features/meetings/api.ts` | TanStack Query hooks: `useCreateMeeting`, `useMeetings`, `useMeeting` |
| `src/features/meetings/hooks/useFileUpload.ts` | Multipart upload with progress using presigned URLs |
| `src/features/meetings/components/MeetingsList.tsx` | List of meetings with status badges |
| `src/features/meetings/components/NewMeetingForm.tsx` | Title + audio file upload with drag-and-drop, progress bar, validation |
| `src/features/meetings/components/FileDropzone.tsx` | Drag-and-drop zone with file type/size validation |
| `src/pages/MeetingsPage.tsx` | Meetings list page |
| `src/pages/NewMeetingPage.tsx` | New meeting page |

## Key Interfaces

### Meeting Model
```typescript
const meetingSchema = new Schema({
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
  audioHash: { type: String, index: true }, // SHA-256 of audio content
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
meetingSchema.index({ userId: 1, createdAt: -1 });
meetingSchema.index({ userId: 1, _id: 1 });
```

### API Routes
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/meetings` | Yes | `{ title }` | `{ meetingId, title, status }` |
| `GET` | `/api/meetings` | Yes | — | `[{ meetingId, title, status, createdAt }]` |
| `GET` | `/api/meetings/:id` | Yes | — | Full meeting object |
| `DELETE` | `/api/meetings/:id` | Yes | — | `{ success: true }` |
| `POST` | `/api/meetings/:id/upload-url` | Yes | `{ fileName, contentType, fileSize, hash }` | `{ uploadId?, presignedUrl?, parts? }` |
| `POST` | `/api/meetings/:id/complete-upload` | Yes | `{ uploadId, parts, fileName, contentType, fileSize }` | `{ success: true }` |

### Upload Flow (Multipart)
```
1. Client: POST /api/meetings/:id/upload-url
   → Server validates file type/size, checks hash for duplicates
   → Server creates multipart upload, returns presigned URLs for each part

2. Client: uploads each part directly to S3 using presigned URLs
   → Tracks progress (bytes uploaded / total)

3. Client: POST /api/meetings/:id/complete-upload
   → Server completes multipart upload
   → Server writes .metadata.json sidecar to S3
   → Server updates meeting.files[] in Mongo
   → Meeting status stays "uploaded" until Lambda processes it
```

### Sidecar Writing (Server-Side Only)
```typescript
// After upload completes, server writes:
// s3://raw-bucket/data-source-a/users/{userId}/meetings/{meetingId}/audio.mp3.metadata.json
const sidecar = {
  metadataAttributes: {
    userId: req.user.userId,
    meetingId: meetingId,
    type: 'audio',
  },
};
await s3.putObject({ Bucket: rawBucket, Key: sidecarKey, Body: JSON.stringify(sidecar) });
```

### File Validation
```typescript
const ALLOWED_AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/ogg', 'audio/amr'];
const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr'];
const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500 MB (conservative within BDA's 2048 MB max)
const MAX_UPLOADS_PER_DAY = 5; // configurable
```

## Step-by-Step Implementation Order

1. Create shared meeting and upload schemas.
2. Create `server/src/config/aws.ts` — S3 client.
3. Create `Quota` model and service.
4. Create `Meeting` model with indexes.
5. Create meeting service (CRUD, hash check, all queries include `userId`).
6. Create upload service (presigned URL generation, multipart, sidecar writing).
7. Create meeting routes and controller.
8. Create upload routes and controller.
9. Register routes in `app.ts`.
10. Create client `useFileUpload` hook with multipart upload and progress.
11. Create `FileDropzone` component with drag-and-drop and validation.
12. Create `NewMeetingForm` with file selection and upload progress.
13. Create `MeetingsList` component.
14. Create pages and add routes.

## Isolation Guardrails (from 00_PROJECT_CONTEXT.md Section 7)
> - `userId` always from verified JWT. Every Mongo query includes `userId`.
> - Return 404 on ownership mismatch: `findOne({ _id: meetingId, userId })`.
> - Presigned URLs for one exact key, expire in 5 minutes, content-type restriction.
> - Presign only audio/document keys, never the sidecar.

## Cost Guardrails (from 00_PROJECT_CONTEXT.md Section 9)
> - Enforce server-side limits: max 500 MB per file, allowed MIME types, max 5 uploads/day.
> - Reject duplicates (SHA-256 hash check).
> - Abort incomplete multipart uploads via lifecycle rule (1 day).

## Acceptance Criteria
- [ ] User can create a meeting with a title.
- [ ] User can upload an audio file with drag-and-drop and see progress.
- [ ] Upload rejects files with wrong MIME type or exceeding size limit.
- [ ] Duplicate audio (same hash) is rejected with a clear message.
- [ ] Daily upload quota is enforced.
- [ ] Presigned URLs expire in 5 minutes and include content-type restriction.
- [ ] `.metadata.json` sidecar is written to S3 after upload completes.
- [ ] Sidecar is written by the server, never by the browser.
- [ ] Meeting appears in the meetings list with status `uploaded`.
- [ ] User A cannot see or access User B's meetings (404, not 403).
- [ ] User can delete a meeting (removes S3 files too — basic delete for now).

## Tests to Write
- `server/src/modules/meetings/service.test.ts` — CRUD with userId scoping, 404 on wrong user.
- `server/src/modules/upload/service.test.ts` — presigned URL generation, hash dedup logic.
- `server/src/modules/quotas/service.test.ts` — quota check and increment.
- `shared/src/schemas/upload.test.ts` — file validation schema tests.

## Manual Verification
1. Create a meeting, upload an audio file, see progress bar.
2. Check S3: file exists at `data-source-a/users/{userId}/meetings/{meetingId}/audio.mp3`.
3. Check S3: sidecar exists at `data-source-a/users/{userId}/meetings/{meetingId}/audio.mp3.metadata.json`.
4. Try uploading a `.exe` file → rejected.
5. Try uploading the same audio again → duplicate rejected.
6. Sign in as different user → cannot see first user's meetings.

## Common Pitfalls
- S3 CORS not configured for the frontend origin → upload fails.
- Multipart upload part numbers are 1-indexed, not 0-indexed.
- Forgetting to complete the multipart upload → parts stay in S3 forever (lifecycle rule handles).
- Content-Type mismatch between presigned URL and actual upload → 403 from S3.
- SHA-256 hash should be computed on the client and sent to the server for dedup check.

## Suggested Model Tier
Any capable model.

## Definition of Done
All acceptance criteria pass. Commit message: `feat: meetings CRUD with multipart S3 upload, hash dedup, and metadata sidecars`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 3 (S3): raw uploads bucket with CORS and lifecycle rules.
