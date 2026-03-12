import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_EMBED_MODEL ?? "models/gemini-embedding-001";
const DEFAULT_OUTPUT_DIMENSIONALITY = 768;
const DEFAULT_GEMINI_BATCH_SIZE = 64;
const DETERMINISTIC_DIMENSIONS = 128;

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

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for the Gemini embedding provider.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const batchSize = options.batchSize ?? DEFAULT_GEMINI_BATCH_SIZE;
  const vectors = [];

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const response = await ai.models.embedContent({
      model: options.model ?? DEFAULT_GEMINI_MODEL,
      contents: batch,
      config: {
        outputDimensionality: options.outputDimensionality ?? DEFAULT_OUTPUT_DIMENSIONALITY,
      },
    });

    vectors.push(...(response.embeddings ?? []).map((item) => item.values ?? []));
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
