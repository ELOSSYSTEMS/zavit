import "server-only";

import { prisma } from "@/lib/server/db/client.mjs";
import { runEventPipeline } from "@/lib/events/pipeline.mjs";
import { runIngestion } from "@/lib/ingest/run-ingest.mjs";
import {
  getCaseActionAuditType,
  resolveCaseStatusTransition,
} from "@/lib/reports/workflow.mjs";

export type AdminPipelineRun = {
  id: string;
  runType: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  sourceCount: number;
  articleCount: number;
  heldEventCount: number;
  publishedEventCount: number;
  modelProvider: string | null;
  modelVersion: string | null;
  blockedReason: string | null;
  errorSummary: string | null;
};

export type AdminAuditEntry = {
  id: string;
  actionType: string;
  actorRole: string;
  actorRef: string | null;
  createdAt: Date;
  reason: string | null;
  event: {
    id: string;
    publicId: string;
  } | null;
  source: {
    displayName: string;
  } | null;
};

export type AdminSourceRecord = {
  id: string;
  slug: string;
  displayName: string;
  ingestMethod: string;
  enabled: boolean;
  availabilityStatus: string;
  health: {
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
    consecutiveFailures: number;
    failureType: string | null;
  } | null;
};

export type AdminSourceAudit = {
  id: string;
  actionType: string;
  actorRef: string | null;
  createdAt: Date;
  reason: string | null;
  source: {
    displayName: string;
  } | null;
};

export type AdminEventDetail = {
  id: string;
  publicId: string;
  status: string;
  confidenceState: string;
  confidenceScore: number | null;
  suppressionReason: string | null;
  publishedSnapshot: {
    publishedAt: Date;
  } | null;
  memberships: Array<{
    id: string;
    membershipRole: string;
    membershipReason: string | null;
    article: {
      headline: string;
      snippet: string | null;
      publishedAt: Date | null;
      source: {
        displayName: string;
      };
    };
  }>;
  publishSnapshots: Array<{
    id: string;
    snapshotVersion: number;
    publicStatus: string;
    publishedAt: Date;
    confidenceState: string;
    warningLabel: string | null;
  }>;
  audits: Array<{
    id: string;
    actionType: string;
    actorRole: string;
    actorRef: string | null;
    createdAt: Date;
    reason: string | null;
  }>;
};

export type AdminOperatorCase = {
  id: string;
  caseType: string;
  status: string;
  reportId: string | null;
  eventId: string | null;
  sourceId: string | null;
  assignedRole: string | null;
  assignedTo: string | null;
  acknowledgementBy: string | null;
  acknowledgementAt: Date | null;
  resolutionBy: string | null;
  resolutionAt: Date | null;
  emergencySuppressedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  report: {
    contactEmail: string | null;
    abuseScore: number | null;
    payload: unknown;
  } | null;
  event: {
    id: string;
    publicId: string;
    status: string;
  } | null;
  source: {
    id: string;
    displayName: string;
    slug: string;
    enabled: boolean;
  } | null;
};

type AdminTransactionClient = Pick<
  typeof prisma,
  | "source"
  | "sourceHealth"
  | "operatorActionAudit"
  | "event"
  | "operatorCase"
  | "correctionReport"
>;

type AdminCaseStatus =
  | "ACKNOWLEDGED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "SUPPRESSED"
  | "RESOLVED"
  | "REJECTED";

export async function refreshAdminPipeline(input?: {
  provider?: string;
}) {
  const provider = input?.provider ?? process.env.CLUSTER_EMBED_PROVIDER ?? "gemini";
  const ingestResult = await runIngestion({ prisma });
  const pipelineRun = await runEventPipeline(prisma, { provider });

  return {
    ingestResult,
    pipelineRun,
  };
}

