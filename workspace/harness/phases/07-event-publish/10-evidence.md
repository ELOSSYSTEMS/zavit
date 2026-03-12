# Step 7 Evidence: Event Formation And Publish Gating

## Decisions Made

- Added embeddings-backed event grouping in [predict-groups.mjs](../../../../lib/clustering/predict-groups.mjs) and provider handling in [embeddings.mjs](../../../../lib/clustering/embeddings.mjs).
- Added the Step 7 pipeline orchestrator in [pipeline.mjs](../../../../lib/events/pipeline.mjs) and the runtime entrypoint in [run-event-pipeline.mjs](../../../../scripts/run-event-pipeline.mjs).
- Added a regression harness runner at [run-clustering-regression.mjs](../../../../scripts/run-clustering-regression.mjs) so the Step 6 dataset is exercised by the real Step 7 clustering code.
- Updated the public feed and event detail routes at [page.tsx](../../../../app/page.tsx) and [page.tsx](../../../../app/events/[id]/page.tsx) to read only from publish-gated snapshots or published events.
- Updated the admin pipeline and event review routes at [page.tsx](../../../../app/admin/pipeline/page.tsx) and [page.tsx](../../../../app/admin/events/[id]/page.tsx) to expose run state, event memberships, and publish-snapshot evidence.
- Added Step 7 environment shape in [env.example](../../../../env.example) for `GEMINI_EMBED_MODEL` and `CLUSTER_EMBED_PROVIDER`.

## Files Or Modules Affected

- `project/package.json`
- `project/package-lock.json`
- `project/env.example`
- `project/lib/db/prisma.ts`
- `project/lib/clustering/*.mjs`
- `project/lib/events/pipeline.mjs`
- `project/scripts/run-clustering-regression.mjs`
- `project/scripts/run-event-pipeline.mjs`
- `project/app/page.tsx`
- `project/app/events/[id]/page.tsx`
- `project/app/admin/pipeline/page.tsx`
- `project/app/admin/events/[id]/page.tsx`
- `project/tests/events/event-pipeline.test.mjs`
- `project/workspace/harness/phases/07-event-publish/*.md`

## Findings That Affect Later Steps

- The Step 6 regression harness now passes against the real Step 7 clustering code with the live Gemini provider.
- The latest successful full pipeline run `cmmnszbno0000ncbfbyzs9i8k` persisted one published event snapshot and five held events from 137 ingested articles.
- Public routes now fail closed by reading only from the latest successful `FULL` run snapshots or `PUBLISHED` events.
- The publish gate blocks before snapshot writes when ingest coverage is incomplete or the Step 6 regression harness fails.
- Current clustering remains conservative: only one event published from the latest run, and several candidates stayed held for admin review.

## Deviations From Plan

- The live Step 7 pipeline currently writes one latest-run snapshot set but does not yet archive stale held events from prior runs.
- The regression harness persists as a standalone script instead of being embedded into the pipeline command itself.
- The public home route now shows a minimal publish-gated feed earlier than Step 10 because Step 7 needed a concrete public read tied to snapshots.
