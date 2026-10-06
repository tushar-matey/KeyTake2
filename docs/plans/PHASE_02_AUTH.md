# Phase 2 — Cognito Auth End to End

## Goal and Scope
Implement user authentication using Amazon Cognito: React auth screens (sign up, confirm email, sign in, sign out, password reset), token attachment to API requests, Express `requireAuth` middleware, and a User model in MongoDB.

## Out of Scope
- OAuth/social sign-in, MFA beyond email confirmation.
- Meeting CRUD, file upload, any AI features.
- Admin user management.

## Prerequisites
- Phase 1 complete.
- `docs/AWS_SETUP.md` Section 4 (Cognito) complete: User Pool and App Client created, IDs in `.env`.
- `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION` set.
- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` set in `server/.env`.
- MongoDB running locally or via Atlas.

## Env Vars Needed
| Var | Workspace | Source |
|---|---|---|
| `VITE_COGNITO_USER_POOL_ID` | client | Cognito console |
| `VITE_COGNITO_CLIENT_ID` | client | Cognito console |
| `VITE_COGNITO_REGION` | client | Your chosen region |
| `COGNITO_USER_POOL_ID` | server | Same as above |
| `COGNITO_CLIENT_ID` | server | Same as above |
| `AWS_REGION` | server | Your chosen region |
| `MONGODB_URI` | server | Local or Atlas |

## Files to Create or Modify

### `shared/`
| File | Purpose |
|---|---|
| `src/schemas/user.ts` | `userSchema`, `signUpSchema`, `signInSchema`, `confirmSchema`, `resetPasswordSchema` |
| `src/schemas/api.ts` | `apiErrorSchema`, `apiSuccessSchema` |

### `client/`
| File | Purpose |
|---|---|
| `src/lib/cognito.ts` | Cognito configuration and helper functions using `amazon-cognito-identity-js` |
| `src/hooks/useAuth.tsx` | Auth context provider: `signUp`, `confirmEmail`, `signIn`, `signOut`, `resetPassword`, `user`, `isAuthenticated`, `isLoading` |
| `src/lib/api-client.ts` | Update: attach `Authorization: Bearer <accessToken>` header |
| `src/features/auth/components/LoginForm.tsx` | Email + password sign-in form |
| `src/features/auth/components/SignUpForm.tsx` | Email + password sign-up form |
| `src/features/auth/components/ConfirmEmailForm.tsx` | 6-digit confirmation code form |
| `src/features/auth/components/ForgotPasswordForm.tsx` | Reset password flow |
| `src/features/auth/index.ts` | Barrel exports |
| `src/pages/LoginPage.tsx` | Login/SignUp tabbed page |
| `src/pages/DashboardPage.tsx` | Placeholder protected page |
| `src/components/ProtectedRoute.tsx` | Redirects to `/login` if not authenticated |
| `src/App.tsx` | Update: wrap in AuthProvider, add ProtectedRoute |

### `server/`
| File | Purpose |
|---|---|
| `src/middleware/requireAuth.ts` | Verify JWT using `aws-jwt-verify`, extract `sub` as `userId`, attach to `req.user` |
| `src/modules/auth/routes.ts` | `GET /api/auth/me` — return current user profile |
| `src/modules/auth/controller.ts` | Handler for `/me` |
| `src/modules/auth/service.ts` | `findOrCreateUser(cognitoSub, email)` |
| `src/modules/auth/model.ts` | Mongoose `User` model |
| `src/config/db.ts` | MongoDB connection with Mongoose |
| `src/app.ts` | Update: register auth routes, connect DB |
| `src/types/express.d.ts` | Extend Express Request: `req.user = { userId, email }` |

## Key Interfaces

### `requireAuth` Middleware
```typescript
// server/src/middleware/requireAuth.ts
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: env.COGNITO_CLIENT_ID,
});

// Extracts token from `Authorization: Bearer <token>`
// Sets req.user = { userId: payload.sub, email: payload.email }
// Returns 401 if invalid/expired
```

### User Model
```typescript
// server/src/modules/auth/model.ts
const userSchema = new Schema({
  cognitoSub: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
```

### Auth Context (React)
```typescript
// client/src/hooks/useAuth.tsx
interface AuthContextValue {
  user: { userId: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}
```

### API Routes
| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/auth/me` | Required | `{ userId, email, createdAt }` |

## Step-by-Step Implementation Order

1. Install `amazon-cognito-identity-js` in `client/`.
2. Install `aws-jwt-verify` in `server/`.
3. Create shared zod schemas for auth.
4. Create `server/src/config/db.ts` — MongoDB connection.
5. Create `User` Mongoose model.
6. Create `requireAuth` middleware.
7. Create auth service (`findOrCreateUser`).
8. Create auth routes and controller.
9. Register routes in `app.ts`.
10. Create `client/src/lib/cognito.ts` — Cognito pool setup.
11. Create `useAuth` context with all auth flows.
12. Create auth form components.
13. Create `LoginPage.tsx` with tabs (Sign In / Sign Up / Confirm / Reset).
14. Create `ProtectedRoute.tsx`.
15. Update `App.tsx` with auth provider and protected routes.
16. Update `api-client.ts` to attach Bearer token.

## Isolation Guardrails (from 00_PROJECT_CONTEXT.md Section 7)
> - `userId` always comes from the verified JWT on the server (`req.user.sub`), never from the request body.
> - Return 404 (not 403) on ownership mismatch.

## Acceptance Criteria
- [ ] User can sign up with email and password.
- [ ] User receives confirmation email and can confirm with code.
- [ ] User can sign in and sees the dashboard.
- [ ] User is redirected to `/login` when accessing a protected route without auth.
- [ ] `GET /api/auth/me` returns the user profile with valid token.
- [ ] `GET /api/auth/me` returns 401 with missing/invalid/expired token.
- [ ] User record is created in MongoDB on first sign-in.
- [ ] Sign out clears the session and redirects to login.
- [ ] Forgot password flow works end to end.
- [ ] Server crashes with clear error if Cognito env vars are missing.

## Tests to Write
- `server/src/middleware/requireAuth.test.ts` — mock verifier, test valid/invalid/missing token cases.
- `server/src/modules/auth/service.test.ts` — test `findOrCreateUser` creates new user, returns existing.
- `shared/src/schemas/user.test.ts` — validate auth schemas.

## Manual Verification
1. Start server and client.
2. Sign up a new user, confirm email, sign in.
3. Check MongoDB: user record exists with correct `cognitoSub`.
4. Open DevTools → Network: verify `Authorization` header is sent on API calls.
5. Manually send request to `/api/auth/me` without token → 401.

## Common Pitfalls
- Using `id_token` instead of `access_token` — use access token.
- Forgetting to set `tokenUse: 'access'` in the verifier.
- Cognito Client ID mismatch between frontend and backend.
- Not handling token refresh (Cognito SDK handles this if configured correctly).
- CORS not allowing `Authorization` header — ensure `cors({ exposedHeaders: ['Authorization'] })` is not needed but `credentials: true` and correct `allowedHeaders` are set.

## Suggested Model Tier
Any capable model.

## Definition of Done
All acceptance criteria pass. Commit message: `feat: implement Cognito auth with React screens, JWT verification, and User model`.

## AWS_SETUP.md Sections Needed After This Phase
- Section 4 (Cognito): User Pool, App Client, email verification.
