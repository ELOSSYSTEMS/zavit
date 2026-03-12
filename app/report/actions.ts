"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

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

type PreparedReportSubmissionSuccess = {
  ok: true;
  correctionReportData: Prisma.CorrectionReportUncheckedCreateInput;
  operatorCaseData: Prisma.OperatorCaseUncheckedCreateInput;
};

type PreparedReportSubmissionFailure = {
  ok: false;
  error: string;
};

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

  await prisma.$transaction(async (tx) => {
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
