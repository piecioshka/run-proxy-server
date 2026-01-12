# proxy-server

🔨 Simple tool for pass requests via vanilla Node.js proxy server

## Features

- ✅ create a HTTP server, which proxy all requests
- ✅ support HTTPS protocol in passed URL
- ✅ caching resource in local directory [#3](https://github.com/piecioshka/proxy-server/issues/3)
- ✅ check if resource is cached in local directory, and use it instead of make a request [#5](https://github.com/piecioshka/proxy-server/issues/5)
- ✅ support denylist of URLs which will be not cached [#7](https://github.com/piecioshka/proxy-server/issues/7)

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Start the proxy server with a target URL and port:

```bash
npm run start -- --url URL --port PORT [--denylist PATTERNS]
```

Then make requests to the proxy server:

```bash
curl http://localhost:8000/
```

The first request will fetch from the target URL and cache the response. Subsequent requests will be served from the cache.

### Options

- `--url` (required): The base URL to proxy requests to
- `--port` (optional): The port for the proxy server (default: 8000)
- `--denylist` (optional): Comma-separated list of URL patterns to exclude from caching. Supports wildcards (`*`). Example: `--denylist "*/api/*,*.json,https://example.com/admin/*"`

### Usage Examples

#### Example 1: Proxying a website

```bash
# Start the proxy server
npm run start -- --url https://jsonplaceholder.typicode.com --port 8000

# Make a request (will proxy and cache)
curl http://localhost:8000/posts/1

# Make the same request again (will be served from cache)
curl http://localhost:8000/posts/1
```

#### Example 2: Proxying API endpoints

```bash
# Proxy an API server
npm run start -- --url https://api.github.com --port 8000

# First request - proxied and cached
curl http://localhost:8000/users/octocat

# Second request - served from cache (faster, no network call)
curl http://localhost:8000/users/octocat
```

#### Example 3: Proxying with denylist

```bash
# Start proxy server with denylist to exclude dynamic API endpoints
npm run start -- --url https://example.com --port 8080 --denylist "*/api/*,*.json"

# API requests won't be cached (always fresh)
curl http://localhost:8080/api/users

# Static content will be cached
curl http://localhost:8080/index.html
```

#### Example 4: Proxying static assets

```bash
# Proxy a CDN
npm run start -- --url https://cdn.example.com --port 8000

# Request images, CSS, JS - all cached after first request
curl http://localhost:8000/styles.css
curl http://localhost:8000/logo.png
curl http://localhost:8000/app.js
```

### Cache Behavior

- **First request**: Proxied to the target URL and cached locally
- **Subsequent requests**: Served from the `.cache` directory
- **Cache location**: `.cache/` directory in the project root
- **Cache key**: MD5 hash of the full URL
- **Cached data**: Response body, headers, and status code
- **Denylist**: URLs matching denylist patterns are never cached

To clear the cache, simply delete the `.cache` directory:

```bash
rm -rf .cache
```

## Development

Run with auto-reload on file changes:

```bash
npm run dev -- --url URL --port PORT [--denylist PATTERNS]
```

## Testing

Run the unit tests:

```bash
npm test
```

The test suite includes comprehensive tests for:
- **Denylist functionality**: Pattern parsing, wildcard matching, caching
- **Cache operations**: Text content, binary content, cache key generation
- **Error handling**: Corrupt cache files, status code preservation

## Denylist Examples

See the [`examples/`](examples/) directory for detailed usage examples:

- **Basic Usage** - Simple denylist with JSON files
- **API Exclusion** - Exclude all API endpoints
- **Multiple Patterns** - Combine different exclusion rules
- **Programmatic Usage** - Integrate denylist in your code
- **CDN Exclusion** - Exclude CDN domains

For more details, see [examples/README.md](examples/README.md).
