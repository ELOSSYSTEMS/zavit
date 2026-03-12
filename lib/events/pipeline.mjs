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
    };
  });
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
          evidenceSummary: `independent groups: ${candidate.independentGroups}; minimum pair similarity: ${candidate.minimumSimilarity ?? 0}; coherence: ${candidate.coherenceReason ?? "pass"}`,
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
