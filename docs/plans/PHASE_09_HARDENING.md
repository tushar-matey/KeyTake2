# Phase 9 — Deletion, Hardening, Tests & Deployment

## Goal and Scope
Implement meeting deletion (S3 cleanup + vector removal), account deletion, per-user rate limits and quotas, security hardening (helmet, validation), remaining tests (isolation, Lambda idempotency, polling), and deployment configs for Vercel and Render.

## Out of Scope
- New features. This phase is about hardening and shipping.

## Prerequisites
- All prior phases (1–8) complete.
- Vercel and Render accounts created.
- `docs/AWS_SETUP.md` Section 12 (Deployment) values ready.

## Files to Create or Modify

### `server/`
| File | Purpose |
|---|---|
| `src/modules/meetings/service.ts` | Update: full deletion flow (S3 cleanup, KB sync, Mongo delete) |
| `src/modules/settings/routes.ts` | `DELETE /api/account` — account deletion |
| `src/modules/settings/controller.ts` | Handler |
| `src/modules/settings/service.ts` | Account deletion: S3 prefix delete, Cognito user delete, Mongo cleanup |
| `src/middleware/rateLimiter.ts` | Update: per-endpoint rate limits |
| `src/modules/quotas/service.ts` | Update: enforce daily chat request quota and token quota |
| `src/modules/chat/controller.ts` | Update: check quota before agent invocation |
| `src/modules/upload/controller.ts` | Update: check upload quota before presigning |
| `src/app.ts` | Update: helmet config, CORS tightening, global error handler |

### `client/`
| File | Purpose |
|---|---|
| `src/pages/SettingsPage.tsx` | Delete account page with confirmation dialog |
| `src/features/meetings/components/DeleteMeetingDialog.tsx` | Confirmation dialog for meeting deletion |

### Root
| File | Purpose |
|---|---|
| `vercel.json` | Vercel deployment config |
| `render.yaml` | Render deployment config |
| `README.md` | Update: deployment instructions, env var checklist |

## Key Interfaces

### Meeting Deletion Flow
```typescript
// server/src/modules/meetings/service.ts
async function deleteMeeting(meetingId: string, userId: string): Promise<void> {
  // 1. Verify ownership
  const meeting = await Meeting.findOne({ _id: meetingId, userId });
  if (!meeting) throw new NotFoundError();

  // 2. Delete raw files from S3 (users/{userId}/meetings/{meetingId}/*)
  await deleteS3Prefix(env.S3_RAW_BUCKET, `users/${userId}/meetings/${meetingId}/`);

  // 3. Delete BDA output from derived bucket (bda-output/{meetingId}/*)
  await deleteS3Prefix(env.S3_DERIVED_BUCKET, `bda-output/${meetingId}/`);

  // 4. Trigger data source sync to remove vectors
  //    StartIngestionJob with SYNC mode removes deleted files' vectors
  await syncDataSource(env.BEDROCK_KB_ID, env.BEDROCK_DS_A_ID);
  // Also sync data source B if meeting had documents
  if (meeting.files.some(f => ['doc'].includes(f.type))) {
    await syncDataSource(env.BEDROCK_KB_ID, env.BEDROCK_DS_B_ID);
  }

  // 5. Delete chat messages
  await ChatMessage.deleteMany({ meetingId, userId });

  // 6. Delete meeting record
  await Meeting.deleteOne({ _id: meetingId, userId });
}
```

### Account Deletion Flow
```typescript
// server/src/modules/settings/service.ts
async function deleteAccount(userId: string): Promise<void> {
  // 1. Delete all S3 content: users/{userId}/*
  await deleteS3Prefix(env.S3_RAW_BUCKET, `users/${userId}/`);

  // 2. Delete all BDA output for user's meetings
  const meetings = await Meeting.find({ userId });
  for (const meeting of meetings) {
    await deleteS3Prefix(env.S3_DERIVED_BUCKET, `bda-output/${meeting._id}/`);
  }

  // 3. Trigger KB sync
  await syncDataSource(env.BEDROCK_KB_ID, env.BEDROCK_DS_A_ID);
  await syncDataSource(env.BEDROCK_KB_ID, env.BEDROCK_DS_B_ID);

  // 4. Delete all Mongo records
  await ChatMessage.deleteMany({ userId });
  await Meeting.deleteMany({ userId });
  await Quota.deleteMany({ userId });
  await User.deleteOne({ cognitoSub: userId });

  // 5. Delete Cognito user
  const cognitoClient = new CognitoIdentityProviderClient({ region: env.AWS_REGION });
  await cognitoClient.send(new AdminDeleteUserCommand({
    UserPoolId: env.COGNITO_USER_POOL_ID,
    Username: userId,
  }));
}
```

### Rate Limiting
```typescript
// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  keyGenerator: (req) => req.user?.userId ?? req.ip,
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 chat messages per minute
  keyGenerator: (req) => req.user?.userId ?? req.ip,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 auth attempts per 15 min
});
```

### Daily Quotas Check
```typescript
// Before upload: check Quota.uploadCount < MAX_DAILY_UPLOADS (5)
// Before chat: check Quota.chatRequestCount < MAX_DAILY_CHATS (50)
// After chat: increment Quota.chatRequestCount and add tokenCount
```

