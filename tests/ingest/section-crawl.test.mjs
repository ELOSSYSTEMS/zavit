import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { collectSectionCandidates } from "../../lib/ingest/section-crawl.mjs";

const sectionFixture = readFileSync(
  new URL("../fixtures/ingest/section-sample.html", import.meta.url),
  "utf8",
);

test("collectSectionCandidates keeps same-domain article candidates only", () => {
  const candidates = collectSectionCandidates(sectionFixture, {
    slug: "kan-news",
    websiteUrl: "https://www.kan.org.il/content/kan-news/",
  });

  assert.deepEqual(candidates, [
    "https://www.kan.org.il/content/kan-news/item-1",
    "https://www.kan.org.il/content/kan-news/item-2",
  ]);
});
