# Step 4 Handoff: Source Roster And Metadata Policy

## Next Step Inputs

Step 5 must read these first:

- [30-gate.md](./30-gate.md)
- [00-kickoff.md](./00-kickoff.md)
- [10-evidence.md](./10-evidence.md)
- [20-checks.md](./20-checks.md)
- [source-policy.md](../../../../docs/source-policy.md)
- [approved-roster.json](../../../../lib/sources/approved-roster.json)
- [validate-source-roster.mjs](../../../../scripts/validate-source-roster.mjs)
- [schema.prisma](../../../../prisma/schema.prisma)

## Locked Assumptions

- The approved v1 roster is exactly these 12 slugs: `ynet`, `n12`, `walla`, `haaretz`, `maariv`, `israel-hayom`, `kan-news`, `globes`, `makor-rishon`, `kikar-hashabbat`, `makan`, `davar`
- `approved-roster.json` is the canonical source-policy row file until a dedicated seed runner exists
- `independenceGroup` is the baseline corroboration key for later ingest, clustering, and publish gating
- `kan-news` and `makan` are approved sources but share an independence group and cannot corroborate each other

## Open Questions

- Which section-crawl selectors or discovery strategy Step 5 will use for Kan News, Globes, Kikar HaShabbat, and Makan
- Whether Step 5 will introduce a DB seed command or read the JSON roster directly
- Whether any currently `UNKNOWN` paywall or ownership fields can be safely tightened after live ingestion validation

## Required References

- [package.json](../../../../package.json)
- [reference/sources.ts](../../../../reference/sources.ts)
- [jobs/worker.ts](../../../../jobs/worker.ts)
- [app/sources/page.tsx](../../../../app/sources/page.tsx)
- [app/admin/sources/page.tsx](../../../../app/admin/sources/page.tsx)
