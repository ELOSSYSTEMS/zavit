# Adversarial Implementation Review

This document is derived only from:

- `REBUILD_PLAN.md`
- `SPRINT_BY_SPRINT_PLAN.md`
- `DETAILED_PHASE_PLAN.md`
- `PRODUCT_SPEC.md`

Companion specs:

- `IMPLEMENTATION_SPEC_A.md`
- `IMPLEMENTATION_SPEC_B.md`

# 1. Normalized understanding
## 1.1 App goal

- Verified: ZAVIT is a Hebrew-first, Israel-focused event comparison web product.
- Verified: The public product is event-centric, not article-centric.
- Verified: The user should be able to compare how multiple outlets covered the same real-world event, with attribution, uncertainty, and direct link-out.
- Resolved clarification: this is a standalone public web app with internal admin surfaces, not a Shopify app.

## 1.2 Explicit requirements

- One public web app with `/`, `/events/[id]`, `/sources`, `/about`.
- Internal admin routes at `/admin/pipeline`, `/admin/events/[id]`, `/admin/sources`.
- Metadata-only ingestion from approved editorial sources.
- No full article storage, reader mode, or archive-style reproduction.
- Event is the canonical durable object.
- `Cluster` may exist internally but must not be a durable public object.
- Hebrew-first, RTL-native public experience.
- Public output language in v1 is Hebrew only.
- Direct attribution and source link-out are mandatory.
- AI-generated text must be explicitly labeled.
- Low-confidence and unverified states must be visible.
- Correction/report flow must exist and be visible from event pages.
- Source directory must expose neutral source metadata.
- Source failures and stale pipeline state must be diagnosable in admin.
- Prisma is the only schema authority.
- Public/admin separation is mandatory.
- False merges are the top product risk.
- v1 publishable events generally require at least two distinct independent sources.
- Paywalled content must be marked, not bypassed.
- Publisher opt-out/compliance workflow must exist by v1 legal acceptance.

## 1.3 Implied requirements

- Inference: source independence must be modeled, not assumed.
- Inference: pipeline runs need traceability from ingest through embedding/clustering to public event output.
- Inference: public publication must be gated so partial or degraded runs do not silently corrupt the feed.
- Inference: confidence must affect publish eligibility, not only UI decoration.
- Inference: ranking needs deterministic and reviewable heuristics because engagement optimization is disallowed.
- Inference: operator overrides, suppressions, and corrections need auditability.
- Inference: mixed Hebrew/Arabic/English source metadata requires deliberate bidi handling and normalization.
- Inference: any AI summary/title generation needs fallback behavior when evidence is weak or generation fails.
- Inference: unauthenticated report intake needs abuse controls because v1 avoids forced accounts.

## 1.4 Constraints

- Explicit: no personalization in v1 core feed.
- Explicit: no trust scores, left/right badges, or truth-scoring core UX.
- Explicit: no old prototype carry-forward as production base.
- Explicit: no Phase 5 work before core comparison is stable and clustering quality is defensible.
- Explicit: no aggressive absence claims in v1.
- Explicit: missing coverage is not proof of intentional omission.
- UNKNOWN: app framework/runtime.
- UNKNOWN: hosting/deployment target.
- UNKNOWN: Postgres environment details.
- UNKNOWN: scheduler/job runner.
- UNKNOWN: default embeddings provider.
- UNKNOWN: owner of labeled evaluation dataset.
- UNKNOWN: exact v1 source count target.
- UNKNOWN: exact freshness target and schedule frequency.
- UNKNOWN: whether angle labels are predefined or semi-generative in v1.

## 1.5 Unknowns

- UNKNOWN: admin authentication and authorization model.
- UNKNOWN: report intake storage, moderation, spam prevention, and SLA.
- UNKNOWN: publisher opt-out/takedown workflow mechanics.
- UNKNOWN: source admission review process and who approves new sources.
- UNKNOWN: exact definition of `independent sources`.
- UNKNOWN: ranking formula for home feed significance.
- UNKNOWN: confidence computation method and threshold mapping.
- UNKNOWN: public degraded-state behavior when ingest is stale or clustering is blocked.
- UNKNOWN: whether thumbnails are actually stored/displayed in v1.
- UNKNOWN: whether `Topic` exists in v1 data or is deferred to v1.5.
- UNKNOWN: whether `Angle` is public in v1 or only shown when confidence is exceptionally high.
- UNKNOWN: whether operator suppression is soft-hide, hard-delete, or revision-based.
- UNKNOWN: analytics/telemetry implementation, if any, for success metrics.

