const DEFAULT_GEMINI_MODEL = process.env.GEMINI_TEXT_MODEL ?? "models/gemini-2.0-flash";
const DEFAULT_EXTRACTION_VERSION = "anchors-v1";
const MAX_LIST_ITEMS = 8;

const EVENT_TYPE_PATTERNS = [
  { eventType: "stabbing", patterns: [/\bstabb/i, /דקיר/u, /knife attack/i] },
  { eventType: "shooting", patterns: [/\bshoot/i, /ירי/u, /gunfire/i] },
  { eventType: "bombing", patterns: [/\bbomb/i, /פיצו/u, /explosi/i] },
  { eventType: "vehicle_attack", patterns: [/ramming/i, /car ramming/i, /דריס/u] },
  { eventType: "protest", patterns: [/\bprotest/i, /\bdemonstration/i, /הפגנ/u, /מחא/u] },
  { eventType: "political", patterns: [/\bbudget/i, /\bcabinet/i, /\bvote/i, /תקציב/u, /ממשלה/u, /קואליצ/u] },
  { eventType: "military_operation", patterns: [/\bstrike/i, /\braid/i, /מבצע/u, /תקיפ/u] },
  { eventType: "natural_disaster", patterns: [/\bearthquake/i, /\bflood/i, /רעידת אדמה/u, /שטפ/u] },
  { eventType: "accident", patterns: [/\bcrash/i, /\boverturn/i, /\baccident/i, /תאונ/u, /התהפ/u] },
];

const KEYWORD_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "after",
  "near",
  "from",
  "this",
  "that",
  "said",
  "reports",
  "report",
  "update",
  "updates",
  "breaking",
  "police",
  "officials",
  "של",
  "על",
  "עם",
  "גם",
  "זה",
  "זו",
  "עוד",
  "דיווח",
  "דיווחים",
]);

function uniqueTrimmed(values) {
  return [...new Set(
    (values ?? [])
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  )].slice(0, MAX_LIST_ITEMS);
}

function normalizeEventType(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/gu, "_");
  return normalized || null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeAnchorConfidence(value, fallback = null) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, Number(numeric.toFixed(4))));
}

function tokenizeKeywords(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !KEYWORD_STOPWORDS.has(token))
    .slice(0, MAX_LIST_ITEMS);
}

function inferEventType(text) {
  for (const candidate of EVENT_TYPE_PATTERNS) {
    if (candidate.patterns.some((pattern) => pattern.test(text))) {
      return candidate.eventType;
    }
  }

  return "other";
}

function extractCapitalizedLocations(text) {
  const matches = text.match(/\b(?:in|near|at|on)\s+([A-Z][\p{L}-]+(?:\s+[A-Z][\p{L}-]+){0,3})/gu) ?? [];
  return matches.map((match) => match.replace(/^(in|near|at|on)\s+/iu, "").trim());
}

function extractTransportLocations(text) {
  const matches = [
    ...(text.match(/\b(?:Highway|Route)\s+\d+\b/gu) ?? []),
    ...(text.match(/\b[\p{L}-]+\s+Junction\b/gu) ?? []),
    ...(text.match(/\b[\p{L}-]+\s+Street\b/gu) ?? []),
  ];

  return matches;
}

