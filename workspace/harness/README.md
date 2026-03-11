# Harness Process

## Purpose

This folder holds the phase evidence loop for the ZAVIT rebuild. Each phase produces markdown artifacts that become required input for the next phase, so problems surface early instead of at release time.

## Folder Structure

```text
workspace/
  harness/
    README.md
    PROCESS_LOOP.md
    templates/
      00-kickoff.md
      10-evidence.md
      20-checks.md
      30-gate.md
      40-handoff.md
    phases/
      <NN-step-slug>/
        00-kickoff.md
        10-evidence.md
        20-checks.md
        30-gate.md
        40-handoff.md
```

## Required Loop Per Step

1. Create `00-kickoff.md`
- Scope for the step
- Dependencies from previous steps
- Explicit non-goals
- Risks to watch

2. Update `10-evidence.md`
- Decisions made
- Files/modules touched
- Findings that change later work
- Deviations from plan

3. Write `20-checks.md`
- Automated checks run
- Manual checks performed
- Failures, warnings, and unresolved items

4. Write `30-gate.md`
- Pass, blocked, or conditional-pass verdict
- Entry criteria for the next step
- Stop conditions if the verdict is not pass

5. Write `40-handoff.md`
- What the next step should consume
- Which assumptions are now locked
- Which open questions remain active

## Rules

- No step starts without its own `00-kickoff.md`.
- No step closes without `20-checks.md`, `30-gate.md`, and `40-handoff.md`.
- Each step must link back to the previous step's `30-gate.md` and `40-handoff.md`.
- If a gate is blocked, the next step cannot begin except for documented unblock work.
- If a later step changes an earlier assumption, update the earlier step's `10-evidence.md` and note the change in the current step.

## Naming Convention

Use `workspace/harness/phases/<NN-step-slug>/`.

Examples:
- `workspace/harness/phases/01-contract-lock/`
- `workspace/harness/phases/05-ingestion-health/`
- `workspace/harness/phases/12-release-gates/`
