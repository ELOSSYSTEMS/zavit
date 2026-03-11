# Evaluation Gate

## Status

Step 1 draft on 2026-03-12

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

## Deferred Step 6 Decisions

- Exact confidence computation method
- Exact false-merge acceptance threshold
- Exact hold-rate tolerance
- Exact evaluation-runner implementation and artifact format

These are not Step 1 blockers and do not block Step 2 scaffolding. They remain build-stopping for Step 6 clustering acceptance and Step 7 public publish logic.
