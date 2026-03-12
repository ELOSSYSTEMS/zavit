# Step 5 Checks: Ingestion And Health Tracking

## Automated Checks

- `npm test`
- `npm run validate:sources`
- `npm run lint`
- `npm run typecheck`
- `npm run db:push`
- `npm run seed:sources`
- `npm run ingest:sources`
- `npm run build`

## Manual Checks

- Inspected persisted per-source article counts and health rows after the latest ingest run
- Confirmed source visibility exists on [app/sources/page.tsx](../../../../app/sources/page.tsx) and [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx)
- Confirmed article body content is not stored by checking the Step 3 schema and the Step 5 ingest write paths, which only persist headline, snippet, URLs, timestamps, and source metadata
- Confirmed the browser-backed fallback renders article links for `kan-news` and `davar`, which both reject plain server-side fetch

## Results

- `npm test`: passed
- `npm run validate:sources`: passed
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run db:push`: passed against the hosted Postgres database
- `npm run seed:sources`: passed after making roster sync idempotent on either `slug` or `canonicalDomain`
- `npm run ingest:sources`: passed
  - run id: `cmmnrzjvd0000zsbf5lw8dki2`
  - 12 of 12 approved sources ingested successfully
  - 137 metadata-only article rows persisted
  - all approved sources show `ACTIVE` availability with zero consecutive failures on the latest run
- `npm run build`: passed

## Failures And Warnings

- `kan-news` and `davar` still reject plain server-side fetch, so their working baseline now depends on the browser-backed fallback path
- The Postgres connection string currently emits a `pg` warning about future SSL mode behavior; it is a warning, not a current runtime failure

## Residual Risk

- Future runs now depend on a local Chromium-compatible executable being available for the two browser-backed sources
- The hosted Postgres connection string should eventually be tightened to an explicit SSL mode to avoid future `pg` behavior drift