## 1.6 Conflicts between source files

- `PRODUCT_SPEC.md` says a v1 Event is reported by at least two distinct independent sources; the plan docs allow single-source public events if explicitly marked unverified.
- `REBUILD_PLAN.md` says basic admin visibility is needed `if needed`; the other documents make admin surfaces mandatory and specific.
- All plan documents declare the work `Ready`, but `DETAILED_PHASE_PLAN.md` and `PRODUCT_SPEC.md` still list unresolved implementation blockers and major decisions.
- `PRODUCT_SPEC.md` makes publisher opt-out a v1 legal acceptance criterion; the plans do not allocate concrete implementation work for that workflow.
- `PRODUCT_SPEC.md` defines coverage states like `Not Detected` and `Limited Coverage`; the plans do not define the completeness/evidence model needed to support those states safely in v1.
- `PRODUCT_SPEC.md` introduces `Topic` and a richer event lifecycle; the planned schema lists do not include `Topic`, review state, suppression state, or revision history.

# 2. Red-team review of current implementation plan
## 2.1 Critical issues

- Issue: Product-type mismatch. Why it matters: the source set defines a public news-comparison web app, not a Shopify app. Risk level: Critical. What would break: architecture selection, auth model, route model, deployment assumptions, and any Shopify-specific implementation work. Recommended correction: resolve whether `Shopify app` was a mistaken label before implementation starts.
- Issue: `Ready` verdict without resolved blockers. Why it matters: framework, hosting, scheduler, embeddings provider, source-count target, freshness target, and labeled-dataset ownership are still undecided. Risk level: Critical. What would break: Phase 0 scaffolding, env contract, job topology, cost model, and Phase 2 exit criteria. Recommended correction: demote readiness to blocked pending decisions and make those ADRs explicit Phase 0 gates.
- Issue: Event publication rule is contradictory. Why it matters: the core public object has no stable eligibility rule. Risk level: Critical. What would break: clustering output policy, UI states, QA acceptance, trust language, and ranking. Recommended correction: choose one rule now: either never public with one source, or public only as explicitly unverified under narrow conditions.
- Issue: Legal/compliance implementation is missing where the product spec requires it. Why it matters: v1 acceptance includes opt-out and publisher concerns, but the plan does not implement intake, review, takedown, or audit flows. Risk level: Critical. What would break: legal launch readiness and publisher complaint handling. Recommended correction: add a compliance workflow, queue, operator tooling, and storage policy before declaring v1 implementable.
- Issue: Clustering quality gate is not measurable as written. Why it matters: `agreed threshold` is not a threshold, and the dataset owner is unknown. Risk level: Critical. What would break: Phase 2 exit, release gating, and trust claims. Recommended correction: define labeled-set ownership, metric definitions, acceptance thresholds, and review cadence before tuning work.
- Issue: Admin security model is absent. Why it matters: admin includes source blacklisting, correction controls, and diagnostic visibility. Risk level: Critical. What would break: safe operation, auditability, and production deployment. Recommended correction: define operator roles, auth mechanism, session model, and authorization boundaries in Phase 0.

## 2.2 High-risk issues

