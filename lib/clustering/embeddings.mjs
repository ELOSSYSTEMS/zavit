const DEFAULT_GEMINI_MODEL = process.env.GEMINI_EMBED_MODEL ?? "models/gemini-embedding-001";
const DEFAULT_OUTPUT_DIMENSIONALITY = 768;
const DETERMINISTIC_DIMENSIONS = 128;
const GEMINI_BATCH_REQUEST_LIMIT = 100;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "after",
  "before",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "same",
  "said",
  "report",
  "reports",
  "coverage",
  "officials",
  "article",
  "news",
  "live",
  "update",
  "updates",
  "חדשות",
  "ואקטואליה",
  "was",
  "were",
  "with",
  "will",
  "של",
  "על",
  "עם",
  "גם",
  "זה",
  "זו",
  "עוד",
  "כל",
  "ללא",
  "אחרי",
  "לפני",
  "בתוך",
  "דיווח",
  "דיווחים",
  "attack",
  "attacks",
  "stabbing",
  "stabbings",
  "shooting",
  "shootings",
  "terror",
  "terrorist",
  "terrorists",
  "police",
  "suspect",
  "suspects",
  "killed",
  "injured",
  "injury",
  "victim",
  "victims",
  "scene",
  "hospital",
  "security",
  "breaking",
  "urgent",
  "פיגוע",
  "פיגועים",
  "דקירה",
  "ירי",
  "מחבל",
  "מחבלים",
  "פצוע",
  "פצועים",
  "הרוג",
  "הרוגים",
  "משטרה",
  "חשוד",
  "חשודים",
  "זירה",
  "בית",
  "חולים",
  "אבטחה",
]);

function hashToken(token) {
  let hash = 2166136261;

  for (const character of token) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

export function tokenizeText(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function vectorizeDeterministic(text) {
  const vector = Array.from({ length: DETERMINISTIC_DIMENSIONS }, () => 0);

  for (const token of tokenizeText(text)) {
    vector[hashToken(token) % DETERMINISTIC_DIMENSIONS] += 1;
  }

  return normalizeVector(vector);
}

async function embedWithGemini(texts, options = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = options.model ?? DEFAULT_GEMINI_MODEL;
  const taskType = options.taskType ?? "SEMANTIC_SIMILARITY";
  const outputDimensionality = options.outputDimensionality ?? DEFAULT_OUTPUT_DIMENSIONALITY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for the Gemini embedding provider.");
  }

  if (!texts.length) {
    return [];
  }

  if (texts.length === 1) {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          taskType,
          outputDimensionality,
          content: {
            parts: [
              {
                text: texts[0],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const vector = payload?.embedding?.values ?? null;

    if (!Array.isArray(vector)) {
      throw new Error("Gemini embedding request returned no embedding values.");
    }

    return [vector];
  }

  const vectors = [];

  for (let index = 0; index < texts.length; index += GEMINI_BATCH_REQUEST_LIMIT) {
    const batch = texts.slice(index, index + GEMINI_BATCH_REQUEST_LIMIT);
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model,
            taskType,
            outputDimensionality,
            content: {
              parts: [
                {
                  text,
                },
              ],
            },
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const batchVectors = (payload.embeddings ?? []).map((item) => item.values ?? []);

    if (batchVectors.length !== batch.length) {
      throw new Error(
        `Expected ${batch.length} Gemini embeddings, received ${batchVectors.length}.`,
      );
    }

    vectors.push(...batchVectors);
  }

  if (vectors.length !== texts.length) {
    throw new Error(`Expected ${texts.length} Gemini embeddings, received ${vectors.length}.`);
  }

  return vectors;
}

export async function embedTexts(texts, options = {}) {
  const provider = options.provider ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";

  if (provider === "deterministic") {
    return texts.map((text) => vectorizeDeterministic(text));
  }

  if (provider === "gemini") {
    return embedWithGemini(texts, options);
  }

  throw new Error(`Unsupported embedding provider ${provider}`);
}

export function cosineSimilarity(left, right) {
  if (!left.length || !right.length || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
