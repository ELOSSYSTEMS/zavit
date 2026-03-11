# Step 4 Gate: Source Roster And Metadata Policy

## Verdict

`PASS`

## Entry Criteria Met

- The approved v1 roster now contains exactly 12 named sources
- Every approved source has a documented policy row and seed input in [approved-roster.json](../../../../lib/sources/approved-roster.json)
- The required coverage buckets are represented
- Same-parent independence handling is explicit through `independenceGroup`
- [source-policy.md](../../../../docs/source-policy.md) now locks the final named roster and documents unknown metadata handling
- `npm run validate:sources` passed

## Blockers

- None for Step 4 exit
- Deferred later-phase blockers remain:
  - Step 5: validate the section-crawl seeds against live site behavior and implement the actual source seed runner
  - Step 6: numeric evaluation thresholds and harness execution
  - Step 7: runtime enforcement of independence grouping during publication gating

## Stop Conditions

- Do not add or remove approved roster members without updating both [source-policy.md](../../../../docs/source-policy.md) and [approved-roster.json](../../../../lib/sources/approved-roster.json)
- Do not treat Kan News and Makan as independent corroboration against each other
- Do not silently replace `UNKNOWN` metadata with guessed values

## Required Next Action

Start Step 5 kickoff using this gate, the Step 4 handoff, and the canonical roster file as the ingest baseline.
