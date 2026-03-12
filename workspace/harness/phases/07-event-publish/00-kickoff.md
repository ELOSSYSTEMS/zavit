# Step 7 Kickoff: Event Formation And Publish Gating

## Goal

Materialize draft and published events from the Step 5 ingest baseline, gate publication through the Step 6 evaluation harness, and expose event/run state in admin and public routes without bypass paths.

## Inputs Read

- [Step 6 gate](../06-evaluation-harness/30-gate.md)
- [Step 6 handoff](../06-evaluation-harness/40-handoff.md)
- [evaluation-gate.md](../../../../docs/evaluation-gate.md)
- [ADR-004-confidence-thresholds.md](../../../../docs/adr/ADR-004-confidence-thresholds.md)
- [schema.prisma](../../../../prisma/schema.prisma)

## Dependencies

- The Step 6 harness output format remains the required gate before publish promotion.
- Event publication still requires at least two distinct independent sources.
- Publish snapshots remain the only public event read source for published state.

## Non-Goals

- Do not add Step 8 admin auth or role enforcement yet.
- Do not add Step 9 report intake flows yet.
- Do not widen clustering inputs beyond metadata-only headline/snippet fields.

## Risks

- Heuristic clustering may still over-merge generic feed headlines and must fail closed.
- Paid Gemini embedding calls should not be exercised in verification without explicit user approval.
- Publish confidence can look misleading if held clusters are not mapped back to non-publish states.

## Planned Outputs

- Embedding-provider plumbing with a deterministic verification path
- Candidate retrieval and clustering prediction generation
- Publish gate tied to Step 6 evaluation results and ingest completeness
- Event, membership, and publish snapshot persistence
- Data-backed admin pipeline and event routes plus published public event detail
