# Meeting Brain — Progress Tracker

> Every implementer must update this file when they finish a phase or make a decision.

---

## Phase Checklist

| Phase | Title | Status | Assignee | Notes |
|---|---|---|---|---|
| 1 | Monorepo Scaffold | Not started | — | — |
| 2 | Cognito Auth E2E | Not started | — | Depends on Phase 1 |
| 3 | Audio Meetings Module | Not started | — | Depends on Phase 2 |
| 4 | Knowledge Base & Audio Ingestion | Not started | — | Depends on Phase 3; needs strong-model review |
| 5 | Summary Service | Not started | — | Depends on Phase 4 |
| 6 | Strands Agent & Chat | Not started | — | Depends on Phase 5; needs strong-model review |
| 7 | Frontend Polish | Not started | — | Depends on Phase 6 |
| 8 | Documents Support | Not started | — | Depends on Phase 4 |
| 9 | Deletion, Hardening & Deployment | Not started | — | Depends on all prior phases |

---

## Decisions and Deviations Log

> Log any decisions made during implementation that deviate from or clarify the plans.

| Date | Phase | Decision | Rationale |
|---|---|---|---|
| — | — | — | — |

---

## Known Issues

> Track known bugs, tech debt, or incomplete items here.

| ID | Phase | Description | Severity | Status |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Open Questions

> Record any blockers or questions that need resolution.

| ID | Phase | Question | Status | Resolution |
|---|---|---|---|---|
| OQ-1 | 4 | Confirm whether BDA supports direct ingestion via Knowledge Base data source A with `BEDROCK_DATA_AUTOMATION` parser in the console UI, or if it requires API-only setup. | Open | VERIFY IN CONSOLE |
| OQ-2 | 6 | Verify that `@strands-agents/sdk` TypeScript SDK supports custom tool definitions with synchronous return values for the Retrieve tool. The docs show the pattern but confirm the exact API surface. | Open | VERIFY against SDK v1.0 |
| OQ-3 | 5 | Confirm whether BDA transcript output is stored in the derived bucket or can be fetched directly via API after `InvokeDataAutomationAsync` completes, to use for summary generation. | Open | VERIFY IN CONSOLE |
| OQ-4 | 4 | S3 Vectors non-filterable metadata configuration — confirm exactly how to set metadata fields as non-filterable when creating the vector index in the console. | Open | VERIFY IN CONSOLE |

---

## How to Update This File

When you finish a phase:
1. Change the phase status to `Done` and add the completion date in Notes.
2. Log any decisions or deviations in the Decisions table.
3. Move any resolved Open Questions to the Decisions table with the resolution.
4. Add any new issues to Known Issues.
5. List the AWS_SETUP.md sections the user should complete now.

When you start a phase:
1. Change the phase status to `In progress`.
