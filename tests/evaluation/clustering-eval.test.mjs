import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  DEFAULT_THRESHOLDS,
  evaluatePredictions,
  loadEvaluationDataset,
  loadPredictions,
} from "../../lib/evaluation/clustering-eval.mjs";

const datasetPath = path.resolve("tests/fixtures/evaluation/labeled-clustering-dataset.v1.json");
const predictionsPath = path.resolve("tests/fixtures/evaluation/predictions-sample-pass.v1.json");

test("evaluation harness passes for the sample labeled predictions", () => {
  const dataset = loadEvaluationDataset(datasetPath);
  const predictions = loadPredictions(predictionsPath);
  const report = evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS);

  assert.equal(report.pass, true);
  assert.deepEqual(report.metrics, {
    falseMergeRate: 0,
    holdRate: 0,
    publishEligiblePrecision: 1,
    publishEligibleRecall: 1,
  });
  assert.equal(report.summary.articleCount, 12);
  assert.equal(report.summary.labeledGroupCount, 3);
});

test("evaluation harness fails when a false merge appears in a publish-eligible group", () => {
  const dataset = loadEvaluationDataset(datasetPath);
  const predictions = {
    datasetVersion: "2026-03-12.v1",
    runLabel: "fixture-false-merge",
    predictedGroups: [
      {
        id: "p-merged",
        publishEligible: true,
        articleIds: ["a1", "a2", "a3", "a10"],
      },
      {
        id: "p-budget-vote",
        publishEligible: true,
        articleIds: ["a4", "a5", "a6"],
      },
      {
        id: "p-highway-6-bus-crash",
        publishEligible: true,
        articleIds: ["a7", "a8", "a9"],
      }
    ],
    heldArticleIds: ["a11", "a12"],
  };

  const report = evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS);

  assert.equal(report.pass, false);
  assert.ok(report.metrics.falseMergeRate > DEFAULT_THRESHOLDS.falseMergeRateMax);
  assert.ok(report.examples.falseMergePairs.includes("a1::a10"));
});
