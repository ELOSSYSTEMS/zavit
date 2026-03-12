import { logoutAdminAction, toggleSourceAvailabilityAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth.mjs";
import Link from "next/link";
import {
  listAdminSources,
  listRecentSourceAudits,
  type AdminSourceAudit,
  type AdminSourceRecord,
} from "@/lib/server/repos/admin";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const session = (await requireAdminSession("REVIEWER", "/admin/sources"))!;
  const sources = await listAdminSources();
  const audits = await listRecentSourceAudits();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Source health</h1>
          <p>
            Current ingest method, availability state, and latest health markers
            for the approved source roster.
          </p>
        </header>
        <section className="panel admin-toolbar">
          <div className="badge-row">
            <span className="badge">{session.role}</span>
            <span className="badge mono">{session.email}</span>
          </div>
          <nav className="admin-nav">
            <Link href="/admin/pipeline">Pipeline</Link>
            <Link href="/admin/sources">Sources</Link>
            <Link href="/admin/cases">Cases</Link>
            <Link href="/">Public feed</Link>
          </nav>
          <form action={logoutAdminAction}>
            <button className="form-button form-button--secondary" type="submit">
              Sign out
            </button>
          </form>
        </section>
        <section className="panel">
          {sources.length === 0 ? (
            <p>No source records are available yet. Run source sync and ingest first.</p>
          ) : (
            <ul className="stack-list">
              {sources.map((source: AdminSourceRecord) => (
                <li key={source.slug} className="stack-list__item">
                  <h2>{source.displayName}</h2>
                  <p>
                    {source.ingestMethod} · enabled: {String(source.enabled)} · availability:{" "}
                    {source.availabilityStatus}
                  </p>
                  <p>
                    last success: {source.health?.lastSuccessAt?.toISOString() ?? "none"} · last failure:{" "}
                    {source.health?.lastFailureAt?.toISOString() ?? "none"}
                  </p>
                  <p>
                    consecutive failures: {source.health?.consecutiveFailures ?? 0} · failure type:{" "}
                    {source.health?.failureType ?? "none"}
                  </p>
                  {session.role === "OPERATOR" ? (
                    <form action={toggleSourceAvailabilityAction} className="action-form">
                      <input name="sourceId" type="hidden" value={source.id} />
                      <input name="redirectTo" type="hidden" value="/admin/sources" />
                      <input
                        name="operation"
                        type="hidden"
                        value={source.enabled ? "disable" : "enable"}
                      />
                      <label className="field">
                        <span>Operator reason</span>
                        <input
                          className="form-input"
                          dir="auto"
                          name="reason"
                          placeholder={
                            source.enabled
                              ? "Why disable this source?"
                              : "Why restore this source?"
                          }
                          required
                          type="text"
                        />
                      </label>
                      <button
                        className={`form-button ${
                          source.enabled ? "form-button--danger" : "form-button--secondary"
                        }`}
                        type="submit"
                      >
                        {source.enabled ? "Disable source" : "Restore source"}
                      </button>
                    </form>
                  ) : (
                    <p className="status-note">
                      Reviewer access is read-only. Source disablement requires the `operator` role.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Recent source actions</h2>
          {audits.length === 0 ? (
            <p>No source audit entries exist yet.</p>
          ) : (
            <ul className="stack-list">
              {audits.map((audit: AdminSourceAudit) => (
                <li key={audit.id} className="stack-list__item">
                  <h3>
                    {audit.actionType} · {audit.source?.displayName ?? "unknown source"}
                  </h3>
                  <p>
                    actor: {audit.actorRef ?? "system"} · {audit.createdAt.toISOString()}
                  </p>
                  <p>reason: {audit.reason ?? "none"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
