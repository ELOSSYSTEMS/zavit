import assert from "node:assert/strict";
import test from "node:test";

import { resolveAdminAccess } from "../../lib/admin/auth-core.mjs";

const protectedRoutes = [
  "/admin/pipeline",
  "/admin/sources",
  "/admin/events/example",
];

test("admin pages reject unauthenticated sessions", () => {
  for (const pathname of protectedRoutes) {
    assert.deepEqual(
      resolveAdminAccess({
        session: null,
        requiredRole: "REVIEWER",
      }),
      { allowed: false, code: "signin" },
      pathname,
    );
  }
});

test("admin pages allow reviewer sessions", () => {
  for (const pathname of protectedRoutes) {
    assert.deepEqual(
      resolveAdminAccess({
        session: {
          email: "reviewer@example.com",
          role: "REVIEWER",
        },
        requiredRole: "REVIEWER",
      }),
      { allowed: true },
      pathname,
    );
  }
});
