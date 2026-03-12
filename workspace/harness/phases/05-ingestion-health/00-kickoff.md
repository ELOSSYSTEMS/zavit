# Step 5 Kickoff: Ingestion And Health Tracking

## Goal

Implement the first real metadata-ingestion loop for the approved source roster, persist source health and ingest runs, and expose failure states without requiring direct DB inspection.

## Inputs Read

- [30-gate.md](../04-source-roster/30-gate.md)
- [40-handoff.md](../04-source-roster/40-handoff.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [approved-roster.json](../../../../lib/sources/approved-roster.json)
- [validate-source-roster.mjs](../../../../scripts/validate-source-roster.mjs)
- [schema.prisma](../../../../prisma/schema.prisma)
- [reference/sources.ts](../../../../reference/sources.ts)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)

## Dependencies

- The Step 4 approved roster remains the sole ingest baseline
- `Source`, `SourceHealth`, `PipelineRun`, and `Article` must persist the first ingest run without storing article bodies
- `independenceGroup` remains policy-only and is not introduced into the Step 3 schema during Step 5

## Non-Goals

- No embeddings or clustering work
- No publish logic
- No auth or operator case workflow changes
- No expansion beyond the approved Step 4 roster

## Risks

- Some approved sources may block server-side RSS or section fetches and leave the baseline run partial
- Prisma 7 runtime access may fail if the adapter configuration is wrong even when CLI commands succeed
- Section-crawl fallback could over-collect links unless URL normalization and candidate filtering stay tight

## Planned Outputs

- Source sync script to persist the approved roster into `Source`
- RSS-first ingest runner with section-crawl fallback
- URL normalization and dedupe helpers
- `PipelineRun` and `SourceHealth` persistence with failure recording
- DB-backed `/sources` and `/admin/sources` status views
- Step 5 evidence, checks, gate, and handoff artifacts
