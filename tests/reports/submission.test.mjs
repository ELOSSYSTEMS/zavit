import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareReportSubmission,
  scoreReportAbuse,
} from "../../lib/reports/workflow.mjs";

test("public report submissions produce report and case payloads", () => {
  const prepared = prepareReportSubmission({
    channel: "public",
    reportType: "BAD_CLUSTER",
    eventId: "evt_123",
    eventPublicId: "event-123",
    contactEmail: "reader@example.com",
    summary: "Wrong cluster pairing",
    details: "Two unrelated incidents were grouped into the same event feed entry.",
    honeypot: "",
  });

  assert.equal(prepared.ok, true);
  assert.equal(prepared.correctionReportData.reportType, "BAD_CLUSTER");
  assert.equal(prepared.correctionReportData.status, "NEW");
  assert.equal(prepared.operatorCaseData.eventId, "evt_123");
});

test("publisher complaints require contact email", () => {
  const prepared = prepareReportSubmission({
    channel: "publisher",
    reportType: "PUBLISHER_COMPLAINT",
    summary: "Please review attribution",
    details: "The event summary links to the wrong newsroom domain.",
    honeypot: "",
  });

  assert.equal(prepared.ok, false);
  assert.equal(prepared.error, "missing_contact");
});

test("honeypot-triggered submissions are flagged into action required", () => {
  const prepared = prepareReportSubmission({
    channel: "public",
    reportType: "BROKEN_LINK",
    summary: "Broken link on event page",
    details: "The event contains a canonical URL that returns a 404 page.",
    honeypot: "spam-bot",
  });

  assert.equal(prepared.ok, true);
  assert.equal(prepared.correctionReportData.status, "ACTION_REQUIRED");
  assert.equal(prepared.operatorCaseData.status, "ACTION_REQUIRED");
});

test("abuse scoring increases for invalid email and honeypot usage", () => {
  const score = scoreReportAbuse({
    honeypot: "filled",
    summary: "short",
    details: "too short",
    contactEmail: "invalid-email",
  });

  assert.equal(score, 1);
});
