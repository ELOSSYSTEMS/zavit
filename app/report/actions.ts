"use server";

import { redirect } from "next/navigation";

import { submitReportAndCreateCase } from "@/lib/server/repos/reports";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitPublicReportAction(formData: FormData) {
  const result = await submitReportAndCreateCase({
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
  const result = await submitReportAndCreateCase({
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
