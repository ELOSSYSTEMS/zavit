# Compliance Workflow

## Status

Step 1 draft on 2026-03-12

## Purpose

Define the minimum v1 workflow for publisher complaints, opt-out requests, public corrections, and emergency suppression.

## Intake Channels

- Public correction and report form
- Publisher complaint and opt-out form
- Dedicated email intake for publishers and urgent legal requests

## Case Types

- Public correction or bad-cluster report
- Wrong-source or broken-link report
- Publisher complaint
- Publisher opt-out request
- Emergency suppression request

## Roles

- `reviewer`: may inspect cases and perform non-destructive review work
- `operator`: may acknowledge, suppress, disable sources, and close legal/compliance cases

## Service Targets

- Same-business-day acknowledgement for publisher complaints and opt-out requests
- One-business-day emergency suppression target
- Three-business-day initial resolution target

## Minimum Case States

- `new`
- `acknowledged`
- `under_review`
- `action_required`
- `suppressed`
- `resolved`
- `rejected`

## Required Audit Trail

Every case action must record:

- Actor
- Timestamp
- Action taken
- Reason
- Affected source or event
- Linked supporting notes

## Content Handling Rules

- The product must remain metadata-only in v1.
- Publisher removal requests trigger immediate protective review rather than silent deletion without record.
- Suppression must remove public exposure first, then proceed through documented review.

## Open Items

- Build-stopping for Step 8 and Step 9: exact storage schema and notification implementation
- Non-blocking for Step 2 scaffold: final inbox tooling and outbound email provider
