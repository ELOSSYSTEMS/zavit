import { createHash } from "node:crypto";

import { loadApprovedRoster } from "../ingest/roster.mjs";
import {
  DEFAULT_THRESHOLDS,
  evaluatePredictions,
  loadEvaluationDataset,
} from "../evaluation/clustering-eval.mjs";
import { predictEventGroups } from "../clustering/predict-groups.mjs";

const PUBLISH_COHERENCE_SIMILARITY_MIN = Number(
  process.env.CLUSTER_PUBLISH_COHERENCE_SIMILARITY_MIN ?? "0.15",
);
const PUBLISH_ANCHOR_COHERENCE_CONFIDENCE_MIN = Number(
  process.env.CLUSTER_PUBLISH_ANCHOR_COHERENCE_CONFIDENCE_MIN ?? "0.7",
);
const PUBLISH_ANCHOR_TIME_SPREAD_MS = 36 * 60 * 60 * 1000;

function publishAnchorCoherenceEnabled() {
  return process.env.CLUSTER_PUBLISH_ANCHOR_COHERENCE_ENABLED !== "false";
}

function clusterDebugLoggingEnabled() {
  return process.env.CLUSTER_DEBUG_LOG_ENABLED === "true";
}

function mapIndependenceGroups(roster) {
  return new Map(
    roster.sources.map((source) => [source.slug, source.independenceGroup ?? source.slug]),
  );
}

function confidenceStateFromScore(score) {
  if (score >= 0.995) {
    return "HIGH";
  }

  if (score >= 0.99) {
    return "LOW";
  }

  if (score >= 0.97) {
    return "REVIEW";
  }

  return "REJECTED";
}

function makePublicId(articleIds) {
  return `evt-${createHash("sha1").update(articleIds.join("|")).digest("hex").slice(0, 12)}`;
}

function normalizeAnchorText(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/gu, " ")
    : "";
}

function normalizeAnchorList(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(normalizeAnchorText)
      .filter(Boolean),
  )];
}

function reliableAnchorArticle(article) {
  return (
    article?.anchorExtractionStatus !== "FAILED" &&
    Number(article?.anchorConfidence ?? 0) >= PUBLISH_ANCHOR_COHERENCE_CONFIDENCE_MIN
  );
}

