# proxy-server

🔨 Simple tool for pass requests via vanilla Node.js proxy server

## Features

* ✅ create a HTTP server, which proxy all requests
* ✅ support HTTPS protocol in passed URL
* ⛔ caching resource in local directory [#3](https://github.com/piecioshka/proxy-server/issues/3)
* ✅ check if resource is cached in local directory, and use it instead of making a request
* ⛔ support denylist of URLs which will be not cached

## Usage

```bash
npm run start -- --url URL --port PORT
```

## Development

```bash
npm run dev -- --url URL --port PORT
```
