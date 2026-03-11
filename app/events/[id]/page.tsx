type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Public route</p>
          <h1>Event scaffold</h1>
          <p>
            Event detail is reserved for comparison views only after the schema,
            ingestion, and publish gates are implemented.
          </p>
        </header>
        <section className="panel">
          <p>
            Event ID: <span className="mono">{id}</span>
          </p>
        </section>
      </section>
    </main>
  );
}
