import assert from "node:assert/strict";
import test from "node:test";

import {
  getCaseActionAuditType,
  getSlaState,
  resolveCaseStatusTransition,
} from "../../lib/reports/workflow.mjs";

test("case transitions resolve to the locked queue statuses", () => {
  assert.equal(resolveCaseStatusTransition("acknowledge"), "ACKNOWLEDGED");
  assert.equal(resolveCaseStatusTransition("start_review"), "UNDER_REVIEW");
  assert.equal(resolveCaseStatusTransition("request_action"), "ACTION_REQUIRED");
  assert.equal(resolveCaseStatusTransition("mark_suppressed"), "SUPPRESSED");
  assert.equal(resolveCaseStatusTransition("resolve"), "RESOLVED");
  assert.equal(resolveCaseStatusTransition("reject"), "REJECTED");
});

test("SLA state flags late emergency suppression requests quickly", () => {
  const state = getSlaState({
    reportType: "EMERGENCY_SUPPRESSION",
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    status: "NEW",
    now: new Date("2026-03-12T12:00:00.000Z"),
  });

  assert.equal(state, "late");
});

test("audit action mapping preserves acknowledgement and resolution evidence", () => {
  assert.equal(getCaseActionAuditType("ACKNOWLEDGED"), "CASE_ACKNOWLEDGED");
  assert.equal(getCaseActionAuditType("RESOLVED"), "CASE_RESOLVED");
  assert.equal(getCaseActionAuditType("UNDER_REVIEW"), "REVIEW_UPDATED");
});