- Issue: Data model is incomplete for the product rules. Why it matters: current planned entities omit source independence, report intake, event revision/suppression, correction history, and operator overrides. Risk level: High. What would break: compliance handling, admin workflows, and public-state integrity. Recommended correction: extend the schema before implementation, not during cleanup.
- Issue: Ranking logic is under-specified. Why it matters: the feed must avoid engagement optimization but still order events by recency/significance. Risk level: High. What would break: homepage usefulness, reproducibility, and supportability. Recommended correction: define a deterministic ranking formula and override policy up front.
- Issue: Public degraded-state behavior is vague. Why it matters: docs require explicit stale/degraded states, but not when the old feed remains visible, when labels appear, or when public output is withheld. Risk level: High. What would break: trust during source failures or clustering outages. Recommended correction: define fail-closed publication rules and stale-state thresholds.
- Issue: AI output policy is principled but not operational. Why it matters: titles, summaries, angles, and fact grouping are allowed, but no generation/fallback chain exists. Risk level: High. What would break: event-card copy, event-detail copy, and neutrality safeguards. Recommended correction: define which fields are AI-generated, when AI is skipped, and what deterministic fallback is used.
- Issue: Correction/report flow is product-critical but operationally empty. Why it matters: public reporting without abuse controls or admin triage is not trustworthy. Risk level: High. What would break: support burden, spam resistance, and correction SLA. Recommended correction: add rate limiting, queueing, triage states, and operator tooling.
- Issue: Source directory requirements exceed planned source ingestion work. Why it matters: ownership type, locality, editorial type, paywall, neutral description, and availability status need provenance and maintenance. Risk level: High. What would break: source directory completeness and neutrality. Recommended correction: define which fields are required for v1, their source of truth, and how missing values are represented.
- Issue: Pipeline atomicity is not specified. Why it matters: the plan says `materialize durable Event` but not whether public reads use draft state or only promoted snapshots. Risk level: High. What would break: users seeing half-baked events, duplicate events, or mixed old/new state. Recommended correction: use run-scoped staging plus explicit publish/promotion.
- Issue: `Not Detected` appears in the product spec without safe implementation scope. Why it matters: absence claims require indexing completeness the plans do not build in v1. Risk level: High. What would break: public trust and false accusations of omission. Recommended correction: either defer public absence states or define strict evidence thresholds and source completeness checks.

## 2.3 Medium-risk issues

- Issue: Thumbnail handling is mentioned but not planned. Why it matters: legality and UI consistency differ by source. Risk level: Medium. What would break: directory/feed visuals and compliance posture. Recommended correction: decide whether v1 excludes thumbnails entirely.
- Issue: Topic exists in the product model but not the build plan. Why it matters: navigation can drift if Topic quietly enters v1. Risk level: Medium. What would break: schema churn and public IA stability. Recommended correction: explicitly defer Topic to v1.5 unless approved now.
- Issue: Angle is optional in plans but more central in the product spec. Why it matters: scope can creep into editorialized framing analysis. Risk level: Medium. What would break: neutrality and release scope. Recommended correction: make v1 angle display opt-in behind a hard evidence threshold or defer it.
- Issue: Freshness target is implied, not locked. Why it matters: schedule frequency affects source load, operator expectations, and public stale-state logic. Risk level: Medium. What would break: scheduling, cost, and support expectations. Recommended correction: set a numeric freshness target before building jobs.
- Issue: Hebrew-first public copy is required, but source texts are multilingual. Why it matters: mixed-script rendering and transliteration decisions are not operationalized. Risk level: Medium. What would break: event cards, source chips, and comparison readability. Recommended correction: define bidi rendering rules and fallback display conventions early.
- Issue: Success metrics are listed without instrumentation scope. Why it matters: `market` and `trust` metrics are not free. Risk level: Medium. What would break: post-launch decision quality. Recommended correction: separate launch-blocking operational metrics from later product analytics.

## 2.4 Missing decisions

- Whether this is actually a Shopify-related build or the source docs are the true scope.
- Exact public rule for single-source events.
- Exact confidence threshold mapping, including the 99% display rule.
- Exact v1 source roster and independence policy.
- Scheduler/job runner and run orchestration model.
- Admin auth/roles and who can disable/blacklist sources.
- Publisher opt-out and complaint workflow.
- Public publication model during partial or failed runs.
- Whether v1 includes angles at all, and if yes how labels are generated.
- Whether `Not Detected` appears publicly in v1.
- Whether thumbnails are in or out for v1.
- Framework/runtime and deployment topology.
- Metric thresholds for false merges, stale pipeline, and launch readiness.

## 2.5 Fragile assumptions

