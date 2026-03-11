# ADR-004: Confidence Threshold Mapping

## Status

Accepted on 2026-03-12

## Context

- Verified: The canon requires low-confidence signaling below 99%.
- Verified: The adversarial review locks threshold bands for publish, warning, review, and rejection.
- Unknown: the exact confidence computation formula is not yet defined.

## Decision

The v1 confidence bands are:

| Confidence | Outcome |
| --- | --- |
| `>= 0.995` | Publishable without warning |
| `0.990-0.994` | Publishable with visible low-confidence label |
| `0.970-0.989` | Internal review only |
| `< 0.970` | Reject or hold |

These thresholds define product behavior immediately, even though the scoring formula is deferred to later implementation work.

## Evidence

- [07_USER_TRUST_AND_TRANSPARENCY.md](../../canon/07_USER_TRUST_AND_TRANSPARENCY.md)
- [01_EPISTEMIC_POSTURE.md](../../canon/01_EPISTEMIC_POSTURE.md)
- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)

## Consequences

- Step 3 schema must persist confidence values and review states.
- Step 6 evaluation work must define and justify the scoring formula against this mapping.
- Step 7 and Step 10 must present low-confidence states explicitly.
