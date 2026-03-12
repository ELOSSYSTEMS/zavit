import {
  listPublicSources,
  type PublicSourceRecord,
} from "@/lib/server/repos/public";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await listPublicSources();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Public route</p>
          <h1>Source directory</h1>
          <p>
            Neutral source metadata and current availability state from the
            approved roster.
          </p>
        </header>
        <section className="panel">
          {sources.length === 0 ? (
            <p>No source records are available yet. Run source sync and ingest first.</p>
          ) : (
            <ul className="stack-list">
              {sources.map((source: PublicSourceRecord) => (
                <li key={source.slug} className="stack-list__item">
                  <h2>{source.displayName}</h2>
                  <p>
                    {source.editorialType} · {source.primaryLanguage} · {source.paywallStatus}
                  </p>
                  <p>Availability: {source.availabilityStatus}</p>
                  <p>
                    <a href={source.websiteUrl} target="_blank" rel="noreferrer">
                      {source.websiteUrl}
                    </a>
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
