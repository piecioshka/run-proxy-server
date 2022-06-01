/**
 * Example 4: Programmatic Usage
 *
 * This example shows a minimal, realistic flow for:
 * 1) checking denylist rules,
 * 2) reading from cache,
 * 3) fetching fresh content,
 * 4) saving non-denylisted responses to cache.
 */

// Allow this example to run standalone without failing config argv validation.
const cliArgs = process.argv.slice(2);
const hasSetupFlag = cliArgs.includes("--setup-https");
const hasLegacyUrl = cliArgs.includes("--url");
const hasPositionalUrl = cliArgs.some((arg) => !arg.startsWith("--"));

if (!hasSetupFlag && !hasLegacyUrl && !hasPositionalUrl) {
  if (process.argv.length < 2) {
    process.argv.push("programmatic-usage.js");
  }
  process.argv.push("https://example.com");
}

const { isUrlDenylisted } = require("../src/config");
const { getCached, saveToCache } = require("../src/cache");

/**
 * Fetch URL with denylist-aware cache behavior.
 * @param {string} url
 * @returns {Promise<{ body: string, status: number, headers: Record<string, string>, source: "network" | "cache" }>}
 */
async function fetchWithCache(url) {
  // 1) Never read/write cache for denylisted URLs.
  if (isUrlDenylisted(url)) {
    const response = await fetch(url);
    const headers = Object.fromEntries(new Map(response.headers));
    const body = await response.text();
    return { body, status: response.status, headers, source: "network" };
  }

  // 2) Try cache first for cacheable URLs.
  const cached = checkCache(url);
  if (cached) {
    return { ...cached, source: "cache" };
  }

  // 3) Fetch and store in cache.
  const response = await fetch(url);
  const headers = Object.fromEntries(new Map(response.headers));
  const body = await response.text();

  saveToCache(url, body, headers, response.status);

  return { body, status: response.status, headers, source: "network" };
}

/**
 * Example: Testing URLs against custom patterns
 */
function testCustomPatterns() {
  const testUrls = [
    "https://api.example.com/users",
    "https://example.com/data.json",
    "https://example.com/page.html",
  ];

  const customPatterns = ["*/api/*", "*.json"];

  console.log("Testing URLs against custom patterns:");
  testUrls.forEach((url) => {
    const isDenied = isUrlDenylisted(url, customPatterns);
    console.log(`${url}: ${isDenied ? "DENIED" : "ALLOWED"}`);
  });
}

function checkCache(url) {
  return getCached(url);
}

// Export for use in other modules
module.exports = {
  fetchWithCache,
  testCustomPatterns,
};
