# Step 3 Handoff: Schema And State Model

## Next Step Inputs

Step 4 and Step 5 must read these first:

- [30-gate.md](./30-gate.md)
- [40-handoff.md](../02-repo-scaffold/40-handoff.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [schema.prisma](../../../../prisma/schema.prisma)
- [prisma.config.ts](../../../../prisma.config.ts)

## Locked Assumptions

- `Source` holds policy-facing metadata fields needed for later roster approval
- `Article` remains metadata-only and does not include article body storage
- `Event` is the durable domain object; no public `Cluster` object exists
- `PublishSnapshot` is the public publication boundary
- `OperatorCase` and `OperatorActionAudit` are the baseline compliance and audit anchors

## Open Questions

- Which exact named sources will fill the `Source` table in Step 4
- Which source-policy fields Step 4 will treat as required vs temporarily unknown
- Which ingestion normalization details Step 5 will need beyond the current article fields

## Required References

- [package.json](../../../../package.json)
- [env.example](../../../../env.example)
- [jobs/worker.ts](../../../../jobs/worker.ts)
- [app/sources/page.tsx](../../../../app/sources/page.tsx)
- [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx)
