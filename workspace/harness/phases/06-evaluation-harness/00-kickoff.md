# Step 6 Kickoff: Evaluation Harness

## Goal

Make clustering quality measurable before any event publication logic is accepted, using a labeled metadata-only dataset, a reproducible evaluation runner, and explicit numeric thresholds.

## Inputs Read

- [30-gate.md](../05-ingestion-health/30-gate.md)
- [40-handoff.md](../05-ingestion-health/40-handoff.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md)
- [REBUILD_BLUEPRINT.md](../../../../analysis/REBUILD_BLUEPRINT.md)
- [IMPLEMENTATION_SPEC_A.md](../../../../IMPLEMENTATION_SPEC_A.md)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)

## Dependencies

- Step 5 provides the working metadata-only ingest baseline and the current source roster assumptions
- Step 6 must stay harness-first and must not materialize durable events or publish snapshots
- Evaluation artifacts must be reproducible without requiring live embeddings or live source fetch

## Non-Goals

- No embeddings generation
- No candidate retrieval implementation
- No event materialization or publish logic
- No public or admin UI changes

## Risks

- Thresholds could be written in a way that is too vague for Step 7 to enforce
- A fixture-only harness could overstate readiness if it is mistaken for production clustering evidence
- Dataset coverage could miss ambiguous recurring incidents or cross-language edge cases

## Planned Outputs

- Labeled metadata-only clustering dataset under `tests/fixtures/evaluation/`
- Reproducible evaluation runner and sample prediction artifact
- Explicit numeric thresholds in [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- Step 6 evidence, checks, gate, and handoff artifacts
