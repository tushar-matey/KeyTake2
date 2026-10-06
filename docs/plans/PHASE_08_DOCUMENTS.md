# Phase 8 — Documents Support

## Goal and Scope
Add support for uploading PDF, DOCX, TXT, and MD files alongside audio. PDF goes through data source A (BDA parser). DOCX, TXT, MD go through data source B (default parser). Update the ingestion Lambda to route files by extension. Update the UI for multi-file attachment.

## Out of Scope
- Changing the audio pipeline (already works from Phase 4).
- Images, video, or other file types.

## Prerequisites
- Phase 4 complete (Lambda, data source A working).
- `docs/AWS_SETUP.md` Section 7 updated: data source B added to the Knowledge Base.
- `BEDROCK_DS_B_ID` set in `lambda/.env`.

## Files to Create or Modify

### `shared/`
| File | Purpose |
|---|---|
| `src/schemas/upload.ts` | Update: add `ALLOWED_DOC_TYPES`, `ALLOWED_DOC_EXTS`, `MAX_DOC_SIZE_BYTES`, `MAX_PDF_PAGES` |

### `server/`
| File | Purpose |
|---|---|
| `src/modules/upload/service.ts` | Update: handle document uploads, validate MIME types for docs, write sidecars with `type: "memo"` or `type: "doc"` |

### `lambda/`
| File | Purpose |
|---|---|
| `src/handler.ts` | Update: route by extension to correct data source (A for audio/PDF, B for DOCX/TXT/MD) |
| `src/config.ts` | Update: add `BEDROCK_DS_B_ID` |

### `client/`
| File | Purpose |
|---|---|
| `src/features/meetings/components/NewMeetingForm.tsx` | Update: allow multiple file types, separate audio and document sections |
| `src/features/meetings/components/FileDropzone.tsx` | Update: accept document types too |
| `src/features/meetings/components/FilesList.tsx` | New: display uploaded files on meeting detail page |
| `src/pages/MeetingDetailPage.tsx` | Update: Files tab shows uploaded documents |

## Key Interfaces

### File Type Routing in Lambda
```typescript
// lambda/src/handler.ts — updated routing logic
function getDataSourceId(ext: string): string {
  const dsAExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.amr', '.pdf'];
  const dsBExtensions = ['.docx', '.txt', '.md'];

  if (dsAExtensions.includes(ext.toLowerCase())) return config.BEDROCK_DS_A_ID;
  if (dsBExtensions.includes(ext.toLowerCase())) return config.BEDROCK_DS_B_ID;
  throw new Error(`Unsupported file extension: ${ext}`);
}
```

### S3 Event Notification Update
```
Add suffix filters for document types:
  - .pdf   (already added in Phase 4)
  - .docx
  - .txt
  - .md

STILL exclude: .metadata.json, .json
```

### Document Validation
```typescript
const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
];
const ALLOWED_DOC_EXTS = ['.pdf', '.docx', '.txt', '.md'];
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_PDF_PAGES = 20; // BDA console limit
```

### Sidecar Types
```typescript
// For PDFs (parsed by BDA via data source A):
{ metadataAttributes: { userId, meetingId, type: 'memo' } }

// For DOCX/TXT/MD (parsed by default parser via data source B):
{ metadataAttributes: { userId, meetingId, type: 'doc' } }
```

### Batch Ingestion Logic
```typescript
// When multiple files are uploaded for one meeting:
// 1. All uploads complete (presigned URLs + multipart)
// 2. Server writes all sidecars
// 3. S3 events trigger Lambda for each file
// 4. Lambda starts ONE ingestion job per data source
//    (idempotency check: skip if already processing)
// 5. Both data sources may run ingestion concurrently
```

## Step-by-Step Implementation Order

1. Update shared upload schemas with document types.
2. Update upload service to handle document MIME types and sidecars.
3. Update Lambda handler with file extension routing to data source A or B.
4. Update Lambda config with `BEDROCK_DS_B_ID`.
5. Update S3 event notification to include `.docx`, `.txt`, `.md` suffixes.
6. Update `FileDropzone` to accept document file types.
7. Update `NewMeetingForm` for multi-file upload (audio + documents).
8. Create `FilesList` component for the meeting detail Files tab.
9. Rebuild and deploy Lambda.
10. Test end to end: upload audio + PDF + DOCX, verify all are ingested.

## Isolation Guardrails
> - Sidecars always include `userId` and `meetingId`.
> - Document uploads use the same presigned URL security (one key, 5-min expiry, content-type).
> - Retrieval filter (in chat) applies to all content regardless of source.

## Cost Guardrails
> - Max 50 MB per document file. Max 20 pages for PDFs.
> - Documents are secondary — do not complicate the audio pipeline.
> - Two data sources must never ingest the same files (enforced by extension routing).
> - Batch: one ingestion job per data source, idempotent.

## Acceptance Criteria
- [ ] User can upload PDF, DOCX, TXT, MD files alongside audio.
- [ ] Lambda routes PDF to data source A (BDA), DOCX/TXT/MD to data source B (default).
- [ ] Two data sources never ingest the same file.
- [ ] Sidecars are written correctly for each document type.
- [ ] Documents are ingested into the Knowledge Base.
- [ ] Chat can answer questions about document content with citations.
- [ ] File validation rejects unsupported types and oversized files.
- [ ] Files tab on meeting detail shows uploaded documents.

## Tests to Write
- `lambda/src/handler.test.ts` — update: test routing by extension (PDF→A, DOCX→B, etc.).
- `shared/src/schemas/upload.test.ts` — update: validate document types.

## Manual Verification
1. Upload audio + PDF + DOCX for one meeting.
2. Wait for `ready` status.
3. In chat, ask about content from the PDF → get answer with citation.
4. In chat, ask about content from the DOCX → get answer with citation.
5. Check CloudWatch: Lambda invoked once per file, not recursively.
6. Check KB console: both data sources show ingested files.

## Common Pitfalls
- Adding `.txt` suffix filter may match other `.txt` files in the bucket — the `users/` prefix filter prevents this.
- DOCX MIME type is long (`application/vnd.openxmlformats-...`) — ensure exact match.
- PDF page count validation requires reading the file — consider doing this server-side before presigning.
- Data source B must be configured with different inclusion filters than A to avoid overlap.

## Suggested Model Tier
Any capable model (Lambda routing logic is straightforward).

## Definition of Done
All acceptance criteria pass. Commit message: `feat: add document upload support with data source B routing and multi-file UI`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 7: add data source B to Knowledge Base.
- Section 9: update Lambda env vars with `BEDROCK_DS_B_ID`, update S3 event suffix filters.
