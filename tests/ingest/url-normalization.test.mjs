import test from "node:test";
import assert from "node:assert/strict";

import { dedupeNormalizedUrls, normalizeUrl } from "../../lib/ingest/url-normalize.mjs";

test("normalizeUrl removes tracking params and fragments", () => {
  const normalized = normalizeUrl(
    "http://news.example.com/story/123/?utm_source=test&foo=bar#fragment",
  );

  assert.equal(normalized, "https://news.example.com/story/123?foo=bar");
});

test("dedupeNormalizedUrls keeps only unique canonical urls", () => {
  const urls = dedupeNormalizedUrls([
    "https://news.example.com/story/123?utm_source=test&foo=bar",
    "https://news.example.com/story/123/?foo=bar&utm_medium=email",
    "https://news.example.com/story/456",
  ]);

  assert.deepEqual(urls, [
    "https://news.example.com/story/123?foo=bar",
    "https://news.example.com/story/456",
  ]);
});
