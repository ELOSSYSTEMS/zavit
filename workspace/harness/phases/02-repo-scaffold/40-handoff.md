# Step 2 Handoff: Repo Scaffold

## Next Step Inputs

Step 3 must read these first:

- [30-gate.md](./30-gate.md)
- [40-handoff.md](../01-contract-lock/40-handoff.md)
- [ADR-001-standalone-web-app.md](../../../../docs/adr/ADR-001-standalone-web-app.md)
- [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md)
- [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md)
- [package.json](../../../../package.json)
- [prisma.config.ts](../../../../prisma.config.ts)
- [schema.prisma](../../../../prisma/schema.prisma)
- [env.example](../../../../env.example)

## Locked Assumptions

- The implementation repo lives under `project/`
- The baseline is one Next.js app plus one Node.js worker process
- Prisma remains the only schema authority
- Public/admin route separation already exists and should be preserved
- OpenAI remains the default v1 embeddings provider

## Open Questions

- Which product-domain entities and states Step 3 will add first
- How Step 3 will model publish snapshots, auditability, and legal/compliance entities without reintroducing a public `Cluster` object

## Required References

- [app/page.tsx](../../../../app/page.tsx)
- [app/admin/pipeline/page.tsx](../../../../app/admin/pipeline/page.tsx)
- [app/admin/events/[id]/page.tsx](../../../../app/admin/events/[id]/page.tsx)
- [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx)
- [app/events/[id]/page.tsx](../../../../app/events/[id]/page.tsx)
- [app/sources/page.tsx](../../../../app/sources/page.tsx)
- [jobs/worker.ts](../../../../jobs/worker.ts)
- [README.md](../../../../README.md)
