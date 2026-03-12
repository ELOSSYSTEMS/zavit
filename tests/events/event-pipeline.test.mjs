import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCandidateSummaries,
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

test("candidate summaries hold clusters that fail publish coherence", () => {
  const candidates = buildCandidateSummaries(
    [
      {
        articleIds: ["a1", "a2"],
        headline: "Mixed incident cluster",
        confidenceScore: 0.996,
        publishEligible: true,
        overbroadCluster: false,
        clusterCoherent: false,
        minimumSimilarity: 0.41,
      },
    ],
    new Map([
      ["a1", { source: { slug: "ynet" } }],
      ["a2", { source: { slug: "n12" } }],
    ]),
    new Map([
      ["ynet", "g1"],
      ["n12", "g2"],
    ]),
  );

  assert.equal(candidates[0].publishable, false);
  assert.equal(candidates[0].confidenceState, "REVIEW");
  assert.match(candidates[0].coherenceReason, /full-cluster coherence/);
});
