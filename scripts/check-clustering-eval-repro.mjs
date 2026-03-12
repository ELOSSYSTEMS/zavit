import path from "node:path";

import {
  DEFAULT_THRESHOLDS,
  evaluatePredictions,
  loadEvaluationDataset,
  loadPredictions,
} from "../lib/evaluation/clustering-eval.mjs";

const datasetPath = path.resolve("tests/fixtures/evaluation/labeled-clustering-dataset.v1.json");
const predictionsPath = path.resolve("tests/fixtures/evaluation/predictions-sample-pass.v1.json");

const dataset = loadEvaluationDataset(datasetPath);
const predictions = loadPredictions(predictionsPath);

const first = JSON.stringify(evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS));
const second = JSON.stringify(evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS));

if (first !== second) {
  throw new Error("Clustering evaluation output is not reproducible for the same dataset and prediction artifact.");
}

console.log(
  JSON.stringify(
    {
      verdict: "PASS",
      bytes: Buffer.byteLength(first, "utf8"),
    },
    null,
    2,
  ),
);
