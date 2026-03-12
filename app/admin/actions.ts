"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  authenticateAdminCredentials,
  buildAdminLoginPath,
  normalizeAdminNextPath,
} from "@/lib/admin/auth-core.mjs";
import {
  clearAdminSession,
  getSafeAdminRedirect,
  requireAdminSession,
  setAdminSession,
} from "@/lib/admin/auth.mjs";
import {
  toggleEventSuppression,
  toggleSourceAvailability,
  updateOperatorCaseStatus,
} from "@/lib/server/repos/admin";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const validCaseActions = new Set([
  "acknowledge",
  "start_review",
  "request_action",
  "mark_suppressed",
  "resolve",
  "reject",
]);

export async function loginAdminAction(formData: FormData) {
  const nextPath = normalizeAdminNextPath(
    getFormValue(formData, "next"),
    "/admin/pipeline",
  );
  const result = authenticateAdminCredentials({
    email: getFormValue(formData, "email"),
    password: getFormValue(formData, "password"),
    totpToken: getFormValue(formData, "totp"),
  });

  if (!result.ok) {
    redirect(buildAdminLoginPath(nextPath, result.code));
  }

  await setAdminSession(result.session);
  redirect(nextPath);
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect(buildAdminLoginPath("/admin/pipeline", "logged_out"));
}

export async function toggleSourceAvailabilityAction(formData: FormData) {
  const redirectTo = getSafeAdminRedirect(
    getFormValue(formData, "redirectTo"),
    "/admin/sources",
  );
  const session = (await requireAdminSession("OPERATOR", redirectTo))!;
  const sourceId = getFormValue(formData, "sourceId");
  const reason = getFormValue(formData, "reason") || "No reason supplied.";
  const operation = getFormValue(formData, "operation");

  if (!sourceId || !["disable", "enable"].includes(operation)) {
    redirect(redirectTo);
  }

  const disabling = operation === "disable";
  await toggleSourceAvailability({
    sourceId,
    disable: disabling,
    reason,
    actorRef: session.email,
  });

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/sources");
  redirect(redirectTo);
}

export async function toggleEventSuppressionAction(formData: FormData) {
  const redirectTo = getSafeAdminRedirect(
    getFormValue(formData, "redirectTo"),
    "/admin/pipeline",
  );
  const session = (await requireAdminSession("OPERATOR", redirectTo))!;
  const eventId = getFormValue(formData, "eventId");
  const reason = getFormValue(formData, "reason") || "No reason supplied.";
  const operation = getFormValue(formData, "operation");

  if (!eventId || !["suppress", "restore"].includes(operation)) {
    redirect(redirectTo);
  }

  const event = await toggleEventSuppression({
    eventId,
    suppress: operation === "suppress",
    reason,
    actorRef: session.email,
  });

  if (!event) {
    redirect(redirectTo);
  }

  revalidatePath("/");
  revalidatePath(`/events/${event.publicId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/events/${event.eventId}`);
  redirect(redirectTo);
}

export async function updateOperatorCaseStatusAction(formData: FormData) {
  const redirectTo = getSafeAdminRedirect(
    getFormValue(formData, "redirectTo"),
    "/admin/cases",
  );
  const session = (await requireAdminSession("OPERATOR", redirectTo))!;
  const operatorCaseId = getFormValue(formData, "operatorCaseId");
  const action = getFormValue(formData, "action");
  const reason = getFormValue(formData, "reason") || "No reason supplied.";

  if (!operatorCaseId || !action) {
    redirect(redirectTo);
  }

  if (!validCaseActions.has(action)) {
    redirect(redirectTo);
  }

  const result = await updateOperatorCaseStatus({
    operatorCaseId,
    action,
    reason,
    actorRef: session.email,
  });

  if (!result) {
    redirect(redirectTo);
  }

  revalidatePath("/admin/cases");
  if (result.eventId) {
    revalidatePath(`/admin/events/${result.eventId}`);
  }
  redirect(redirectTo);
}
