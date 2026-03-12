import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAdminNextPath,
  resolveAdminAccess,
} from "../../lib/admin/auth-core.mjs";
import {
  getAdminConfig,
  getRoleForEmail,
  hasRequiredRole,
  isAdminConfigured,
} from "../../lib/admin/config.mjs";

const env = {
  ADMIN_REVIEWER_EMAILS: "reviewer@example.com",
  ADMIN_OPERATOR_EMAILS: "operator@example.com,reviewer-operator@example.com",
  ADMIN_PASSWORD: "test-password",
  ADMIN_TOTP_SECRET: "JBSWY3DPEHPK3PXP",
  ADMIN_SESSION_SECRET: "test-session-secret",
};

test("reviewers can access reviewer pages but not operator actions", () => {
  assert.deepEqual(
    resolveAdminAccess({
      session: {
        email: "reviewer@example.com",
        role: "REVIEWER",
      },
      requiredRole: "REVIEWER",
    }),
    { allowed: true },
  );
  assert.deepEqual(
    resolveAdminAccess({
      session: {
        email: "reviewer@example.com",
        role: "REVIEWER",
      },
      requiredRole: "OPERATOR",
    }),
    { allowed: false, code: "forbidden" },
  );
});

test("operators satisfy reviewer and operator requirements", () => {
  assert.equal(hasRequiredRole("OPERATOR", "REVIEWER"), true);
  assert.equal(hasRequiredRole("OPERATOR", "OPERATOR"), true);
  assert.equal(hasRequiredRole("REVIEWER", "OPERATOR"), false);
});

test("operator allowlist takes precedence over reviewer allowlist", () => {
  const config = getAdminConfig(env);

  assert.equal(getRoleForEmail("reviewer-operator@example.com", config), "OPERATOR");
  assert.equal(getRoleForEmail("reviewer@example.com", config), "REVIEWER");
  assert.equal(getRoleForEmail("unknown@example.com", config), null);
});

test("admin config requires both reviewer and operator coverage", () => {
  assert.equal(isAdminConfigured(getAdminConfig(env)), true);
  assert.equal(
    isAdminConfigured(
      getAdminConfig({
        ...env,
        ADMIN_OPERATOR_EMAILS: "",
      }),
    ),
    false,
  );
});

test("admin next-path normalization fails closed", () => {
  assert.equal(normalizeAdminNextPath("/admin/sources"), "/admin/sources");
  assert.equal(normalizeAdminNextPath("/admin/login"), "/admin/pipeline");
  assert.equal(normalizeAdminNextPath("/events/example"), "/admin/pipeline");
});
