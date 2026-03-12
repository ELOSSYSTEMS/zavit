import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Public route</p>
          <h1>About scaffold</h1>
          <p>
            This route reserves the future transparency and product-posture page
            required by the contract lock.
          </p>
        </header>
        <section className="panel">
          <div className="badge-row">
            <span className="badge">Hebrew-first</span>
            <span className="badge">Event-centric</span>
            <span className="badge">No public angles in v1</span>
          </div>
          <p>
            Need to report a correction, publisher complaint, or suppression request?{" "}
            <Link href="/report">Open the report flow</Link>.
          </p>
        </section>
      </section>
    </main>
  );
}
