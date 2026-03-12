import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type AdminSourceRow = {
  slug: string;
  displayName: string;
  ingestMethod: string;
  enabled: boolean;
  availabilityStatus: string;
  health: {
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
    consecutiveFailures: number;
    failureType: string | null;
  } | null;
};

async function getAdminSourceRows(): Promise<AdminSourceRow[]> {
  try {
    return (await prisma.source.findMany({
      orderBy: { displayName: "asc" },
      include: {
        health: true,
      },
    })) as AdminSourceRow[];
  } catch {
    return [];
  }
}

export default async function AdminSourcesPage() {
  const sources = await getAdminSourceRows();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Source health</h1>
          <p>
            Current ingest method, availability state, and latest health markers
            for the approved source roster.
          </p>
        </header>
        <section className="panel">
          {sources.length === 0 ? (
            <p>No source records are available yet. Run source sync and ingest first.</p>
          ) : (
            <ul className="stack-list">
              {sources.map((source) => (
                <li key={source.slug} className="stack-list__item">
                  <h2>{source.displayName}</h2>
                  <p>
                    {source.ingestMethod} · enabled: {String(source.enabled)} · availability:{" "}
                    {source.availabilityStatus}
                  </p>
                  <p>
                    last success: {source.health?.lastSuccessAt?.toISOString() ?? "none"} · last failure:{" "}
                    {source.health?.lastFailureAt?.toISOString() ?? "none"}
                  </p>
                  <p>
                    consecutive failures: {source.health?.consecutiveFailures ?? 0} · failure type:{" "}
                    {source.health?.failureType ?? "none"}
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
