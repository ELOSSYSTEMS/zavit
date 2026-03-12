# Step 9 Kickoff: Report Intake And Complaint Workflow

## Goal

Add the critical public correction and publisher complaint flows, persist them into `CorrectionReport` and `OperatorCase`, and expose a guarded admin queue that can acknowledge, suppress, and resolve those cases without undocumented manual steps.

## Inputs Read

- [Step 8 gate](../08-admin-ops/30-gate.md)
- [Step 8 handoff](../08-admin-ops/40-handoff.md)
- [ADR-005-public-admin-separation.md](../../../../docs/adr/ADR-005-public-admin-separation.md)
- [compliance-workflow.md](../../../../docs/compliance-workflow.md)
- [schema.prisma](../../../../prisma/schema.prisma)

## Dependencies

- Admin auth and role enforcement from Step 8 remain the required control boundary for complaint handling.
- `CorrectionReport`, `OperatorCase`, and `OperatorActionAudit` remain the system-of-record entities for intake and case progression.
- Public complaint flows must stay metadata-only and must not store full article bodies or attachments in v1.

## Non-Goals

- Do not add external notification providers or mailbox integrations yet.
- Do not add public moderation dashboards or expose internal queue state on public routes.
- Do not bypass the existing event suppression and source disablement controls introduced in Step 8.

## Risks

- Weak intake validation could create noisy or abusive queue entries that swamp the admin surface.
- Case-state transitions without clear audit writes would undermine the compliance workflow.
- Emergency complaint handling can become misleading if case suppression state drifts from actual event/source public state.

## Planned Outputs

- Public correction/report intake route
- Publisher complaint intake route
- Abuse scoring and SLA-state helpers
- Guarded admin case queue and operator case-state actions
- Focused submission, abuse-control, and queue-state tests plus Step 9 harness evidence
