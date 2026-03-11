# Step 4 Evidence: Source Roster And Metadata Policy

## Decisions Made

- Locked the first approved v1 roster at 12 sources: Ynet, N12, Walla, Haaretz, Maariv, Israel Hayom, Kan News, Globes, Makor Rishon, Kikar HaShabbat, Makan, and Davar.
- Stored the canonical Step 4 policy rows and Step 5 seed inputs in [approved-roster.json](../../../../lib/sources/approved-roster.json).
- Added `independenceGroup` to each roster row so later ingest and publish logic can enforce the Step 1 corroboration rule without re-deriving ownership relationships.
- Resolved the only deliberate same-parent overlap by assigning both Kan News and Makan to `kan-public-broadcast`, which means they are approved roster members but not independent corroboration against each other.
- Kept uncertain ownership and paywall details explicit with `UNKNOWN` rather than inventing certainty for Makor Rishon, Kikar HaShabbat, and Davar.
- Updated [source-policy.md](../../../../docs/source-policy.md) to name the exact v1 roster and to define how unknown metadata must be represented.

## Files Or Modules Affected

- `project/package.json`
- `project/docs/source-policy.md`
- `project/lib/sources/approved-roster.json`
- `project/scripts/validate-source-roster.mjs`
- `project/workspace/harness/phases/04-source-roster/*.md`

## Findings That Affect Later Steps

- Step 5 must ingest from the exact `seedInput` values in [approved-roster.json](../../../../lib/sources/approved-roster.json) unless Step 4 is explicitly reopened.
- Step 5 should validate the section-crawl seeds for Kan News, Globes, Kikar HaShabbat, and Makan early, because those are approved but not RSS-backed in the current roster.
- Step 5 and Step 7 should treat `independenceGroup`, not only domain or brand name, as the baseline corroboration key.
- Unknown paywall and ownership details are no longer blockers for roster approval as long as they remain explicit and do not create unresolved same-parent ambiguity.

## Deviations From Plan

- Used a machine-readable JSON roster plus a validation script instead of a DB seed script because no source-seeding runtime exists yet in the implementation repo.
- Kept the final named roster locked in [source-policy.md](../../../../docs/source-policy.md) while placing the full policy rows in [approved-roster.json](../../../../lib/sources/approved-roster.json) to give Step 5 an exact ingest baseline.
