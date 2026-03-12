import "server-only";

import { prisma } from "@/lib/server/db/client.mjs";
import { prepareReportSubmission } from "@/lib/reports/workflow.mjs";

type ReportTypeValue =
  | "BAD_CLUSTER"
  | "WRONG_SOURCE"
  | "BROKEN_LINK"
  | "PUBLISHER_COMPLAINT"
  | "PUBLISHER_OPT_OUT"
  | "EMERGENCY_SUPPRESSION";

type CaseStatusValue =
  | "NEW"
  | "ACKNOWLEDGED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "SUPPRESSED"
  | "RESOLVED"
  | "REJECTED";

type ReportCreateData = {
  reportType: ReportTypeValue;
  eventId: string | null;
  sourceId: string | null;
  status: CaseStatusValue;
  payload: {
    channel: string;
    summary: string;
    details: string;
    eventPublicId: string | null;
    sourceSlug: string | null;
    honeypotTriggered: boolean;
  };
  abuseScore: number;
  contactEmail: string | null;
};

type OperatorCaseCreateData = {
  caseType: ReportTypeValue;
  status: CaseStatusValue;
  eventId: string | null;
  sourceId: string | null;
  notes: string;
};

type PreparedReportSubmissionSuccess = {
  ok: true;
  correctionReportData: ReportCreateData;
  operatorCaseData: OperatorCaseCreateData;
};

type PreparedReportSubmissionFailure = {
  ok: false;
  error: string;
};

type ReportTransactionClient = Pick<
  typeof prisma,
  "correctionReport" | "operatorCase"
>;

export type ReportSubmissionArgs = {
  channel: "public" | "publisher";
  reportType: string;
  eventPublicId: string;
  sourceSlug: string;
  contactEmail: string;
  summary: string;
  details: string;
  honeypot: string;
};

export type ReportSubmissionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

async function findEventReferenceByPublicId(publicId: string): Promise<{
  id: string;
  publicId: string;
} | null> {
  if (!publicId) {
    return null;
  }

  const event = await prisma.event.findFirst({
    where: {
      publicId,
    },
    select: {
      id: true,
      publicId: true,
    },
  });

  return event
    ? {
        id: event.id,
        publicId: event.publicId,
      }
    : null;
}

async function findSourceReferenceBySlug(slug: string): Promise<{
  id: string;
  slug: string;
} | null> {
  if (!slug) {
    return null;
  }

  const source = await prisma.source.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  return source
    ? {
        id: source.id,
        slug: source.slug,
      }
    : null;
}

export async function submitReportAndCreateCase(
  args: ReportSubmissionArgs,
): Promise<ReportSubmissionResult> {
  const linkedEvent = await findEventReferenceByPublicId(args.eventPublicId);
  const linkedSource = await findSourceReferenceBySlug(args.sourceSlug);
  const prepared = prepareReportSubmission({
    channel: args.channel,
    reportType: args.reportType,
    eventId: linkedEvent?.id,
    eventPublicId: linkedEvent?.publicId ?? args.eventPublicId,
    sourceId: linkedSource?.id,
    sourceSlug: linkedSource?.slug ?? args.sourceSlug,
    contactEmail: args.contactEmail,
    summary: args.summary,
    details: args.details,
    honeypot: args.honeypot,
  }) as PreparedReportSubmissionSuccess | PreparedReportSubmissionFailure;

  if (!prepared.ok) {
    return prepared;
  }

  await prisma.$transaction(async (tx: ReportTransactionClient) => {
    const report = await tx.correctionReport.create({
      data: prepared.correctionReportData,
    });

    await tx.operatorCase.create({
      data: {
        ...prepared.operatorCaseData,
        reportId: report.id,
      },
    });
  });

  return { ok: true };
}
