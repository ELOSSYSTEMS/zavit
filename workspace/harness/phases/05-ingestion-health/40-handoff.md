# Step 5 Handoff: Ingestion And Health Tracking

## Next Step Inputs

Before Step 6 work, read these first:

- [30-gate.md](./30-gate.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [approved-roster.json](../../../../lib/sources/approved-roster.json)
- [run-ingest.mjs](../../../../lib/ingest/run-ingest.mjs)
- [section-crawl.mjs](../../../../lib/ingest/section-crawl.mjs)
- [sync-source-roster.mjs](../../../../scripts/sync-source-roster.mjs)
- [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx)

## Locked Assumptions

- The approved roster membership and independence grouping remain unchanged from Step 4
- Prisma runtime access depends on the Postgres adapter wiring added in Step 5
- The active hosted Postgres connection works for `db push`, source sync, ingest persistence, and Next.js runtime reads
- `kan-news` and `davar` require the recorded browser-backed fallback path because they reject plain server-side fetch
- The Step 5 baseline run `cmmnrzjvd0000zsbf5lw8dki2` is the current successful reference ingest for Step 6 inputs

## Open Questions

- Whether Step 6 should consume only the latest successful ingest run or a broader rolling window of metadata rows
- Whether the browser-backed fallback should stay local-runtime only or be formalized for CI and deployment environments
- Whether the hosted connection string should be tightened to `sslmode=verify-full` to remove the current `pg` SSL warning

## Required References

- [package.json](../../../../package.json)
- [prisma.ts](../../../../lib/db/prisma.ts)
- [app/sources/page.tsx](../../../../app/sources/page.tsx)
- [schema.prisma](../../../../prisma/schema.prisma)
- [source-policy.md](../../../../docs/source-policy.md)
