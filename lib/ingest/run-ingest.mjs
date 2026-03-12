import { createPrismaClient } from "../server/db/client.mjs";
import { loadPageHtml } from "./browser-fetch.mjs";
import { discoverSectionArticles } from "./section-crawl.mjs";
import { loadApprovedRoster, mapRosterSourceToSourceRecord } from "./roster.mjs";
import { parseFeedItems } from "./rss.mjs";

const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "he-IL,he;q=0.9,en;q=0.8,ar;q=0.7",
};

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

function requiresBrowserFallback(source) {
  return source.slug === "kan-news" || source.slug === "davar";
}

class IngestFailure extends Error {
  constructor(failureType, message) {
    super(message);
    this.failureType = failureType;
  }
}

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dedupeArticles(articles) {
  const seen = new Set();
  const output = [];

  for (const article of articles) {
    if (!article.canonicalUrl || seen.has(article.canonicalUrl)) {
      continue;
    }

    seen.add(article.canonicalUrl);
    output.push(article);
  }

  return output;
}

async function fetchRssArticles(source, fetchImpl) {
  const response = await fetchImpl(source.feedUrl, { headers: DEFAULT_HEADERS });

  if (!response.ok) {
    throw new IngestFailure("FETCH", `RSS fetch failed with status ${response.status}`);
  }

  const xml = await response.text();
  const articles = parseFeedItems(xml, source.websiteUrl);

  if (!articles.length) {
    throw new IngestFailure("PARSE", "RSS feed returned no usable items");
  }

  return dedupeArticles(articles).slice(0, 20);
}

async function fetchSourceArticles(source, fetchImpl) {
  if (requiresBrowserFallback(source)) {
    return discoverSectionArticles(source, {
      fetchImpl,
      loadHtmlImpl: (url) => loadPageHtml(url),
    });
  }

  if (source.ingestMethod === "RSS") {
    try {
      return await fetchRssArticles(source, fetchImpl);
    } catch (error) {
      const fallback = await discoverSectionArticles(source, { fetchImpl }).catch(() => null);

      if (fallback?.length) {
        return fallback;
      }

      throw error;
    }
  }

  if (source.ingestMethod === "SECTION_CRAWL") {
    const articles = await discoverSectionArticles(source, { fetchImpl });

    if (!articles.length) {
      throw new IngestFailure("PARSE", "Section crawl returned no usable items");
    }

    return articles;
  }

  throw new IngestFailure("FETCH", `Unsupported ingest method ${source.ingestMethod}`);
}

async function syncRoster(prisma, roster) {
  const synced = new Map();

  for (const source of roster.sources) {
    const record = mapRosterSourceToSourceRecord(source);
    const existing = await prisma.source.findFirst({
      where: {
        OR: [{ slug: record.slug }, { canonicalDomain: record.canonicalDomain }],
      },
    });
    const saved = existing
      ? await prisma.source.update({
          where: { id: existing.id },
          data: record,
        })
      : await prisma.source.create({
          data: record,
        });

    synced.set(source.slug, saved);
  }

  return synced;
}

async function markSourceSuccess(prisma, source, articleCount) {
  await prisma.source.update({
    where: { id: source.id },
    data: {
      availabilityStatus: "ACTIVE",
      health: {
        upsert: {
          create: {
            lastSuccessAt: new Date(),
            consecutiveFailures: 0,
            failureType: null,
            staleWarningAt: null,
          },
          update: {
            lastSuccessAt: new Date(),
            consecutiveFailures: 0,
            failureType: null,
            staleWarningAt: null,
            disabledReason: null,
          },
        },
      },
    },
  });

  return articleCount;
}

