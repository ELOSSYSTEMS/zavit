## ZAVIT Project Scaffold

Step 2 establishes the implementation baseline for ZAVIT inside `project/`.

## Included in this scaffold

- One Next.js application for public and admin routes
- One Prisma schema authority under `prisma/`
- Placeholder worker entrypoint under `jobs/`
- Tracked `docs/` and `tests/` folders
- Public/admin route separation without feature logic

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npx prisma validate
```

## Not included yet

- Source ingestion
- Clustering and publish logic
- Authentication and authorization enforcement
- Approved v1 source roster
