export default function AdminPipelinePage() {
  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Pipeline admin scaffold</h1>
          <p>
            This route exists to enforce public/admin separation from the first
            scaffold. It does not expose operational data yet.
          </p>
        </header>
        <section className="panel">
          <div className="badge-row">
            <span className="badge">Auth deferred</span>
            <span className="badge">Data deferred</span>
            <span className="badge">Route locked</span>
          </div>
        </section>
      </section>
    </main>
  );
}
