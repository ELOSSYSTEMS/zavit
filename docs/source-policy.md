# Source Policy

## Status

Step 1 draft on 2026-03-12

## Purpose

Define the admission, metadata, and treatment rules for v1 editorial sources before ingestion or public comparison begins.

## Locked Rules

- Verified: Sources must be established professional news outlets with an editorial board or identifiable journalistic structure.
- Verified: Inputs may be in Hebrew, English, or Arabic, while public output remains Hebrew-only in v1.
- Verified: Sources are displayed with equal platform treatment and mandatory attribution.
- Verified: Paywalled material must be marked and never bypassed.
- Verified: Social media, pure opinion blogs, and non-editorial sources are excluded.

## Admission Requirements

A source is admissible only if it satisfies all of the following:

- Covers Israel, the West Bank, Gaza, or directly Israel-relevant events
- Has an identifiable editorial structure
- Can be ingested through an approved metadata-only mechanism
- Can be linked out directly to original reporting
- Does not require body storage or reader-mode reproduction to provide value

## Required Metadata For Each Admitted Source

Each approved source record must eventually capture:

- Display name
- Canonical domain
- Primary language or languages
- Editorial type
- Ownership or operating entity
- Paywall status
- Availability status
- Independence notes
- Ingest method and feed endpoint

## Corroboration Policy

- Distinct feeds from the same brand are not independent corroboration.
- Same-parent or mirrored publications are not independent corroboration unless Step 4 records a justified exception.
- Wire rewrites do not count as independent corroboration by default.

## v1 Roster Constraint

- Locked target: 12 approved sources spanning mainstream Hebrew, public broadcast, business, religious or Haredi, and Arab-community coverage.
- Step 1 does not approve the final named roster. That approval belongs to Step 4 by the active execution plan.
- Reference inputs exist in [reference/sources.ts](../reference/sources.ts) and [reference/PLAN.md](../reference/PLAN.md), and Step 4 must convert them into the final approved roster and metadata table.
- Step 2 and Step 3 may scaffold against source-policy fields and seed interfaces without finalizing the named roster.

## Stored Field Policy

The product may store only:

- Headline
- Short snippet
- Canonical URL
- Publication timestamp
- Source identity and policy metadata
- Paywall and availability status
- Operator-authored neutral source metadata

The product may not store article body text or thumbnails in v1.

## Open Items

- Build-stopping for Step 4 and ingestion: final named roster approval
- Non-blocking for Step 2 scaffold: exact source admission approver identity
- Non-blocking for Step 2 scaffold: exact public-broadcast, business, and Arab-community candidates remain to be named in Step 4
