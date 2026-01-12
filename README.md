# proxy-server

🔨 Simple tool for pass requests via vanilla Node.js proxy server

## Features

- ✅ create a HTTP server, which proxy all requests
- ✅ support HTTPS protocol in passed URL
- ⛔ caching resource in local directory [#3](https://github.com/piecioshka/proxy-server/issues/3)
- ⛔ check if resource is cached in local directory, and use it instead of make a request [#5](https://github.com/piecioshka/proxy-server/issues/5)
- ⛔ support denylist of URLs which will be not cached [#7](https://github.com/piecioshka/proxy-server/issues/7)

## Usage

```bash
npm run start -- --url URL --port PORT
```

## Development

```bash
npm run dev -- --url URL --port PORT
```
