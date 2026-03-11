type AdminEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEventPage({
  params,
}: AdminEventPageProps) {
  const { id } = await params;

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Event review scaffold</h1>
          <p>
            This route reserves the future review surface for operator evidence,
            suppression, and correction workflows.
          </p>
        </header>
        <section className="panel">
          <p>
            Review target: <span className="mono">{id}</span>
          </p>
        </section>
      </section>
    </main>
  );
}
