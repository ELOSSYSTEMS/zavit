# ZAVIT Step-by-Step Execution Plan

**Source:** `ADVERSARIAL_IMPLEMENTATION_REVIEW.md`  
**Derived on:** 2026-03-11  
**Status:** Execution baseline with harness-backed phase loop

## 1. Goal

Rebuild ZAVIT as a standalone public web app with internal admin surfaces, and require each step to leave behind test evidence, manual review evidence, and a gate decision that becomes input to the next step.

## 2. Harness-Backed Process

Before any step starts, create a phase folder under `workspace/harness/phases/<NN-step-slug>/`.

Each step must produce these markdown files:
- `00-kickoff.md`
- `10-evidence.md`
- `20-checks.md`
- `30-gate.md`
- `40-handoff.md`

Each step must read these inputs before starting:
- the previous step's `30-gate.md`
- the previous step's `40-handoff.md`
- any canon or policy docs named in that handoff

## 3. Global Quality Rules

- No implementation step starts without an approved kickoff doc.
- No step closes without automated checks, manual checks, and a gate verdict.
- A blocked gate stops the next step except for explicit unblock work.
- If a later step invalidates an earlier assumption, update the earlier step's evidence doc and reference the change.
- Release is blocked if the harness trail is incomplete.

## 4. Step Plan

### Step 1: Contract Lock

**Phase folder**
- `workspace/harness/phases/01-contract-lock/`

**Objective**
- Freeze product rules, v1 boundaries, and trust/compliance constraints before code starts.

**Outputs**
- ADRs for product type, event rule, independence rule, confidence thresholds, and public/admin separation
- `docs/source-policy.md`
- `docs/compliance-workflow.md`
- `docs/evaluation-gate.md`

**Automated checks**
- Link check or path check for all referenced canon docs
- Optional markdown lint if enabled in the new repo

**Manual checks**
- Review every `UNKNOWN` from the adversarial review and either resolve it or mark it blocked
- Confirm v1 non-goals are explicit: no public angles, no thumbnails, no public `Not Detected`

**Exit gate**
- PASS only if the blocker list is closed or explicitly documented as build-stopping

**Feed-forward requirement**
- `40-handoff.md` must name the exact ADRs and policy docs Step 2 and Step 3 must read first

### Step 2: Repo Scaffold

**Phase folder**
- `workspace/harness/phases/02-repo-scaffold/`

**Objective**
- Create the clean implementation repo under `project/` without importing prototype runtime code.

**Outputs**
- framework scaffold
- `env.example`
- base folders for app, lib, jobs, prisma, tests, and docs

**Automated checks**
- `npm run lint`
- `npm run typecheck`
- `npx prisma validate`

**Manual checks**
- Confirm public and admin route separation exists in the scaffold
- Confirm no prototype code was copied in as production runtime

**Exit gate**
- PASS only if the app boots and the schema/tooling commands succeed

**Feed-forward requirement**
- `40-handoff.md` must list repo paths and package scripts Step 3 will depend on

### Step 3: Schema And State Model

**Phase folder**
- `workspace/harness/phases/03-schema-state/`

**Objective**
- Encode trust-critical entities and state transitions before feature work spreads assumptions.

**Outputs**
- Prisma schema for source, article, pipeline, event, evidence, review, report, and audit entities
- publish snapshot and operator action support

**Automated checks**
- `npx prisma validate`
- schema diff review if migrations are added
- model-level tests for confidence-state mapping once code exists

**Manual checks**
- Confirm no durable public `Cluster` object exists
- Confirm legal/compliance workflow entities are represented
- Confirm publish snapshots and auditability are represented

**Exit gate**
- PASS only if Step 1 policy docs map cleanly to schema entities and missing entities list is empty

**Feed-forward requirement**
- `40-handoff.md` must tell Step 4 and Step 5 which schema entities are ready and which are intentionally deferred

### Step 4: Source Roster And Metadata Policy

**Phase folder**
- `workspace/harness/phases/04-source-roster/`

**Objective**
- Lock the first approved source set and the metadata policy that ingestion depends on.

