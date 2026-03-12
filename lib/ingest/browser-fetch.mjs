import { chromium } from "playwright-core";

const BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

function resolveExecutablePath() {
  const match = BROWSER_CANDIDATES.find((candidate) => {
    try {
      return Boolean(process.getBuiltinModule("fs").existsSync(candidate));
    } catch {
      return false;
    }
  });

  if (!match) {
    throw new Error("No supported local browser executable was found for browser-based ingest fallback.");
  }

  return match;
}

export async function loadPageHtml(url) {
  const browser = await chromium.launch({
    executablePath: resolveExecutablePath(),
    headless: true,
  });

  try {
    const context = await browser.newContext({
      locale: "he-IL",
      userAgent: DEFAULT_USER_AGENT,
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const html = await page.content();

    await context.close();

    return html;
  } finally {
    await browser.close();
  }
}
