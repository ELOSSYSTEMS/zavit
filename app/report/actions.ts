"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { prepareReportSubmission } from "@/lib/reports/workflow.mjs";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

type ReportSubmissionArgs = {
  channel: "public" | "publisher";
  reportType: string;
  eventPublicId: string;
  sourceSlug: string;
  contactEmail: string;
  summary: string;
  details: string;
  honeypot: string;
};

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

async function findEventIdByPublicId(publicId: string) {
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

  return event ?? null;
}

async function findSourceIdBySlug(slug: string) {
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

  return source ?? null;
}

async function createReportAndCase({
  channel,
  reportType,
  eventPublicId,
  sourceSlug,
  contactEmail,
  summary,
  details,
  honeypot,
}: ReportSubmissionArgs): Promise<
  PreparedReportSubmissionSuccess | PreparedReportSubmissionFailure
> {
  const linkedEvent = await findEventIdByPublicId(eventPublicId);
  const linkedSource = await findSourceIdBySlug(sourceSlug);
  const prepared = prepareReportSubmission({
    channel,
    reportType,
    eventId: linkedEvent?.id,
    eventPublicId: linkedEvent?.publicId ?? eventPublicId,
    sourceId: linkedSource?.id,
    sourceSlug: linkedSource?.slug ?? sourceSlug,
    contactEmail,
    summary,
    details,
    honeypot,
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

  return prepared;
}

export async function submitPublicReportAction(formData: FormData) {
  const result = await createReportAndCase({
    channel: "public",
    reportType: getFormValue(formData, "reportType"),
    eventPublicId: getFormValue(formData, "eventPublicId"),
    sourceSlug: getFormValue(formData, "sourceSlug"),
    contactEmail: getFormValue(formData, "contactEmail"),
    summary: getFormValue(formData, "summary"),
    details: getFormValue(formData, "details"),
    honeypot: getFormValue(formData, "website"),
  });

  redirect(
    result.ok
      ? "/report?submitted=public"
      : `/report?error=${result.error ?? "unknown"}`,
  );
}

export async function submitPublisherComplaintAction(formData: FormData) {
  const result = await createReportAndCase({
    channel: "publisher",
    reportType: getFormValue(formData, "reportType"),
    eventPublicId: getFormValue(formData, "eventPublicId"),
    sourceSlug: getFormValue(formData, "sourceSlug"),
    contactEmail: getFormValue(formData, "contactEmail"),
    summary: getFormValue(formData, "summary"),
    details: getFormValue(formData, "details"),
    honeypot: getFormValue(formData, "website"),
  });

  redirect(
    result.ok
      ? "/report?submitted=publisher"
      : `/report?error=${result.error ?? "unknown"}`,
  );
}
