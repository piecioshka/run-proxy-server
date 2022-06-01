# Denylist Usage Examples

This directory contains examples demonstrating how to use the URL denylist feature in `run-proxy-server`.

## How to read these examples

- `basic-usage.js`, `api-exclusion.js`, `multiple-patterns.js`, and `cdn-exclusion.js` are explanation files with copy-paste command lines.
- `programmatic-usage.js` is a code example showing denylist + cache integration flow.
- You can run the commands from repository root.

## Examples

### 1. Basic Usage (`basic-usage.js`)

Simple example showing how to exclude JSON files from caching.

```bash
npm run start -- https://api.example.com --port 8080 --denylist "*.json"
```

### 2. API Endpoint Exclusion (`api-exclusion.js`)

Exclude all API endpoints while caching other resources.

```bash
npm run start -- https://example.com --port 8080 --denylist "*/api/*"
```

### 3. Multiple Patterns (`multiple-patterns.js`)

Use multiple patterns to exclude different types of resources.

```bash
npm run start -- https://example.com --port 8080 --denylist "*/api/*,*.json,*/admin/*,*.log"
```

### 4. Programmatic Usage (`programmatic-usage.js`)

Shows how to use the denylist functionality in your code when implementing caching.

```javascript
const { isUrlDenylisted } = require("../src/config");

if (!isUrlDenylisted(url)) {
  // Cache the resource
}
```

### 5. CDN Exclusion (`cdn-exclusion.js`)

Exclude resources from CDN domains that have their own caching.

```bash
npm run start -- https://example.com --port 8080 --denylist "https://cdn.example.com/*,https://static.example.com/*"
```

## Pattern Syntax

The denylist supports wildcard patterns:

- `*` matches any characters (including none)
- Patterns are matched against the full URL
- Multiple patterns are separated by commas

### Common Patterns

| Pattern                     | Description      | Matches                               |
| --------------------------- | ---------------- | ------------------------------------- |
| `*.json`                    | All JSON files   | `https://example.com/data.json`       |
| `*.xml`                     | All XML files    | `https://example.com/config.xml`      |
| `*/api/*`                   | All API paths    | `https://example.com/api/users`       |
| `*/admin/*`                 | All admin paths  | `https://example.com/admin/dashboard` |
| `https://cdn.example.com/*` | Specific domain  | `https://cdn.example.com/image.png`   |
| `*/private/*`               | Private sections | `https://example.com/private/data`    |

## Use Cases

### Dynamic Content

Exclude frequently changing content:

```bash
--denylist "*/api/*,*/feed/*,*/live/*"
```

### Sensitive Data

Exclude admin and user-specific content:

```bash
--denylist "*/admin/*,*/user/*,*/account/*"
```

### Data Files

Exclude data files that change often:

```bash
--denylist "*.json,*.xml,*.csv"
```

### External Resources

Exclude CDNs and third-party resources:

```bash
--denylist "https://cdn.*,https://static.*,https://assets.*"
```

## Integration with Caching

The denylist integrates with the built-in cache to:

1. Check each request URL before caching
2. Skip cache storage for denylisted URLs
3. Bypass cache lookup for denylisted URLs
4. Always fetch denylisted URLs fresh

Example integration:

```javascript
const { isUrlDenylisted } = require("../src/config");

async function handleRequest(url) {
  if (isUrlDenylisted(url)) {
    // Fetch without caching
    return await fetch(url);
  }

  // Check cache, fetch and store if needed
  return await fetchWithCache(url);
}
```
