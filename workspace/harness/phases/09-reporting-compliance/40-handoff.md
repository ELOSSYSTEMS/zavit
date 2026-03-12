# Step 9 Handoff: Report Intake And Complaint Workflow

## Next Step Inputs

Before any Step 9 unblock work, read these first:

- [30-gate.md](./30-gate.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [page.tsx](../../../../app/report/page.tsx)
- [actions.ts](../../../../app/report/actions.ts)
- [page.tsx](../../../../app/admin/cases/page.tsx)
- [actions.ts](../../../../app/admin/actions.ts)
- [workflow.mjs](../../../../lib/reports/workflow.mjs)
- [page.tsx](../../../../app/admin/login/page.tsx)

## Locked Assumptions

- Public intake remains metadata-only in v1.
- `operator` remains required for complaint progression and resolution.
- Complaint suppression continues to depend on the existing Step 8 event/source mutation paths plus explicit queue-state updates.
- Build-green evidence is not enough to close Step 9 without live runtime-configured admin processing.

## Open Questions

- Whether the eventual notification path should be email-first, inbox-first, or both.
- Whether emergency suppression should acquire a dedicated one-click queue action once the live workflow is proven.
- How much disclosure copy from the new report flow should surface in Step 10 public routes.

## Required References

- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [page.tsx](../../../../app/events/[id]/page.tsx)
- [page.tsx](../../../../app/about/page.tsx)
