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

## Testing

Run the unit tests:

```bash
npm test
```

The test suite includes comprehensive tests for the denylist functionality, covering:
- Pattern parsing and caching
- Wildcard matching (beginning, middle, end)
- Multiple patterns
- Special character escaping
- Performance optimizations

## Examples

See the [`examples/`](examples/) directory for detailed usage examples:

- **Basic Usage** - Simple denylist with JSON files
- **API Exclusion** - Exclude all API endpoints
- **Multiple Patterns** - Combine different exclusion rules
- **Programmatic Usage** - Integrate denylist in your code
- **CDN Exclusion** - Exclude CDN domains

For more details, see [examples/README.md](examples/README.md).
