# Step 6 Evidence: Evaluation Harness

## Decisions Made

- Added a metadata-only labeled clustering dataset at [labeled-clustering-dataset.v1.json](../../../../tests/fixtures/evaluation/labeled-clustering-dataset.v1.json).
- Added a prediction-format evaluation runner at [run-clustering-eval.mjs](../../../../scripts/run-clustering-eval.mjs) backed by [clustering-eval.mjs](../../../../lib/evaluation/clustering-eval.mjs).
- Added a sample passing prediction artifact at [predictions-sample-pass.v1.json](../../../../tests/fixtures/evaluation/predictions-sample-pass.v1.json) so the report format and threshold logic can be exercised deterministically.
- Updated [evaluation-gate.md](../../../../docs/evaluation-gate.md) with exact metric formulas, artifact definitions, and numeric Step 6 thresholds.
- Added a human-readable acceptance artifact at [clustering-eval-baseline.md](../../../../docs/artifacts/clustering-eval-baseline.md).

## Files Or Modules Affected

- `project/package.json`
- `project/lib/evaluation/clustering-eval.mjs`
- `project/scripts/run-clustering-eval.mjs`
- `project/tests/fixtures/evaluation/*.json`
- `project/tests/evaluation/clustering-eval.test.mjs`
- `project/docs/evaluation-gate.md`
- `project/docs/artifacts/clustering-eval-baseline.md`
- `project/workspace/harness/phases/06-evaluation-harness/*.md`

## Findings That Affect Later Steps

- Step 7 can now consume a stable prediction artifact format instead of inventing ad hoc clustering reports.
- The accepted Step 6 thresholds are now explicit:
  - false merge rate `<= 0.01`
  - hold rate `<= 0.20`
  - publish-eligible precision `>= 1.00`
  - publish-eligible recall `>= 0.85`
- The current harness is intentionally fixture-driven; it proves measurability and artifact reproducibility, not production clustering quality.
- Dataset coverage includes Hebrew, English, and Arabic items plus ambiguous protest announcements and a single-source rumor hold.

## Deviations From Plan

- The Step 6 harness uses synthetic metadata fixtures rather than live Step 5 DB exports so the acceptance artifact remains deterministic and reproducible in CI.
- No embeddings or candidate retrieval code was added in Step 6; that remains Step 7 work by design.
