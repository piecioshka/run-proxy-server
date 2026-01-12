# proxy-server

🔨 Simple tool for pass requests via vanilla Node.js proxy server

## Features

- ✅ create a HTTP server, which proxy all requests
- ✅ support HTTPS protocol in passed URL
- ✅ caching resource in local directory [#3](https://github.com/piecioshka/proxy-server/issues/3)
- ✅ check if resource is cached in local directory, and use it instead of make a request [#5](https://github.com/piecioshka/proxy-server/issues/5)
- ⛔ support denylist of URLs which will be not cached [#7](https://github.com/piecioshka/proxy-server/issues/7)

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Start the proxy server by providing a target URL and an optional port:

```bash
npm run start -- --url https://example.com --port 8000
```

**Parameters:**
- `--url` (required): The target URL to proxy requests to
- `--port` (optional): The port to run the proxy server on (default: 8000)

### Examples

**Example 1: Proxy HTTP requests**

```bash
npm run start -- --url http://api.example.com --port 3000
```

Then access the proxy at `http://localhost:3000/path/to/resource`

**Example 2: Proxy HTTPS requests**

```bash
npm run start -- --url https://secure-api.example.com
```

Access at `http://localhost:8000` (default port)

**Example 3: Caching in action**

```bash
# Start the proxy server
npm run start -- --url https://httpbin.org --port 8080

# First request (proxied and cached)
curl http://localhost:8080/json
# Response time: ~500ms

# Second request (served from cache)
curl http://localhost:8080/json
# Response time: ~5ms (much faster!)
```

The proxy server automatically caches all responses in the `.cache` directory. Subsequent requests for the same resource will be served from cache, significantly improving response times.

### Caching Behavior

- **Automatic caching**: All proxied resources are automatically cached in `.cache/` directory
- **Cache key**: Uses SHA-256 hash of the full URL (including query parameters)
- **Supported content**: Both text (HTML, JSON, CSS, JS) and binary (images, PDFs, etc.)
- **Cache location**: `.cache/` directory in the project root
- **Cache format**: JSON files with metadata (headers, status, timestamp)

To clear the cache, simply delete the `.cache` directory:

```bash
rm -rf .cache
```

## Development

Run the server in development mode with auto-reload on file changes:

```bash
npm run dev -- --url URL --port PORT
```

## Testing

Run the unit tests:

```bash
npm test
```
