# Evaluation Gate

## Status

Step 6 accepted on 2026-03-12

## Purpose

Define the minimum measurable gate required before clustering outputs can affect the public product.

## Locked Decisions

- The founder or operator owns the initial labeled clustering dataset and threshold sign-off.
- Public publication requires at least two distinct, independent sources.
- Confidence thresholds are governed by [ADR-004](./adr/ADR-004-confidence-thresholds.md).
- The default v1 embeddings provider is governed by [ADR-006](./adr/ADR-006-implementation-baseline.md).
- Low-confidence and unverified internal states must remain visible to operators.

## Required Gate Inputs

Before Step 7 publish logic is accepted, the project must have:

- A labeled regression dataset
- A reproducible evaluation runner
- Metric definitions for false merges and hold behavior
- A written acceptance report for the active threshold set

## Publish Eligibility Rules

- `>= 0.995`: eligible to publish without warning when corroboration rules are met
- `0.990-0.994`: eligible to publish only with a low-confidence label
- `0.970-0.989`: not public, internal review only
- `< 0.970`: reject or hold

## Step 6 Harness Definitions

- Dataset artifact:
  - metadata-only article fixtures plus labeled event groups and held articles
- Prediction artifact:
  - JSON object with `predictedGroups[]`, `heldArticleIds[]`, and `publishEligible` flags
- Runner output:
  - JSON report with summary counts, numeric metrics, threshold set, and pass/fail verdict

## Step 6 Acceptance Thresholds

- False merge rate:
  - defined as predicted same-event article pairs that cross labeled group boundaries divided by all predicted same-event pairs
  - threshold: `<= 0.01`
- Hold rate:
  - defined as labeled same-event article pairs left unclustered divided by all labeled same-event pairs
  - threshold: `<= 0.20`
- Publish-eligible precision:
  - defined as predicted publish-eligible groups that map cleanly to one labeled publish-eligible group divided by all predicted publish-eligible groups
  - threshold: `>= 1.00`
- Publish-eligible recall:
  - defined as labeled publish-eligible groups recovered by at least one predicted publish-eligible group divided by all labeled publish-eligible groups
  - threshold: `>= 0.85`

## Accepted Step 6 Artifacts

- Dataset: [labeled-clustering-dataset.v1.json](../tests/fixtures/evaluation/labeled-clustering-dataset.v1.json)
- Runner: [run-clustering-eval.mjs](../scripts/run-clustering-eval.mjs)
- Reproducibility check: [check-clustering-eval-repro.mjs](../scripts/check-clustering-eval-repro.mjs)
- Acceptance report: [clustering-eval-baseline.md](./artifacts/clustering-eval-baseline.md)

These definitions are not Step 1 blockers and do not block Step 2 scaffolding. They are build-stopping for Step 6 harness acceptance and Step 7 public publish logic.
