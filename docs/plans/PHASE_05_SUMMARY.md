# Phase 5 — Summary Service

## Goal and Scope
Generate a meeting summary using Claude Sonnet via the Bedrock Converse API, using the BDA transcript output. Cache the summary in MongoDB. Display the transcript with speakers and timestamps on the meeting detail page.

## Out of Scope
- Chat (Phase 6), documents (Phase 8), frontend polish (Phase 7).
- Re-summarization (for now, summary is generated once).

## Prerequisites
- Phase 4 complete. At least one meeting with status `ready` and a BDA transcript in the derived bucket.
- `BEDROCK_MODEL_ID` set in `server/.env` (e.g., `anthropic.claude-sonnet-4-20250514-v1:0`).
- Bedrock model access enabled for Claude Sonnet (AWS_SETUP.md Section 2).

## Files to Create or Modify

### `server/`
| File | Purpose |
|---|---|
| `src/modules/summary/routes.ts` | `GET /api/meetings/:id/summary`, `POST /api/meetings/:id/summary` (trigger) |
| `src/modules/summary/controller.ts` | Request handlers |
| `src/modules/summary/service.ts` | Fetch BDA output, call Claude Converse, save summary |
| `src/modules/meetings/model.ts` | Update: add `summary` and `transcript` fields |
| `src/config/bedrock.ts` | Bedrock Runtime client setup |

### `shared/`
| File | Purpose |
|---|---|
| `src/schemas/summary.ts` | `summaryResponseSchema`, `transcriptSegmentSchema` |

### `client/`
| File | Purpose |
|---|---|
| `src/features/meetings/api.ts` | Update: add `useMeetingSummary` query hook |
| `src/features/meetings/components/SummaryPanel.tsx` | Renders the meeting summary |
| `src/features/meetings/components/TranscriptView.tsx` | Renders transcript with speakers and timestamps |
| `src/pages/MeetingDetailPage.tsx` | Basic meeting detail page with summary and transcript |

## Key Interfaces

### Summary Service
```typescript
// server/src/modules/summary/service.ts
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

export async function generateSummary(meetingId: string, userId: string): Promise<string> {
  // 1. Check if summary already cached in Mongo → return it
  const meeting = await Meeting.findOne({ _id: meetingId, userId });
  if (!meeting) throw new NotFoundError();
  if (meeting.summary) return meeting.summary;

  // 2. Fetch BDA transcript output from derived bucket
  const transcript = await fetchBDATranscript(meetingId);

  // 3. Call Claude Sonnet via Converse API
  const client = new BedrockRuntimeClient({ region: env.AWS_REGION });
  const response = await client.send(new ConverseCommand({
    modelId: env.BEDROCK_MODEL_ID,
    messages: [{
      role: 'user',
      content: [{ text: buildSummaryPrompt(transcript) }],
    }],
    inferenceConfig: {
      maxTokens: 4096,    // MANDATORY: set max_tokens
      temperature: 0.3,
    },
  }));

  // 4. Extract summary text
  const summary = response.output?.message?.content?.[0]?.text ?? '';

  // 5. Cache in Mongo
  await Meeting.updateOne(
    { _id: meetingId, userId },
    { summary, transcript: parseTranscriptSegments(transcript) }
  );

  return summary;
}
```

### Summary Prompt
```typescript
function buildSummaryPrompt(transcript: string): string {
  return `You are a meeting summarizer. Given the transcript below, produce a structured summary with:
1. **Meeting Overview** (2-3 sentences)
2. **Key Discussion Points** (bullet points)
3. **Decisions Made** (bullet points, if any)
4. **Action Items** (bullet points with assignee if identifiable, if any)
5. **Notable Quotes** (with speaker label and timestamp, if any)

Rules:
- Use only information from the transcript. Do not invent details.
- Reference speakers by their labels (e.g., Speaker 0, Speaker 1).
- Keep the summary concise but comprehensive.
- Format timestamps as mm:ss.

Transcript:
${transcript}`;
}
```

