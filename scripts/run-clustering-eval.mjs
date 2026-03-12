import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_THRESHOLDS,
  evaluatePredictions,
  loadEvaluationDataset,
  loadPredictions,
} from "../lib/evaluation/clustering-eval.mjs";

const DEFAULT_DATASET_PATH = path.resolve(
  "tests/fixtures/evaluation/labeled-clustering-dataset.v1.json",
);
const DEFAULT_PREDICTIONS_PATH = path.resolve(
  "tests/fixtures/evaluation/predictions-sample-pass.v1.json",
);

function parseArgs(argv) {
  const parsed = {
    dataset: DEFAULT_DATASET_PATH,
    predictions: DEFAULT_PREDICTIONS_PATH,
    jsonOut: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--dataset" && next) {
      parsed.dataset = path.resolve(next);
      index += 1;
      continue;
    }

    if (token === "--predictions" && next) {
      parsed.predictions = path.resolve(next);
      index += 1;
      continue;
    }

    if (token === "--json-out" && next) {
      parsed.jsonOut = path.resolve(next);
      index += 1;
    }
  }

  return parsed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dataset = loadEvaluationDataset(options.dataset);
  dataset.sourcePath = options.dataset;
  const predictions = loadPredictions(options.predictions);
  predictions.sourcePath = options.predictions;

  const report = evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS);

  if (options.jsonOut) {
    fs.mkdirSync(path.dirname(options.jsonOut), { recursive: true });
    fs.writeFileSync(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));

  if (!report.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
