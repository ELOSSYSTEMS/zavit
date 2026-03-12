import "dotenv/config";

import { evaluateClusteringHarness } from "../lib/events/pipeline.mjs";

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const provider = readFlag("--provider") ?? process.env.CLUSTER_EMBED_PROVIDER ?? "deterministic";
const datasetPath = readFlag("--dataset") ?? "tests/fixtures/evaluation/labeled-clustering-dataset.v2.json";

const baseline = await evaluateClusteringHarness({
  provider,
  datasetPath,
  label: `baseline-${provider}`,
  anchorVetoEnabled: false,
});

const anchorAware = await evaluateClusteringHarness({
  provider,
  datasetPath,
  label: `anchor-aware-${provider}`,
  anchorVetoEnabled: true,
});

console.log(
  JSON.stringify(
    {
      provider,
      datasetPath,
      baseline: {
        report: baseline.report,
        predictedGroupCount: baseline.predictions.predictedGroups.length,
        heldArticleCount: baseline.predictions.heldArticleIds.length,
      },
      anchorAware: {
        report: anchorAware.report,
        predictedGroupCount: anchorAware.predictions.predictedGroups.length,
        heldArticleCount: anchorAware.predictions.heldArticleIds.length,
      },
    },
    null,
    2,
  ),
);

if (!anchorAware.report.pass) {
  process.exitCode = 1;
}
