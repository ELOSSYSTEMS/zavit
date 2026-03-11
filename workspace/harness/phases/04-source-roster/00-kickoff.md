# Step 4 Kickoff: Source Roster And Metadata Policy

## Goal

Lock the first approved 12-source roster, its policy-facing metadata rows, and the exact Step 5 seed inputs before ingestion code starts.

## Inputs Read

- [30-gate.md](../03-schema-state/30-gate.md)
- [40-handoff.md](../03-schema-state/40-handoff.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [schema.prisma](../../../../prisma/schema.prisma)
- [reference/sources.ts](../../../../reference/sources.ts)
- [reference/PLAN.md](../../../../reference/PLAN.md)
- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)

## Dependencies

- Step 3 `Source` schema fields must remain the source-policy contract for the roster rows
- The approved roster must span mainstream Hebrew, public broadcast, business, religious or Haredi, and Arab-community coverage
- Same-parent independence rules from [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md) must stay enforceable in the roster artifact

## Non-Goals

- No ingestion runtime implementation
- No DB seed runner
- No source UI implementation or admin workflow changes
- No expansion beyond the first approved 12 sources

## Risks

- Ownership and paywall metadata may be over-asserted if Step 4 guesses instead of using explicit unknowns
- Same-parent sources could be misclassified as independent if the roster does not encode independence grouping
- Section-crawl seeds may need refinement in Step 5 if the current entry points are too broad or unstable

## Planned Outputs

- Canonical source roster file at [approved-roster.json](../../../../lib/sources/approved-roster.json)
- Validation script at [validate-source-roster.mjs](../../../../scripts/validate-source-roster.mjs)
- `package.json` script wiring for source-roster validation
- Updated [source-policy.md](../../../../docs/source-policy.md) with the final named v1 roster and unknown-metadata handling rules
- Step 4 evidence, checks, gate, and handoff artifacts
