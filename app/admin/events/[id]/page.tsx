import Link from "next/link";
import { notFound } from "next/navigation";

import { logoutAdminAction, toggleEventSuppressionAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth.mjs";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type AdminEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getEvent(id: string) {
  try {
    return await prisma.event.findFirst({
      where: {
        OR: [{ publicId: id }, { id }],
      },
      include: {
        memberships: {
          include: {
            article: {
              include: {
                source: true,
              },
            },
          },
        },
        publishedSnapshot: true,
        publishSnapshots: {
          orderBy: { publishedAt: "desc" },
          take: 3,
        },
        audits: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function AdminEventPage({
  params,
}: AdminEventPageProps) {
  const session = (await requireAdminSession("REVIEWER", "/admin/pipeline"))!;
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Event review</h1>
          <p>
            Membership evidence, confidence state, and latest publish snapshot
            for one materialized event.
          </p>
        </header>
        <section className="panel admin-toolbar">
          <div className="badge-row">
            <span className="badge">{session.role}</span>
            <span className="badge mono">{session.email}</span>
            <span className="badge">{event.status}</span>
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
          <p>
            Review target: <span className="mono">{event.publicId}</span>
          </p>
          <p>
            status: {event.status} · confidence: {event.confidenceState} · score:{" "}
            {event.confidenceScore?.toFixed(4) ?? "none"}
          </p>
          <p>latest snapshot: {event.publishedSnapshot?.publishedAt?.toISOString() ?? "none"}</p>
          <p>suppression reason: {event.suppressionReason ?? "none"}</p>
          {session.role === "OPERATOR" ? (
            <form action={toggleEventSuppressionAction} className="action-form">
              <input name="eventId" type="hidden" value={event.id} />
              <input name="redirectTo" type="hidden" value={`/admin/events/${event.id}`} />
              <input
                name="operation"
                type="hidden"
                value={event.status === "SUPPRESSED" ? "restore" : "suppress"}
              />
              <label className="field">
                <span>Operator reason</span>
                <input
                  className="form-input"
                  dir="auto"
                  name="reason"
                  placeholder={
                    event.status === "SUPPRESSED"
                      ? "Why restore this event?"
                      : "Why suppress this event?"
                  }
                  required
                  type="text"
                />
              </label>
              <button
                className={`form-button ${
                  event.status === "SUPPRESSED"
                    ? "form-button--secondary"
                    : "form-button--danger"
                }`}
                type="submit"
              >
                {event.status === "SUPPRESSED" ? "Restore event" : "Suppress event"}
              </button>
            </form>
          ) : (
            <p className="status-note">
              Reviewer access is read-only. Event suppression requires the `operator` role.
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Memberships</h2>
          {event.memberships.length === 0 ? (
            <p>No event memberships were materialized for this event.</p>
          ) : (
            <ul className="stack-list">
              {event.memberships.map((membership) => (
                <li key={membership.id} className="stack-list__item">
                  <h3>{membership.article.headline}</h3>
                  <p>
                    {membership.membershipRole} · {membership.article.source.displayName} ·{" "}
                    {membership.article.publishedAt?.toISOString() ?? "unknown time"}
                  </p>
                  <p>{membership.article.snippet ?? "No snippet"}</p>
                  <p>reason: {membership.membershipReason ?? "none"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Event audit trail</h2>
          {event.audits.length === 0 ? (
            <p>No event audit entries exist yet.</p>
          ) : (
            <ul className="stack-list">
              {event.audits.map((audit) => (
                <li key={audit.id} className="stack-list__item">
                  <h3>
                    {audit.actionType} · {audit.actorRole}
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
        <section className="panel">
          <h2>Recent snapshots</h2>
          {event.publishSnapshots.length === 0 ? (
            <p>No publish snapshots exist yet.</p>
          ) : (
            <ul className="stack-list">
              {event.publishSnapshots.map((snapshot) => (
                <li key={snapshot.id} className="stack-list__item">
                  <p>
                    v{snapshot.snapshotVersion} · {snapshot.publicStatus} ·{" "}
                    {snapshot.publishedAt.toISOString()}
                  </p>
                  <p>
                    confidence: {snapshot.confidenceState} · warning: {snapshot.warningLabel ?? "none"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
