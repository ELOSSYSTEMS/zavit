import "server-only";

import { prisma } from "@/lib/server/db/client.mjs";

export type PublishedFeedItem = {
  event: {
    publicId: string;
    neutralTitle: string | null;
    confidenceState: string;
  };
  warningLabel: string | null;
  publishedAt: Date;
};

export type PublishedEventDetail = {
  publicId: string;
  neutralTitle: string | null;
  confidenceState: string;
  lastUpdatedAt: Date;
  publishedSnapshot: {
    neutralTitle: string | null;
    confidenceState: string;
    warningLabel: string | null;
  } | null;
  memberships: Array<{
    id: string;
    article: {
      headline: string;
      canonicalUrl: string;
      snippet: string | null;
      publishedAt: Date | null;
      source: {
        displayName: string;
      };
    };
  }>;
};

export type PublicSourceRecord = {
  slug: string;
  displayName: string;
  primaryLanguage: string;
  editorialType: string;
  paywallStatus: string;
  availabilityStatus: string;
  websiteUrl: string;
};

export async function listPublishedFeed(): Promise<PublishedFeedItem[]> {
  try {
    const latestRun = await prisma.pipelineRun.findFirst({
      where: {
        runType: "FULL",
        status: "SUCCEEDED",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!latestRun) {
      return [];
    }

    const snapshots: PublishedFeedItem[] = await prisma.publishSnapshot.findMany({
      where: {
        pipelineRunId: latestRun.id,
        publicStatus: "PUBLISHED",
      },
      orderBy: { publishedAt: "desc" },
      select: {
        publishedAt: true,
        warningLabel: true,
        event: {
          select: {
            publicId: true,
            neutralTitle: true,
            confidenceState: true,
          },
        },
      },
    });

    return snapshots.map((snapshot) => ({
      event: {
        publicId: snapshot.event.publicId,
        neutralTitle: snapshot.event.neutralTitle,
        confidenceState: snapshot.event.confidenceState,
      },
      warningLabel: snapshot.warningLabel,
      publishedAt: snapshot.publishedAt,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedEventDetail(
  publicId: string,
): Promise<PublishedEventDetail | null> {
  try {
    const latestRun = await prisma.pipelineRun.findFirst({
      where: {
        runType: "FULL",
        status: "SUCCEEDED",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!latestRun) {
      return null;
    }

    const event: PublishedEventDetail | null = await prisma.event.findFirst({
      where: {
        publicId,
        status: "PUBLISHED",
        publishRunId: latestRun.id,
      },
      select: {
        publicId: true,
        neutralTitle: true,
        confidenceState: true,
        lastUpdatedAt: true,
        publishedSnapshot: {
          select: {
            neutralTitle: true,
            confidenceState: true,
            warningLabel: true,
          },
        },
        memberships: {
          select: {
            id: true,
            article: {
              select: {
                headline: true,
                canonicalUrl: true,
                snippet: true,
                publishedAt: true,
                source: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    return {
      publicId: event.publicId,
      neutralTitle: event.neutralTitle,
      confidenceState: event.confidenceState,
      lastUpdatedAt: event.lastUpdatedAt,
      publishedSnapshot: event.publishedSnapshot
        ? {
            neutralTitle: event.publishedSnapshot.neutralTitle,
            confidenceState: event.publishedSnapshot.confidenceState,
            warningLabel: event.publishedSnapshot.warningLabel,
          }
        : null,
      memberships: event.memberships.map((membership) => ({
        id: membership.id,
        article: {
          headline: membership.article.headline,
          canonicalUrl: membership.article.canonicalUrl,
          snippet: membership.article.snippet,
          publishedAt: membership.article.publishedAt,
          source: {
            displayName: membership.article.source.displayName,
          },
        },
      })),
    };
  } catch {
    return null;
  }
}

export async function listPublicSources(): Promise<PublicSourceRecord[]> {
  try {
    const sources: PublicSourceRecord[] = await prisma.source.findMany({
      orderBy: { displayName: "asc" },
      select: {
        slug: true,
        displayName: true,
        primaryLanguage: true,
        editorialType: true,
        paywallStatus: true,
        availabilityStatus: true,
        websiteUrl: true,
      },
    });

    return sources.map((source) => ({
      slug: source.slug,
      displayName: source.displayName,
      primaryLanguage: source.primaryLanguage,
      editorialType: source.editorialType,
      paywallStatus: source.paywallStatus,
      availabilityStatus: source.availabilityStatus,
      websiteUrl: source.websiteUrl,
    }));
  } catch {
    return [];
  }
}
