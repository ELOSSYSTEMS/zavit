import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

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
      },
    });
  } catch {
    return null;
  }
}

export default async function AdminEventPage({
  params,
}: AdminEventPageProps) {
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
        <section className="panel">
          <p>
            Review target: <span className="mono">{event.publicId}</span>
          </p>
          <p>
            status: {event.status} · confidence: {event.confidenceState} · score:{" "}
            {event.confidenceScore?.toFixed(4) ?? "none"}
          </p>
          <p>latest snapshot: {event.publishedSnapshot?.publishedAt?.toISOString() ?? "none"}</p>
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
