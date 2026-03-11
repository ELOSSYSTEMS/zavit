# Step 3 Evidence: Schema And State Model

## Decisions Made

- Replaced the Step 2 bootstrap Prisma model with a trust-critical schema aligned to Step 1 ADRs and Implementation Spec A.
- Modeled `Source`, `SourceHealth`, `Article`, and `PipelineRun` as the baseline ingestion and health entities.
- Modeled `Event`, `EventMembership`, `EventFact`, `EventFactSupport`, and `EventReview` without introducing any durable public `Cluster` object.
- Added `PublishSnapshot` to support fail-closed promotion and last-known-good public state.
- Added `CorrectionReport`, `OperatorCase`, and `OperatorActionAudit` to represent correction, legal/compliance, and auditable operator actions.
- Encoded source policy, publication state, confidence state, and role/state machines as Prisma enums.

## Files Or Modules Affected

- `project/prisma/schema.prisma`
- `workspace/harness/phases/03-schema-state/*.md`

## Findings That Affect Later Steps

- Step 4 can build on `Source` and `SourceHealth` for roster metadata, availability, and independence notes without changing the overall source identity shape.
- Step 5 can attach ingest and health flows directly to `Article`, `SourceHealth`, and `PipelineRun`.
- Step 7 can build publish gating on `Event`, `PublishSnapshot`, `ConfidenceState`, and `PipelineRun` without inventing a public-cluster abstraction.
- Step 8 and Step 9 already have schema anchors for operator roles, reports, cases, and audit actions.
- Prisma 7 schema work must continue to keep datasource configuration in `prisma.config.ts`.

## Deviations From Plan

- Added `OperatorCase` as a distinct entity instead of relying only on `CorrectionReport` so legal/compliance queue state and action history can remain explicit.
- Added `PublishSnapshot` as a first-class relation during Step 3 instead of deferring it, because the plan and Step 1 review both treat publish isolation as trust-critical.
