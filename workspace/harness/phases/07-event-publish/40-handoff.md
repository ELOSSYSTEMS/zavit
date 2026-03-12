# Step 7 Handoff: Event Formation And Publish Gating

## Next Step Inputs

Before Step 8 work, read these first:

- [30-gate.md](./30-gate.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [pipeline.mjs](../../../../lib/events/pipeline.mjs)
- [predict-groups.mjs](../../../../lib/clustering/predict-groups.mjs)
- [run-clustering-regression.mjs](../../../../scripts/run-clustering-regression.mjs)
- [run-event-pipeline.mjs](../../../../scripts/run-event-pipeline.mjs)
- [page.tsx](../../../../app/admin/pipeline/page.tsx)
- [page.tsx](../../../../app/admin/events/[id]/page.tsx)

## Locked Assumptions

- Public reads must continue to use only `PUBLISHED` events and latest successful run snapshots
- The Step 6 regression harness remains mandatory for clustering changes
- The live Step 7 provider baseline is Gemini embeddings via `GEMINI_API_KEY`
- Incomplete ingest coverage must continue to block publish before snapshot writes

## Open Questions

- Whether stale held events from earlier runs should be archived, superseded, or retained as operator evidence
- How much live clustering recall should improve before Step 10 public-read work broadens the feed
- Whether per-run regression artifacts should be persisted for operator review instead of only command output

## Required References

- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [schema.prisma](../../../../prisma/schema.prisma)
- [page.tsx](../../../../app/events/[id]/page.tsx)
- [page.tsx](../../../../app/page.tsx)
