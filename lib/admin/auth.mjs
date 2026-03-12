import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  buildAdminLoginPath,
  createAdminSessionToken,
  normalizeAdminNextPath,
  readAdminSessionFromToken,
  resolveAdminAccess,
} from "./auth-core.mjs";
import {
  getAdminConfig,
  isAdminConfigured,
} from "./config.mjs";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "./session.mjs";

export async function readAdminSession(env = process.env, nowMs = Date.now()) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return readAdminSessionFromToken(token, env, nowMs);
}

export async function getOptionalAdminSession(env = process.env, nowMs = Date.now()) {
  const config = getAdminConfig(env);

  if (!isAdminConfigured(config)) {
    return null;
  }

  return readAdminSession(env, nowMs);
}

export async function setAdminSession(session, env = process.env) {
  const cookieStore = await cookies();
  const token = createAdminSessionToken(session, env);

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function requireAdminSession(
  requiredRole = "REVIEWER",
  nextPath = "/admin/pipeline",
  env = process.env,
) {
  const config = getAdminConfig(env);

  if (!isAdminConfigured(config)) {
    redirect(buildAdminLoginPath(nextPath, "misconfigured"));
  }

  const session = await readAdminSession(env);
  const access = resolveAdminAccess({
    session,
    requiredRole,
  });

  if (!access.allowed) {
    redirect(buildAdminLoginPath(nextPath, access.code));
  }

  return session;
}

export function getSafeAdminRedirect(value, fallback) {
  return normalizeAdminNextPath(value, fallback);
}
