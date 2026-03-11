# Step 2 Evidence: Repo Scaffold

## Decisions Made

- Used the locked Step 2 baseline from [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md) to scaffold one Next.js application under `project/`.
- Established public/admin route separation in the repo scaffold without implementing auth logic yet.
- Added Prisma 7 bootstrap files with `prisma.config.ts` and a placeholder `BootstrapMarker` model so schema tooling can validate before Step 3 introduces product-domain models.
- Added tracked `jobs/`, `lib/`, `tests/`, and `docs/` folders inside `project/`.

## Files Or Modules Affected

- `project/app/*`
- `project/package.json`
- `project/prisma/schema.prisma`
- `project/prisma.config.ts`
- `project/env.example`
- `project/jobs/worker.ts`
- `project/lib/README.md`
- `project/tests/README.md`
- `project/docs/README.md`
- `workspace/harness/phases/02-repo-scaffold/*.md`

## Findings That Affect Later Steps

- Prisma 7 no longer accepts datasource URLs inside `schema.prisma`; Step 3 must keep connection settings in `prisma.config.ts`.
- Step 3 starts from a bootstrap schema only and must replace `BootstrapMarker` with the real trust-critical entities.
- Step 4 still owns final roster approval; the scaffold includes route and folder boundaries only, not seed data.
- Public/admin route separation is now present and can be preserved as auth and data layers are added later.

## Deviations From Plan

- None on Step 2 outputs.
- The scaffold includes an additional `prisma.config.ts` because Prisma 7 requires it for datasource configuration.
