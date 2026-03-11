# Step 2 Kickoff: Repo Scaffold

## Goal

Create the clean implementation baseline under `project/` without importing prototype runtime code.

## Inputs Read

- [30-gate.md](../01-contract-lock/30-gate.md)
- [40-handoff.md](../01-contract-lock/40-handoff.md)
- [ADR-001-standalone-web-app.md](../../../../docs/adr/ADR-001-standalone-web-app.md)
- [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md)
- [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)

## Dependencies

- Step 1 gate remains `PASS`
- Next.js plus Node worker plus PostgreSQL plus Prisma plus pgvector baseline from ADR-006
- Public/admin route separation from ADR-005

## Non-Goals

- No source ingestion implementation
- No finalized v1 source roster
- No clustering or publish logic
- No auth implementation beyond route separation

## Risks

- Scaffold commands may introduce framework defaults that exceed the approved baseline
- Prisma validation may require pinning package versions compatible with the generated app
- Step 2 must avoid carrying any prototype runtime code from the archived repo

## Planned Outputs

- Framework scaffold under `project/`
- `env.example`
- Base folders for `app`, `lib`, `jobs`, `prisma`, `tests`, and `docs`
- Public and admin route separation
- Step 2 evidence, checks, gate, and handoff artifacts
