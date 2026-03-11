# ADR-005: Public And Admin Separation

## Status

Accepted on 2026-03-12

## Context

- Verified: Public/admin separation is mandatory in the review and plan.
- Verified: Admin auth requires allowlisted email, password, and TOTP.
- Verified: Roles are `reviewer` and `operator`, with `operator` required for source disablement, event suppression, and legal-case resolution.

## Decision

ZAVIT will maintain a hard boundary between public read routes and admin/operator routes.

Role rules:

- Public routes require no privileged access.
- `reviewer` may inspect and review internal state but may not disable sources or resolve legal/compliance cases.
- `operator` may perform sensitive state-changing actions, including source disablement, event suppression, and case resolution.

## Evidence

- [ADVERSARIAL_IMPLEMENTATION_REVIEW.md](../../ADVERSARIAL_IMPLEMENTATION_REVIEW.md)
- [07_USER_TRUST_AND_TRANSPARENCY.md](../../canon/07_USER_TRUST_AND_TRANSPARENCY.md)
- [08_LEGAL_AND_COMPLIANCE_POSTURE.md](../../canon/08_LEGAL_AND_COMPLIANCE_POSTURE.md)
- [09_PHASE_AND_APPROVAL_MODEL.md](../../canon/09_PHASE_AND_APPROVAL_MODEL.md)

## Consequences

- Step 2 scaffold must create route separation from day one.
- Step 8 must implement authn, authz, and audit coverage for all operator actions.
- Shared components or APIs must not weaken authorization boundaries.
