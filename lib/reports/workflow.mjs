const PUBLIC_REPORT_TYPES = new Set([
  "BAD_CLUSTER",
  "WRONG_SOURCE",
  "BROKEN_LINK",
]);

const PUBLISHER_REPORT_TYPES = new Set([
  "PUBLISHER_COMPLAINT",
  "PUBLISHER_OPT_OUT",
  "EMERGENCY_SUPPRESSION",
]);

const CASE_STATUS_TRANSITIONS = {
  acknowledge: "ACKNOWLEDGED",
  start_review: "UNDER_REVIEW",
  request_action: "ACTION_REQUIRED",
  mark_suppressed: "SUPPRESSED",
  resolve: "RESOLVED",
  reject: "REJECTED",
};

export function normalizeFreeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function scoreReportAbuse({
  honeypot,
  summary,
  details,
  contactEmail,
}) {
  let score = 0;

  if (normalizeFreeText(honeypot)) {
    score += 1;
  }

  const normalizedSummary = normalizeFreeText(summary);
  const normalizedDetails = normalizeFreeText(details);
  const normalizedEmail = normalizeFreeText(contactEmail);

  if (normalizedSummary.length < 8) {
    score += 0.2;
  }

  if (normalizedDetails.length < 24) {
    score += 0.2;
  }

  if (normalizedDetails.length > 1_500) {
    score += 0.2;
  }

  if (normalizedEmail && !normalizedEmail.includes("@")) {
    score += 0.2;
  }

  return Math.min(Number(score.toFixed(2)), 1);
}

export function deriveInitialCaseStatus(abuseScore) {
  return abuseScore >= 0.9 ? "ACTION_REQUIRED" : "NEW";
}

export function getSlaTargetHours(reportType) {
  if (reportType === "EMERGENCY_SUPPRESSION") {
    return 24;
  }

  if (
    reportType === "PUBLISHER_COMPLAINT" ||
    reportType === "PUBLISHER_OPT_OUT"
  ) {
    return 8;
  }

  return 72;
}

export function getSlaState({
  reportType,
  createdAt,
  status,
  now = new Date(),
}) {
  if (["RESOLVED", "REJECTED"].includes(status)) {
    return "closed";
  }

  if (status === "SUPPRESSED") {
    return "suppressed";
  }

  const createdAtDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const elapsedHours =
    (new Date(now).getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);
  const targetHours = getSlaTargetHours(reportType);

  if (elapsedHours >= targetHours) {
    return "late";
  }

  if (elapsedHours >= targetHours * 0.75) {
    return "due_soon";
  }

  return "on_track";
}

export function resolveCaseStatusTransition(action) {
  const nextStatus = CASE_STATUS_TRANSITIONS[action];

  if (!nextStatus) {
    throw new Error(`Unsupported case action: ${action}`);
  }

  return nextStatus;
}

export function prepareReportSubmission({
  channel,
  reportType,
  eventId,
  eventPublicId,
  sourceId,
  sourceSlug,
  contactEmail,
  summary,
  details,
  honeypot,
}) {
  const normalizedType = normalizeFreeText(reportType).toUpperCase();
  const normalizedChannel = normalizeFreeText(channel);
  const normalizedSummary = normalizeFreeText(summary);
  const normalizedDetails = normalizeFreeText(details);
  const normalizedEmail = normalizeFreeText(contactEmail).toLowerCase();

  if (!normalizedSummary || !normalizedDetails) {
    return {
      ok: false,
      error: "missing_details",
    };
  }

  if (
    (normalizedChannel === "public" && !PUBLIC_REPORT_TYPES.has(normalizedType)) ||
    (normalizedChannel === "publisher" &&
      !PUBLISHER_REPORT_TYPES.has(normalizedType))
  ) {
    return {
      ok: false,
      error: "invalid_type",
    };
  }

  if (normalizedChannel === "publisher" && !normalizedEmail) {
    return {
      ok: false,
      error: "missing_contact",
    };
  }

  const abuseScore = scoreReportAbuse({
    honeypot,
    summary: normalizedSummary,
    details: normalizedDetails,
    contactEmail: normalizedEmail,
  });
  const initialStatus = deriveInitialCaseStatus(abuseScore);
  const payload = {
    channel: normalizedChannel,
    summary: normalizedSummary,
    details: normalizedDetails,
    eventPublicId: normalizeFreeText(eventPublicId) || null,
    sourceSlug: normalizeFreeText(sourceSlug) || null,
    honeypotTriggered: Boolean(normalizeFreeText(honeypot)),
  };

  return {
    ok: true,
    correctionReportData: {
      reportType: normalizedType,
      eventId: eventId || null,
      sourceId: sourceId || null,
      status: initialStatus,
      payload,
      abuseScore,
      contactEmail: normalizedEmail || null,
    },
    operatorCaseData: {
      caseType: normalizedType,
      status: initialStatus,
      eventId: eventId || null,
      sourceId: sourceId || null,
      notes: normalizedSummary,
    },
  };
}

export function getCaseActionAuditType(nextStatus) {
  if (nextStatus === "ACKNOWLEDGED") {
    return "CASE_ACKNOWLEDGED";
  }

  if (["RESOLVED", "REJECTED"].includes(nextStatus)) {
    return "CASE_RESOLVED";
  }

  return "REVIEW_UPDATED";
}