function inspectAnchorCoherence(articles) {
  if (!publishAnchorCoherenceEnabled()) {
    return null;
  }

  const reliableArticles = articles.filter(reliableAnchorArticle);

  if (reliableArticles.length < 2) {
    return null;
  }

  const reliableEventTypes = [...new Set(
    reliableArticles
      .map((article) => normalizeAnchorText(article.eventType).replace(/\s+/gu, "_"))
      .filter((eventType) => eventType && eventType !== "other"),
  )];

  if (reliableEventTypes.length > 1) {
    return "conflicting anchor event types";
  }

  const locationCounts = new Map();

  for (const article of reliableArticles) {
    for (const location of normalizeAnchorList(article.locations)) {
      locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
    }
  }

  const majorityLocation = [...locationCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;

  if (majorityLocation && majorityLocation[1] >= 2) {
    for (const article of reliableArticles) {
      const articleLocations = normalizeAnchorList(article.locations);

      if (articleLocations.length && !articleLocations.includes(majorityLocation[0])) {
        return "conflicting anchor locations";
      }
    }
  }

  const extractedTimes = reliableArticles
    .map((article) => (article.extractedDatetime ? new Date(article.extractedDatetime) : null))
    .filter((value) => value && !Number.isNaN(value.getTime()))
    .map((value) => value.getTime())
    .sort((left, right) => left - right);

  if (
    extractedTimes.length >= 2 &&
    extractedTimes[extractedTimes.length - 1] - extractedTimes[0] > PUBLISH_ANCHOR_TIME_SPREAD_MS
  ) {
    return "conflicting anchor datetimes";
  }

  return null;
}

function buildPredictionArtifact(datasetVersion, clusteringResult, label) {
  return {
    datasetVersion,
    runLabel: label,
    predictedGroups: clusteringResult.groups.map((group) => ({
      id: group.id,
      publishEligible: group.publishEligible,
      articleIds: group.articleIds,
    })),
    heldArticleIds: clusteringResult.heldArticleIds,
  };
}

export async function evaluateClusteringHarness(options = {}) {
  const datasetPath = options.datasetPath ?? "tests/fixtures/evaluation/labeled-clustering-dataset.v1.json";
  const dataset = loadEvaluationDataset(datasetPath);
  const roster = loadApprovedRoster();
  const independenceGroupBySlug = mapIndependenceGroups(roster);
  const clusteringResult = await predictEventGroups(dataset.articles, {
    provider: options.provider,
    apiKey: options.apiKey,
    independenceGroupBySlug,
    anchorVetoEnabled: options.anchorVetoEnabled,
  });
  const predictions = buildPredictionArtifact(dataset.datasetVersion, clusteringResult, options.label ?? "step7-generated");
  const report = evaluatePredictions(dataset, predictions, DEFAULT_THRESHOLDS);

  return {
    dataset,
    predictions,
    report,
  };
}

export function resolvePublishBlockers({ ingestRun, rosterSourceCount, evaluationReport }) {
  if (!ingestRun) {
    return "No successful ingest run is available.";
  }

  if (ingestRun.status !== "SUCCEEDED") {
    return `Latest ingest run is ${ingestRun.status}, not SUCCEEDED.`;
  }

  if (ingestRun.sourceCount < rosterSourceCount) {
    return `Latest ingest run covered ${ingestRun.sourceCount} of ${rosterSourceCount} approved sources.`;
  }

  if (!evaluationReport.pass) {
    return "Step 6 clustering harness did not meet the accepted thresholds.";
  }

  return null;
}

export function assessGroupCoherence(group, articles = []) {
  const minimumSimilarity = Number(group.minimumSimilarity ?? 0);

  if (!group.clusterCoherent) {
    return {
      coherent: false,
      reason: "cluster pairing did not maintain full-cluster coherence",
    };
  }

  if (minimumSimilarity < PUBLISH_COHERENCE_SIMILARITY_MIN) {
    return {
      coherent: false,
      reason: `minimum pair similarity ${minimumSimilarity.toFixed(4)} below publish threshold`,
    };
  }

  const anchorReason = inspectAnchorCoherence(articles);

  if (anchorReason) {
    return {
      coherent: false,
      reason: anchorReason,
    };
  }

  return {
    coherent: true,
    reason: null,
  };
}

export function buildCandidateSummaries(groups, articleById, independenceGroupBySlug) {
  return groups.map((group) => {
    const articles = group.articleIds.map((articleId) => articleById.get(articleId)).filter(Boolean);
    const independentGroups = new Set(
      articles.map((article) => independenceGroupBySlug.get(article.source.slug) ?? article.source.slug),
    ).size;
    const coherence = assessGroupCoherence(group, articles);
    const rawConfidenceState = confidenceStateFromScore(group.confidenceScore);
    const confidenceState = group.overbroadCluster || !coherence.coherent
      ? "REVIEW"
      : independentGroups < 2
        ? "REJECTED"
        : rawConfidenceState;
    const publishable =
      group.publishEligible &&
      coherence.coherent &&
      (confidenceState === "HIGH" || confidenceState === "LOW");

    return {
      publicId: makePublicId(group.articleIds),
      articleIds: group.articleIds,
      headline: group.headline,
      confidenceScore: group.confidenceScore,
      confidenceState,
      publishable,
      independentGroups,
      minimumSimilarity: group.minimumSimilarity,
      coherenceReason: coherence.reason,
      debug: group.debug ?? null,
    };
  });
}

function describeArticle(article) {
  if (!article) {
    return "Unknown article";
  }

  return `${article.source.displayName}: ${article.headline}`;
}

function formatPairLine(pair, articleById) {
  const [leftId, rightId] = pair.articleIds;
  const leftArticle = articleById.get(leftId);
  const rightArticle = articleById.get(rightId);
  const parts = [
    `${describeArticle(leftArticle)} <-> ${describeArticle(rightArticle)}`,
    `similarity ${Number(pair.similarity ?? 0).toFixed(4)}`,
    `headline tokens ${pair.sharedHeadlineTokens ?? 0}`,
    `all tokens ${pair.sharedTokens ?? 0}`,
    pair.lexicalGate ? "lexical gate pass" : "lexical gate fail",
  ];

  if (pair.anchorConflict) {
    parts.push(`anchor conflict ${pair.anchorConflict}`);
  } else {
    parts.push("anchors aligned or unavailable");
  }

  if (pair.relationship === "direct-merge") {
    parts.push("direct merge candidate");
  } else if (pair.relationship === "coherence-support") {
    parts.push("coherence support only");
  } else if (pair.relationship === "anchor-conflict") {
    parts.push("contradiction inside final cluster");
  }

  return `- ${parts.join(" | ")}`;
}

export function formatMembershipEvidenceSummary(candidate, articleId, articleById) {
  if (!candidate.debug) {
    return `independent groups: ${candidate.independentGroups}; minimum pair similarity: ${candidate.minimumSimilarity ?? 0}; coherence: ${candidate.coherenceReason ?? "pass"}`;
  }

  const articleSupport = candidate.debug.articleSupport?.find((entry) => entry.articleId === articleId);
  const lines = [
    `cluster headline: ${candidate.headline}`,
    `cluster size: ${candidate.debug.clusterFacts?.articleCount ?? candidate.articleIds.length}`,
    `independent groups: ${candidate.independentGroups}`,
    `confidence: ${candidate.confidenceScore?.toFixed(4) ?? "none"} (${candidate.confidenceState})`,
    `publishable: ${candidate.publishable ? "yes" : "no"}`,
    `coherence: ${candidate.coherenceReason ?? "pass"}`,
    `thresholds: merge >= ${Number(candidate.debug.thresholds?.mergeSimilarityMin ?? 0).toFixed(4)}, coherence >= ${Number(candidate.debug.thresholds?.clusterCoherenceSimilarityMin ?? 0).toFixed(4)}, shared tokens >= ${candidate.debug.thresholds?.minSharedTokens ?? 0}`,
    "top cluster links:",
  ];

  for (const pair of candidate.debug.strongestPairs ?? []) {
    lines.push(formatPairLine(pair, articleById));
  }

  lines.push("support for this article:");

  if (articleSupport?.strongestLinks?.length) {
    for (const pair of articleSupport.strongestLinks) {
      lines.push(formatPairLine(pair, articleById));
    }
  } else {
    lines.push("- no pair support captured");
  }

  return lines.join("\n");
}

export async function runEventPipeline(prisma, options = {}) {
  const roster = loadApprovedRoster();
  const independenceGroupBySlug = mapIndependenceGroups(roster);
  const latestIngestRun = await prisma.pipelineRun.findFirst({
    where: {
      runType: "INGEST",
    },
    orderBy: { createdAt: "desc" },
  });
  const { report } = await evaluateClusteringHarness({
    provider: options.provider,
    apiKey: options.apiKey,
    label: options.label ?? "step7-gate",
  });
  const blockedReason = resolvePublishBlockers({
    ingestRun: latestIngestRun,
    rosterSourceCount: roster.sources.length,
    evaluationReport: report,
  });
  const run = await prisma.pipelineRun.create({
    data: {
      runType: "FULL",
      status: blockedReason ? "BLOCKED" : "RUNNING",
      startedAt: new Date(),
      sourceCount: latestIngestRun?.sourceCount ?? 0,
      articleCount: latestIngestRun?.articleCount ?? 0,
      modelProvider: options.provider ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini",
      modelVersion:
        (options.provider ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini") === "gemini"
          ? (process.env.GEMINI_EMBED_MODEL ?? "models/gemini-embedding-001")
          : "deterministic-v1",
      blockedReason,
    },
  });

  if (blockedReason) {
    return prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: "BLOCKED",
      },
    });
  }

  const articles = await prisma.article.findMany({
    where: {
      ingestRunId: latestIngestRun.id,
    },
    include: {
      source: true,
    },
    orderBy: { publishedAt: "desc" },
  });
  const clusteringResult = await predictEventGroups(
    articles.map((article) => ({
      id: article.id,
      sourceSlug: article.source.slug,
      language: article.language,
      headline: article.headline,
      snippet: article.snippet,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      eventType: article.eventType,
      locations: Array.isArray(article.locations) ? article.locations : [],
      extractedDatetime: article.extractedDatetime?.toISOString() ?? null,
      anchorConfidence: article.anchorConfidence,
      anchorExtractionStatus: article.anchorExtractionStatus,
    })),
    {
      provider: options.provider,
      apiKey: options.apiKey,
      independenceGroupBySlug,
      anchorVetoEnabled: options.anchorVetoEnabled,
    },
  );
  const articleById = new Map(articles.map((article) => [article.id, article]));
  const candidates = buildCandidateSummaries(clusteringResult.groups, articleById, independenceGroupBySlug);

  if (clusterDebugLoggingEnabled()) {
    for (const candidate of candidates) {
      console.info(
        "[cluster-debug]",
        JSON.stringify({
          runId: run.id,
          publicId: candidate.publicId,
          headline: candidate.headline,
          publishable: candidate.publishable,
          coherenceReason: candidate.coherenceReason,
          debug: candidate.debug,
        }),
      );
    }
  }

  let publishedEventCount = 0;
  let heldEventCount = 0;

  for (const candidate of candidates) {
    const event = await prisma.event.upsert({
      where: {
        publicId: candidate.publicId,
      },
      update: {
        neutralTitle: candidate.headline,
        confidenceScore: candidate.confidenceScore,
        confidenceState: candidate.confidenceState,
        publishRunId: run.id,
        status: candidate.publishable ? "PUBLISHED" : "HELD",
      },
      create: {
        publicId: candidate.publicId,
        status: candidate.publishable ? "PUBLISHED" : "HELD",
        confidenceScore: candidate.confidenceScore,
        confidenceState: candidate.confidenceState,
        neutralTitle: candidate.headline,
        firstSeenAt: new Date(),
        publishRunId: run.id,
      },
    });

    await prisma.eventMembership.deleteMany({
      where: {
        eventId: event.id,
      },
    });

    for (const [index, articleId] of candidate.articleIds.entries()) {
      await prisma.eventMembership.create({
        data: {
          eventId: event.id,
          articleId,
          membershipRole: index === 0 ? "PRIMARY" : "SUPPORTING",
          membershipReason: "step7-cluster-match",
          evidenceSummary: formatMembershipEvidenceSummary(candidate, articleId, articleById),
        },
      });
    }

    if (candidate.publishable) {
      const snapshotVersion = (await prisma.publishSnapshot.count({
        where: {
          eventId: event.id,
        },
      })) + 1;

      const snapshot = await prisma.publishSnapshot.create({
        data: {
          eventId: event.id,
          pipelineRunId: run.id,
          confidenceState: candidate.confidenceState,
          neutralTitle: candidate.headline,
          warningLabel: candidate.confidenceState === "LOW" ? "Low confidence" : null,
          publicStatus: "PUBLISHED",
          snapshotVersion,
        },
      });

      await prisma.event.update({
        where: { id: event.id },
        data: {
          publishedSnapshotId: snapshot.id,
          status: "PUBLISHED",
        },
      });

      publishedEventCount += 1;
    } else {
      heldEventCount += 1;
    }
  }

  return prisma.pipelineRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      status: "SUCCEEDED",
      heldEventCount,
      publishedEventCount,
      articleCount: articles.length,
      errorSummary: null,
    },
  });
}
