import { normalizeUrl } from "./url-normalize.mjs";

function stripCdata(value) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
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

export function stripMarkup(value) {
  return decodeEntities(stripCdata(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1].trim() : null;
}

function extractAtomLink(block) {
  const match = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return match ? match[1].trim() : null;
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(stripMarkup(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function parseFeedItems(xml, baseUrl) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];

  return blocks
    .map((block) => {
      const rawLink = extractTag(block, "link") ?? extractAtomLink(block);
      const canonicalUrl = normalizeUrl(stripMarkup(rawLink ?? ""), baseUrl);

      if (!canonicalUrl) {
        return null;
      }

      const title = stripMarkup(extractTag(block, "title") ?? "");
      const snippet = stripMarkup(
        extractTag(block, "description") ??
          extractTag(block, "summary") ??
          extractTag(block, "content") ??
          "",
      );

      if (!title) {
        return null;
      }

      return {
        canonicalUrl,
        rawUrl: stripMarkup(rawLink ?? canonicalUrl),
        headline: title,
        snippet: snippet || null,
        publishedAt: toIsoDate(
          extractTag(block, "pubDate") ?? extractTag(block, "published") ?? extractTag(block, "updated"),
        ),
      };
    })
    .filter(Boolean);
}
