# Phase Loop

## Intent

The loop is designed to feed evidence forward and force each phase to leave behind usable inputs for the next one.

## Loop

1. Kickoff
- Read the previous phase's `30-gate.md` and `40-handoff.md`.
- Create the current phase's `00-kickoff.md`.
- Confirm scope, dependencies, non-goals, and blockers.

2. Execute
- Do the planned work.
- Keep `10-evidence.md` current whenever findings change downstream assumptions.

3. Verify Narrowly
- Run the smallest automated checks that prove the current phase.
- Record raw outcomes in `20-checks.md`.

4. Verify Broadly
- Run manual checks or broader integration checks that prove the phase did not create hidden risk.
- Record gaps and residual risk in `20-checks.md`.

5. Gate
- Decide `PASS`, `BLOCKED`, or `CONDITIONAL PASS` in `30-gate.md`.
- A `CONDITIONAL PASS` must list exact follow-ups and deadline step.

6. Feed Forward
- Write `40-handoff.md` with the next phase inputs, locked assumptions, and required references.
- The next phase kickoff must link to this handoff.

## Minimum Gate Questions

- Did this phase satisfy its automated checks?
- Did this phase satisfy its manual checks?
- Did this phase change any upstream assumptions?
- Are there unresolved blockers that make the next phase unsafe?
- What exact markdown files must the next phase read first?
