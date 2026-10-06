# Phase 4 — Knowledge Base & Audio Ingestion

> ⚠️ **Needs strong-model review** for Lambda loop protection and ingestion pipeline safety.

## Goal and Scope
Set up the Bedrock Knowledge Base with data source A (BDA parser for audio/PDF), S3 Vectors, Titan Text Embeddings V2, and the ingestion Lambda. After this phase, uploading an audio file triggers automated transcription with speaker diarization, ingestion into the knowledge base, and status updates in MongoDB.

## Out of Scope
- Data source B for DOCX/TXT/MD (Phase 8).
- Summary generation (Phase 5), chat (Phase 6).
- Frontend status polling UI (Phase 7 — this phase uses a basic check).

## Prerequisites
- Phase 3 complete.
- `docs/AWS_SETUP.md` Sections 3 (S3), 5 (S3 Vectors), 6 (BDA project), 7 (Knowledge Base with data source A), 8 (IAM roles), 9 (Lambda) complete.
- All Lambda and KB env vars set (see below).

## Env Vars Needed
| Var | Where | Source |
|---|---|---|
| `BEDROCK_KB_ID` | server + lambda | KB console |
| `BEDROCK_DS_A_ID` | lambda | KB data source console |
| `BDA_PROJECT_ARN` | lambda | BDA console |
| `S3_RAW_BUCKET` | lambda | S3 console |
| `S3_DERIVED_BUCKET` | lambda | S3 console |
| `AWS_REGION` | lambda | Your region |
| `MONGODB_URI` | lambda | Connection string |

## Files to Create or Modify

### `lambda/`
| File | Purpose |
|---|---|
| `src/handler.ts` | S3 event handler: validate event, check idempotency, start ingestion |
| `src/utils/s3.ts` | S3 helpers (read sidecar, check file exists) |
| `src/utils/bedrock.ts` | Start ingestion job helper |
| `src/utils/mongo.ts` | Lightweight Mongo client for status updates |
| `src/config.ts` | Zod-validated env vars for Lambda |
| `build.sh` | Build script: compile TS, bundle, zip for Lambda upload |
| `package.json` | Update: add build script, `@aws-sdk/client-bedrock-agent`, `@aws-sdk/client-s3`, `mongodb` |

### `server/`
| File | Purpose |
|---|---|
| `src/modules/meetings/service.ts` | Update: add `updateStatus` method, add `getStatus` route |
| `src/modules/meetings/routes.ts` | Update: add `GET /api/meetings/:id/status` |

## Key Interfaces

### Lambda Handler
```typescript
// lambda/src/handler.ts
import { S3Event } from 'aws-lambda';

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // 1. SAFETY: Verify this is the raw bucket, not derived
    if (bucket !== config.S3_RAW_BUCKET) return;

    // 2. SAFETY: Skip .metadata.json files (prevent loops)
    if (key.endsWith('.metadata.json')) return;

    // 3. Parse userId and meetingId from key
    //    key format: users/{userId}/meetings/{meetingId}/filename.ext
    const { userId, meetingId, fileName, ext } = parseS3Key(key);

    // 4. IDEMPOTENCY: Check meeting status in Mongo
    //    Skip if already 'processing' or 'ready'
    const meeting = await getMeeting(meetingId, userId);
    if (!meeting || ['processing', 'ready'].includes(meeting.status)) return;

    // 5. Update status to 'processing'
    await updateMeetingStatus(meetingId, userId, 'processing');

    // 6. Determine data source by extension
    //    Audio/PDF → Data Source A (BDA)
    //    DOCX/TXT/MD → Data Source B (default) — Phase 8
    const dataSourceId = getDataSourceId(ext);

    // 7. Start ingestion job
    //    Use IngestKnowledgeBaseDocuments for single-file ingestion
    //    (preferred over StartIngestionJob for targeted ingestion)
    await startIngestion(config.BEDROCK_KB_ID, dataSourceId, key);
  }
};
```

### S3 Event Filter Configuration (Critical for Loop Prevention)
```
S3 Event Notification on raw bucket:
  Event types: s3:ObjectCreated:*
  Prefix filter: users/
  Suffix filters (one notification per suffix):
    - .mp3
    - .wav
    - .flac
    - .m4a
    - .ogg
    - .amr
    - .pdf

  DO NOT add: .metadata.json, .json, or any other suffix
  DO NOT add notifications on the derived bucket
```

### Ingestion API Call
```typescript
// Using @aws-sdk/client-bedrock-agent
import { BedrockAgentClient, StartIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';

const startIngestion = async (kbId: string, dsId: string, s3Key: string) => {
  const client = new BedrockAgentClient({ region: config.AWS_REGION });
  // Option A: StartIngestionJob (syncs entire data source)
  // Option B: IngestKnowledgeBaseDocuments (single file, if available — VERIFY)
  await client.send(new StartIngestionJobCommand({
    knowledgeBaseId: kbId,
    dataSourceId: dsId,
  }));
};
```

