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
- Step 1 did not approve the final named roster. Step 4 now locks that roster for v1.
- Reference inputs exist in [reference/sources.ts](../reference/sources.ts) and [reference/PLAN.md](../reference/PLAN.md), and Step 4 must convert them into the final approved roster and metadata table.
- Step 2 and Step 3 may scaffold against source-policy fields and seed interfaces without finalizing the named roster.

## Approved v1 Roster

The Step 4 approved v1 roster is:

- Ynet
- N12
- Walla
- Haaretz
- Maariv
- Israel Hayom
- Kan News
- Globes
- Makor Rishon
- Kikar HaShabbat
- Makan
- Davar

The canonical Step 4 policy rows and Step 5 seed inputs live in [approved-roster.json](../lib/sources/approved-roster.json).

## Metadata Handling Rules

- Ownership and independence fields in the Step 4 roster are operational policy labels for corroboration and audit purposes, not corporate-registry assertions.
- When a metadata field is not safely known, the roster must use an explicit `UNKNOWN` enum or a neutral note instead of guessing.
- Same-parent brands must be assigned the same independence group in the Step 4 roster so Step 5 and Step 7 cannot miscount them as distinct corroboration.
- Step 5 may refine crawl endpoints, but it may not change the approved roster membership or independence grouping without updating the Step 4 evidence trail.

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

- Build-stopping for Step 5: validate the section-crawl seeds for Kan News, Globes, Kikar HaShabbat, and Makan against live site behavior
- Non-blocking for Step 5: refine paywall metadata where the current Step 4 row intentionally remains `UNKNOWN`
- Non-blocking for future governance: exact source admission approver identity
