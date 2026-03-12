import test from "node:test";
import assert from "node:assert/strict";

import { embedTexts } from "../../lib/clustering/embeddings.mjs";

test("embedTexts parses single-item Gemini embedContent responses", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        embedding: {
          values: [0.1, 0.2, 0.3],
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  try {
    const vectors = await embedTexts(["hello"], {
      provider: "gemini",
      apiKey: "test-key",
    });

    assert.deepEqual(vectors, [[0.1, 0.2, 0.3]]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("embedTexts parses multi-item Gemini batchEmbedContents responses", async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl = null;

  globalThis.fetch = async (url) => {
    calledUrl = String(url);

    return new Response(
      JSON.stringify({
        embeddings: [
          { values: [0.1, 0.2] },
          { values: [0.3, 0.4] },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  try {
    const vectors = await embedTexts(["hello", "world"], {
      provider: "gemini",
      apiKey: "test-key",
    });

    assert.match(calledUrl, /batchEmbedContents/);
    assert.deepEqual(vectors, [
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
