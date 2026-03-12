import "dotenv/config";

import { loadApprovedRoster, mapRosterSourceToSourceRecord } from "../lib/ingest/roster.mjs";
import { prisma } from "../lib/server/db/client.mjs";

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
