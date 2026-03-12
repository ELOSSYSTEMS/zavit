import { normalizeUrl } from "./url-normalize.mjs";

function parseAttributes(tag) {
  const attributes = {};
  const matches = tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g);

  for (const match of matches) {
    attributes[match[1].toLowerCase()] = match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripMarkup(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function collectMetaTags(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.map((tag) => parseAttributes(tag));
}

function collectLinkTags(html) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  return tags.map((tag) => parseAttributes(tag));
}

function pickMetaContent(metas, keys) {
  const normalized = keys.map((key) => key.toLowerCase());

  for (const meta of metas) {
    const name = meta.name?.toLowerCase();
    const property = meta.property?.toLowerCase();

    if ((name && normalized.includes(name)) || (property && normalized.includes(property))) {
      return meta.content?.trim() ?? null;
    }
  }

  return null;
}

function pickCanonicalUrl(html, metas, pageUrl) {
  const links = collectLinkTags(html);

  for (const link of links) {
    if (link.rel?.toLowerCase() === "canonical" && link.href) {
      return normalizeUrl(link.href, pageUrl);
    }
  }

  return normalizeUrl(
    pickMetaContent(metas, ["og:url"]) ?? pageUrl,
    pageUrl,
  );
}

export function extractArticleMetadata(html, pageUrl) {
  const metas = collectMetaTags(html);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const headline = stripMarkup(
    pickMetaContent(metas, ["og:title", "twitter:title"]) ?? titleMatch?.[1] ?? "",
  );

  const snippet = stripMarkup(
    pickMetaContent(metas, ["description", "og:description", "twitter:description"]) ?? "",
  );

  const publishedRaw = pickMetaContent(metas, [
    "article:published_time",
    "og:article:published_time",
    "pubdate",
    "date",
  ]);

  const publishedAt = publishedRaw ? new Date(publishedRaw) : null;

  return {
    canonicalUrl: pickCanonicalUrl(html, metas, pageUrl),
    rawUrl: pageUrl,
    headline: headline || null,
    snippet: snippet || null,
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toISOString() : null,
  };
}
