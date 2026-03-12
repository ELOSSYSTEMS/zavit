# Step 5 Evidence: Ingestion And Health Tracking

## Decisions Made

- Added a real ingest stack under `lib/ingest/` for roster loading, URL normalization, RSS parsing, HTML metadata extraction, section crawling, and run orchestration.
- Added source sync and ingest entrypoints at [sync-source-roster.mjs](../../../../scripts/sync-source-roster.mjs) and [run-ingest.mjs](../../../../scripts/run-ingest.mjs).
- Added Prisma 7 runtime adapter wiring with `@prisma/adapter-pg` and `pg`, because the generated client would not run without an explicit Postgres adapter.
- Added DB-backed visibility for source state on [app/sources/page.tsx](../../../../app/sources/page.tsx) and [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx).
- Added fixture-based tests for URL normalization, RSS parsing, article metadata extraction, and section-crawl candidate filtering.
- Added RSS-to-section-crawl fallback so sources with blocked or redirected feeds can still ingest metadata from their public site entry point.
- Added a browser-backed HTML fallback for `kan-news` and `davar`, because both deny plain server-side fetch while still rendering usable public article links in a real browser session.

## Files Or Modules Affected

- `project/package.json`
- `project/package-lock.json`
- `project/app/sources/page.tsx`
- `project/app/admin/sources/page.tsx`
- `project/lib/db/prisma.ts`
- `project/lib/ingest/*.mjs`
- `project/scripts/sync-source-roster.mjs`
- `project/scripts/run-ingest.mjs`
- `project/tests/fixtures/ingest/*`
- `project/tests/ingest/*.test.mjs`
- `project/workspace/harness/phases/05-ingestion-health/*.md`

## Findings That Affect Later Steps

- The approved roster now persists cleanly into `Source`, and ingest writes `PipelineRun`, `Article`, and `SourceHealth` rows without storing article body content.
- The latest full ingest run `cmmnrzjvd0000zsbf5lw8dki2` succeeded for all 12 approved sources and persisted 137 metadata-only article rows.
- [app/sources/page.tsx](../../../../app/sources/page.tsx) and [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx) now expose availability and health state without DB-only inspection.
- DB-backed source health now shows all 12 approved sources as `ACTIVE`, including previously blocked `kan-news` and `davar`, with zero consecutive failures on the latest run.
- The runtime connection now prefers `DATABASE_URL_UNPOOLED` when present, which matches the current hosted Postgres setup better than relying only on the pooled URL.
- The current Postgres connection string still emits a `pg` SSL-mode warning; it is not blocking Step 5, but it should be tightened later if the hosted provider supports `sslmode=verify-full`.

## Deviations From Plan

- Implemented DB-backed status pages during Step 5 instead of waiting for Step 8 so stale/failing source visibility could be checked now.
- Used a runtime adapter-based Prisma client instead of the original bare client construction because Prisma 7 runtime access requires adapter configuration in this repo.
- Added a source-specific browser-backed fetch path for `kan-news` and `davar` instead of dropping them from the approved Step 4 roster.
