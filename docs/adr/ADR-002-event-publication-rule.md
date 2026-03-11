# ADR-002: Event Publication Rule

## Status

Accepted on 2026-03-12

## Context

- Verified: The canon defines an Event as a discrete real-world occurrence reported by at least two distinct, independent sources.
- Verified: The adversarial review identifies a conflict in earlier source files around whether single-source items may appear publicly.
- Verified: The locked decision set resolves that single-source items are never public in v1.

## Decision

ZAVIT will expose a public Event only when at least two distinct, independent sources corroborate the same discrete incident.

Additional rules:

- Single-source stories remain internal-only pending corroboration or rejection.
- `Cluster` may exist as an internal processing construct, but never as a durable public object.
- `Not Detected` remains internal-only in v1.
- Public angles are out of scope for v1 unless explicitly re-approved after launch.

## Evidence

- [03_EVENT_MODEL.md](../../canon/03_EVENT_MODEL.md)
- [05_COVERAGE_AND_ABSENCE_CLAIMS.md](../../canon/05_COVERAGE_AND_ABSENCE_CLAIMS.md)
- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)

## Consequences

- Step 3 schema work must model internal pending states for single-source reports.
- Step 7 publish logic must fail closed when corroboration is missing.
- Step 10 public UI must not expose single-source items as Events.
