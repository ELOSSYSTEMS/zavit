import Link from "next/link";

import { logoutAdminAction, updateOperatorCaseStatusAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth.mjs";
import { getSlaState } from "@/lib/reports/workflow.mjs";
import {
  listAdminOperatorCases,
  type AdminOperatorCase,
} from "@/lib/server/repos/admin";

export const dynamic = "force-dynamic";

const caseActions = [
  { value: "acknowledge", label: "Acknowledge" },
  { value: "start_review", label: "Start review" },
  { value: "request_action", label: "Mark action required" },
  { value: "mark_suppressed", label: "Mark suppressed" },
  { value: "resolve", label: "Resolve" },
  { value: "reject", label: "Reject" },
];

export default async function AdminCasesPage() {
  const session = (await requireAdminSession("REVIEWER", "/admin/cases"))!;
  const cases = await listAdminOperatorCases();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Report and complaint queue</h1>
          <p>
            Public correction reports, publisher complaints, and case-state
            progression with SLA visibility.
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
          {cases.length === 0 ? (
            <p>No reports or operator cases are available yet.</p>
          ) : (
            <ul className="stack-list">
              {cases.map((operatorCase: AdminOperatorCase) => {
                const slaState = getSlaState({
                  reportType: operatorCase.caseType,
                  createdAt: operatorCase.createdAt,
                  status: operatorCase.status,
                });

                return (
                  <li key={operatorCase.id} className="stack-list__item">
                    <h2>
                      {operatorCase.caseType} · {operatorCase.status}
                    </h2>
                    <p>
                      SLA: {slaState} · created: {operatorCase.createdAt.toISOString()}
                    </p>
                    <p>
                      contact: {operatorCase.report?.contactEmail ?? "none"} · abuse score:{" "}
                      {operatorCase.report?.abuseScore?.toFixed(2) ?? "0.00"}
                    </p>
                    <p>summary: {(operatorCase.report?.payload as { summary?: string } | null)?.summary ?? "none"}</p>
                    <p>
                      event: {operatorCase.event?.publicId ?? "none"} · source:{" "}
                      {operatorCase.source?.displayName ?? "none"}
                    </p>
                    <p>
                      assigned: {operatorCase.assignedTo ?? "none"} · acknowledged by:{" "}
                      {operatorCase.acknowledgementBy ?? "none"}
                    </p>
                    <p>notes: {operatorCase.notes ?? "none"}</p>
                    <div className="badge-row">
                      {operatorCase.event?.id ? (
                        <Link href={`/admin/events/${operatorCase.event.id}`}>Open event review</Link>
                      ) : null}
                      {operatorCase.source?.slug ? (
                        <Link href={`/report?source=${operatorCase.source.slug}`}>Public form context</Link>
                      ) : null}
                    </div>
                    {session.role === "OPERATOR" ? (
                      <form action={updateOperatorCaseStatusAction} className="action-form">
                        <input name="operatorCaseId" type="hidden" value={operatorCase.id} />
                        <input name="redirectTo" type="hidden" value="/admin/cases" />
                        <label className="field">
                          <span>Case action</span>
                          <select className="form-input" defaultValue="acknowledge" name="action">
                            {caseActions.map((action: (typeof caseActions)[number]) => (
                              <option key={action.value} value={action.value}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Operator note</span>
                          <input
                            className="form-input"
                            dir="auto"
                            name="reason"
                            required
                            type="text"
                          />
                        </label>
                        <button className="form-button" type="submit">
                          Update case
                        </button>
                      </form>
                    ) : (
                      <p className="status-note">
                        Reviewer access is read-only. Complaint progression requires the `operator` role.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
