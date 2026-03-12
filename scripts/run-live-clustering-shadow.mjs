import "dotenv/config";

import { loadApprovedRoster } from "../lib/ingest/roster.mjs";
import { prisma } from "../lib/server/db/client.mjs";
import { predictEventGroups } from "../lib/clustering/predict-groups.mjs";

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function mapIndependenceGroups(roster) {
  return new Map(
    roster.sources.map((source) => [source.slug, source.independenceGroup ?? source.slug]),
  );
}

function assignmentMap(result) {
  const assignments = new Map();

  for (const group of result.groups) {
    for (const articleId of group.articleIds) {
      assignments.set(articleId, group.id);
    }
  }

  for (const articleId of result.heldArticleIds) {
    assignments.set(articleId, "HOLD");
  }

  return assignments;
}

function compareAssignments(baseline, anchorAware) {
  const baselineAssignments = assignmentMap(baseline);
  const anchorAssignments = assignmentMap(anchorAware);
  const articleIds = [...new Set([...baselineAssignments.keys(), ...anchorAssignments.keys()])].sort();

  return articleIds
    .map((articleId) => ({
      articleId,
      baseline: baselineAssignments.get(articleId) ?? "UNASSIGNED",
      anchorAware: anchorAssignments.get(articleId) ?? "UNASSIGNED",
    }))
    .filter((entry) => entry.baseline !== entry.anchorAware);
}

function summarize(result) {
  return {
    groupCount: result.groups.length,
    heldArticleCount: result.heldArticleIds.length,
    groups: result.groups.map((group) => ({
      id: group.id,
      articleIds: group.articleIds,
      publishEligible: group.publishEligible,
      minimumSimilarity: group.minimumSimilarity,
      confidenceScore: group.confidenceScore,
    })),
    heldArticleIds: result.heldArticleIds,
  };
}

async function main() {
  const provider = readFlag("--provider") ?? process.env.CLUSTER_EMBED_PROVIDER ?? "deterministic";
  const runId = readFlag("--run-id");
  const roster = loadApprovedRoster();
  const independenceGroupBySlug = mapIndependenceGroups(roster);

  try {
    const ingestRun = runId
      ? await prisma.pipelineRun.findUnique({
          where: { id: runId },
          select: { id: true, status: true, articleCount: true, createdAt: true },
        })
      : await prisma.pipelineRun.findFirst({
          where: { runType: "INGEST" },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, articleCount: true, createdAt: true },
        });

    if (!ingestRun) {
      throw new Error("No ingest run available for live clustering shadow.");
    }

    const articles = await prisma.article.findMany({
      where: {
        ingestRunId: ingestRun.id,
      },
      include: {
        source: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    const clusteringArticles = articles.map((article) => ({
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
    }));

    const baseline = await predictEventGroups(clusteringArticles, {
      provider,
      independenceGroupBySlug,
      anchorVetoEnabled: false,
    });
    const anchorAware = await predictEventGroups(clusteringArticles, {
      provider,
      independenceGroupBySlug,
      anchorVetoEnabled: true,
    });

    console.log(
      JSON.stringify(
        {
          ingestRun,
          articleCount: clusteringArticles.length,
          provider,
          baseline: summarize(baseline),
          anchorAware: summarize(anchorAware),
          changedAssignments: compareAssignments(baseline, anchorAware),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