export async function listAdminPipelineRuns(): Promise<AdminPipelineRun[]> {
  try {
    const runs: AdminPipelineRun[] = await prisma.pipelineRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        runType: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        sourceCount: true,
        articleCount: true,
        heldEventCount: true,
        publishedEventCount: true,
        modelProvider: true,
        modelVersion: true,
        blockedReason: true,
        errorSummary: true,
      },
    });

    return runs.map((run) => ({
      ...run,
    }));
  } catch {
    return [];
  }
}

export async function listRecentOperatorAudits(): Promise<AdminAuditEntry[]> {
  try {
    const audits: AdminAuditEntry[] = await prisma.operatorActionAudit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            publicId: true,
          },
        },
        source: {
          select: {
            displayName: true,
          },
        },
      },
      take: 12,
    });

    return audits.map((audit) => ({
      id: audit.id,
      actionType: audit.actionType,
      actorRole: audit.actorRole,
      actorRef: audit.actorRef,
      createdAt: audit.createdAt,
      reason: audit.reason,
      event: audit.event
        ? {
            id: audit.event.id,
            publicId: audit.event.publicId,
          }
        : null,
      source: audit.source
        ? {
            displayName: audit.source.displayName,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function listAdminSources(): Promise<AdminSourceRecord[]> {
  try {
    const sources: AdminSourceRecord[] = await prisma.source.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        slug: true,
        displayName: true,
        ingestMethod: true,
        enabled: true,
        availabilityStatus: true,
        health: {
          select: {
            lastSuccessAt: true,
            lastFailureAt: true,
            consecutiveFailures: true,
            failureType: true,
          },
        },
      },
    });

    return sources.map((source) => ({
      id: source.id,
      slug: source.slug,
      displayName: source.displayName,
      ingestMethod: source.ingestMethod,
      enabled: source.enabled,
      availabilityStatus: source.availabilityStatus,
      health: source.health
        ? {
            lastSuccessAt: source.health.lastSuccessAt,
            lastFailureAt: source.health.lastFailureAt,
            consecutiveFailures: source.health.consecutiveFailures,
            failureType: source.health.failureType,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function listRecentSourceAudits(): Promise<AdminSourceAudit[]> {
  try {
    const audits: AdminSourceAudit[] = await prisma.operatorActionAudit.findMany({
      where: {
        sourceId: {
          not: null,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        source: {
          select: {
            displayName: true,
          },
        },
      },
      take: 12,
    });

    return audits.map((audit) => ({
      id: audit.id,
      actionType: audit.actionType,
      actorRef: audit.actorRef,
      createdAt: audit.createdAt,
      reason: audit.reason,
      source: audit.source
        ? {
            displayName: audit.source.displayName,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function getAdminEventDetail(
  id: string,
): Promise<AdminEventDetail | null> {
  try {
    const event: AdminEventDetail | null = await prisma.event.findFirst({
      where: {
        OR: [{ publicId: id }, { id }],
      },
      select: {
        id: true,
        publicId: true,
        status: true,
        confidenceState: true,
        confidenceScore: true,
        suppressionReason: true,
        publishedSnapshot: {
          select: {
            publishedAt: true,
          },
        },
        memberships: {
          select: {
            id: true,
            membershipRole: true,
            membershipReason: true,
            article: {
              select: {
                headline: true,
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
        publishSnapshots: {
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: {
            id: true,
            snapshotVersion: true,
            publicStatus: true,
            publishedAt: true,
            confidenceState: true,
            warningLabel: true,
          },
        },
        audits: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            actionType: true,
            actorRole: true,
            actorRef: true,
            createdAt: true,
            reason: true,
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    return {
      id: event.id,
      publicId: event.publicId,
      status: event.status,
      confidenceState: event.confidenceState,
      confidenceScore: event.confidenceScore,
      suppressionReason: event.suppressionReason,
      publishedSnapshot: event.publishedSnapshot
        ? {
            publishedAt: event.publishedSnapshot.publishedAt,
          }
        : null,
      memberships: event.memberships.map((membership) => ({
        id: membership.id,
        membershipRole: membership.membershipRole,
        membershipReason: membership.membershipReason,
        article: {
          headline: membership.article.headline,
          snippet: membership.article.snippet,
          publishedAt: membership.article.publishedAt,
          source: {
            displayName: membership.article.source.displayName,
          },
        },
      })),
      publishSnapshots: event.publishSnapshots.map((snapshot) => ({
        id: snapshot.id,
        snapshotVersion: snapshot.snapshotVersion,
        publicStatus: snapshot.publicStatus,
        publishedAt: snapshot.publishedAt,
        confidenceState: snapshot.confidenceState,
        warningLabel: snapshot.warningLabel,
      })),
      audits: event.audits.map((audit) => ({
        id: audit.id,
        actionType: audit.actionType,
        actorRole: audit.actorRole,
        actorRef: audit.actorRef,
        createdAt: audit.createdAt,
        reason: audit.reason,
      })),
    };
  } catch {
    return null;
  }
}

export async function listAdminOperatorCases(): Promise<AdminOperatorCase[]> {
  try {
    const cases: AdminOperatorCase[] = await prisma.operatorCase.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        caseType: true,
        status: true,
        reportId: true,
        eventId: true,
        sourceId: true,
        assignedRole: true,
        assignedTo: true,
        acknowledgementBy: true,
        acknowledgementAt: true,
        resolutionBy: true,
        resolutionAt: true,
        emergencySuppressedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        report: {
          select: {
            contactEmail: true,
            abuseScore: true,
            payload: true,
          },
        },
        event: {
          select: {
            id: true,
            publicId: true,
            status: true,
          },
        },
        source: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            enabled: true,
          },
        },
      },
    });

    return cases.map((operatorCase) => ({
      id: operatorCase.id,
      caseType: operatorCase.caseType,
      status: operatorCase.status,
      reportId: operatorCase.reportId,
      eventId: operatorCase.eventId,
      sourceId: operatorCase.sourceId,
      assignedRole: operatorCase.assignedRole,
      assignedTo: operatorCase.assignedTo,
      acknowledgementBy: operatorCase.acknowledgementBy,
      acknowledgementAt: operatorCase.acknowledgementAt,
      resolutionBy: operatorCase.resolutionBy,
      resolutionAt: operatorCase.resolutionAt,
      emergencySuppressedAt: operatorCase.emergencySuppressedAt,
      notes: operatorCase.notes,
      createdAt: operatorCase.createdAt,
      updatedAt: operatorCase.updatedAt,
      report: operatorCase.report
        ? {
            contactEmail: operatorCase.report.contactEmail,
            abuseScore: operatorCase.report.abuseScore,
            payload: operatorCase.report.payload,
          }
        : null,
      event: operatorCase.event
        ? {
            id: operatorCase.event.id,
            publicId: operatorCase.event.publicId,
            status: operatorCase.event.status,
          }
        : null,
      source: operatorCase.source
        ? {
            id: operatorCase.source.id,
            displayName: operatorCase.source.displayName,
            slug: operatorCase.source.slug,
            enabled: operatorCase.source.enabled,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function toggleSourceAvailability(input: {
  sourceId: string;
  disable: boolean;
  reason: string;
  actorRef: string;
}): Promise<boolean> {
  const { sourceId, disable, reason, actorRef } = input;

  await prisma.$transaction(async (tx: AdminTransactionClient) => {
    await tx.source.update({
      where: { id: sourceId },
      data: {
        enabled: !disable,
        availabilityStatus: disable ? "DISABLED" : "ACTIVE",
      },
    });

    await tx.sourceHealth.upsert({
      where: { sourceId },
      update: {
        disabledReason: disable ? reason : null,
      },
      create: {
        sourceId,
        disabledReason: disable ? reason : null,
      },
    });

    await tx.operatorActionAudit.create({
      data: {
        actionType: disable ? "SOURCE_DISABLED" : "SOURCE_ENABLED",
        actorRole: "OPERATOR",
        actorRef,
        reason,
        sourceId,
      },
    });
  });

  return true;
}

export async function toggleEventSuppression(input: {
  eventId: string;
  suppress: boolean;
  reason: string;
  actorRef: string;
}): Promise<{ eventId: string; publicId: string } | null> {
  const { eventId, suppress, reason, actorRef } = input;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      publicId: true,
      publishedSnapshotId: true,
    },
  });

  if (!event) {
    return null;
  }

  await prisma.$transaction(async (tx: AdminTransactionClient) => {
    await tx.event.update({
      where: { id: event.id },
      data: suppress
        ? {
            status: "SUPPRESSED",
            suppressedAt: new Date(),
            suppressionReason: reason,
          }
        : {
            status: event.publishedSnapshotId ? "PUBLISHED" : "HELD",
            suppressedAt: null,
            suppressionReason: null,
          },
    });

    await tx.operatorActionAudit.create({
      data: {
        actionType: suppress ? "EVENT_SUPPRESSED" : "EVENT_UNSUPPRESSED",
        actorRole: "OPERATOR",
        actorRef,
        reason,
        eventId: event.id,
      },
    });
  });

  return {
    eventId: event.id,
    publicId: event.publicId,
  };
}

export async function updateOperatorCaseStatus(input: {
  operatorCaseId: string;
  action: string;
  reason: string;
  actorRef: string;
}): Promise<{ eventId: string | null } | null> {
  const { operatorCaseId, action, reason, actorRef } = input;
  const nextStatus = resolveCaseStatusTransition(action) as AdminCaseStatus;
  const operatorCase = await prisma.operatorCase.findUnique({
    where: { id: operatorCaseId },
    include: {
      event: {
        select: {
          id: true,
          status: true,
        },
      },
      source: {
        select: {
          enabled: true,
        },
      },
    },
  });

  if (!operatorCase) {
    return null;
  }

  if (
    nextStatus === "SUPPRESSED" &&
    operatorCase.event?.status !== "SUPPRESSED" &&
    operatorCase.source?.enabled !== false
  ) {
    return null;
  }

  const now = new Date();
  const updateData: {
    status: AdminCaseStatus;
    acknowledgementAt?: Date;
    acknowledgementBy?: string;
    assignedRole?: "OPERATOR";
    assignedTo?: string;
    resolutionAt?: Date;
    resolutionBy?: string;
    emergencySuppressedAt?: Date;
    notes?: string;
  } = {
    status: nextStatus,
    notes: reason,
  };

  if (nextStatus === "ACKNOWLEDGED") {
    updateData.acknowledgementAt = now;
    updateData.acknowledgementBy = actorRef;
  }

  if (["UNDER_REVIEW", "ACTION_REQUIRED"].includes(nextStatus)) {
    updateData.assignedRole = "OPERATOR";
    updateData.assignedTo = actorRef;
  }

  if (["RESOLVED", "REJECTED"].includes(nextStatus)) {
    updateData.resolutionAt = now;
    updateData.resolutionBy = actorRef;
  }

  if (nextStatus === "SUPPRESSED") {
    updateData.emergencySuppressedAt = now;
  }

  await prisma.$transaction(async (tx: AdminTransactionClient) => {
    await tx.operatorCase.update({
      where: { id: operatorCase.id },
      data: updateData,
    });

    if (operatorCase.reportId) {
      await tx.correctionReport.update({
        where: { id: operatorCase.reportId },
        data: {
          status: nextStatus,
        },
      });
    }

    await tx.operatorActionAudit.create({
      data: {
        actionType: getCaseActionAuditType(nextStatus),
        actorRole: "OPERATOR",
        actorRef,
        reason,
        eventId: operatorCase.eventId,
        sourceId: operatorCase.sourceId,
        operatorCaseId: operatorCase.id,
      },
    });
  });

  return {
    eventId: operatorCase.eventId,
  };
}
