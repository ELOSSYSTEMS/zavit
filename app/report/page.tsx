import Link from "next/link";

import {
  submitPublicReportAction,
  submitPublisherComplaintAction,
} from "@/app/report/actions";

export const dynamic = "force-dynamic";

type ReportPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    submitted?: string | string[];
    event?: string | string[];
    source?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusMessage(error: string | undefined, submitted: string | undefined) {
  if (submitted === "public") {
    return "Public correction or report submitted. It is now in the admin queue.";
  }

  if (submitted === "publisher") {
    return "Publisher complaint submitted. It is now in the admin queue.";
  }

  switch (error) {
    case "missing_details":
      return "Summary and details are required.";
    case "invalid_type":
      return "Choose a valid report type for the selected form.";
    case "missing_contact":
      return "Publisher complaints require a contact email.";
    default:
      return null;
  }
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = (await searchParams) ?? {};
  const selectedEvent = getSingleValue(params.event) ?? "";
  const selectedSource = getSingleValue(params.source) ?? "";
  const statusMessage = getStatusMessage(
    getSingleValue(params.error),
    getSingleValue(params.submitted),
  );

  return (
    <main className="shell">
      <section className="page-frame">
        <header className="page-header">
          <p className="eyebrow">Public route</p>
          <h1>Report a correction or complaint</h1>
          <p>
            Submit public corrections, broken-link reports, publisher complaints,
            or emergency suppression requests without exposing full article content.
          </p>
        </header>

        {statusMessage ? <section className="status-note">{statusMessage}</section> : null}

        <section className="card-grid">
          <section className="panel">
            <h2>Public correction or issue report</h2>
            <p>
              Use this for bad clustering, wrong-source attribution, or broken links.
            </p>
            <form action={submitPublicReportAction} className="field-grid">
              <input autoComplete="off" className="sr-only" name="website" tabIndex={-1} type="text" />
              <label className="field">
                <span>Report type</span>
                <select className="form-input" defaultValue="BAD_CLUSTER" name="reportType">
                  <option value="BAD_CLUSTER">Bad cluster</option>
                  <option value="WRONG_SOURCE">Wrong source</option>
                  <option value="BROKEN_LINK">Broken link</option>
                </select>
              </label>
              <label className="field">
                <span>Event ID (optional)</span>
                <input
                  className="form-input"
                  defaultValue={selectedEvent}
                  dir="ltr"
                  name="eventPublicId"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Source slug (optional)</span>
                <input
                  className="form-input"
                  defaultValue={selectedSource}
                  dir="ltr"
                  name="sourceSlug"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Contact email (optional)</span>
                <input
                  className="form-input"
                  dir="ltr"
                  name="contactEmail"
                  type="email"
                />
              </label>
              <label className="field">
                <span>Summary</span>
                <input className="form-input" name="summary" required type="text" />
              </label>
              <label className="field">
                <span>Details</span>
                <textarea className="form-input form-textarea" name="details" required rows={5} />
              </label>
              <button className="form-button" type="submit">
                Submit public report
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Publisher complaint or opt-out</h2>
            <p>
              Use this for publisher complaints, opt-out requests, or emergency suppression.
            </p>
            <form action={submitPublisherComplaintAction} className="field-grid">
              <input autoComplete="off" className="sr-only" name="website" tabIndex={-1} type="text" />
              <label className="field">
                <span>Complaint type</span>
                <select
                  className="form-input"
                  defaultValue="PUBLISHER_COMPLAINT"
                  name="reportType"
                >
                  <option value="PUBLISHER_COMPLAINT">Publisher complaint</option>
                  <option value="PUBLISHER_OPT_OUT">Publisher opt-out request</option>
                  <option value="EMERGENCY_SUPPRESSION">Emergency suppression request</option>
                </select>
              </label>
              <label className="field">
                <span>Event ID (optional)</span>
                <input
                  className="form-input"
                  defaultValue={selectedEvent}
                  dir="ltr"
                  name="eventPublicId"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Source slug (optional)</span>
                <input
                  className="form-input"
                  defaultValue={selectedSource}
                  dir="ltr"
                  name="sourceSlug"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Contact email</span>
                <input
                  className="form-input"
                  dir="ltr"
                  name="contactEmail"
                  required
                  type="email"
                />
              </label>
              <label className="field">
                <span>Summary</span>
                <input className="form-input" name="summary" required type="text" />
              </label>
              <label className="field">
                <span>Details</span>
                <textarea className="form-input form-textarea" name="details" required rows={5} />
              </label>
              <button className="form-button form-button--danger" type="submit">
                Submit publisher complaint
              </button>
            </form>
          </section>
        </section>

        <section className="panel">
          <h2>Notes</h2>
          <ul>
            <li>Submissions remain metadata-only in v1.</li>
            <li>Emergency suppression should include the event ID or source slug when known.</li>
            <li>
              <Link href="/about">Read the public product posture</Link>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
