# Step 1 Evidence: Contract Lock

## Decisions Made

- Accepted [ADR-001-standalone-web-app.md](../../../../docs/adr/ADR-001-standalone-web-app.md) to lock the rebuild as one standalone public web app with internal admin surfaces.
- Accepted [ADR-002-event-publication-rule.md](../../../../docs/adr/ADR-002-event-publication-rule.md) to forbid public single-source events in v1.
- Accepted [ADR-003-source-independence-rule.md](../../../../docs/adr/ADR-003-source-independence-rule.md) to define independence by ownership and editorial control.
- Accepted [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md) to lock publish/review/hold bands.
- Accepted [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md) to lock role and surface boundaries.
- Accepted [ADR-006-implementation-baseline.md](../../../../docs/adr/ADR-006-implementation-baseline.md) to lock the Step 2 framework/runtime baseline.
- Drafted [source-policy.md](../../../../docs/source-policy.md), [compliance-workflow.md](../../../../docs/compliance-workflow.md), and [evaluation-gate.md](../../../../docs/evaluation-gate.md) as Step 1 policy outputs.

## Files Or Modules Affected

- `docs/adr/*`
- `docs/source-policy.md`
- `docs/compliance-workflow.md`
- `docs/evaluation-gate.md`
- `workspace/harness/phases/01-contract-lock/*.md`

## Findings That Affect Later Steps

- Step 2 is now unblocked at the contract level because the implementation baseline is locked.
- Step 4 remains the correct phase for final named source-roster approval even though the target mix and metadata rules are now documented.
- Step 6 and Step 7 remain the correct phases for final evaluation metrics and clustering acceptance evidence.
- Public `Not Detected`, thumbnails, and public angles remain explicitly out of scope for v1.

## Deviations From Plan

- None on Step 1 outputs.
- Corrected the earlier gate framing so future-phase decisions are deferred to their proper steps instead of blocking Step 1.
