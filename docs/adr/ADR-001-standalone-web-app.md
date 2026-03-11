# ADR-001: Standalone Public Web App

## Status

Accepted on 2026-03-12

## Context

- Verified: The adversarial review resolves the product type as "a standalone public web app with internal admin surfaces."
- Verified: Public routes are `/`, `/events/[id]`, `/sources`, and `/about`.
- Verified: Internal admin routes are `/admin/pipeline`, `/admin/events/[id]`, and `/admin/sources`.
- Verified: Shopify-specific architecture is out of scope for the rebuild.

## Decision

ZAVIT will be rebuilt as one standalone web application with two clearly separated surfaces:

- Public read surface for anonymous users
- Internal admin surface for authenticated operators and reviewers

The rebuild will not use Shopify app patterns, Shopify auth, or Shopify deployment assumptions.

## Evidence

- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- [00_PRODUCT_DEFINITION.md](../../canon/00_PRODUCT_DEFINITION.md)
- [09_PHASE_AND_APPROVAL_MODEL.md](../../canon/09_PHASE_AND_APPROVAL_MODEL.md)

## Consequences

- Step 2 must scaffold public and admin routes as separate surfaces.
- Shared data contracts may exist, but route access and actions must be separated by surface and role.
- Framework/runtime selection is still unresolved and remains a build-stopping Step 2 input.
