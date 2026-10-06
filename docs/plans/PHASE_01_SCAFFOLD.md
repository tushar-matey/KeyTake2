# Phase 1 — Monorepo Scaffold

## Goal and Scope
Set up the npm workspaces monorepo with all four packages (`client`, `server`, `lambda`, `shared`), shared TypeScript config, ESLint, Prettier, environment variable validation, and a README skeleton. After this phase the project builds, lints, and runs (showing placeholder pages).

## Out of Scope
- Authentication, AWS integration, database, any feature logic.
- Tailwind design tokens beyond defaults (Phase 7).
- Deployment configs (Phase 9).

## Prerequisites
- Node.js 20+ and npm 10+ installed.
- Read `docs/plans/00_PROJECT_CONTEXT.md` in full.

## Files to Create

### Root
| File | Purpose |
|---|---|
| `package.json` | Root workspace config with `workspaces: ["client", "server", "lambda", "shared"]` and shared scripts |
| `tsconfig.base.json` | Shared strict TS config extended by each workspace |
| `.eslintrc.cjs` | ESLint config (TypeScript, React for client) |
| `.prettierrc` | Prettier config |
| `.gitignore` | Node, dist, .env, coverage, etc. |
| `README.md` | Project overview, setup instructions (skeleton), cost estimates table |

### `shared/`
| File | Purpose |
|---|---|
| `package.json` | Package `@keytake/shared`, main pointing to `dist/` |
| `tsconfig.json` | Extends base, `outDir: "dist"`, `composite: true` |
| `src/schemas/meeting.ts` | Placeholder: `meetingStatusSchema = z.enum(["uploaded", "processing", "ready", "failed"])` |
| `src/schemas/index.ts` | Barrel export |
| `src/types/index.ts` | Derived types from schemas |
| `src/index.ts` | Root barrel export |

### `server/`
| File | Purpose |
|---|---|
| `package.json` | Dependencies: express, mongoose, zod, helmet, cors, express-rate-limit, pino, pino-pretty, dotenv, aws-jwt-verify |
| `tsconfig.json` | Extends base, references `shared` |
| `.env.example` | All server env vars with placeholder values |
| `src/config/env.ts` | Zod schema for server env vars, `validateEnv()` at startup |
| `src/app.ts` | Express app: helmet, cors, JSON body parser, health route `GET /api/health` |
| `src/server.ts` | Entry: validate env, connect placeholder, start listening |

### `client/`
| File | Purpose |
|---|---|
| `package.json` | Dependencies: react, react-dom, react-router-dom, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, tailwindcss, postcss, autoprefixer |
| `tsconfig.json` | Extends base, `jsx: "react-jsx"` |
| `vite.config.ts` | Vite React plugin, proxy `/api` to `http://localhost:3001` in dev |
| `tailwind.config.ts` | Content paths, dark mode `"class"`, empty theme extensions |
| `postcss.config.cjs` | Tailwind + autoprefixer |
| `.env.example` | `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION` |
| `src/index.css` | Tailwind directives (`@tailwind base; components; utilities;`) |
| `src/main.tsx` | React root render |
| `src/App.tsx` | React Router with placeholder routes: `/`, `/login`, `/meetings` |
| `src/pages/HomePage.tsx` | Placeholder |
| `src/lib/api-client.ts` | Axios or fetch wrapper with base URL from env |

### `lambda/`
| File | Purpose |
|---|---|
| `package.json` | Dependencies: `@aws-sdk/client-bedrock-agent`, `@aws-sdk/client-s3`, zod |
| `tsconfig.json` | Extends base, `target: "ES2022"`, `module: "commonjs"` |
| `.env.example` | Lambda env vars placeholder |
| `src/handler.ts` | Placeholder export: `export const handler = async (event) => ({ statusCode: 200 })` |

### `docs/`
| File | Purpose |
|---|---|
| `docs/plans/` | Already exists (this file) |

## Key Interfaces

### `server/src/config/env.ts`
```typescript
import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_RAW_BUCKET: z.string().min(1),
  S3_DERIVED_BUCKET: z.string().min(1),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  BEDROCK_KB_ID: z.string().optional(),
  BEDROCK_DS_A_ID: z.string().optional(),
  BEDROCK_DS_B_ID: z.string().optional(),
  BDA_PROJECT_ARN: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-sonnet-4-20250514-v1:0'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export function validateEnv(): ServerEnv { ... }
```

### `server/src/app.ts`
```typescript
// GET /api/health → { status: "ok", timestamp: string }
```

### Root `package.json` scripts
```json
{
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client",
    "build": "npm run build --workspaces --if-present",
    "build:shared": "npm run build -w shared",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "vitest run",
    "clean": "rm -rf node_modules */node_modules */dist"
  }
}
```

## Step-by-Step Implementation Order

1. Create root `package.json` with workspaces.
2. Create `tsconfig.base.json` (strict mode, `target: "ES2022"`, `moduleResolution: "bundler"`).
3. Create `.eslintrc.cjs` and `.prettierrc`.
4. Create `.gitignore`.
5. Create `shared/` with its `package.json`, `tsconfig.json`, schemas, and barrel exports.
6. Create `server/` with its `package.json`, `tsconfig.json`, env config, app, and server files.
7. Create `client/` with Vite config, Tailwind config, placeholder pages, and `App.tsx`.
8. Create `lambda/` with placeholder handler.
9. Run `npm install` at root.
10. Run `npm run build:shared` to generate shared types.
11. Verify `npm run dev:server` starts and `GET /api/health` returns `{ status: "ok" }`.
12. Verify `npm run dev:client` starts and shows the placeholder page.
13. Verify `npm run lint` passes.
14. Create `README.md` with setup instructions and cost table.

## Applicable Guardrails
- No AWS resources are created in this phase.
- No `any` unless justified.
- All env vars validated with zod.

## Acceptance Criteria
- [ ] `npm install` at root succeeds.
- [ ] `npm run build` succeeds for all workspaces.
- [ ] `npm run dev:server` starts Express on port 3001; `GET /api/health` returns 200.
- [ ] `npm run dev:client` starts Vite dev server; page renders in browser.
- [ ] `npm run lint` passes with zero errors.
- [ ] `shared` package exports schemas and types correctly.
- [ ] `.env.example` exists in `server/`, `client/`, `lambda/`.
- [ ] Server crashes with a clear error if `MONGODB_URI` is missing from env.

## Tests to Write
- `shared/src/schemas/meeting.test.ts` — validate `meetingStatusSchema` accepts valid values and rejects invalid.
- `server/src/config/env.test.ts` — validate that missing required vars throw, defaults are applied.

## Manual Verification
1. Clone the repo, run `npm install`, `npm run build`, `npm run dev`.
2. Open browser, see placeholder page.
3. `curl http://localhost:3001/api/health` returns JSON.

## Common Pitfalls
- Forgetting to set `"composite": true` in shared tsconfig breaks project references.
- Vite proxy config must match the server port.
- Workspace references need `"@keytake/shared": "file:../shared"` or `"*"` in root.

## Suggested Model Tier
Any capable model.

## Definition of Done
All acceptance criteria pass. Commit message: `feat: scaffold monorepo with workspaces, tooling, and env validation`.

## AWS_SETUP.md Sections Needed After This Phase
None — no AWS resources are needed yet.