function extractHebrewLocations(text) {
  const patterns = [
    /(?:ברחוב|רחוב)\s+([\p{Script=Hebrew}"' -]{2,40})/gu,
    /(?:בצומת|צומת)\s+([\p{Script=Hebrew}"' -]{2,40})/gu,
    /(?:בכביש|כביש)\s+([\p{Script=Hebrew}\d"' -]{1,20})/gu,
    /(?:בירושלים|ירושלים|בתל אביב|תל אביב|בשדרות|שדרות|ברמת גן|רמת גן|במישיגן|מישיגן)/gu,
  ];
  const results = [];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      results.push((match[1] ?? match[0]).trim());
    }
  }

  return results;
}

function deterministicExtract(article) {
  const text = [article.headline, article.snippet].filter(Boolean).join(" -- ");
  const locations = uniqueTrimmed([
    ...extractCapitalizedLocations(text),
    ...extractTransportLocations(text),
    ...extractHebrewLocations(text),
  ]);
  const eventType = inferEventType(text);
  const keywords = uniqueTrimmed(tokenizeKeywords(text));

  return {
    eventType,
    locations,
    datetime: normalizeDate(article.publishedAt),
    actors: [],
    keywords,
    confidence: locations.length || eventType !== "other" ? 0.62 : 0.35,
    status: "HEURISTIC",
    raw: null,
  };
}

function buildGeminiPrompt(article) {
  return [
    "Extract event anchors from the article metadata and return JSON only.",
    "Schema:",
    '{"eventType":"string|null","locations":["string"],"datetime":"ISO-8601|null","actors":["string"],"keywords":["string"],"confidence":0}',
    "",
    `Headline: ${article.headline ?? ""}`,
    `Snippet: ${article.snippet ?? ""}`,
    `PublishedAt: ${article.publishedAt ?? ""}`,
    `Language: ${article.language ?? ""}`,
  ].join("\n");
}

async function extractWithGemini(article, options = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini anchor extraction.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${DEFAULT_GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildGeminiPrompt(article),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini anchor extraction failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini anchor extraction returned no JSON content.");
  }

  return {
    parsed: JSON.parse(text),
    raw: payload,
  };
}

export function normalizeAnchorExtraction(input, fallbackArticle = {}) {
  const normalized = {
    eventType: normalizeEventType(input?.eventType) ?? inferEventType([fallbackArticle.headline, fallbackArticle.snippet].filter(Boolean).join(" -- ")),
    locations: uniqueTrimmed(input?.locations),
    datetime: normalizeDate(input?.datetime ?? fallbackArticle.publishedAt),
    actors: uniqueTrimmed(input?.actors),
    keywords: uniqueTrimmed(input?.keywords ?? tokenizeKeywords([fallbackArticle.headline, fallbackArticle.snippet].filter(Boolean).join(" -- "))),
    confidence: normalizeAnchorConfidence(input?.confidence, 0.5),
    status: typeof input?.status === "string" ? input.status : "OK",
    raw: input?.raw ?? null,
  };

  return normalized;
}

function resolveProvider(options = {}) {
  if (options.provider) {
    return options.provider;
  }

  if (process.env.CLUSTER_ANCHOR_PROVIDER) {
    return process.env.CLUSTER_ANCHOR_PROVIDER;
  }

  return process.env.GEMINI_API_KEY ? "gemini" : "deterministic";
}

export async function extractArticleAnchors(article, options = {}) {
  const provider = resolveProvider(options);

  if (provider === "disabled") {
    return normalizeAnchorExtraction(
      {
        eventType: null,
        locations: [],
        datetime: null,
        actors: [],
        keywords: [],
        confidence: 0,
        status: "DISABLED",
        raw: null,
      },
      article,
    );
  }

  if (provider === "deterministic") {
    return normalizeAnchorExtraction(deterministicExtract(article), article);
  }

  if (provider === "gemini") {
    const extracted = await extractWithGemini(article, options);
    return normalizeAnchorExtraction(
      {
        ...extracted.parsed,
        status: "OK",
        raw: extracted.raw,
      },
      article,
    );
  }

  throw new Error(`Unsupported anchor extraction provider ${provider}`);
}

export function toArticleAnchorUpdate(anchors) {
  return {
    eventType: anchors.eventType,
    locations: anchors.locations,
    extractedDatetime: anchors.datetime ? new Date(anchors.datetime) : null,
    actors: anchors.actors,
    anchorKeywords: anchors.keywords,
    anchorConfidence: anchors.confidence,
    anchorExtractionVersion: DEFAULT_EXTRACTION_VERSION,
    anchorExtractionStatus: anchors.status,
    anchorRaw: anchors.raw,
  };
}

