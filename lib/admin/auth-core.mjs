import {
  getAdminConfig,
  getRoleForEmail,
  hasRequiredRole,
  isAdminConfigured,
  normalizeAdminEmailAddress,
} from "./config.mjs";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session.mjs";
import { verifyTotpToken } from "./totp.mjs";

export const ADMIN_SESSION_COOKIE = "zavit_admin_session";

export function normalizeAdminNextPath(value, fallback = "/admin/pipeline") {
  const candidate = String(value ?? "").trim();

  if (!candidate.startsWith("/admin") || candidate.startsWith("/admin/login")) {
    return fallback;
  }

  return candidate;
}

export function buildAdminLoginPath(nextPath = "/admin/pipeline", errorCode) {
  const params = new URLSearchParams();
  params.set("next", normalizeAdminNextPath(nextPath));

  if (errorCode) {
    params.set("error", errorCode);
  }

  return `/admin/login?${params.toString()}`;
}

export function authenticateAdminCredentials(
  { email, password, totpToken },
  env = process.env,
  nowMs = Date.now(),
) {
  const config = getAdminConfig(env);

  if (!isAdminConfigured(config)) {
    return {
      ok: false,
      code: "misconfigured",
    };
  }

  const normalizedEmail = normalizeAdminEmailAddress(email);
  const role = getRoleForEmail(normalizedEmail, config);

  if (!role) {
    return {
      ok: false,
      code: "not_allowed",
    };
  }

  if (password !== config.password) {
    return {
      ok: false,
      code: "invalid_password",
    };
  }

  if (
    !verifyTotpToken({
      secret: config.totpSecret,
      token: totpToken,
      timestamp: nowMs,
    })
  ) {
    return {
      ok: false,
      code: "invalid_totp",
    };
  }

  return {
    ok: true,
    session: {
      email: normalizedEmail,
      role,
    },
  };
}

export function createAdminSessionToken(session, env = process.env, nowMs = Date.now()) {
  const config = getAdminConfig(env);

  if (!config.sessionSecret) {
    throw new Error("ADMIN_SESSION_SECRET is required.");
  }

  return createSessionToken(
    session,
    config.sessionSecret,
    nowMs,
    ADMIN_SESSION_MAX_AGE_SECONDS,
  );
}

export function readAdminSessionFromToken(token, env = process.env, nowMs = Date.now()) {
  const config = getAdminConfig(env);

  if (!config.sessionSecret) {
    return null;
  }

  return verifySessionToken(token, config.sessionSecret, nowMs);
}

export function resolveAdminAccess({
  session,
  requiredRole = "REVIEWER",
}) {
  if (!session) {
    return {
      allowed: false,
      code: "signin",
    };
  }

  if (!hasRequiredRole(session.role, requiredRole)) {
    return {
      allowed: false,
      code: "forbidden",
    };
  }

  return {
    allowed: true,
  };
}

export function getAdminErrorMessage(errorCode) {
  switch (errorCode) {
    case "misconfigured":
      return "Admin auth is not fully configured in the environment yet.";
    case "not_allowed":
      return "This email is not on the admin allowlist.";
    case "invalid_password":
      return "The admin password did not match.";
    case "invalid_totp":
      return "The TOTP code did not verify.";
    case "forbidden":
      return "Your role does not allow that admin action.";
    case "logged_out":
      return "Signed out.";
    default:
      return null;
  }
}
