import test from "node:test";
import assert from "node:assert/strict";

import {
  extractArticleAnchors,
  normalizeAnchorExtraction,
  toArticleAnchorUpdate,
} from "../../lib/clustering/extract-anchors.mjs";

test("normalizeAnchorExtraction keeps a stable shape for partial outputs", () => {
  const normalized = normalizeAnchorExtraction(
    {
      eventType: "Stabbing",
      locations: [" Ramat Gan ", "", "Ramat Gan"],
      confidence: "0.81",
    },
    {
      headline: "Attack reported in Ramat Gan",
      snippet: "Police responded to the scene.",
      publishedAt: "2026-03-12T18:00:00Z",
    },
  );

  assert.equal(normalized.eventType, "stabbing");
  assert.deepEqual(normalized.locations, ["Ramat Gan"]);
  assert.equal(normalized.datetime, "2026-03-12T18:00:00.000Z");
  assert.deepEqual(normalized.actors, []);
  assert.equal(normalized.confidence, 0.81);
});

test("extractArticleAnchors supports disabled provider", async () => {
  const anchors = await extractArticleAnchors(
    {
      headline: "Budget vote delayed overnight",
      snippet: "Coalition leaders continued negotiations.",
      publishedAt: "2026-03-12T18:00:00Z",
    },
    {
      provider: "disabled",
    },
  );

  assert.equal(anchors.status, "DISABLED");
  assert.equal(anchors.confidence, 0);
  assert.deepEqual(anchors.locations, []);
});

test("extractArticleAnchors deterministic mode infers simple anchors", async () => {
  const anchors = await extractArticleAnchors(
    {
      headline: "Stabbing attack in Ramat Gan leaves two injured",
      snippet: "Police said the suspect was arrested on Bialik Street in Ramat Gan.",
      publishedAt: "2026-03-12T18:00:00Z",
    },
    {
      provider: "deterministic",
    },
  );

  assert.equal(anchors.eventType, "stabbing");
  assert.ok(anchors.locations.some((location) => /ramat gan/i.test(location)));
  assert.equal(anchors.status, "HEURISTIC");
  assert.ok(anchors.confidence > 0.5);
});

test("toArticleAnchorUpdate maps normalized anchors to article fields", () => {
  const update = toArticleAnchorUpdate({
    eventType: "protest",
    locations: ["Jerusalem"],
    datetime: "2026-03-12T18:00:00.000Z",
    actors: ["organizers"],
    keywords: ["protest"],
    confidence: 0.77,
    status: "OK",
    raw: null,
  });

  assert.equal(update.eventType, "protest");
  assert.deepEqual(update.locations, ["Jerusalem"]);
  assert.equal(update.extractedDatetime.toISOString(), "2026-03-12T18:00:00.000Z");
  assert.equal(update.anchorConfidence, 0.77);
  assert.equal(update.anchorExtractionStatus, "OK");
});
