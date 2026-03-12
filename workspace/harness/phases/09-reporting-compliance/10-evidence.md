# Step 9 Evidence: Report Intake And Complaint Workflow

## Decisions Made

- Added report-intake workflow helpers in [workflow.mjs](../../../../lib/reports/workflow.mjs) for abuse scoring, SLA-state derivation, queue-state transitions, and intake normalization.
- Added DB-backed public intake server actions in [actions.ts](../../../../app/report/actions.ts) that create paired `CorrectionReport` and `OperatorCase` records.
- Added the public intake route in [page.tsx](../../../../app/report/page.tsx) with separate public-report and publisher-complaint forms.
- Added the guarded admin complaint queue in [page.tsx](../../../../app/admin/cases/page.tsx) and extended [actions.ts](../../../../app/admin/actions.ts) with operator-only case-state progression.
- Added public entry points to the report flow from [page.tsx](../../../../app/events/[id]/page.tsx) and [page.tsx](../../../../app/about/page.tsx).
- Added focused submission and queue-state tests in [tests/reports/submission.test.mjs](../../../../tests/reports/submission.test.mjs) and [tests/reports/queue-state.test.mjs](../../../../tests/reports/queue-state.test.mjs).

## Files Or Modules Affected

- `project/app/report/actions.ts`
- `project/app/report/page.tsx`
- `project/app/admin/actions.ts`
- `project/app/admin/cases/page.tsx`
- `project/app/events/[id]/page.tsx`
- `project/app/about/page.tsx`
- `project/app/admin/pipeline/page.tsx`
- `project/app/admin/sources/page.tsx`
- `project/app/admin/events/[id]/page.tsx`
- `project/app/globals.css`
- `project/package.json`
- `project/lib/reports/workflow.mjs`
- `project/tests/reports/*.test.mjs`
- `project/workspace/harness/phases/09-reporting-compliance/*.md`

## Findings That Affect Later Steps

- Public correction and publisher complaint intake now land in `CorrectionReport` and create matching `OperatorCase` rows through the same server-action path.
- Abuse signals now fail closed into `ACTION_REQUIRED` queue state when the honeypot is triggered or the abuse score crosses the threshold.
- SLA state can now be derived from case type and age without adding new schema columns.
- Admin case progression is wired for Step 9, but the live admin queue cannot be exercised yet because the runtime `.env` is missing the Step 8 auth variables required to sign in.

## Deviations From Plan

- Step 9 does not implement notifications or mailbox delivery; queue state remains the sole evidence surface for now.
- Complaint suppression is modeled as a case-state update that depends on the already existing Step 8 event/source suppression surfaces rather than duplicating those mutations inside the queue page.
- Attachments remain out of scope; payloads stay metadata-only as locked in the contract docs.
