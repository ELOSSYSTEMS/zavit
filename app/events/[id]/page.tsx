import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublishedEventDetail,
  type PublishedEventDetail,
} from "@/lib/server/repos/public";

type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getPublishedEventDetail(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Public route</p>
          <h1>{event.publishedSnapshot?.neutralTitle ?? event.neutralTitle ?? "Event"}</h1>
          <p>
            Published event snapshot backed by the Step 7 publish gate.
          </p>
        </header>
        <section className="panel">
          <p>
            Event ID: <span className="mono">{event.publicId}</span>
          </p>
          <p>
            confidence: {event.publishedSnapshot?.confidenceState ?? event.confidenceState} · warning:{" "}
            {event.publishedSnapshot?.warningLabel ?? "none"}
          </p>
          <p>updated: {event.lastUpdatedAt.toISOString()}</p>
          <p>
            <Link href={`/report?event=${event.publicId}`}>Report a correction or complaint</Link>
          </p>
        </section>
        <section className="panel">
          <h2>Coverage</h2>
          <ul className="stack-list">
            {event.memberships.map((membership: PublishedEventDetail["memberships"][number]) => (
              <li key={membership.id} className="stack-list__item">
                <h3>{membership.article.headline}</h3>
                <p>
                  {membership.article.source.displayName} ·{" "}
                  {membership.article.publishedAt?.toISOString() ?? "unknown time"}
                </p>
                <p>{membership.article.snippet ?? "No snippet"}</p>
                <p>
                  <a href={membership.article.canonicalUrl} target="_blank" rel="noreferrer">
                    {membership.article.canonicalUrl}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
