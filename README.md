# proxy-server

🔨 Simple tool for pass requests via vanilla Node.js proxy server

## Features

- ✅ create a HTTP server, which proxy all requests
- ✅ support HTTPS protocol in passed URL
- ⛔ caching resource in local directory [#3](https://github.com/piecioshka/proxy-server/issues/3)
- ⛔ check if resource is cached in local directory, and use it instead of make a request [#5](https://github.com/piecioshka/proxy-server/issues/5)
- ✅ support denylist of URLs which will be not cached [#7](https://github.com/piecioshka/proxy-server/issues/7)

## Usage

```bash
npm run start -- --url URL --port PORT [--denylist PATTERNS]
```

### Options

- `--url` (required): The base URL to proxy requests to
- `--port` (optional): The port for the proxy server (default: 8000)
- `--denylist` (optional): Comma-separated list of URL patterns to exclude from caching. Supports wildcards (`*`). Example: `--denylist "*/api/*,*.json,https://example.com/admin/*"`

### Examples

```bash
# Start proxy server without denylist
npm run start -- --url https://example.com --port 8080

# Start proxy server with denylist
npm run start -- --url https://example.com --port 8080 --denylist "*/api/*,*.json"
```

## Development

```bash
npm run dev -- --url URL --port PORT [--denylist PATTERNS]
```
