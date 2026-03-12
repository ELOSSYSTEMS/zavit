import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type FeedSnapshot = {
  event: {
    publicId: string;
    neutralTitle: string | null;
    confidenceState: string;
  };
  warningLabel: string | null;
  publishedAt: Date;
};

async function getPublishedFeed(): Promise<FeedSnapshot[]> {
  try {
    const latestRun = await prisma.pipelineRun.findFirst({
      where: {
        runType: "FULL",
        status: "SUCCEEDED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestRun) {
      return [];
    }

    return await prisma.publishSnapshot.findMany({
      where: {
        pipelineRunId: latestRun.id,
        publicStatus: "PUBLISHED",
      },
      include: {
        event: {
          select: {
            publicId: true,
            neutralTitle: true,
            confidenceState: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const feed = await getPublishedFeed();

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
            {feed.map((snapshot: FeedSnapshot) => (
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
