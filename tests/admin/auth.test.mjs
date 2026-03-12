import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateAdminCredentials,
  buildAdminLoginPath,
  createAdminSessionToken,
  readAdminSessionFromToken,
} from "../../lib/admin/auth-core.mjs";
import { generateTotpToken } from "../../lib/admin/totp.mjs";

const env = {
  ADMIN_REVIEWER_EMAILS: "reviewer@example.com",
  ADMIN_OPERATOR_EMAILS: "operator@example.com",
  ADMIN_PASSWORD: "test-password",
  ADMIN_TOTP_SECRET: "JBSWY3DPEHPK3PXP",
  ADMIN_SESSION_SECRET: "test-session-secret",
};

const fixedNow = Date.parse("2026-03-12T10:00:00.000Z");

test("admin reviewer credentials pass with allowlisted email, password, and TOTP", () => {
  const totp = generateTotpToken({
    secret: env.ADMIN_TOTP_SECRET,
    timestamp: fixedNow,
  });

  const result = authenticateAdminCredentials(
    {
      email: "reviewer@example.com",
      password: env.ADMIN_PASSWORD,
      totpToken: totp,
    },
    env,
    fixedNow,
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.session, {
    email: "reviewer@example.com",
    role: "REVIEWER",
  });
});

test("admin operator credentials produce an operator session", () => {
  const totp = generateTotpToken({
    secret: env.ADMIN_TOTP_SECRET,
    timestamp: fixedNow,
  });

  const result = authenticateAdminCredentials(
    {
      email: "operator@example.com",
      password: env.ADMIN_PASSWORD,
      totpToken: totp,
    },
    env,
    fixedNow,
  );

  assert.equal(result.ok, true);
  assert.equal(result.session.role, "OPERATOR");
});

test("admin credentials reject a bad TOTP token", () => {
  const result = authenticateAdminCredentials(
    {
      email: "reviewer@example.com",
      password: env.ADMIN_PASSWORD,
      totpToken: "000000",
    },
    env,
    fixedNow,
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid_totp");
});

test("admin session tokens round-trip through signing and verification", () => {
  const token = createAdminSessionToken(
    {
      email: "operator@example.com",
      role: "OPERATOR",
    },
    env,
    fixedNow,
  );

  const session = readAdminSessionFromToken(token, env, fixedNow + 5_000);

  assert.deepEqual(session, {
    email: "operator@example.com",
    role: "OPERATOR",
    issuedAt: Math.floor(fixedNow / 1000),
    expiresAt: Math.floor(fixedNow / 1000) + 43_200,
  });
});

test("admin login path keeps users inside /admin routes", () => {
  assert.equal(
    buildAdminLoginPath("/admin/events/example", "signin"),
    "/admin/login?next=%2Fadmin%2Fevents%2Fexample&error=signin",
  );
  assert.equal(
    buildAdminLoginPath("https://example.com", "signin"),
    "/admin/login?next=%2Fadmin%2Fpipeline&error=signin",
  );
});