### Status Update Route
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/meetings/:id/status` | Yes | `{ status, errorMessage? }` |

### EventBridge Rule (for status updates)
```json
{
  "source": ["aws.bedrock"],
  "detail-type": ["Knowledge Base Ingestion Job State Change"],
  "detail": {
    "knowledgeBaseId": ["YOUR_KB_ID"]
  }
}
```
This rule triggers a second Lambda (or the same one with a different handler) that updates meeting status in Mongo to `ready` or `failed`.

## Step-by-Step Implementation Order

1. Create `lambda/src/config.ts` — zod-validated Lambda env vars.
2. Create `lambda/src/utils/s3.ts` — S3 helpers.
3. Create `lambda/src/utils/mongo.ts` — lightweight Mongo client (connect/disconnect per invocation or connection pooling with caching).
4. Create `lambda/src/utils/bedrock.ts` — ingestion helpers.
5. Create `lambda/src/handler.ts` — main handler with all safety checks.
6. Create `lambda/build.sh` — compile, bundle, and zip.
7. Add `GET /api/meetings/:id/status` route to server.
8. Deploy Lambda via console (see AWS_SETUP.md Section 9).
9. Configure S3 event notification with exact filters.
10. Test with one sample audio file.

## Isolation Guardrails
> - The Lambda reads `userId` and `meetingId` from the S3 key path, never from event metadata.
> - Status updates in Mongo always include `userId` in the query.

## Cost Guardrails (CRITICAL — from 00_PROJECT_CONTEXT.md Section 9.1)
> **Lambda and Event Loops:**
> - The ingestion Lambda must NEVER write to a location that triggers its own S3 event.
> - Sidecar `.metadata.json` files are written by the server in Phase 3, NOT by the Lambda.
> - S3 event notifications scoped by prefix (`users/`) and suffix (audio/PDF extensions only).
> - `.metadata.json` and the derived bucket are explicitly excluded from triggers.
> - Raw uploads and derived output in separate buckets.
> - Reserved concurrency: 2–5.
> - DLQ configured.
> - Max retry attempts: 0–2.
> - Handler is idempotent: skips if meeting is `processing` or `ready`.
> - Timeout: 60 seconds, memory: 256 MB.
> - Lambda never invokes itself or waits in a loop.
>
> **Bedrock:**
> - Do not re-ingest unchanged files. Prefer single-document ingestion.
> - One ingestion job per data source at a time.

## Acceptance Criteria
- [ ] Lambda deploys and has correct env vars, timeout, memory, reserved concurrency, DLQ.
- [ ] S3 event notification is configured with correct prefix/suffix filters.
- [ ] Uploading an audio file triggers the Lambda exactly once (verify in CloudWatch).
- [ ] Lambda updates meeting status to `processing`.
- [ ] Ingestion job starts successfully.
- [ ] After ingestion completes, meeting status updates to `ready` (via EventBridge or polling).
- [ ] `GET /api/meetings/:id/status` returns current status.
- [ ] Lambda skips `.metadata.json` files (no infinite loop).
- [ ] Lambda skips meetings already in `processing` or `ready` status.
- [ ] Lambda errors go to the DLQ.
- [ ] BDA transcript includes speaker labels (`spk_0`, `spk_1`) and timestamps.

## Tests to Write
- `lambda/src/handler.test.ts` — test with mock S3 events:
  - Valid audio file → starts ingestion.
  - `.metadata.json` file → skips.
  - Meeting already `processing` → skips.
  - Meeting already `ready` → skips.
  - Derived bucket event → skips.
- `server/src/modules/meetings/service.test.ts` — test `updateStatus`.

## Manual Verification
1. Upload an audio file through the app.
2. Check CloudWatch: Lambda invoked exactly once.
3. Check Mongo: meeting status is `processing`, then `ready`.
4. Check Bedrock KB console: "Test knowledge base" query returns content from the audio.
5. Verify BDA output in derived bucket has speaker labels and timestamps.
6. Upload a `.metadata.json` file manually → Lambda should NOT trigger (or should skip).
7. Check DLQ: should be empty (no errors).

## Common Pitfalls
- **CRITICAL**: Adding `.json` or `.*` as a suffix filter will trigger on `.metadata.json` → infinite loop.
- Lambda timeout too short for Mongo connection setup — use 60s.
- Forgetting to grant Lambda permission to be invoked by S3.
- BDA project not configured with speaker diarization enabled.
- `IngestKnowledgeBaseDocuments` may not be available in all regions — fall back to `StartIngestionJob`.
- Mongo connection pooling: in Lambda, cache the connection across warm invocations.

## Suggested Model Tier
**Needs a strong model or strong-model review** — Lambda loop protection is safety-critical.

## Definition of Done
All acceptance criteria pass. Commit message: `feat: add ingestion Lambda with BDA, KB data source A, and loop protections`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 5 (S3 Vectors)
- Section 6 (BDA project with diarization)
- Section 7 (Knowledge Base with data source A)
- Section 8 (IAM: KB service role, Lambda execution role)
- Section 9 (Lambda deployment, event notification)
- Section 10 (EventBridge rule, if used)
