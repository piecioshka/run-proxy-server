/**
 * Example 3: Multiple Patterns
 * 
 * This example demonstrates using multiple patterns in the denylist
 * to exclude different types of resources from caching.
 */

// Command line usage:
// npm run start -- --url https://example.com --port 8080 --denylist "*/api/*,*.json,*/admin/*,*.log"

// When caching is implemented, multiple types of URLs will be excluded:
// 
// 1. All API endpoints (*/api/*)
// Examples:
// - https://example.com/api/users
// - https://example.com/v1/api/posts
//
// 2. All JSON files (*.json)
// Examples:
// - https://example.com/data.json
// - https://example.com/config.json
//
// 3. All admin pages (*/admin/*)
// Examples:
// - https://example.com/admin/dashboard
// - https://example.com/secure/admin/settings
//
// 4. All log files (*.log)
// Examples:
// - https://example.com/error.log
// - https://example.com/access.log

// Examples of URLs that would still be cached:
// - https://example.com/index.html
// - https://example.com/public/page
// - https://example.com/data.xml
// - https://example.com/styles.css