async function markSourceFailure(prisma, source, failureType, message) {
  const existing = await prisma.sourceHealth.findUnique({
    where: { sourceId: source.id },
  });
  const nextFailures = (existing?.consecutiveFailures ?? 0) + 1;
  const nextAvailability = nextFailures >= 3 ? "TEMPORARILY_UNAVAILABLE" : "DEGRADED";

  await prisma.source.update({
    where: { id: source.id },
    data: {
      availabilityStatus: nextAvailability,
      health: {
        upsert: {
          create: {
            lastFailureAt: new Date(),
            failureType,
            consecutiveFailures: nextFailures,
            disabledReason: message,
            staleWarningAt: new Date(),
          },
          update: {
            lastFailureAt: new Date(),
            failureType,
            consecutiveFailures: nextFailures,
            disabledReason: message,
            staleWarningAt: new Date(),
          },
        },
      },
    },
  });
}

async function persistArticles(prisma, sourceRecord, runId, articles) {
  let persisted = 0;

  for (const article of articles) {
    await prisma.article.upsert({
      where: { canonicalUrl: article.canonicalUrl },
      create: {
        sourceId: sourceRecord.id,
        ingestRunId: runId,
        canonicalUrl: article.canonicalUrl,
        rawUrl: article.rawUrl ?? article.canonicalUrl,
        headline: article.headline,
        snippet: article.snippet,
        publishedAt: toDateOrNull(article.publishedAt),
        language: sourceRecord.primaryLanguage,
        paywallFlag: sourceRecord.paywallStatus === "PARTIAL" || sourceRecord.paywallStatus === "FULL",
      },
      update: {
        sourceId: sourceRecord.id,
        ingestRunId: runId,
        rawUrl: article.rawUrl ?? article.canonicalUrl,
        headline: article.headline,
        snippet: article.snippet,
        publishedAt: toDateOrNull(article.publishedAt),
        language: sourceRecord.primaryLanguage,
        paywallFlag: sourceRecord.paywallStatus === "PARTIAL" || sourceRecord.paywallStatus === "FULL",
        fetchedAt: new Date(),
      },
    });

    persisted += 1;
  }

  return persisted;
}

export async function runIngestion(options = {}) {
  const connectionString = resolveConnectionString();

  if (!connectionString && !options.prisma) {
    throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for ingestion.");
  }

  const prisma =
    options.prisma ??
    createPrismaClient(connectionString);
  const fetchImpl = options.fetchImpl ?? fetch;
  const roster = loadApprovedRoster();
  const selectedSources = options.sourceSlug
    ? roster.sources.filter((source) => source.slug === options.sourceSlug)
    : roster.sources;

  if (!selectedSources.length) {
    throw new Error(`No approved source found for slug ${options.sourceSlug}`);
  }

  const syncedSources = await syncRoster(prisma, roster);
  const run = await prisma.pipelineRun.create({
    data: {
      runType: "INGEST",
      status: "RUNNING",
      startedAt: new Date(),
      sourceCount: selectedSources.length,
    },
  });

  let articleCount = 0;
  let successCount = 0;
  const failures = [];

  for (const source of selectedSources) {
    const sourceRecord = syncedSources.get(source.slug);

    try {
      const articles = await fetchSourceArticles(source, fetchImpl);
      const persisted = await persistArticles(prisma, sourceRecord, run.id, articles);
      articleCount += persisted;
      successCount += 1;
      await markSourceSuccess(prisma, sourceRecord, persisted);
    } catch (error) {
      const failureType = error instanceof IngestFailure ? error.failureType : "UNKNOWN";
      const message = error instanceof Error ? error.message : "Unknown ingest error";
      failures.push(`${source.slug}: ${message}`);
      await markSourceFailure(prisma, sourceRecord, failureType, message);
    }
  }

  const status = successCount === 0 ? "FAILED" : failures.length > 0 ? "PARTIAL" : "SUCCEEDED";

  const updatedRun = await prisma.pipelineRun.update({
    where: { id: run.id },
    data: {
      status,
      finishedAt: new Date(),
      articleCount,
      errorSummary: failures.length ? failures.join(" | ").slice(0, 1000) : null,
    },
  });

  if (!options.prisma) {
    await prisma.$disconnect();
  }

  return {
    runId: updatedRun.id,
    status: updatedRun.status,
    sourceCount: selectedSources.length,
    successCount,
    articleCount,
    failures,
  };
}