**Outputs**
- initial 12-source roster
- neutral metadata rows for ownership, locality, editorial type, paywall, availability, and independence notes

**Automated checks**
- schema-level seed validation if seed scripts exist
- duplicate source URL/name detection script if implemented

**Manual checks**
- Review source independence and ownership assumptions
- Confirm unknown metadata handling is documented
- Confirm source admission workflow exists

**Exit gate**
- PASS only if every approved source has a documented policy row and no unresolved independence ambiguity blocks ingest

**Feed-forward requirement**
- `40-handoff.md` must identify the exact source records and seed inputs Step 5 will ingest

### Step 5: Ingestion And Health Tracking

**Phase folder**
- `workspace/harness/phases/05-ingestion-health/`

**Objective**
- Ingest metadata reliably and expose failure states explicitly.

**Outputs**
- RSS-first ingest flow
- URL normalization and dedupe
- `SourceHealth` and `PipelineRun` persistence
- failure class recording

**Automated checks**
- unit tests for parser behavior
- unit tests for URL normalization and dedupe
- fixture-based ingest tests
- scheduled-run smoke test if scheduler exists

**Manual checks**
- inspect sample ingests across Hebrew and English feeds
- verify stale/failing source visibility
- verify article body content is not stored

**Exit gate**
- PASS only if ingest succeeds for the approved roster baseline and failure states are diagnosable without DB spelunking

**Feed-forward requirement**
- `40-handoff.md` must point Step 6 to the ingest fixtures, sample outputs, and known source-quality caveats

### Step 6: Evaluation Harness

**Phase folder**
- `workspace/harness/phases/06-evaluation-harness/`

**Objective**
- Make clustering quality measurable before event publication work proceeds.

**Outputs**
- labeled clustering dataset
- evaluation runner definition
- numeric thresholds for false merges, hold rate, and publish eligibility

**Automated checks**
- regression harness run on labeled pairs/groups
- reproducibility check for the harness output format

**Manual checks**
- review dataset coverage for recurring incidents, multilingual coverage, and ambiguous pairs
- confirm thresholds are accepted and documented by the operator/founder

**Exit gate**
- PASS only if clustering can be measured numerically and the acceptance thresholds are written in the harness docs

**Feed-forward requirement**
- `40-handoff.md` must name the exact harness files Step 7 must run before any publish logic is accepted

### Step 7: Event Formation And Publish Gating

**Phase folder**
- `workspace/harness/phases/07-event-publish/`

**Objective**
- Materialize durable events from validated evidence and fail closed on weak or partial runs.

**Outputs**
- embeddings flow
- candidate retrieval
- verification rules
- draft event creation
- publish snapshot promotion

**Automated checks**
- regression harness run from Step 6
- tests for confidence threshold mapping
- tests for single-source rejection
- tests for incomplete-run publish blocking

**Manual checks**
- review a sample of accepted and rejected event groupings
- inspect explainability fields and publish snapshots
- confirm last-known-good snapshot behavior on failed runs

**Exit gate**
- PASS only if the regression harness meets threshold and no public event can bypass the publish gate

**Feed-forward requirement**
- `40-handoff.md` must identify the evidence views and states Step 8 will expose in admin

### Step 8: Admin Security And Operator Tooling

**Phase folder**
- `workspace/harness/phases/08-admin-ops/`

**Objective**
- Make sensitive controls safe and auditable before public launch.

**Outputs**
- admin auth with allowlist, password, and TOTP
- role enforcement for `reviewer` and `operator`
- admin surfaces for pipeline, events, and sources
- operator audit trail

**Automated checks**
- auth tests for allowlist/session flow
- authorization tests for role boundaries
- route access tests for admin pages

**Manual checks**
- verify reviewers cannot disable sources or resolve legal cases
- verify operators can inspect runs, suppress events, and disable sources
- inspect audit trail readability and completeness

**Exit gate**
- PASS only if operator-only actions are enforced and all sensitive actions are auditable

**Feed-forward requirement**
- `40-handoff.md` must tell Step 9 which admin paths and queue states already exist

