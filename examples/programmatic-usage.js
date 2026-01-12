/**
 * Example 4: Programmatic Usage
 * 
 * This example shows how to use the denylist functionality
 * programmatically in your code.
 */

// Note: Adjust the import path based on your project structure
// When run from the examples directory: require("../src/config")
// When integrated in your project: require("./src/config") or similar

const { isUrlDenylisted } = require("../src/config");

/**
 * Example function showing how to integrate denylist with caching
 */
async function fetchWithCache(url) {
  // Check if URL should be denied from caching
  if (isUrlDenylisted(url)) {
    console.log(`URL ${url} is in denylist, fetching without cache`);
    // Fetch directly without caching
    return await fetch(url);
  }

  // Check if URL is in cache
  const cached = checkCache(url);
  if (cached) {
    console.log(`URL ${url} found in cache`);
    return cached;
  }

  // Fetch and cache
  console.log(`URL ${url} not in cache, fetching and caching`);
  const response = await fetch(url);
  saveToCache(url, response);
  return response;
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

// Placeholder functions for the example
function checkCache(url) {
  // Implementation would check local cache
  return null;
}

function saveToCache(url, response) {
  // Implementation would save to local cache
}

// Export for use in other modules
module.exports = {
  fetchWithCache,
  testCustomPatterns,
};