### Transcript Segment (stored in Mongo)
```typescript
interface TranscriptSegment {
  segmentIndex: number;
  startTimestampMs: number;
  endTimestampMs: number;
  text: string;
  speaker: string;     // "spk_0", "spk_1", etc.
  channel?: string;
}
```

### BDA Output Fetching
```typescript
// Fetch from derived bucket at bda-output/{meetingId}/...
// The BDA output structure contains audio_segments with speaker labels and timestamps
// VERIFY: exact path where BDA writes output when used as KB data source parser
async function fetchBDATranscript(meetingId: string): Promise<BDAOutput> {
  // Read the standard output JSON from the derived bucket
  // Parse audio_segments and compose into a readable transcript
}
```

### API Routes
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/meetings/:id/summary` | Yes | `{ summary, transcript: TranscriptSegment[] }` |
| `POST` | `/api/meetings/:id/summary` | Yes | `{ summary }` (triggers generation if not cached) |

### Meeting Model Update
```typescript
// Add to meeting schema:
summary: { type: String },
transcript: [{
  segmentIndex: Number,
  startTimestampMs: Number,
  endTimestampMs: Number,
  text: String,
  speaker: String,
  channel: String,
}],
```

## Step-by-Step Implementation Order

1. Create `server/src/config/bedrock.ts` — Bedrock Runtime client.
2. Create shared summary/transcript schemas.
3. Update Meeting model with summary and transcript fields.
4. Create summary service with BDA output fetching and Claude Converse call.
5. Create summary routes and controller.
6. Register routes in `app.ts`.
7. Create `SummaryPanel` component.
8. Create `TranscriptView` component (scrollable, speaker-labeled, timestamped).
9. Create `MeetingDetailPage` with summary and transcript sections.
10. Add TanStack Query hooks and route.

## Isolation Guardrails
> - Summary generation verifies meeting ownership: `findOne({ _id: meetingId, userId })`.
> - Never log transcript or summary content.

## Cost Guardrails
> - `max_tokens: 4096` on the Converse call. MANDATORY on every Claude call.
> - Summary generated once and cached. Do not regenerate unless explicitly requested.
> - Transcript is read from S3 (BDA output), not re-processed.

## Acceptance Criteria
- [ ] `GET /api/meetings/:id/summary` returns summary for a `ready` meeting.
- [ ] Summary is generated via Claude Sonnet Converse API with `max_tokens` set.
- [ ] Summary is cached in Mongo — second request returns cached version without calling Claude.
- [ ] Transcript segments include speaker labels and timestamps.
- [ ] Meeting detail page displays summary and scrollable transcript.
- [ ] Transcript shows "Speaker 0", "Speaker 1" labels and mm:ss timestamps.
- [ ] Returns 404 for wrong user's meeting.
- [ ] Returns appropriate error if meeting is not `ready`.

## Tests to Write
- `server/src/modules/summary/service.test.ts`:
  - Returns cached summary without calling Claude.
  - Calls Claude when no cache exists.
  - Returns 404 for wrong userId.
  - Verify `max_tokens` is set in the Converse call.

## Manual Verification
1. Ensure a meeting is in `ready` status.
2. Navigate to meeting detail page → summary generates and displays.
3. Refresh page → summary loads instantly (from cache).
4. Check transcript view has speaker labels and timestamps.
5. Check Mongo: summary and transcript fields are populated.

## Common Pitfalls
- BDA output path may vary — VERIFY the exact S3 key where BDA stores output.
- Converse API requires `messages` format (not the old `invoke_model` format).
- The model ID format may need to include the version suffix.
- Forgetting `max_tokens` → Claude may use default (very large), costing more.
- BDA transcript may be split across multiple segments — concatenate them in order.

## Suggested Model Tier
Any capable model (the Claude call itself is straightforward; the BDA output parsing is the main work).

## Definition of Done
All acceptance criteria pass. Commit message: `feat: generate and cache meeting summary with Claude Converse, display transcript with speakers`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 2 (Region): confirm Claude Sonnet model access is enabled.
- No new resources; this phase uses services set up in Phase 4.
