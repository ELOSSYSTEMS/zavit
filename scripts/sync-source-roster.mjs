import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { loadApprovedRoster, mapRosterSourceToSourceRecord } from "../lib/ingest/roster.mjs";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for source sync.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const roster = loadApprovedRoster();

  for (const source of roster.sources) {
    const record = mapRosterSourceToSourceRecord(source);
    const existing = await prisma.source.findFirst({
      where: {
        OR: [{ slug: record.slug }, { canonicalDomain: record.canonicalDomain }],
      },
    });

    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: record,
      });
      continue;
    }

    await prisma.source.create({
      data: record,
    });
  }

  console.log(`Synced ${roster.sources.length} approved sources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
