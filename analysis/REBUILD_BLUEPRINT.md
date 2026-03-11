# Rebuild Blueprint

## Goal

Build a narrow, coherent v1 of ZAVIT around one user promise:

Users see one real-world event and compare how multiple Israeli news outlets covered it.

## Recommended v1 scope

### Product

- Home feed of event cards
- Event detail page focused on comparison
- Source directory
- Transparency/about page

### Comparison primitives on event detail

- neutral system-generated event title
- list of participating outlets
- outlet headlines side by side
- publication timeline
- common facts
- conflicting or uncertain facts
- optional angle grouping only if it can be done safely and clearly

## Recommended architecture

### One domain model

- `Source`
- `Article`
- `Event`
- `EventMembership`
- optional `AngleCard`

Do not keep separate public concepts of `cluster` and `event`.
Use `Event` as the product object everywhere.

### One schema authority

Use Prisma migrations as the single schema path.
If raw SQL is needed for pgvector or indexes, wrap it inside the migration flow, not beside it.

### One clustering path

Use a single pipeline:

1. ingest metadata
2. normalize
3. generate embeddings
4. retrieve candidate pairs
5. verify event-level match
6. materialize durable events

Do not keep multiple active clustering generations in the production tree.

## Recommended implementation order

1. Canon and scope lock
2. New schema
3. Source ingestion
4. Embedding pipeline
5. Event clustering evaluation harness
6. Read APIs
7. Home feed
8. Event comparison page
9. Transparency and source directory

## Non-negotiables

- Hebrew-first UI
- RTL-native layout
- direct source attribution
- explicit AI disclosure
- confidence and correction paths
- no full-article storage

## Immediate starting artifacts from old repo

- `canon/`
- `PLAN.md`
- `src/lib/config/sources.ts`

## Do not port before review

- current Prisma schema
- current migrations
- current clustering scripts
- current route structure

## Suggested new repo shape

```text
app/
  page.tsx
  events/
    [id]/
  sources/
  about/
lib/
  db/
  ingestion/
  embeddings/
  clustering/
  events/
  sources/
prisma/
tests/
docs/
```

## Verification standard for the rebuild

- lint passes
- migration status healthy
- seeded ingest run works
- clustering regression suite has labeled cases
- event page proves comparison, not just aggregation
