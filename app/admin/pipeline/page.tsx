import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function getPipelineRuns() {
  try {
    return await prisma.pipelineRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  } catch {
    return [];
  }
}

export default async function AdminPipelinePage() {
  const runs = await getPipelineRuns();

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Admin route</p>
          <h1>Pipeline runs</h1>
          <p>
            Latest ingest and event-pipeline runs, including blocked reasons and
            publish counts.
          </p>
        </header>
        <section className="panel">
          {runs.length === 0 ? (
            <p>No pipeline runs are available yet.</p>
          ) : (
            <ul className="stack-list">
              {runs.map((run) => (
                <li key={run.id} className="stack-list__item">
                  <h2>
                    {run.runType} · {run.status}
                  </h2>
                  <p>
                    started: {run.startedAt?.toISOString() ?? "none"} · finished:{" "}
                    {run.finishedAt?.toISOString() ?? "none"}
                  </p>
                  <p>
                    sources: {run.sourceCount} · articles: {run.articleCount} · held events:{" "}
                    {run.heldEventCount} · published events: {run.publishedEventCount}
                  </p>
                  <p>
                    provider: {run.modelProvider ?? "n/a"} · model: {run.modelVersion ?? "n/a"}
                  </p>
                  <p>blocked reason: {run.blockedReason ?? "none"}</p>
                  <p>error summary: {run.errorSummary ?? "none"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Operator note</h2>
          <p>
            Public events now appear only through the publish-gated feed on <span className="mono">/</span> and
            event detail pages on <span className="mono">/events/[id]</span>.
          </p>
        </section>
      </section>
    </main>
  );
}
