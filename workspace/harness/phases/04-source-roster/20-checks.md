# Step 4 Checks: Source Roster And Metadata Policy

## Automated Checks

- `npm run validate:sources`

## Manual Checks

- Confirmed all 12 approved sources have a documented policy row in [approved-roster.json](../../../../lib/sources/approved-roster.json)
- Confirmed the required coverage buckets are present: mainstream Hebrew, public broadcast, business, religious or Haredi, and Arab-community
- Reviewed same-parent independence handling and confirmed only Kan News and Makan share an `independenceGroup`
- Confirmed [source-policy.md](../../../../docs/source-policy.md) documents explicit unknown handling and keeps the final named roster locked in policy
- Confirmed the source admission workflow continues to exist in [source-policy.md](../../../../docs/source-policy.md) through the admission requirements and corroboration policy sections

## Results

- `npm run validate:sources`: passed

## Failures And Warnings

- No schema-level DB seeding check exists yet because the repo still lacks a source seed runner
- Four approved sources currently use `SECTION_CRAWL` seed inputs and need Step 5 validation against live site behavior: Kan News, Globes, Kikar HaShabbat, and Makan
- Some ownership and paywall rows intentionally remain `UNKNOWN` where Step 4 could not safely assert more

## Residual Risk

- Step 5 could still discover that one or more section-crawl seeds need narrower URLs or a source-specific parser
- Independence grouping is encoded at the policy level now, but Step 5 and Step 7 must actually consume it instead of falling back to naive domain checks
