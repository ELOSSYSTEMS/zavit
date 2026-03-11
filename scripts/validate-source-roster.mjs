import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rosterPath = resolve(process.cwd(), 'lib/sources/approved-roster.json');
const raw = readFileSync(rosterPath, 'utf8');
const roster = JSON.parse(raw);

const allowedOwnershipTypes = new Set(['PRIVATE', 'PUBLIC', 'NGO', 'RELIGIOUS', 'UNKNOWN']);
const allowedEditorialTypes = new Set([
  'GENERAL_NEWS',
  'BROADCAST',
  'BUSINESS',
  'RELIGIOUS',
  'COMMUNITY',
  'PUBLIC_SERVICE',
  'OTHER',
]);
const allowedLocalityScopes = new Set(['NATIONAL', 'REGIONAL', 'LOCAL', 'INTERNATIONAL']);
const allowedLanguages = new Set(['HEBREW', 'ENGLISH', 'ARABIC']);
const allowedPaywallStatuses = new Set(['FREE', 'PARTIAL', 'FULL', 'UNKNOWN']);
const allowedAvailabilityStatuses = new Set(['ACTIVE', 'DEGRADED', 'TEMPORARILY_UNAVAILABLE', 'DISABLED']);
const allowedIngestMethods = new Set(['RSS', 'SITEMAP', 'SECTION_CRAWL', 'MANUAL']);
const allowedSeedKinds = new Set(['RSS', 'SITEMAP', 'SECTION_CRAWL', 'MANUAL']);
const requiredCoverageBuckets = new Set([
  'MAINSTREAM_HEBREW',
  'PUBLIC_BROADCAST',
  'BUSINESS',
  'RELIGIOUS_HAREDI',
  'ARAB_COMMUNITY',
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEnum(value, allowed, label, slug) {
  assert(allowed.has(value), `${slug}: invalid ${label} "${value}"`);
}

function assertString(value, label, slug) {
  assert(typeof value === 'string' && value.trim().length > 0, `${slug}: missing ${label}`);
}

function assertUrl(value, label, slug) {
  assertString(value, label, slug);
  new URL(value);
}

assert(Array.isArray(roster.sources), 'sources must be an array');
assert(roster.sources.length === 12, `expected 12 approved sources, found ${roster.sources.length}`);
assert(roster.sourceCount === roster.sources.length, 'sourceCount must match sources length');

const seen = {
  slug: new Set(),
  displayName: new Set(),
  canonicalDomain: new Set(),
  websiteUrl: new Set(),
  seedUrl: new Set(),
};
const coverageSeen = new Set();

for (const source of roster.sources) {
  const { slug } = source;

  assertString(slug, 'slug', '(unknown)');
  assert(!seen.slug.has(slug), `${slug}: duplicate slug`);
  seen.slug.add(slug);

  assertString(source.displayName, 'displayName', slug);
  assert(!seen.displayName.has(source.displayName), `${slug}: duplicate displayName "${source.displayName}"`);
  seen.displayName.add(source.displayName);

  assertString(source.coverageBucket, 'coverageBucket', slug);
  coverageSeen.add(source.coverageBucket);

  assertString(source.canonicalDomain, 'canonicalDomain', slug);
  assert(!seen.canonicalDomain.has(source.canonicalDomain), `${slug}: duplicate canonicalDomain "${source.canonicalDomain}"`);
  seen.canonicalDomain.add(source.canonicalDomain);

  assertString(source.editorialBrand, 'editorialBrand', slug);
  assertString(source.ownershipName, 'ownershipName', slug);
  assertEnum(source.ownershipType, allowedOwnershipTypes, 'ownershipType', slug);
  assertEnum(source.editorialType, allowedEditorialTypes, 'editorialType', slug);
  assertEnum(source.localityScope, allowedLocalityScopes, 'localityScope', slug);
  assertEnum(source.primaryLanguage, allowedLanguages, 'primaryLanguage', slug);
  assertEnum(source.paywallStatus, allowedPaywallStatuses, 'paywallStatus', slug);
  assertEnum(source.availabilityStatus, allowedAvailabilityStatuses, 'availabilityStatus', slug);
  assert(typeof source.enabled === 'boolean', `${slug}: enabled must be boolean`);
  assertEnum(source.ingestMethod, allowedIngestMethods, 'ingestMethod', slug);
  assertUrl(source.websiteUrl, 'websiteUrl', slug);
  assert(!seen.websiteUrl.has(source.websiteUrl), `${slug}: duplicate websiteUrl "${source.websiteUrl}"`);
  seen.websiteUrl.add(source.websiteUrl);
  assertString(source.independenceGroup, 'independenceGroup', slug);
  assertString(source.sourcePolicyNotes, 'sourcePolicyNotes', slug);
  assertString(source.independenceNotes, 'independenceNotes', slug);
  assert(source.seedInput && typeof source.seedInput === 'object', `${slug}: missing seedInput`);
  assertEnum(source.seedInput.kind, allowedSeedKinds, 'seedInput.kind', slug);
  assertUrl(source.seedInput.url, 'seedInput.url', slug);
  assert(!seen.seedUrl.has(source.seedInput.url), `${slug}: duplicate seedInput.url "${source.seedInput.url}"`);
  seen.seedUrl.add(source.seedInput.url);

  if (source.ingestMethod === 'RSS') {
    assertUrl(source.feedUrl, 'feedUrl', slug);
    assert(source.seedInput.kind === 'RSS', `${slug}: RSS ingestMethod must use RSS seedInput.kind`);
    assert(source.seedInput.url === source.feedUrl, `${slug}: RSS seedInput.url must match feedUrl`);
  } else {
    assert(source.feedUrl === null, `${slug}: non-RSS source must use null feedUrl`);
    assert(source.seedInput.kind === source.ingestMethod, `${slug}: seedInput.kind must match ingestMethod for non-RSS sources`);
  }
}

for (const requiredBucket of requiredCoverageBuckets) {
  assert(coverageSeen.has(requiredBucket), `missing required coverage bucket "${requiredBucket}"`);
}

console.log(`Validated ${roster.sources.length} approved sources from ${rosterPath}`);
