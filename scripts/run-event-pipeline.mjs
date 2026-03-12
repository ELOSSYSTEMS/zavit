import "dotenv/config";

import { runEventPipeline } from "../lib/events/pipeline.mjs";
import { prisma } from "../lib/server/db/client.mjs";

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const provider = readFlag("--provider") ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";

try {
  const run = await runEventPipeline(prisma, { provider });
  console.log(
    JSON.stringify(
      {
        runId: run.id,
        status: run.status,
        heldEventCount: run.heldEventCount,
        publishedEventCount: run.publishedEventCount,
        blockedReason: run.blockedReason,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
