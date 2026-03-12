# Clustering Evaluation Baseline

## Scope

This Step 6 artifact accepts the evaluation harness format, metric definitions, and threshold set. It does not claim that production clustering is implemented yet.

## Dataset And Runner

- Dataset: [labeled-clustering-dataset.v1.json](../../tests/fixtures/evaluation/labeled-clustering-dataset.v1.json)
- Sample predictions: [predictions-sample-pass.v1.json](../../tests/fixtures/evaluation/predictions-sample-pass.v1.json)
- Runner: [run-clustering-eval.mjs](../../scripts/run-clustering-eval.mjs)
- Reproducibility check: [check-clustering-eval-repro.mjs](../../scripts/check-clustering-eval-repro.mjs)

## Active Thresholds

- false merge rate: `<= 0.01`
- hold rate: `<= 0.20`
- publish-eligible precision: `>= 1.00`
- publish-eligible recall: `>= 0.85`

## Sample Harness Result

- dataset version: `2026-03-12.v1`
- prediction label: `fixture-sample-pass`
- verdict: `PASS`
- false merge rate: `0.0000`
- hold rate: `0.0000`
- publish-eligible precision: `1.0000`
- publish-eligible recall: `1.0000`
- reproducibility check: `PASS`

## Limitation

Step 7 must replace the sample prediction fixture with actual clustering output before any publish logic can be accepted.
