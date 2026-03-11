# ADR-006: Implementation Baseline

## Status

Accepted on 2026-03-12

## Context

- Verified: The reference plan names Next.js for the API gateway and web client, PostgreSQL for the core database, pgvector for embeddings, and Node.js workers for ingestion and clustering support.
- Verified: Implementation Spec A is the approved conservative baseline for v1 delivery.
- Verified: the current local scaffold uses a Gemini API key shape rather than an OpenAI key.
- Verified: The rebuild blueprint recommends one codebase, one schema authority, and one clustering path.

## Decision

The v1 implementation baseline is:

- One Next.js application codebase for public and admin routes
- One Node.js worker process for scheduled ingest and clustering jobs
- One PostgreSQL database
- One Prisma schema authority
- pgvector enabled through Prisma-managed migration flow
- One default embeddings provider for v1: Gemini

Additional boundary rules:

- Public and admin remain route-separated within the same application baseline.
- Raw SQL may be used only inside the Prisma migration flow when pgvector or indexes require it.
- The exact queue or scheduler package remains a Step 2 implementation detail as long as it supports the locked freshness target and fail-closed publish flow.

## Evidence

- [reference/PLAN.md](../../reference/PLAN.md)
- [IMPLEMENTATION_SPEC_A.md](../../IMPLEMENTATION_SPEC_A.md)
- [analysis/REBUILD_BLUEPRINT.md](../../analysis/REBUILD_BLUEPRINT.md)
- [reference/daily-clustering-setup.md](../../reference/daily-clustering-setup.md)

## Consequences

- Step 2 can scaffold without guessing the framework/runtime.
- Step 2 should create one app baseline plus worker entrypoint, not a multi-app monorepo.
- Step 6 will still need a concrete evaluation runner and acceptance report, but provider choice is no longer a Step 1 blocker.
