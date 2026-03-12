import { createHash } from "node:crypto";

import { cosineSimilarity, embedTexts, tokenizeText } from "./embeddings.mjs";

const MAX_TIME_DELTA_MS = 36 * 60 * 60 * 1000;
const MERGE_SIMILARITY_MIN = 0.13;
const MIN_SHARED_TOKENS = 2;

function articleText(article) {
  return article.headline ?? "";
}

function normalizePublishedAt(value) {
  return value ? new Date(value) : null;
}

function shareNumericToken(leftTokens, rightTokens) {
  const right = new Set(rightTokens.filter((token) => /\d/u.test(token)));
  return leftTokens.some((token) => /\d/u.test(token) && right.has(token));
}

function overlapCount(leftTokens, rightTokens) {
  const right = new Set(rightTokens);
  return leftTokens.filter((token) => right.has(token)).length;
}

function pairKey(leftId, rightId) {
  return [leftId, rightId].sort().join("::");
}

class UnionFind {
  constructor(ids) {
    this.parent = new Map(ids.map((id) => [id, id]));
  }

  find(id) {
    const current = this.parent.get(id);

    if (current === id) {
      return id;
    }

    const root = this.find(current);
    this.parent.set(id, root);
    return root;
  }

  union(left, right) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);

    if (leftRoot !== rightRoot) {
      this.parent.set(rightRoot, leftRoot);
    }
  }
}

function toGroupId(articleIds) {
  return `grp-${createHash("sha1").update(articleIds.join("|")).digest("hex").slice(0, 12)}`;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function uniqueCount(values) {
  return new Set(values).size;
}

function buildArticleMeta(article) {
  const headlineTokens = tokenizeText(article.headline);
  const tokens = tokenizeText(articleText(article));
  return {
    ...article,
    publishedDate: normalizePublishedAt(article.publishedAt),
    headlineTokens,
    tokens,
    lowSignalHeadline: headlineTokens.length < 2,
  };
}

function buildGroupSummary(groupArticles, pairMetrics, independenceGroupBySlug) {
  const articleIds = groupArticles.map((article) => article.id).sort();
  const similarities = [];

  for (let left = 0; left < groupArticles.length; left += 1) {
    for (let right = left + 1; right < groupArticles.length; right += 1) {
      const metric = pairMetrics.get(pairKey(groupArticles[left].id, groupArticles[right].id));

      if (metric) {
        similarities.push(metric.similarity);
      }
    }
  }

  const averageSimilarity = average(similarities);
  const independentGroups = uniqueCount(
    groupArticles.map((article) => independenceGroupBySlug.get(article.sourceSlug) ?? article.sourceSlug),
  );
  const languages = uniqueCount(groupArticles.map((article) => article.language));
  const overbroadCluster = groupArticles.length > 12;
  const confidenceScore = Number(
    Math.min(
      0.999,
      0.94 +
        averageSimilarity * 0.05 +
        Math.min(0.008 * Math.max(0, independentGroups - 1), 0.032) +
        Math.min(0.004 * Math.max(0, groupArticles.length - 2), 0.02) +
        Math.min(0.002 * Math.max(0, languages - 1), 0.004),
    ).toFixed(4),
  );

  return {
    id: toGroupId(articleIds),
    articleIds,
    publishEligible: independentGroups >= 2 && !overbroadCluster,
    averageSimilarity: Number(averageSimilarity.toFixed(4)),
    confidenceScore,
    overbroadCluster,
    headline: groupArticles
      .slice()
      .sort((left, right) => {
        const tokenDelta = right.headlineTokens.length - left.headlineTokens.length;

        if (tokenDelta !== 0) {
          return tokenDelta;
        }

        const leftDate = left.publishedDate?.getTime() ?? 0;
        const rightDate = right.publishedDate?.getTime() ?? 0;
        return leftDate - rightDate;
      })[0]?.headline ?? "Untitled event",
  };
}

export async function predictEventGroups(articles, options = {}) {
  const independenceGroupBySlug = options.independenceGroupBySlug ?? new Map();
  const preparedArticles = articles.map(buildArticleMeta);
  const vectors = await embedTexts(preparedArticles.map(articleText), options);
  const unionFind = new UnionFind(preparedArticles.map((article) => article.id));
  const pairMetrics = new Map();

  for (let left = 0; left < preparedArticles.length; left += 1) {
    for (let right = left + 1; right < preparedArticles.length; right += 1) {
      const leftArticle = preparedArticles[left];
      const rightArticle = preparedArticles[right];
      const leftTime = leftArticle.publishedDate?.getTime() ?? 0;
      const rightTime = rightArticle.publishedDate?.getTime() ?? 0;

      if (leftTime && rightTime && Math.abs(leftTime - rightTime) > MAX_TIME_DELTA_MS) {
        continue;
      }

      if (leftArticle.lowSignalHeadline || rightArticle.lowSignalHeadline) {
        continue;
      }

      const sharedHeadlineTokens = overlapCount(leftArticle.headlineTokens, rightArticle.headlineTokens);
      const sharedTokens = overlapCount(leftArticle.tokens, rightArticle.tokens);
      const lexicalGate =
        (sharedHeadlineTokens >= 1 && sharedTokens >= MIN_SHARED_TOKENS) ||
        shareNumericToken(leftArticle.headlineTokens, rightArticle.headlineTokens);
      const similarity = cosineSimilarity(vectors[left], vectors[right]);
      const merge = lexicalGate && similarity >= MERGE_SIMILARITY_MIN;

      pairMetrics.set(pairKey(leftArticle.id, rightArticle.id), {
        similarity,
        sharedTokens,
        merge,
      });

      if (merge) {
        unionFind.union(leftArticle.id, rightArticle.id);
      }
    }
  }

  const grouped = new Map();

  for (const article of preparedArticles) {
    const root = unionFind.find(article.id);
    const bucket = grouped.get(root) ?? [];
    bucket.push(article);
    grouped.set(root, bucket);
  }

  const groups = [];
  const heldArticleIds = [];

  for (const cluster of grouped.values()) {
    if (cluster.length < 2) {
      heldArticleIds.push(cluster[0].id);
      continue;
    }

    groups.push(buildGroupSummary(cluster, pairMetrics, independenceGroupBySlug));
  }

  return {
    groups: groups.sort((left, right) => left.id.localeCompare(right.id)),
    heldArticleIds: heldArticleIds.sort(),
  };
}
