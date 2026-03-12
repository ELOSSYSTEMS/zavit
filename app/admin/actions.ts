"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
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
  getCaseActionAuditType,
  resolveCaseStatusTransition,
} from "@/lib/reports/workflow.mjs";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

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

  await prisma.$transaction(async (tx) => {
    await tx.source.update({
      where: { id: sourceId },
      data: {
        enabled: !disabling,
        availabilityStatus: disabling ? "DISABLED" : "ACTIVE",
      },
    });

    await tx.sourceHealth.upsert({
      where: { sourceId },
      update: {
        disabledReason: disabling ? reason : null,
      },
      create: {
        sourceId,
        disabledReason: disabling ? reason : null,
      },
    });

    await tx.operatorActionAudit.create({
      data: {
        actionType: disabling ? "SOURCE_DISABLED" : "SOURCE_ENABLED",
        actorRole: "OPERATOR",
        actorRef: session.email,
        reason,
        sourceId,
      },
    });
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

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      publicId: true,
      publishedSnapshotId: true,
    },
  });

  if (!event) {
    redirect(redirectTo);
  }

  const suppressing = operation === "suppress";

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: event.id },
      data: suppressing
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
        actionType: suppressing ? "EVENT_SUPPRESSED" : "EVENT_UNSUPPRESSED",
        actorRole: "OPERATOR",
        actorRef: session.email,
        reason,
        eventId: event.id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/events/${event.publicId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/events/${event.id}`);
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

  const nextStatus = resolveCaseStatusTransition(action);
  const operatorCase = await prisma.operatorCase.findUnique({
    where: { id: operatorCaseId },
    include: {
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
          enabled: true,
        },
      },
    },
  });

  if (!operatorCase) {
    redirect(redirectTo);
  }

  if (
    nextStatus === "SUPPRESSED" &&
    operatorCase.event?.status !== "SUPPRESSED" &&
    operatorCase.source?.enabled !== false
  ) {
    redirect(redirectTo);
  }

  const now = new Date();
  const updateData: {
    status: "ACKNOWLEDGED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "SUPPRESSED" | "RESOLVED" | "REJECTED";
    acknowledgementAt?: Date;
    acknowledgementBy?: string;
    assignedRole?: "REVIEWER" | "OPERATOR";
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
    updateData.acknowledgementBy = session.email;
  }

  if (["UNDER_REVIEW", "ACTION_REQUIRED"].includes(nextStatus)) {
    updateData.assignedRole = "OPERATOR";
    updateData.assignedTo = session.email;
  }

  if (["RESOLVED", "REJECTED"].includes(nextStatus)) {
    updateData.resolutionAt = now;
    updateData.resolutionBy = session.email;
  }

  if (nextStatus === "SUPPRESSED") {
    updateData.emergencySuppressedAt = now;
  }

  await prisma.$transaction(async (tx) => {
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
        actorRef: session.email,
        reason,
        eventId: operatorCase.eventId,
        sourceId: operatorCase.sourceId,
        operatorCaseId: operatorCase.id,
      },
    });
  });

  revalidatePath("/admin/cases");
  if (operatorCase.event?.id) {
    revalidatePath(`/admin/events/${operatorCase.event.id}`);
  }
  redirect(redirectTo);
}
