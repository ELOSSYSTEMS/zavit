# Task: MVP Build (Phase 0 + 1)

**Status:** IN_PROGRESS
**Goal:** Deliver a working MVP with ingestion, clustering, and basic UI.

## Phase 0: Foundation (Prerequisites)
- [x] **Project Layout**: Initialize Next.js app with Tailwind & Typescript. <!-- Verified existing modules -->
- [x] **DB Setup**: Set up Prisma with PostgreSQL.
- [x] **Ingestion Engine**:
    - [x] Create source definition config (Top 15 Israeli sources).
    - [x] Implement RSS fetcher (Layer 1).
    - [x] Implement Sitemap scraper (Layer 2).
    - [x] Implement Ingestion Script.

## Phase 1: MVP Core
- [ ] **Clustering Logic**:
    - [ ] Implement text normalization (Hebrew).
    - [ ] Implement basic grouping logic (Title similarity + Time window).
    - [ ] **pgvector Scaffold (MANDATORY)**:
        - [ ] Enable pgvector extension in PostgreSQL.
        - [ ] Create embeddings table schema.
        - [ ] Implement stub embeddings interface (`embeddings.ts`).
- [ ] **API Layer**:
    - [ ] Create endpoints for `GET /events` and `GET /events/:id`.
- [ ] **UI Implementation**:
    - [ ] Setup Shadcn/UI.
    - [ ] Build **Home Feed** (list of clusters).
    - [ ] Build **Story Page** (single event view).
    - [ ] Build **Source Directory**.

## Verification
- [x] Verify ingestion runs and saves to DB.
- [ ] Verify clusters form correctly.
- [ ] Verify UI displays Hebrew content correctly (RTL).
