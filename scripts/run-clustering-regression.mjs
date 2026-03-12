import "dotenv/config";

import { evaluateClusteringHarness } from "../lib/events/pipeline.mjs";

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const provider = readFlag("--provider") ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";
const { report, predictions } = await evaluateClusteringHarness({
  provider,
  label: `step7-${provider}`,
});

console.log(
  JSON.stringify(
    {
      provider,
      report,
      predictedGroupCount: predictions.predictedGroups.length,
      heldArticleCount: predictions.heldArticleIds.length,
    },
    null,
    2,
  ),
);

if (!report.pass) {
  process.exitCode = 1;
}
