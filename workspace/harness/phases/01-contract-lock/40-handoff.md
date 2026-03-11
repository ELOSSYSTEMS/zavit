# Step 1 Handoff: Contract Lock

## Next Step Inputs

Step 2 and Step 3 must read these first:

- [ADR-001-standalone-web-app.md](../../../../docs/adr/ADR-001-standalone-web-app.md)
- [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md)
- [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [30-gate.md](./30-gate.md)

## Locked Assumptions

- ZAVIT is a standalone public web app with internal admin surfaces
- Public events require at least two distinct, independent sources
- Public single-source events are out of scope for v1
- Public `Not Detected`, public angles, and thumbnails are out of scope for v1
- Confidence thresholds are locked at the product-behavior level
- Step 2 uses the Next.js plus Node worker plus Postgres plus Prisma plus pgvector baseline
- `reviewer` and `operator` roles are required, with sensitive actions reserved for `operator`

## Open Questions

- Which 12 named sources are approved for the v1 roster in Step 4
- Which exact evaluation metrics and artifact format are accepted for the Step 6 clustering gate

## Required References

- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- [ADVERSARIAL_REVIEW_STEP_PLAN.md](../../../plan/step/ADVERSARIAL_REVIEW_STEP_PLAN.md)
- [00_PRODUCT_DEFINITION.md](../../../../canon/00_PRODUCT_DEFINITION.md)
- [03_EVENT_MODEL.md](../../../../canon/03_EVENT_MODEL.md)
- [04_SOURCE_TREATMENT.md](../../../../canon/04_SOURCE_TREATMENT.md)
- [07_USER_TRUST_AND_TRANSPARENCY.md](../../../../canon/07_USER_TRUST_AND_TRANSPARENCY.md)
- [08_LEGAL_AND_COMPLIANCE_POSTURE.md](../../../../canon/08_LEGAL_AND_COMPLIANCE_POSTURE.md)