### Step 9: Report Intake And Complaint Workflow

**Phase folder**
- `workspace/harness/phases/09-reporting-compliance/`

**Objective**
- Add the public correction and complaint workflows the review marked as critical.

**Outputs**
- public correction/report intake
- publisher complaint intake
- triage queue states
- abuse controls and SLA states

**Automated checks**
- form submission tests
- queue-state transition tests
- rate-limit or abuse-control tests
- notification/inbox tests if implemented

**Manual checks**
- submit a public correction flow end to end
- submit a publisher complaint flow end to end
- verify acknowledgement, suppression, and resolution states are understandable in admin

**Exit gate**
- PASS only if both intake paths work and admin can process them without undocumented manual steps

**Feed-forward requirement**
- `40-handoff.md` must name the public states and disclosure copy Step 10 must surface

### Step 10: Public Read Experience

**Phase folder**
- `workspace/harness/phases/10-public-read/`

**Objective**
- Deliver the actual comparison product after the backend and operator safeguards are in place.

**Outputs**
- `/`
- `/events/[id]`
- `/sources`
- `/about`
- Hebrew-first, RTL-native public presentation

**Automated checks**
- route rendering tests
- API contract tests for feed and event detail
- accessibility smoke tests if available
- snapshot tests for event states if implemented

**Manual checks**
- desktop and mobile browser QA
- RTL and bidi content review
- source attribution and link-out review
- AI disclosure and low-confidence label review

**Exit gate**
- PASS only if the event page proves comparison value in one screen and all trust cues are visible

**Feed-forward requirement**
- `40-handoff.md` must identify UI edge cases Step 11 must harden

### Step 11: Degraded States And Edge Cases

**Phase folder**
- `workspace/harness/phases/11-degraded-edge-cases/`

**Objective**
- Close the hidden-risk paths before release.

**Outputs**
- stale-feed handling
- degraded-state copy
- mixed-language rendering rules
- edge-case handling for broken links, duplicates, missing snippets, and follow-ups

**Automated checks**
- synthetic tests for stale runs
- synthetic tests for broken sources and malformed data
- tests for legal-hold and suppression display behavior

**Manual checks**
- inspect degraded public UI states
- inspect operator behavior during source failure and legal-hold scenarios
- confirm thumbnails and absence claims do not appear publicly

**Exit gate**
- PASS only if degraded behavior is explicit, non-misleading, and consistent with the canon

**Feed-forward requirement**
- `40-handoff.md` must list remaining release risks and observability gaps for Step 12

### Step 12: Observability And Release Gates

**Phase folder**
- `workspace/harness/phases/12-release-gates/`

**Objective**
- Make the product traceable, supportable, and release only on evidence.

**Outputs**
- structured logging
- metrics and dashboards or equivalent evidence views
- release checklist
- deploy and rollback runbooks
- incident rehearsal results

**Automated checks**
- final lint, typecheck, and schema health checks
- full regression suite including ingest and clustering
- smoke tests for critical public and admin paths

**Manual checks**
- deploy rehearsal
- rollback rehearsal
- bad-merge incident drill
- source-failure incident drill
- complaint-handling drill

**Release gate**
- PASS only if the full harness trail is complete and each public event is traceable from ingest to publish snapshot

**Feed-forward requirement**
- `40-handoff.md` becomes the release packet summary and the baseline for the first post-launch cycle

## 5. Global Stop Conditions

- A public `Cluster` object reappears in schema or UI
- Single-source events become public in v1
- Full article storage, reader mode, or thumbnails are introduced in v1
- Public angle analysis is added without explicit re-approval
- Clustering changes land without Step 6 harness evidence
- Sensitive admin actions exist without audit history
- Release is attempted with missing harness docs or blocked gates

## 6. Required First Build Loop

The minimum safe opening loop is:
1. Step 1 kickoff, evidence, checks, gate, handoff
2. Step 2 kickoff using Step 1 handoff
3. Step 3 kickoff using Step 2 handoff
4. Step 4 kickoff using Step 3 handoff
5. Only then start ingestion and clustering work
