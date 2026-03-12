import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { logoutAdminAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth.mjs";

export const dynamic = "force-dynamic";

async function getPipelineRuns() {
  try {
    return await prisma.pipelineRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  } catch {
    return [];
  }
}

async function getRecentAuditEntries() {
  try {
    return await prisma.operatorActionAudit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            publicId: true,
          },
        },
        source: {
          select: {
            displayName: true,
          },
        },
      },
      take: 12,
    });
  } catch {
    return [];
  }
}

export default async function AdminPipelinePage() {
  const session = (await requireAdminSession("REVIEWER", "/admin/pipeline"))!;
  const runs = await getPipelineRuns();
  const audits = await getRecentAuditEntries();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Pipeline runs</h1>
          <p>
            Latest ingest and event-pipeline runs, including blocked reasons and
            publish counts.
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
          {runs.length === 0 ? (
            <p>No pipeline runs are available yet.</p>
          ) : (
            <ul className="stack-list">
              {runs.map((run) => (
                <li key={run.id} className="stack-list__item">
                  <h2>
                    {run.runType} · {run.status}
                  </h2>
                  <p>
                    started: {run.startedAt?.toISOString() ?? "none"} · finished:{" "}
                    {run.finishedAt?.toISOString() ?? "none"}
                  </p>
                  <p>
                    sources: {run.sourceCount} · articles: {run.articleCount} · held events:{" "}
                    {run.heldEventCount} · published events: {run.publishedEventCount}
                  </p>
                  <p>
                    provider: {run.modelProvider ?? "n/a"} · model: {run.modelVersion ?? "n/a"}
                  </p>
                  <p>blocked reason: {run.blockedReason ?? "none"}</p>
                  <p>error summary: {run.errorSummary ?? "none"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Recent operator actions</h2>
          {audits.length === 0 ? (
            <p>No operator audit entries exist yet.</p>
          ) : (
            <ul className="stack-list">
              {audits.map((audit) => (
                <li key={audit.id} className="stack-list__item">
                  <h3>
                    {audit.actionType} · {audit.actorRole}
                  </h3>
                  <p>
                    actor: {audit.actorRef ?? "system"} · {audit.createdAt.toISOString()}
                  </p>
                  <p>
                    target: {audit.source?.displayName ?? audit.event?.publicId ?? "none"}
                  </p>
                  <p>reason: {audit.reason ?? "none"}</p>
                  {audit.event?.id ? (
                    <p>
                      <Link href={`/admin/events/${audit.event.id}`}>Open event review</Link>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Operator note</h2>
          <p>
            Public events now appear only through the publish-gated feed on <span className="mono">/</span> and
            event detail pages on <span className="mono">/events/[id]</span>.
          </p>
        </section>
      </section>
    </main>
  );
}
