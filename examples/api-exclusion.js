/**
 * Example 2: API Endpoint Exclusion
 *
 * This example shows how to exclude all API endpoints from caching
 * while allowing other resources to be cached.
 */

// Command line usage:
// npm run start -- https://example.com --port 8080 --denylist "*/api/*"

// In this project, all URLs containing /api/ in the path will not be cached
// Examples of URLs that would be denied:
// - https://example.com/api/users
// - https://example.com/api/v1/posts
// - https://example.com/api/v2/products
// - https://example.com/v1/api/data

// Examples of URLs that would be cached:
// - https://example.com/index.html
// - https://example.com/static/logo.png
// - https://example.com/public/page
// - https://example.com/about
