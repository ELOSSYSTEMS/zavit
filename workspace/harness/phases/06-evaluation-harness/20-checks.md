# Step 6 Checks: Evaluation Harness

## Automated Checks

- `npm run test:evaluation`
- `npm run eval:clustering`
- `npm run lint`
- `npm run typecheck`

## Manual Checks

- Reviewed dataset coverage for multilingual items, recurring-incident ambiguity, and single-source hold behavior
- Confirmed the runner output includes stable summary counts, metrics, thresholds, and a pass/fail verdict
- Confirmed the threshold text in [evaluation-gate.md](../../../../docs/evaluation-gate.md) matches the runner defaults in [clustering-eval.mjs](../../../../lib/evaluation/clustering-eval.mjs)
- Confirmed Step 6 does not add embeddings, event materialization, or public publish behavior

## Results

- `npm run test:evaluation`: passed
- `npm run eval:clustering`: passed
  - dataset version: `2026-03-12.v1`
  - prediction label: `fixture-sample-pass`
  - false merge rate: `0.0000`
  - hold rate: `0.0000`
  - publish-eligible precision: `1.0000`
  - publish-eligible recall: `1.0000`
- `npm run lint`: passed
- `npm run typecheck`: passed

## Failures And Warnings

- The passing evaluation result uses a sample prediction fixture, not actual clustering output
- Step 7 must rerun this harness against real clustering predictions before any publish logic is accepted

## Residual Risk

- The current dataset is intentionally small, so later threshold tuning may require broader incident coverage
- The runner measures group and pair quality, but it does not itself generate embeddings or candidate pairs
