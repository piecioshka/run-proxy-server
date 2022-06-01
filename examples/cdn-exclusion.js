/**
 * Example 5: CDN and External Resource Exclusion
 *
 * This example shows how to exclude resources from specific domains
 * like CDNs that have their own caching mechanisms.
 */

// Command line usage:
// npm run start -- https://example.com --port 8080 --denylist "https://cdn.example.com/*,https://static.example.com/*"

// In this project, resources from CDN domains will not be cached locally
// This is useful because:
// 1. CDNs already have their own caching and optimization
// 2. CDN resources are often faster to fetch directly
// 3. Reduces local cache size for resources that are well-cached elsewhere

// Examples of URLs that would be denied:
// - https://cdn.example.com/images/logo.png
// - https://cdn.example.com/js/bundle.min.js
// - https://static.example.com/css/styles.css
// - https://static.example.com/fonts/roboto.woff2

// Examples of URLs that would be cached:
// - https://example.com/images/profile.jpg
// - https://example.com/assets/local-script.js
// - https://example.com/page.html
