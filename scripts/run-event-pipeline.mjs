import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { runEventPipeline } from "../lib/events/pipeline.mjs";

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const connectionString = resolveConnectionString();

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for the event pipeline.");
}

const provider = readFlag("--provider") ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

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
