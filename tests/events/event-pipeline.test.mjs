import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCandidateSummaries,
  evaluateClusteringHarness,
  formatMembershipEvidenceSummary,
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

test("candidate summaries hold clusters with contradictory reliable anchor locations", () => {
  const candidates = buildCandidateSummaries(
    [
      {
        articleIds: ["a1", "a2", "a3"],
        headline: "Mixed incident cluster",
        confidenceScore: 0.996,
        publishEligible: true,
        overbroadCluster: false,
        clusterCoherent: true,
        minimumSimilarity: 0.66,
      },
    ],
    new Map([
      [
        "a1",
        {
          source: { slug: "ynet" },
          eventType: "stabbing",
          locations: ["Ramat Gan"],
          extractedDatetime: "2026-03-12T18:00:00Z",
          anchorConfidence: 0.91,
          anchorExtractionStatus: "OK",
        },
      ],
      [
        "a2",
        {
          source: { slug: "n12" },
          eventType: "stabbing",
          locations: ["Ramat Gan"],
          extractedDatetime: "2026-03-12T18:04:00Z",
          anchorConfidence: 0.92,
          anchorExtractionStatus: "OK",
        },
      ],
      [
        "a3",
        {
          source: { slug: "haaretz" },
          eventType: "stabbing",
          locations: ["Jerusalem"],
          extractedDatetime: "2026-03-12T18:06:00Z",
          anchorConfidence: 0.94,
          anchorExtractionStatus: "OK",
        },
      ],
    ]),
    new Map([
      ["ynet", "g1"],
      ["n12", "g2"],
      ["haaretz", "g3"],
    ]),
  );

  assert.equal(candidates[0].publishable, false);
  assert.equal(candidates[0].confidenceState, "REVIEW");
  assert.match(candidates[0].coherenceReason, /anchor locations/);
});

test("membership evidence summary shows the strongest cluster links for one article", () => {
  const articleById = new Map([
    [
      "a1",
      {
        source: { slug: "ynet", displayName: "Ynet" },
        headline: "Schools in Sderot open late after rocket alert",
      },
    ],
    [
      "a2",
      {
        source: { slug: "n12", displayName: "N12" },
        headline: "Rocket alert near Sderot delays school opening",
      },
    ],
  ]);
  const [candidate] = buildCandidateSummaries(
    [
      {
        articleIds: ["a1", "a2"],
        headline: "Schools in Sderot open late after rocket alert",
        confidenceScore: 0.996,
        publishEligible: true,
        overbroadCluster: false,
        clusterCoherent: true,
        minimumSimilarity: 0.81,
        debug: {
          thresholds: {
            mergeSimilarityMin: 0.16,
            clusterCoherenceSimilarityMin: 0.15,
            minSharedTokens: 2,
          },
          clusterFacts: {
            articleCount: 2,
          },
          strongestPairs: [
            {
              articleIds: ["a1", "a2"],
              similarity: 0.8123,
              sharedTokens: 7,
              sharedHeadlineTokens: 3,
              lexicalGate: true,
              anchorConflict: null,
              relationship: "direct-merge",
            },
          ],
          articleSupport: [
            {
              articleId: "a1",
              strongestLinks: [
                {
                  articleIds: ["a1", "a2"],
                  similarity: 0.8123,
                  sharedTokens: 7,
                  sharedHeadlineTokens: 3,
                  lexicalGate: true,
                  anchorConflict: null,
                  relationship: "direct-merge",
                },
              ],
            },
            {
              articleId: "a2",
              strongestLinks: [
                {
                  articleIds: ["a1", "a2"],
                  similarity: 0.8123,
                  sharedTokens: 7,
                  sharedHeadlineTokens: 3,
                  lexicalGate: true,
                  anchorConflict: null,
                  relationship: "direct-merge",
                },
              ],
            },
          ],
        },
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

  const summary = formatMembershipEvidenceSummary(candidate, "a1", articleById);

  assert.match(summary, /cluster headline:/);
  assert.match(summary, /top cluster links:/);
  assert.match(summary, /Ynet: Schools in Sderot open late after rocket alert/);
  assert.match(summary, /direct merge candidate/);
});
