import "dotenv/config";

import { runIngestion } from "../lib/ingest/run-ingest.mjs";

function readFlag(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

async function main() {
  const sourceSlug = readFlag("--source");
  const result = await runIngestion({ sourceSlug });

  console.log(JSON.stringify(result, null, 2));

  if (result.status === "FAILED") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
