# ADR-003: Source Independence Rule

## Status

Accepted on 2026-03-12

## Context

- Verified: The canon requires at least two distinct, independent sources for a confirmed Event.
- Verified: The adversarial review resolves independence as editorial-control and ownership separation, not mere URL or branding differences.
- Verified: The source roster itself is not yet locked by name.

## Decision

Two sources count as independent only when they have distinct editorial control and ownership.

The following do not count as independent corroboration in v1:

- Same-brand subfeeds
- Shared parent-group clones
- Mirror publications of the same reporting
- Straight wire rewrites without distinct reporting

Each admitted source record must eventually carry enough metadata to justify independence evaluation, including:

- Legal or operating owner
- Editorial brand
- Outlet type
- Language coverage
- Independence notes

## Evidence

- [03_EVENT_MODEL.md](../../canon/03_EVENT_MODEL.md)
- [04_SOURCE_TREATMENT.md](../../canon/04_SOURCE_TREATMENT.md)
- [02_SCOPE_BOUNDARIES.md](../../canon/02_SCOPE_BOUNDARIES.md)
- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)

## Consequences

- Step 3 schema must store independence-supporting metadata or a source-policy reference.
- Step 4 cannot finalize the roster without explicit ownership and editorial notes.
- Duplicate feeds from the same outlet may still be ingested, but cannot satisfy corroboration alone.
