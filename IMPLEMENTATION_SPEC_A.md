# Implementation Spec A

## 1. Design philosophy

- Conservative, fail-closed, lower complexity.
- Optimize for deterministic behavior, easier QA, easier support, and lower operator confusion.
- Reduce scope until trust-critical behavior is fully specified.
- Do not ship public angle analysis or absence claims unless the evidence model is proven.

## 2. Architecture

- Surface areas used: public web app plus internal admin routes.
- Single deployable web app with one worker process for scheduled jobs.
- One Postgres database, one Prisma schema, one codebase, one scheduled pipeline.
- Run-scoped staging tables feed a publish step; public routes only read from the last successful promoted run.
- No public `Topic` model in v1.
- No public `Angle` section in v1 unless operator-approved and backed by multiple supporting articles.

## 3. Data model

- `Source`: identity, language, ownership_type, locality, editorial_type, paywall_status, availability_status, enabled_flag, source_policy_notes.
- `Article`: source_id, canonical_url, raw_url, headline, snippet, published_at, fetched_at, language, paywall_flag, ingest_run_id.
- `SourceHealth`: source_id, last_success_at, last_failure_at, failure_type, consecutive_failures, disabled_reason.
- `PipelineRun`: run_type, started_at, finished_at, status, source_count, article_count, error_summary, model_provider, model_version.
- `Event`: public_id, status, confidence_state, neutral_title, first_seen_at, last_updated_at, publish_run_id, suppressed_flag.
- `EventMembership`: event_id, article_id, membership_reason, evidence_summary, publication_role.
- `EventFact`: event_id, fact_type, text_he, confidence_state, display_order.
- `EventFactSupport`: event_fact_id, article_id, support_type.
- `EventReview`: event_id, review_status, reviewer_note, corrected_at, corrected_by.
- `CorrectionReport`: report_type, event_id nullable, source_id nullable, submitted_at, status, payload, abuse_score.

## 4. App flows

- Ingest flow: fetch approved sources, parse metadata, normalize URLs, persist articles, record per-source health.
- Cluster flow: embed article title+snippet, retrieve candidates, apply deterministic verification rules, create draft events, hold low-confidence candidates.
- Publish flow: promote only if run passes validation and evaluation gates; otherwise retain the last good public snapshot.
- Public flow: feed shows only promoted events; event detail shows headlines, timeline, shared facts, conflicting facts, direct links, and explicit uncertainty.
- Report flow: public user submits correction/report without account; item enters admin queue.
- Admin flow: operator reviews pipeline health, source failures, event evidence, and report queue; operator can suppress events and disable sources.

## 5. Admin UX

- `/admin/pipeline`: latest runs, status, stale warning, counts, failed sources, blocked publication reason.
- `/admin/events/[id]`: membership list, support evidence, confidence state, suppression/review controls, report history.
- `/admin/sources`: enabled/disabled state, last success/failure, failure trend, editable neutral metadata, blacklist/disable with reason.

## 6. Validation / fail-closed behavior

- Never publish from an incomplete run.
- Never publish a single-source event by default.
- Never show `Not Detected` publicly in v1.
- If AI title generation fails or confidence is weak, use deterministic fallback title or keep the event internal.
- If a source degrades, mark its availability and keep prior public events rather than synthesizing around missing data.
- If a legal complaint is open, suppress affected content pending review.

## 7. Edge cases

- Duplicate URLs with tracking/query differences.
- Same outlet publishing follow-ups that should not count as independent corroboration.
- Mixed-language coverage of the same event.
- Recurring incidents with similar entities.
- Missing snippets or malformed dates.
- Broken outbound links after publication.
- Report spam against politically sensitive events.

## 8. Logging / observability

- Structured logs with `run_id`, `source_id`, `article_id`, `event_id`.
- Persist failure class separately for fetch, parse, normalize, embed, verify, publish.
- Admin-visible stale-state thresholds.
- Minimal metrics: ingest success rate, duplicate rate, held-event count, published-event count, suppression count, report backlog.
- One reproducible evaluation artifact per clustering release.

## 9. Test strategy

- Unit tests for URL normalization, dedupe, parser behavior, confidence-state mapping, and verification rules.
- Fixture tests for multilingual RSS inputs.
- Regression suite for labeled candidate pairs/groups.
- Snapshot/contract tests for public feed and event detail states.
- Failure-mode tests for stale runs, incomplete publish, and source disablement.
- Manual RTL QA and admin workflow drills.

## 10. Deployment / migration

- One app deployment plus one worker/scheduler deployment.
- Prisma migrations only.
- Seed approved source registry and neutral source metadata before first ingest.
- Backfill scripts are run-scoped and idempotent.
- Launch blocked until false-merge gate, stale-state handling, and complaint workflow are tested.

## 11. Risks

- Under-scopes future expansion.
- Manual admin burden may rise as source count grows.
- Conservative publication rules may make the feed feel sparse early.

## 12. Failure modes

- Event yield may be too low because strict gating holds too many candidates.
- Deterministic fallbacks may produce bland or unclear titles.
- Operator review may become a bottleneck.

## 13. Difficulty / confidence

- Estimated implementation difficulty: 6/10
- Confidence score: 0.78
