# Step 8 Evidence: Admin Security And Operator Tooling

## Decisions Made

- Added allowlist, password, and TOTP auth helpers in [config.mjs](../../../../lib/admin/config.mjs), [totp.mjs](../../../../lib/admin/totp.mjs), [session.mjs](../../../../lib/admin/session.mjs), [auth-core.mjs](../../../../lib/admin/auth-core.mjs), and [auth.mjs](../../../../lib/admin/auth.mjs).
- Added the admin login flow and signed session-cookie handling through [page.tsx](../../../../app/admin/login/page.tsx) and [actions.ts](../../../../app/admin/actions.ts).
- Updated [page.tsx](../../../../app/admin/pipeline/page.tsx), [page.tsx](../../../../app/admin/sources/page.tsx), and [page.tsx](../../../../app/admin/events/[id]/page.tsx) to require admin sessions before rendering.
- Added operator-only source disable/restore and event suppress/restore actions in [actions.ts](../../../../app/admin/actions.ts), each with `OperatorActionAudit` writes including actor and reason.
- Added the Step 8 env shape in [env.example](../../../../env.example) for `ADMIN_REVIEWER_EMAILS`, `ADMIN_OPERATOR_EMAILS`, `ADMIN_PASSWORD`, `ADMIN_TOTP_SECRET`, and `ADMIN_SESSION_SECRET`.
- Added focused auth, authorization, and route-guard tests in [tests/admin/auth.test.mjs](../../../../tests/admin/auth.test.mjs), [tests/admin/authorization.test.mjs](../../../../tests/admin/authorization.test.mjs), and [tests/admin/route-access.test.mjs](../../../../tests/admin/route-access.test.mjs).

## Files Or Modules Affected

- `project/app/admin/actions.ts`
- `project/app/admin/login/page.tsx`
- `project/app/admin/pipeline/page.tsx`
- `project/app/admin/sources/page.tsx`
- `project/app/admin/events/[id]/page.tsx`
- `project/app/globals.css`
- `project/env.example`
- `project/package.json`
- `project/lib/admin/*.mjs`
- `project/tests/admin/*.test.mjs`
- `project/workspace/harness/phases/08-admin-ops/*.md`

## Findings That Affect Later Steps

- All Step 8 admin page reads now fail closed when auth env vars are missing, the session is absent, or the role is insufficient.
- `reviewer` can inspect admin routes but cannot trigger the operator-only source and event actions because those server actions call `requireAdminSession("OPERATOR", ...)`.
- Every Step 8 operator action persists `actionType`, `actorRole`, `actorRef`, `reason`, and the affected `sourceId` or `eventId` through `OperatorActionAudit`.
- Source restore clears the disabled reason and returns the source to `ACTIVE`; event restore returns the event to `PUBLISHED` if a publish snapshot exists, otherwise `HELD`.
- There is still no legal-case resolution UI in Step 8, which preserves the contract that only operators may resolve those cases once Step 9 introduces complaint intake and case handling.

## Deviations From Plan

- Step 8 implements page-level guards plus guarded server actions instead of a middleware-based admin boundary.
- The audit trail is readable on the existing admin pages but does not yet expose case-oriented actions because Step 9 intake flows are not implemented yet.
- Login uses shared-password auth plus TOTP as required; no external identity provider was introduced.
