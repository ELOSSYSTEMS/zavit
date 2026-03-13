import { createHash } from "node:crypto";

import { cosineSimilarity, embedTexts, tokenizeText } from "./embeddings.mjs";

const MAX_TIME_DELTA_MS = 36 * 60 * 60 * 1000;
const DEFAULT_MERGE_SIMILARITY_MIN = Number(process.env.CLUSTER_MERGE_SIMILARITY_MIN ?? "0.58");
const DEFAULT_CLUSTER_COHERENCE_SIMILARITY_MIN = Number(
  process.env.CLUSTER_COHERENCE_SIMILARITY_MIN ?? "0.55",
);
const DETERMINISTIC_MERGE_SIMILARITY_MIN = Number(
  process.env.CLUSTER_DETERMINISTIC_MERGE_SIMILARITY_MIN ?? "0.16",
);
const DETERMINISTIC_CLUSTER_COHERENCE_SIMILARITY_MIN = Number(
  process.env.CLUSTER_DETERMINISTIC_COHERENCE_SIMILARITY_MIN ?? "0.15",
);
const MIN_SHARED_TOKENS = Number(process.env.CLUSTER_MIN_SHARED_TOKENS ?? "2");
const ANCHOR_CONTRADICTION_CONFIDENCE_MIN = Number(
  process.env.CLUSTER_ANCHOR_CONTRADICTION_CONFIDENCE_MIN ?? "0.7",
);

function articleText(article) {
  return [article.headline, article.snippet].filter(Boolean).join(" -- ");
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

function normalizeAnchorText(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/gu, " ")
    : "";
}

function normalizeAnchorDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeAnchorList(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(normalizeAnchorText)
      .filter(Boolean),
  )];
}

function articleHasReliableAnchors(article) {
  return (
    article.anchorExtractionStatus !== "FAILED" &&
    Number(article.anchorConfidence ?? 0) >= ANCHOR_CONTRADICTION_CONFIDENCE_MIN
  );
}

function haveLocationOverlap(leftLocations, rightLocations) {
  const right = new Set(rightLocations);
  return leftLocations.some((location) => right.has(location));
}

function anchorContradiction(leftArticle, rightArticle) {
  if (!articleHasReliableAnchors(leftArticle) || !articleHasReliableAnchors(rightArticle)) {
    return null;
  }

  if (
    leftArticle.eventType &&
    rightArticle.eventType &&
    leftArticle.eventType !== "other" &&
    rightArticle.eventType !== "other" &&
    leftArticle.eventType !== rightArticle.eventType
  ) {
    return "eventType";
  }

  if (
    leftArticle.locations.length &&
    rightArticle.locations.length &&
    !haveLocationOverlap(leftArticle.locations, rightArticle.locations)
  ) {
    return "location";
  }

  if (
    leftArticle.extractedDate &&
    rightArticle.extractedDate &&
    Math.abs(leftArticle.extractedDate.getTime() - rightArticle.extractedDate.getTime()) > MAX_TIME_DELTA_MS
  ) {
    return "datetime";
  }

  return null;
}

class UnionFind {
  constructor(ids) {
    this.parent = new Map(ids.map((id) => [id, id]));
    this.members = new Map(ids.map((id) => [id, new Set([id])]));
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
      const leftMembers = this.members.get(leftRoot) ?? new Set([leftRoot]);
      const rightMembers = this.members.get(rightRoot) ?? new Set([rightRoot]);

      for (const member of rightMembers) {
        leftMembers.add(member);
      }

      this.members.set(leftRoot, leftMembers);
      this.members.delete(rightRoot);
    }
  }

  getMembers(id) {
    return this.members.get(this.find(id)) ?? new Set([id]);
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

function resolveProvider(options = {}) {
  return options.provider ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";
}

function resolveMergeSimilarityMin(provider) {
  return provider === "deterministic"
    ? DETERMINISTIC_MERGE_SIMILARITY_MIN
    : DEFAULT_MERGE_SIMILARITY_MIN;
}

function resolveClusterCoherenceSimilarityMin(provider) {
  return provider === "deterministic"
    ? DETERMINISTIC_CLUSTER_COHERENCE_SIMILARITY_MIN
    : DEFAULT_CLUSTER_COHERENCE_SIMILARITY_MIN;
}

function anchorVetoEnabled(options = {}) {
  if (typeof options.anchorVetoEnabled === "boolean") {
    return options.anchorVetoEnabled;
  }

  return process.env.CLUSTER_ANCHOR_VETO_ENABLED !== "false";
}

function clusterPairPasses(metric, clusterCoherenceSimilarityMin) {
  return Boolean(
    metric?.lexicalGate && metric.similarity >= clusterCoherenceSimilarityMin,
  );
}

function canMergeClusters(unionFind, leftId, rightId, pairMetrics, clusterCoherenceSimilarityMin) {
  const leftMembers = [...unionFind.getMembers(leftId)];
  const rightMembers = [...unionFind.getMembers(rightId)];

  for (const leftMember of leftMembers) {
    for (const rightMember of rightMembers) {
      if (leftMember === rightMember) {
        continue;
      }

      const metric = pairMetrics.get(pairKey(leftMember, rightMember));

      if (!clusterPairPasses(metric, clusterCoherenceSimilarityMin)) {
        return false;
      }
    }
  }

  return true;
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
    eventType: normalizeAnchorText(article.eventType).replace(/\s+/gu, "_"),
    locations: normalizeAnchorList(article.locations),
    extractedDate: normalizeAnchorDate(article.extractedDatetime),
    anchorConfidence: Number(article.anchorConfidence ?? 0),
    anchorExtractionStatus: article.anchorExtractionStatus ?? null,
  };
}

