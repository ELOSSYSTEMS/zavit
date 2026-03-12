import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateClusteringHarness,
  resolvePublishBlockers,
} from "../../lib/events/pipeline.mjs";

test("step7 clustering harness generation passes the locked Step 6 thresholds", async () => {
  const { report, predictions } = await evaluateClusteringHarness({
    provider: "deterministic",
    label: "test-deterministic",
  });

  assert.equal(report.pass, true);
  assert.equal(report.metrics.falseMergeRate, 0);
  assert.equal(report.metrics.publishEligiblePrecision, 1);
  assert.ok(Array.isArray(predictions.predictedGroups));
});

test("publish gate blocks incomplete ingest coverage", () => {
  const blockedReason = resolvePublishBlockers({
    ingestRun: {
      status: "SUCCEEDED",
      sourceCount: 10,
    },
    rosterSourceCount: 12,
    evaluationReport: {
      pass: true,
    },
  });

  assert.match(blockedReason, /10 of 12 approved sources/);
});

test("publish gate blocks if the evaluation harness fails", () => {
  const blockedReason = resolvePublishBlockers({
    ingestRun: {
      status: "SUCCEEDED",
      sourceCount: 12,
    },
    rosterSourceCount: 12,
    evaluationReport: {
      pass: false,
    },
  });

  assert.match(blockedReason, /Step 6 clustering harness/);
});
