# Step 1 Kickoff: Contract Lock

## Goal

Freeze the product rules, v1 boundaries, and trust/compliance constraints required before repo scaffolding begins.

## Inputs Read

- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)
- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- [00_PRODUCT_DEFINITION.md](../../../../canon/00_PRODUCT_DEFINITION.md)
- [01_EPISTEMIC_POSTURE.md](../../../../canon/01_EPISTEMIC_POSTURE.md)
- [02_SCOPE_BOUNDARIES.md](../../../../canon/02_SCOPE_BOUNDARIES.md)
- [03_EVENT_MODEL.md](../../../../canon/03_EVENT_MODEL.md)
- [04_SOURCE_TREATMENT.md](../../../../canon/04_SOURCE_TREATMENT.md)
- [05_COVERAGE_AND_ABSENCE_CLAIMS.md](../../../../canon/05_COVERAGE_AND_ABSENCE_CLAIMS.md)
- [07_USER_TRUST_AND_TRANSPARENCY.md](../../../../canon/07_USER_TRUST_AND_TRANSPARENCY.md)
- [08_LEGAL_AND_COMPLIANCE_POSTURE.md](../../../../canon/08_LEGAL_AND_COMPLIANCE_POSTURE.md)
- [09_PHASE_AND_APPROVAL_MODEL.md](../../../../canon/09_PHASE_AND_APPROVAL_MODEL.md)
- [reference/sources.ts](../../../../reference/sources.ts)

## Dependencies

- Canon rules 00-09 remain authoritative
- Locked decisions section in [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- Existing harness loop under [workspace/harness](../../)

## Non-Goals

- No framework scaffold yet
- No schema or migrations
- No source roster approval by name
- No ingestion, clustering, or UI implementation

## Risks

- Step 1 must avoid turning Step 4 and Step 6 inputs into false Step 1 blockers
- Source roster approval is intentionally deferred to Step 4
- Evaluation methodology is intentionally completed in Step 6, not Step 1

## Planned Outputs

- [ADR-001-standalone-web-app.md](../../../../docs/adr/ADR-001-standalone-web-app.md)
- [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md)
- [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