function buildGroupSummary(
  groupArticles,
  pairMetrics,
  independenceGroupBySlug,
  clusterCoherenceSimilarityMin,
  mergeSimilarityMin,
  enableAnchorVeto,
) {
  const articleIds = groupArticles.map((article) => article.id).sort();
  const similarities = [];
  const pairSummaries = [];

  for (let left = 0; left < groupArticles.length; left += 1) {
    for (let right = left + 1; right < groupArticles.length; right += 1) {
      const leftArticle = groupArticles[left];
      const rightArticle = groupArticles[right];
      const metric = pairMetrics.get(pairKey(leftArticle.id, rightArticle.id));

      if (metric) {
        similarities.push(metric.similarity);
        pairSummaries.push({
          articleIds: [leftArticle.id, rightArticle.id],
          similarity: Number(metric.similarity.toFixed(4)),
          sharedTokens: metric.sharedTokens,
          sharedHeadlineTokens: metric.sharedHeadlineTokens,
          lexicalGate: metric.lexicalGate,
          anchorConflict: metric.anchorConflict,
          relationship: metric.anchorConflict
            ? "anchor-conflict"
            : metric.merge
              ? "direct-merge"
              : clusterPairPasses(metric, clusterCoherenceSimilarityMin)
                ? "coherence-support"
                : "weak-support",
        });
      }
    }
  }

  const averageSimilarity = average(similarities);
  const minimumSimilarity = similarities.length ? Math.min(...similarities) : 0;
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
    minimumSimilarity: Number(minimumSimilarity.toFixed(4)),
    clusterCoherent: minimumSimilarity >= clusterCoherenceSimilarityMin,
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
    debug: {
      thresholds: {
        mergeSimilarityMin: Number(mergeSimilarityMin.toFixed(4)),
        clusterCoherenceSimilarityMin: Number(clusterCoherenceSimilarityMin.toFixed(4)),
        minSharedTokens: MIN_SHARED_TOKENS,
        anchorVetoEnabled: enableAnchorVeto,
      },
      clusterFacts: {
        articleCount: groupArticles.length,
        independentGroups,
        languageCount: languages,
        publishEligible: independentGroups >= 2 && !overbroadCluster,
        overbroadCluster,
      },
      strongestPairs: pairSummaries
        .slice()
        .sort((left, right) => right.similarity - left.similarity)
        .slice(0, 5),
      articleSupport: groupArticles.map((article) => ({
        articleId: article.id,
        strongestLinks: pairSummaries
          .filter((pair) => pair.articleIds.includes(article.id))
          .sort((left, right) => right.similarity - left.similarity)
          .slice(0, 3),
      })),
    },
  };
}

export async function predictEventGroups(articles, options = {}) {
  const provider = resolveProvider(options);
  const mergeSimilarityMin = resolveMergeSimilarityMin(provider);
  const clusterCoherenceSimilarityMin = resolveClusterCoherenceSimilarityMin(provider);
  const independenceGroupBySlug = options.independenceGroupBySlug ?? new Map();
  const enableAnchorVeto = anchorVetoEnabled(options);
  const preparedArticles = articles.map(buildArticleMeta);
  const vectors = await embedTexts(preparedArticles.map(articleText), {
    ...options,
    provider,
  });
  const unionFind = new UnionFind(preparedArticles.map((article) => article.id));
  const pairMetrics = new Map();
  const candidateMerges = [];

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
      const anchorConflict = enableAnchorVeto ? anchorContradiction(leftArticle, rightArticle) : null;
      const lexicalGate =
        (sharedHeadlineTokens >= 1 && sharedTokens >= MIN_SHARED_TOKENS) ||
        shareNumericToken(leftArticle.headlineTokens, rightArticle.headlineTokens);
      const similarity = cosineSimilarity(vectors[left], vectors[right]);
      const merge = !anchorConflict && lexicalGate && similarity >= mergeSimilarityMin;

      pairMetrics.set(pairKey(leftArticle.id, rightArticle.id), {
        similarity,
        sharedTokens,
        sharedHeadlineTokens,
        lexicalGate,
        anchorConflict,
        merge,
      });

      if (merge) {
        candidateMerges.push({
          leftId: leftArticle.id,
          rightId: rightArticle.id,
          similarity,
        });
      }
    }
  }

  candidateMerges.sort((left, right) => right.similarity - left.similarity);

  for (const candidate of candidateMerges) {
    if (
      canMergeClusters(
        unionFind,
        candidate.leftId,
        candidate.rightId,
        pairMetrics,
        clusterCoherenceSimilarityMin,
      )
    ) {
      unionFind.union(candidate.leftId, candidate.rightId);
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

    groups.push(
      buildGroupSummary(
        cluster,
        pairMetrics,
        independenceGroupBySlug,
        clusterCoherenceSimilarityMin,
        mergeSimilarityMin,
        enableAnchorVeto,
      ),
    );
  }

  return {
    groups: groups.sort((left, right) => left.id.localeCompare(right.id)),
    heldArticleIds: heldArticleIds.sort(),
  };
}
