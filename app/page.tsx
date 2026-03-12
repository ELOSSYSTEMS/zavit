import Link from "next/link";

import {
  listPublishedFeed,
  type PublishedFeedItem,
} from "@/lib/server/repos/public";

export const dynamic = "force-dynamic";

export default async function Home() {
  const feed = await listPublishedFeed();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Public route</p>
        <h1>Published event feed</h1>
        <p>
          The feed reads only from the latest successful publish run. Nothing is
          shown publicly if the Step 7 gate blocks.
        </p>
      </section>

      <section className="panel">
        {feed.length === 0 ? (
          <p>No published events are available yet. Run the Step 7 event pipeline first.</p>
        ) : (
          <ul className="stack-list">
            {feed.map((snapshot: PublishedFeedItem) => (
              <li key={snapshot.event.publicId} className="stack-list__item">
                <h2>{snapshot.event.neutralTitle ?? snapshot.event.publicId}</h2>
                <p>
                  confidence: {snapshot.event.confidenceState}
                  {snapshot.warningLabel ? ` · ${snapshot.warningLabel}` : ""}
                </p>
                <p>published: {snapshot.publishedAt.toISOString()}</p>
                <p>
                  <Link href={`/events/${snapshot.event.publicId}`}>Open event</Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