- Assumption: 10 to 15 Israeli sources can be ingested cleanly with RSS-first logic. Fragility: some outlets will have unstable feeds, inconsistent snippets, or encoding issues.
- Assumption: title-plus-snippet embeddings are enough to seed good candidates. Fragility: short snippets and multilingual coverage can produce false merges around recurring entities.
- Assumption: operator review can catch bad merges cheaply. Fragility: without strong admin evidence views and suppression tools, review becomes manual database work.
- Assumption: `metadata-only` materially simplifies legal risk. Fragility: snippets, thumbnails, and source descriptions still need explicit approval and complaint handling.
- Assumption: public comparison value can be shown in one screen without drifting into synthetic article-writing. Fragility: if titles/facts/angles are too generated, the product violates its own posture.
- Assumption: Phase 3 shell work can safely overlap before Phase 2 stabilizes. Fragility: UI contracts will churn if event states, confidence, and evidence structures are not locked.

# 3. Recommendation summary

- Recommended path: Hybridize Spec A and Spec B.
- Use Spec A as the v1 delivery baseline.
- Borrow two structural elements from Spec B immediately: publish snapshots and audited operator actions.
- The blocking decisions are now locked in Section 6 and can be used as the execution baseline.

# 4. Comparison summary

| Criterion | Current plan | Spec A | Spec B | Best option | Why |
| --- | --- | --- | --- | --- | --- |
| Simplicity | Moderate in prose, low in execution clarity | High | Medium-Low | Spec A | Smallest reliable implementation surface |
| Robustness | Medium | High | High | Tie A/B | A is safer early; B is stronger long term |
| Production safety | Medium | High | High | Spec A | Fail-closed publish model with fewer moving parts |
| Operator clarity | Medium | High | Medium | Spec A | Simpler admin mental model |
| QA burden | High because gates are vague | Medium | High | Spec A | Fewer states and fewer deployables |
| Extensibility | Medium | Medium | High | Spec B | Revision/snapshot model scales better |
| Speed to ship | Medium in theory, low in practice due to ambiguity | High | Low-Medium | Spec A | Fewer unresolved architectural layers |
| Risk of regressions | High | Medium | Medium | Spec A | Less surface area and clearer publish gates |
| Support burden | High | Medium | Medium-High | Spec A | Easier diagnosis for a small team |
| Ease of debugging | Medium | High | Medium | Spec A | Direct pipeline and public-state mapping |
| Long-term maintainability | Medium | Medium | High | Spec B | Better lineage and revision structure |
| Compliance readiness | Low-Medium | Medium-High | High | Spec B | Case/audit model handles complaints better |
| Fit to current source docs | Medium | High | Medium-High | Spec A | Preserves v1 restraint without overcommitting to v1.5 |

# 5. Build-order blueprint

- Phase 0: Preconditions / decisions required
  - Goal: close all blocking product and architecture decisions before repo bootstrap.
  - Likely files/modules: `docs/adr/*`, `docs/source-policy.md`, `docs/compliance-workflow.md`, `docs/evaluation-gate.md`.
  - Dependencies: source roster review, legal field policy, operator model.
  - Risks: fake progress via scaffolding before hard rules are settled.
  - Exit criteria: all blocking decisions are written and approved.
- Phase 1: Skeleton / scaffolding
  - Goal: create the repo skeleton, schema authority, env contract, and publish-state boundaries.
  - Likely files/modules: `prisma/schema.prisma`, framework shell `UNKNOWN`, `jobs/*`, `tests/*`, `env.example`, `docs/runbook.md`.
  - Dependencies: Phase 0 approval, framework/runtime choice.
  - Risks: early schema omission of review/compliance entities.
  - Exit criteria: app boots, Prisma validates, admin/public split exists, publish snapshot model exists in schema.
- Phase 2: Core logic
  - Goal: implement ingestion, normalization, dedupe, embeddings, verification, draft-event creation, and publish promotion.
  - Likely files/modules: `jobs/ingest/*`, `jobs/normalize/*`, `jobs/embed/*`, `jobs/verify/*`, `jobs/publish/*`, `lib/ranking/*`, `lib/confidence/*`, `lib/source-independence/*`.
  - Dependencies: source registry, embeddings provider, evaluation harness format.
  - Risks: false merges, source instability, multilingual normalization.
  - Exit criteria: labeled suite runs, thresholds are measurable, no public write occurs without successful publish promotion.
