import { readFileSync } from "node:fs";
import path from "node:path";

const rosterPath = path.resolve(process.cwd(), "lib/sources/approved-roster.json");

export function loadApprovedRoster() {
  const raw = readFileSync(rosterPath, "utf8");
  return JSON.parse(raw);
}

export function getRosterSourceBySlug(slug) {
  const roster = loadApprovedRoster();
  return roster.sources.find((source) => source.slug === slug) ?? null;
}

export function mapRosterSourceToSourceRecord(source) {
  return {
    slug: source.slug,
    displayName: source.displayName,
    canonicalDomain: source.canonicalDomain,
    editorialBrand: source.editorialBrand,
    ownershipName: source.ownershipName,
    ownershipType: source.ownershipType,
    editorialType: source.editorialType,
    localityScope: source.localityScope,
    primaryLanguage: source.primaryLanguage,
    paywallStatus: source.paywallStatus,
    availabilityStatus: source.availabilityStatus,
    enabled: source.enabled,
    sourcePolicyNotes: source.sourcePolicyNotes,
    independenceNotes: source.independenceNotes,
    ingestMethod: source.ingestMethod,
    feedUrl: source.feedUrl,
    websiteUrl: source.websiteUrl,
  };
}
