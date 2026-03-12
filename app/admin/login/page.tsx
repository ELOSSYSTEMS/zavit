import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAdminAction } from "@/app/admin/actions";
import {
  getAdminErrorMessage,
  normalizeAdminNextPath,
} from "@/lib/admin/auth-core.mjs";
import {
  getAdminConfig,
  getAdminConfigErrors,
} from "@/lib/admin/config.mjs";
import { getOptionalAdminSession } from "@/lib/admin/auth.mjs";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const errorCode = getSingleQueryValue(params.error);
  const nextPath = normalizeAdminNextPath(
    getSingleQueryValue(params.next),
    "/admin/pipeline",
  );
  const session = await getOptionalAdminSession();
  const errorMessage = getAdminErrorMessage(errorCode);
  const config = getAdminConfig();
  const configErrors = getAdminConfigErrors(config);

  if (session && !errorCode) {
    redirect(nextPath);
  }

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Admin sign-in</h1>
          <p>
            Access requires an allowlisted email, the shared admin password,
            and a valid TOTP code.
          </p>
        </header>

        <section className="panel login-panel">
          {errorMessage ? <p className="status-note">{errorMessage}</p> : null}
          {configErrors.length > 0 ? (
            <div className="status-note status-note--warn">
              <p>Missing admin auth env vars:</p>
              <p className="mono">{configErrors.join(", ")}</p>
            </div>
          ) : null}

          <form action={loginAdminAction} className="field-grid">
            <input type="hidden" name="next" value={nextPath} />
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                className="form-input"
                dir="ltr"
                name="email"
                placeholder="reviewer@example.com"
                required
                type="email"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                className="form-input"
                dir="ltr"
                name="password"
                required
                type="password"
              />
            </label>
            <label className="field">
              <span>TOTP</span>
              <input
                autoComplete="one-time-code"
                className="form-input"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                name="totp"
                pattern="[0-9]{6}"
                placeholder="123456"
                required
                type="text"
              />
            </label>
            <button className="form-button" type="submit">
              Sign in
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Notes</h2>
          <ul>
            <li>`reviewer` can inspect pipeline, event, and source state.</li>
            <li>`operator` is required for source disablement and event suppression.</li>
            <li>
              <Link href="/">Return to the public feed</Link>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
