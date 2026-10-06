# Phase 7 — Frontend Polish

## Goal and Scope
Polish all frontend pages: meetings list with status badges and bounded polling, meeting detail page with summary/transcript/chat/files tabs, dark mode, loading skeletons, toasts, responsive mobile-first layout, and accessible keyboard navigation.

## Out of Scope
- New backend features (all APIs exist from prior phases).
- Document upload UI (Phase 8).
- Rate limiting/hardening (Phase 9).

## Prerequisites
- Phases 1–6 complete. All API endpoints functional.
- shadcn/ui installed and configured.

## Files to Create or Modify

### `client/`
| File | Purpose |
|---|---|
| `tailwind.config.ts` | Update: add design tokens (colors, fonts, spacing), dark mode config |
| `src/index.css` | Update: add Tailwind base layer customizations, font imports |
| `src/components/ui/` | shadcn/ui components: Button, Input, Dialog, Toast, Skeleton, Badge, Tabs, Card, DropdownMenu |
| `src/components/Layout.tsx` | App shell: sidebar/header, responsive nav, dark mode toggle |
| `src/components/ThemeProvider.tsx` | Dark mode context (class-based) |
| `src/components/LoadingSkeleton.tsx` | Reusable skeleton components for meetings list, detail page |
| `src/components/EmptyState.tsx` | Reusable empty state with illustration and CTA |
| `src/components/ErrorBoundary.tsx` | Error boundary with retry |
| `src/hooks/useToast.ts` | Toast notifications hook |
| `src/pages/MeetingsPage.tsx` | Update: status badges, search, sort, empty state |
| `src/pages/MeetingDetailPage.tsx` | Update: tabs (Summary, Transcript, Chat, Files), polished layout |
| `src/pages/NewMeetingPage.tsx` | Update: polished drag-and-drop, audio duration warning |
| `src/features/meetings/components/StatusBadge.tsx` | Color-coded status badge |
| `src/features/meetings/components/MeetingCard.tsx` | Meeting card with status, date, file count |
| `src/features/meetings/hooks/useStatusPolling.ts` | Bounded polling with backoff |

## Key Interfaces

### Status Polling with Bounds
```typescript
// client/src/features/meetings/hooks/useStatusPolling.ts
export function useStatusPolling(meetingId: string, currentStatus: string) {
  const isTerminal = currentStatus === 'ready' || currentStatus === 'failed';

  return useQuery({
    queryKey: ['meeting-status', meetingId],
    queryFn: () => fetchMeetingStatus(meetingId),
    refetchInterval: (data) => {
      if (!data || isTerminal) return false;
      // Start at 5s, increase to 10s after 1 minute
      return elapsed < 60000 ? 5000 : 10000;
    },
    enabled: !isTerminal && !document.hidden, // Stop when tab is hidden
    refetchOnWindowFocus: false,
    // Maximum polling duration: 10 minutes
    // After 10 minutes, stop and show "check back later" message
  });
}

// Also: add a visibilitychange listener to pause/resume polling
```

### Status Badge Component
```typescript
// Tailwind classes per status:
const statusStyles = {
  uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
```

### Meeting Detail Page Layout
```
┌─────────────────────────────────────────────┐
│ Meeting Title              [Status Badge]   │
│ Created: Oct 6, 2026                        │
├─────────────────────────────────────────────┤
│ [Summary] [Transcript] [Chat] [Files]  tabs │
├─────────────────────────────────────────────┤
│                                             │
│  Tab content area                           │
│  (switches between summary, transcript,     │
│   chat panel, and files list)               │
│                                             │
└─────────────────────────────────────────────┘
```

### Audio Duration Warning
```typescript
// In NewMeetingPage, before starting upload:
if (estimatedDurationMinutes > 30) {
  const estimatedCost = (estimatedDurationMinutes * 0.012).toFixed(2);
  // Show warning dialog:
  // "This audio file appears to be over 30 minutes long.
  //  Estimated processing cost: ~$X.XX.
  //  Are you sure you want to continue?"
}
```