- Phase 3: Admin UX
  - Goal: make operators able to inspect runs, review events, process reports, and manage sources.
  - Likely files/modules: route modules for `/admin/pipeline`, `/admin/events/[id]`, `/admin/sources`, `lib/admin-auth/*`, `lib/reporting/*`, `lib/audit/*`.
  - Dependencies: event and pipeline data already persisted.
  - Risks: building admin screens before evidence/audit data exists.
  - Exit criteria: operator can diagnose source failures, suppress bad events, review reports, and see publish status without DB access.
- Phase 4: Edge case handling
  - Goal: harden fail-closed behavior, degraded states, and multilingual/partial-data cases.
  - Likely files/modules: `lib/degraded-state/*`, `lib/bidi/*`, `lib/url-normalization/*`, `lib/report-abuse/*`, additional fixtures/tests.
  - Dependencies: core flows and admin tooling.
  - Risks: edge cases reveal missing base-model fields and force schema churn.
  - Exit criteria: stale pipeline, broken source, missing snippet, single-source, and legal-hold paths are all tested and handled explicitly.
- Phase 5: Observability / debug tooling
  - Goal: add structured logging, traceability, run metrics, and operator-visible diagnostics.
  - Likely files/modules: `lib/logging/*`, `lib/metrics/*`, admin diagnostics views, `docs/alerting.md`.
  - Dependencies: stable run IDs and entity IDs across pipeline stages.
  - Risks: bolting on observability too late and missing critical join keys.
  - Exit criteria: each public event is traceable to source ingest and publish run; stale-state and failure alerts work.
- Phase 6: Verification / QA gates
  - Goal: execute the full verification matrix before release.
  - Likely files/modules: regression suites, browser QA scripts `UNKNOWN`, evaluation reports under `docs/artifacts/*`, release checklist.
  - Dependencies: all prior phases complete.
  - Risks: discovering unresolved product-rule conflicts at the end.
  - Exit criteria: lint, typecheck, schema health, ingest tests, clustering gate, RTL QA, attribution review, disclosure review, correction path, and complaint workflow all pass.
- Phase 7: Release readiness
  - Goal: rehearse deploy, rollback, source failure, bad merge, and complaint handling.
  - Likely files/modules: `docs/deploy-runbook.md`, `docs/rollback-runbook.md`, `docs/operator-playbook.md`.
  - Dependencies: deployed staging environment `UNKNOWN`.
  - Risks: release without operational proof.
  - Exit criteria: deploy rehearsal passed, rollback rehearsal passed, synthetic incident drills passed, release decision based on evidence.

# 6. Locked decisions

- Product type: standalone public web app with internal admin surfaces.
- Single-source events: never public in v1. A second distinct independent source is required before publication.
- Independent sources: outlets with distinct editorial control and ownership. Same brand network, mirrored content, wire rewrites, or shared parent-group clones do not count as independent corroboration.
- Confidence thresholds: `>= 0.995` publishable without warning, `0.990-0.994` publishable with low-confidence label, `0.970-0.989` internal review only, `< 0.970` reject/hold.
- Dataset ownership: the founder/operator owns the initial labeled clustering dataset and sign-off for threshold changes.
- Initial v1 source roster target: 12 approved sources spanning mainstream Hebrew, public broadcast, business, religious/Haredi, and Arab-community coverage. Final named roster must be locked in `docs/source-policy.md` before Phase 1 starts.
- Legally approved stored fields: headline, snippet, canonical URL, publication time, source identity fields, paywall flag, availability status, and operator-authored neutral source metadata. No thumbnails and no article body storage in v1.
- Freshness target: public event freshness target is 30 minutes, with ingestion scheduled every 15 minutes and a stale-state warning after 45 minutes without a successful publish.
- Admin auth/authorization: email allowlist plus password and TOTP. Roles are `reviewer` and `operator`; only `operator` may disable sources, suppress events, or resolve legal cases.
- `Not Detected`: internal-only in v1 and not surfaced publicly.
- Public angles: out of scope for v1 unless explicitly re-approved after launch.
- Thumbnails: out of scope for v1.
- Publisher opt-out and complaint workflow: dedicated public form plus email intake, admin case queue, same-business-day acknowledgement target, one-business-day emergency suppression target, and three-business-day initial resolution target.


