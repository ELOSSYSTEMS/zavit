# Step 8 Kickoff: Admin Security And Operator Tooling

## Goal

Protect the existing admin routes with allowlisted auth, enforce `reviewer` and `operator` boundaries, and make operator-only state changes auditable before Step 9 report intake broadens the trust surface.

## Inputs Read

- [Step 7 gate](../07-event-publish/30-gate.md)
- [Step 7 handoff](../07-event-publish/40-handoff.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [schema.prisma](../../../../prisma/schema.prisma)

## Dependencies

- The existing Step 7 public publish gate remains the only public event read path.
- `OperatorActionAudit`, `Source`, and `Event` state already exist in Prisma and must remain the source of truth.
- Role boundaries must fail closed when auth config is missing, invalid, or expired.

## Non-Goals

- Do not add public report intake or publisher complaint handling yet.
- Do not change Step 7 publish rules or clustering behavior.
- Do not add external auth providers or relax the allowlist, password, and TOTP contract.

## Risks

- Weak or misconfigured session handling could silently expose admin pages.
- Operator actions without required reasons would weaken the audit trail.
- Reviewer/operator role drift would undermine the Step 1 public/admin separation decision.

## Planned Outputs

- Admin login flow using allowlisted email, password, and TOTP
- Signed session cookie handling with page-level admin guards
- Role-aware admin pipeline, source, and event pages
- Operator-only source disable/enable and event suppress/restore actions with audit writes
- Focused auth and authorization tests plus Step 8 harness evidence