### Dark Mode
```typescript
// client/src/components/ThemeProvider.tsx
// Uses class-based dark mode (Tailwind 'class' strategy)
// Persists preference in localStorage
// Respects system preference as default
```

## Step-by-Step Implementation Order

1. Configure Tailwind design tokens (colors, fonts, shadows).
2. Install and configure shadcn/ui components.
3. Create `ThemeProvider` with dark mode toggle.
4. Create `Layout` component with responsive nav.
5. Create reusable components: `StatusBadge`, `LoadingSkeleton`, `EmptyState`, `ErrorBoundary`.
6. Create toast system.
7. Implement `useStatusPolling` hook with bounds and backoff.
8. Polish `MeetingsPage`: cards, badges, search, sort, skeleton loading.
9. Polish `MeetingDetailPage`: tabs, responsive layout.
10. Polish `NewMeetingPage`: drag-and-drop UX, audio duration warning, progress bar.
11. Polish `ChatPanel`: message bubbles, citation styling, streaming indicator.
12. Add keyboard navigation and aria labels throughout.
13. Test responsive layouts on mobile and desktop.
14. Test dark mode across all pages.

## Cost Guardrails (from 00_PROJECT_CONTEXT.md Section 9.2)
> **Polling:**
> - No infinite polling. Status polling uses 5–10 second interval with backoff.
> - Maximum duration: 10 minutes. Stops on `ready` or `failed`.
> - Stops on unmount and when the tab is hidden.
> - Review all `useEffect` dependency arrays to avoid re-fetch loops.
>
> **Frontend:**
> - Frontend never calls Bedrock or AWS APIs directly (only Cognito for auth and S3 via presigned URLs).
> - Warn user before processing audio files over 30 minutes.

## Acceptance Criteria
- [ ] Meetings list shows color-coded status badges.
- [ ] Polling starts for `processing` meetings, stops at `ready` or `failed`.
- [ ] Polling stops when tab is hidden (visibilitychange).
- [ ] Polling stops after 10 minutes maximum.
- [ ] Meeting detail page has functional tabs: Summary, Transcript, Chat, Files.
- [ ] Dark mode toggle works, persists in localStorage.
- [ ] Loading skeletons appear during data fetches.
- [ ] Toast notifications appear for success/error actions.
- [ ] Empty states shown when no meetings exist or no chat messages.
- [ ] Forms are accessible: labels, aria attributes, keyboard navigation.
- [ ] Layout is responsive: usable on mobile screens.
- [ ] No `useEffect` re-fetch loops (check with React DevTools).
- [ ] Audio duration warning appears for files > 30 minutes.

## Tests to Write
- `client/src/features/meetings/hooks/useStatusPolling.test.ts`:
  - Polling stops on `ready` status.
  - Polling stops on `failed` status.
  - Polling stops on unmount.
- Component tests for `StatusBadge`, `EmptyState`.

## Manual Verification
1. Upload a file → see `uploaded` badge, then `processing` (animated), then `ready`.
2. Switch tabs while processing → polling pauses. Switch back → polling resumes.
3. Toggle dark mode → all pages render correctly.
4. Resize browser → layout adapts to mobile.
5. Navigate using keyboard only → all interactive elements reachable.
6. Upload long audio → warning dialog appears.

## Common Pitfalls
- `document.hidden` check needs an event listener for `visibilitychange`, not just an initial check.
- TanStack Query `refetchInterval` must return `false` to stop, not `0`.
- shadcn/ui components may need Tailwind configuration for dark mode.
- `useEffect` with missing dependency → infinite re-render loop.

## Suggested Model Tier
Any capable model.

## Definition of Done
All acceptance criteria pass. Commit message: `feat: polish frontend with status polling, dark mode, skeletons, toasts, and responsive layout`.

## AWS_SETUP.md Sections Needed After This Phase
None — no new AWS resources.
