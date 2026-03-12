import { extractArticleMetadata } from "./html-metadata.mjs";
import { dedupeNormalizedUrls, normalizeUrl } from "./url-normalize.mjs";

const SECTION_RULES = {
  "globes": {
    include: [/\/news\/article\.aspx/i],
    exclude: [/\/news\/home\.aspx/i, /\/news\/rss\.tag/i],
  },
  "kan-news": {
    include: [/\/content\/kan-news\//i],
    exclude: [/\/content\/kan-news\/radio\//i, /\/content\/kan-news\/podcasts\//i],
  },
  "davar": {
    include: [/\/\d+\/?$/i],
    exclude: [/\/writer\//i, /\/topic\//i, /\/daily\//i],
  },
  "kikar-hashabbat": {
    include: [/\/.+/],
    exclude: [/\/tags?\//i, /\/author\//i, /\/video/i, /\/category\//i],
  },
  "makan": {
    include: [/\/content\/news\/makan-news\//i],
    exclude: [/\/content\/news\/makan-news\/tags\//i],
  },
};

const DEFAULT_EXCLUDES = [
  /\/tag\//i,
  /\/tags\//i,
  /\/author\//i,
  /\/topic\//i,
  /\/search/i,
  /\/login/i,
  /\/account/i,
  /\.(jpg|jpeg|png|gif|svg|pdf)$/i,
];

export function extractLinksFromHtml(html, baseUrl) {
  const matches = html.matchAll(/href\s*=\s*("([^"]*)"|'([^']*)')/gi);
  const links = [];

  for (const match of matches) {
    const value = match[2] ?? match[3] ?? "";

    if (!value) {
      continue;
    }

    const normalized = normalizeUrl(value, baseUrl);

    if (normalized) {
      links.push(normalized);
    }
  }

  return dedupeNormalizedUrls(links, baseUrl);
}

function isCandidateArticleUrl(urlString, source) {
  const url = new URL(urlString);
  const sectionUrl = new URL(source.websiteUrl);
  const sameHost =
    url.hostname === sectionUrl.hostname || url.hostname.endsWith(`.${sectionUrl.hostname}`);

  if (!sameHost || urlString === normalizeUrl(source.websiteUrl)) {
    return false;
  }

  const matchTarget = `${url.pathname}${url.search}`;
  const rules = SECTION_RULES[source.slug] ?? { include: [/.+/], exclude: [] };

  if (DEFAULT_EXCLUDES.some((rule) => rule.test(matchTarget))) {
    return false;
  }

  if (rules.exclude.some((rule) => rule.test(matchTarget))) {
    return false;
  }

  return rules.include.some((rule) => rule.test(matchTarget));
}

export function collectSectionCandidates(html, source) {
  return extractLinksFromHtml(html, source.websiteUrl).filter((url) => isCandidateArticleUrl(url, source));
}

async function loadHtml(url, source, options) {
  if (options.loadHtmlImpl) {
    return options.loadHtmlImpl(url, source);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "he-IL,he;q=0.9,en;q=0.8,ar;q=0.7",
      "referer": source.websiteUrl,
    },
  });

  if (!response.ok) {
    throw new Error(`Section crawl failed with status ${response.status}`);
  }

  return response.text();
}

export async function discoverSectionArticles(source, options = {}) {
  const sectionLimit = options.sectionLimit ?? 6;
  const candidateLimit = options.candidateLimit ?? 30;
  const html = await loadHtml(source.websiteUrl, source, options);
  const candidates = collectSectionCandidates(html, source).slice(0, candidateLimit);
  const articles = [];

  for (const candidateUrl of candidates) {
    if (articles.length >= sectionLimit) {
      break;
    }

    try {
      const articleHtml = await loadHtml(candidateUrl, source, options);
      const metadata = extractArticleMetadata(articleHtml, candidateUrl);

      if (metadata.canonicalUrl && metadata.headline) {
        articles.push(metadata);
      }
    } catch {
      continue;
    }
  }

  return dedupeArticles(articles);
}

function dedupeArticles(articles) {
  const seen = new Set();
  const output = [];

  for (const article of articles) {
    if (!article.canonicalUrl || seen.has(article.canonicalUrl)) {
      continue;
    }

    seen.add(article.canonicalUrl);
    output.push(article);
  }

  return output;
}
