# Step 3 Kickoff: Schema And State Model

## Goal

Encode the trust-critical domain entities and state transitions in Prisma before feature work spreads assumptions across the app.

## Inputs Read

- [30-gate.md](../02-repo-scaffold/30-gate.md)
- [40-handoff.md](../02-repo-scaffold/40-handoff.md)
- [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md)
- [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [IMPLEMENTATION_SPEC_A.md](../../../../IMPLEMENTATION_SPEC_A.md)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)

## Dependencies

- Step 2 scaffold and Prisma 7 config under `project/`
- Step 1 contract lock and ADR set
- No durable public `Cluster` object

## Non-Goals

- No ingestion implementation
- No source roster seeding
- No auth implementation
- No publish logic or evaluation runner

## Risks

- Schema may omit audit or compliance states that later phases need
- Schema may accidentally reintroduce a public-cluster concept if event-state boundaries are sloppy
- Prisma 7 validation requires config discipline; datasource URLs must remain outside `schema.prisma`

## Planned Outputs

- Expanded [schema.prisma](../../../../prisma/schema.prisma) with source, article, pipeline, event, evidence, review, report, case, publish snapshot, and audit entities
- Step 3 evidence, checks, gate, and handoff artifacts
