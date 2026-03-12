# Step 8 Handoff: Admin Security And Operator Tooling

## Next Step Inputs

Before Step 9 work, read these first:

- [30-gate.md](./30-gate.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [actions.ts](../../../../app/admin/actions.ts)
- [page.tsx](../../../../app/admin/login/page.tsx)
- [page.tsx](../../../../app/admin/sources/page.tsx)
- [page.tsx](../../../../app/admin/events/[id]/page.tsx)
- [auth-core.mjs](../../../../lib/admin/auth-core.mjs)
- [auth.mjs](../../../../lib/admin/auth.mjs)
- [schema.prisma](../../../../prisma/schema.prisma)

## Locked Assumptions

- Admin access continues to require allowlisted email, shared password, and TOTP.
- `reviewer` remains read-only on current admin pages.
- `operator` remains required for source disablement, event suppression, and future complaint/case resolution.
- Every destructive or suppressive admin action must write `OperatorActionAudit`.

## Open Questions

- Whether Step 9 should store public correction and complaint attachments directly or only metadata plus references.
- Whether report intake should require abuse throttling before persistence or whether scoring-only is sufficient for Step 9.
- How Step 9 should connect `CorrectionReport` intake to `OperatorCase` creation when the target event or source lookup is ambiguous.

## Required References

- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [page.tsx](../../../../app/page.tsx)
- [page.tsx](../../../../app/events/[id]/page.tsx)
