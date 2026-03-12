const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "ref",
  "ref_src",
  "spm",
  "ved",
  "yclid",
]);

const DISALLOWED_PROTOCOLS = new Set(["mailto:", "javascript:", "tel:"]);

export function normalizeUrl(input, baseUrl) {
  if (!input) {
    return null;
  }

  let url;

  try {
    url = new URL(input, baseUrl);
  } catch {
    return null;
  }

  if (DISALLOWED_PROTOCOLS.has(url.protocol)) {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  if (url.protocol === "http:" && url.hostname !== "localhost") {
    url.protocol = "https:";
  }

  url.hash = "";

  const nextParams = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.has(key) && !key.startsWith("utm_"))
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }

      return leftKey.localeCompare(rightKey);
    });

  url.search = "";

  for (const [key, value] of nextParams) {
    url.searchParams.append(key, value);
  }

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }

  return url.toString();
}

export function dedupeNormalizedUrls(urls, baseUrl) {
  const seen = new Set();
  const normalized = [];

  for (const rawUrl of urls) {
    const value = normalizeUrl(rawUrl, baseUrl);

    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}
