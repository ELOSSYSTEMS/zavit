import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Step 2 Repo Scaffold</p>
        <h1>ZAVIT baseline</h1>
        <p>
          This scaffold locks the public and admin surfaces into one Next.js
          application while keeping ingestion, clustering, and publish logic
          deferred to later phases.
        </p>
      </section>

      <section className="card-grid">
        <article className="panel">
          <h2>Public surface</h2>
          <p>
            The public application remains event-centric, Hebrew-first, and
            comparison-focused.
          </p>
          <div className="route-list">
            <Link href="/">
              <span>Home feed scaffold</span>
              <span className="route-path">/</span>
            </Link>
            <Link href="/events/sample-event">
              <span>Event detail scaffold</span>
              <span className="route-path">/events/[id]</span>
            </Link>
            <Link href="/sources">
              <span>Source directory scaffold</span>
              <span className="route-path">/sources</span>
            </Link>
            <Link href="/about">
              <span>Transparency scaffold</span>
              <span className="route-path">/about</span>
            </Link>
          </div>
        </article>

        <article className="panel">
          <h2>Admin surface</h2>
          <p>
            Admin routes exist now as distinct paths, but authn and authz are
            intentionally deferred to the dedicated admin phase.
          </p>
          <div className="route-list">
            <Link href="/admin/pipeline">
              <span>Pipeline overview scaffold</span>
              <span className="route-path">/admin/pipeline</span>
            </Link>
            <Link href="/admin/events/sample-event">
              <span>Event review scaffold</span>
              <span className="route-path">/admin/events/[id]</span>
            </Link>
            <Link href="/admin/sources">
              <span>Source controls scaffold</span>
              <span className="route-path">/admin/sources</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>Scaffold boundaries</h2>
        <ul>
          <li>No prototype runtime code was copied from the archived repo.</li>
          <li>Prisma is the only schema authority in this baseline.</li>
          <li>Gemini is the expected API-key provider shape, but no pipeline code exists yet.</li>
          <li>Source roster approval, ingestion, and clustering remain later-phase work.</li>
        </ul>
      </section>
    </main>
  );
}
