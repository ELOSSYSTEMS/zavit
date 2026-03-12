# Step 6 Handoff: Evaluation Harness

## Next Step Inputs

Before Step 7 work, read these first:

- [30-gate.md](./30-gate.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [clustering-eval.mjs](../../../../lib/evaluation/clustering-eval.mjs)
- [run-clustering-eval.mjs](../../../../scripts/run-clustering-eval.mjs)
- [labeled-clustering-dataset.v1.json](../../../../tests/fixtures/evaluation/labeled-clustering-dataset.v1.json)
- [predictions-sample-pass.v1.json](../../../../tests/fixtures/evaluation/predictions-sample-pass.v1.json)

## Locked Assumptions

- Step 6 is harness-only and does not count as production clustering evidence
- Step 7 must emit the prediction artifact format consumed by [run-clustering-eval.mjs](../../../../scripts/run-clustering-eval.mjs)
- Threshold changes require coordinated updates to code, [evaluation-gate.md](../../../../docs/evaluation-gate.md), and the acceptance artifact
- Metadata-only storage remains the rule for clustering inputs in v1

## Open Questions

- Whether Step 7 should evaluate per-run predictions only or also retain historical evaluation artifacts
- Whether the dataset should expand before Step 7 to include more recurring military and political incidents
- How Step 7 will compute confidence scores that map into the [ADR-004](../../../../docs/adr/ADR-004-confidence-thresholds.md) states

## Required References

- [schema.prisma](../../../../prisma/schema.prisma)
- [approved-roster.json](../../../../lib/sources/approved-roster.json)
- [run-ingest.mjs](../../../../lib/ingest/run-ingest.mjs)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [clustering-eval-baseline.md](../../../../docs/artifacts/clustering-eval-baseline.md)