### Deployment Config

#### `vercel.json`
```json
{
  "buildCommand": "npm run build -w client",
  "outputDirectory": "client/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### `render.yaml`
```yaml
services:
  - type: web
    name: meeting-brain-api
    runtime: node
    buildCommand: npm install && npm run build:shared && npm run build -w server
    startCommand: node server/dist/server.js
    envVars:
      - key: NODE_ENV
        value: production
      # ... all server env vars from .env.example
```

### API Routes
| Method | Path | Auth | Response |
|---|---|---|---|
| `DELETE` | `/api/meetings/:id` | Yes | `{ success: true }` (full deletion) |
| `DELETE` | `/api/account` | Yes | `{ success: true }` |

## Step-by-Step Implementation Order

1. Implement `deleteS3Prefix` utility (list + delete objects in batches).
2. Implement full meeting deletion service (S3 + KB sync + Mongo).
3. Implement account deletion service (S3 + Cognito + Mongo).
4. Create settings routes and controller.
5. Create `SettingsPage` with delete account confirmation.
6. Create `DeleteMeetingDialog` component.
7. Configure rate limiters on all routes.
8. Implement daily quota checks on upload and chat endpoints.
9. Harden `app.ts`: helmet defaults, CORS restriction to Vercel origin only in production.
10. Add zod validation middleware to all remaining routes.
11. Write remaining unit tests (see below).
12. Write isolation integration tests.
13. Create `vercel.json` and `render.yaml`.
14. Update `README.md` with deployment instructions.
15. Update `docs/AWS_SETUP.md` Section 12 with Vercel/Render setup steps.

## Isolation Guardrails
> All deletion operations verify ownership via `userId` from JWT.
> Account deletion removes ALL user data: S3, Cognito, Mongo, KB vectors.
> Admin Cognito operations require the Lambda/server IAM user to have `cognito-idp:AdminDeleteUser`.

## Cost Guardrails
> Rate limits prevent abuse of Bedrock API calls.
> Daily quotas cap per-user usage of upload and chat.
> KB sync after deletion removes vectors — prevents stale data accumulation.

## Acceptance Criteria
- [ ] Deleting a meeting removes S3 files, BDA output, chat messages, and Mongo record.
- [ ] KB sync triggers after deletion (vectors are removed).
- [ ] Account deletion removes all user data across S3, Cognito, and Mongo.
- [ ] Rate limits reject excessive requests with 429.
- [ ] Daily upload quota enforced (return 429 with clear message).
- [ ] Daily chat quota enforced.
- [ ] Helmet headers present in all responses.
- [ ] CORS restricted to Vercel origin in production.
- [ ] All routes have zod validation.
- [ ] App deploys to Vercel (client) and Render (server) successfully.
- [ ] Two-user isolation test passes end to end.
- [ ] Lambda runs exactly once per file (CloudWatch verification).
- [ ] Frontend polling stops correctly (verified with tests).

## Tests to Write (All Remaining)

### Unit Tests
- `server/src/modules/meetings/service.test.ts` — deletion flow.
- `server/src/modules/settings/service.test.ts` — account deletion.
- `server/src/modules/quotas/service.test.ts` — quota enforcement.

### Isolation Integration Tests
- **Two-user test**:
  - Create User A meeting, upload audio.
  - As User B: `GET /api/meetings/:idA` → 404.
  - As User B: `POST /api/meetings/:idA/chat` → 404.
  - As User B: try User A's presigned URL → S3 rejects (expired or wrong key).
  - As User B in chat: "show me all meetings" → gets only User B's content.

### Lambda Test (Manual)
- Upload one file → CloudWatch shows exactly one Lambda invocation.
- Upload `.metadata.json` → Lambda does NOT trigger.

### Frontend Tests
- Polling stops on `ready`.
- Polling stops on `failed`.
- Polling stops on component unmount.

## Manual Verification
1. Delete a meeting → verify S3 files gone, Mongo record gone, chat history gone.
2. Delete account → verify everything cleaned up.
3. Hit rate limit → see 429 response.
4. Deploy to Vercel → client loads correctly.
5. Deploy to Render → API responds correctly.
6. Run end-to-end: sign up → upload → process → summary → chat → delete.

## Common Pitfalls
- S3 `listObjectsV2` + `deleteObjects` batch size max is 1000 — paginate.
- KB sync after deletion takes time — vectors may still appear for a few minutes.
- Cognito `AdminDeleteUser` requires IAM permissions — add to Render IAM user policy.
- Vercel rewrites needed for SPA routing.
- Render build command must build `shared` before `server`.

## Suggested Model Tier
Any capable model (but the isolation tests need careful attention).

## Definition of Done
All acceptance criteria pass. All tests pass. Commit message: `feat: add deletion flows, rate limits, quotas, tests, and deployment configs`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 8 (IAM): update Render IAM user with `cognito-idp:AdminDeleteUser`.
- Section 11 (Cost protection): CloudWatch alarms, log retention.
- Section 12 (Deployment): Vercel and Render setup.
- Section 13 (End-to-end test): full checklist.
