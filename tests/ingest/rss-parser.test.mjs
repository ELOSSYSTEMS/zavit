import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { extractArticleMetadata } from "../../lib/ingest/html-metadata.mjs";
import { parseFeedItems } from "../../lib/ingest/rss.mjs";

const rssFixture = readFileSync(new URL("../fixtures/ingest/rss-sample.xml", import.meta.url), "utf8");
const articleFixture = readFileSync(
  new URL("../fixtures/ingest/article-sample.html", import.meta.url),
  "utf8",
);

test("parseFeedItems returns normalized metadata-only article rows", () => {
  const items = parseFeedItems(rssFixture, "https://news.example.com");

  assert.equal(items.length, 2);
  assert.equal(items[0].canonicalUrl, "https://news.example.com/story/123?foo=bar");
  assert.equal(items[0].headline, "ראש ממשלה קיים הערכת מצב");
  assert.equal(items[0].snippet, "תקציר בדיקה ללא גוף כתבה");
});

test("extractArticleMetadata reads title, snippet and published date without body text", () => {
  const metadata = extractArticleMetadata(
    articleFixture,
    "https://news.example.com/story/456?utm_source=fixture",
  );

  assert.equal(metadata.canonicalUrl, "https://news.example.com/story/456");
  assert.equal(metadata.headline, "כותרת כתבה לבדיקה");
  assert.equal(metadata.snippet, "זהו תקציר תקין לבדיקה ללא גוף מלא.");
  assert.equal(metadata.publishedAt, "2026-03-12T12:00:00.000Z");
});
