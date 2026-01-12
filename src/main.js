require("isomorphic-fetch");
const debug = require("debug");
const { APP_PORT, PROTOCOL, URL, HOST } = require("./config");
const { createServer } = require("./createServer");
const { proxy } = require("./proxy");
const { isCached, loadFromCache, saveToCache, restoreBody } = require("./cache");

debug.enable("*");

const console = {
  log: debug("proxy:log"),
  debug: debug("proxy:debug"),
  error: debug("proxy:error"),
};

/**
 * @param {Response} response
 * @param {Record<string, string>} headers
 * @returns {Promise<string | Buffer>}
 */
async function getResponseBody(response, headers) {
  const type = headers["content-type"];
  if (new RegExp("image").test(type)) {
    return Buffer.from(await (await response.blob()).arrayBuffer());
  } else {
    return await response.text();
  }
}

async function handleRequest(req, res) {
  try {
    const fullUrl = `${PROTOCOL}://${HOST}${req.url}`;
    
    // Check if resource is cached
    if (isCached(fullUrl)) {
      const cached = await loadFromCache(fullUrl);
      if (cached) {
        const body = restoreBody(cached);
        const size = Buffer.byteLength(body);
        const type = cached.headers["content-type"];
        console.debug(fullUrl, "-", size, "-", type, "(cached)");
        const newHeaders = { ...cached.headers };

        delete newHeaders["content-encoding"];

        if (cached.headers["content-length"]) {
          newHeaders["content-length"] = String(size);
        }

        res.writeHead(cached.status, newHeaders).end(body);
        return;
      }
    }

    // Fetch from proxy if not cached
    const response = await proxy(req);
    const responseHeaders = Object.fromEntries(new Map(response.headers));
    const body = await getResponseBody(response, responseHeaders);
    const size = Buffer.byteLength(body);
    const type = responseHeaders["content-type"];
    console.debug(response.url, "-", size, "-", type);
    const newHeaders = { ...responseHeaders };

    delete newHeaders["content-encoding"];

    if (responseHeaders["content-length"]) {
      newHeaders["content-length"] = String(size);
    }

    // Save to cache (fire-and-forget)
    saveToCache(fullUrl, body, responseHeaders, response.status).catch(() => {
      // Silently ignore cache save errors
    });

    res.writeHead(response.status, newHeaders).end(body);
  } catch (err) {
    console.error(err);
  }
}

function main() {
  const server = createServer(PROTOCOL)(handleRequest);
  server.listen(APP_PORT, () => {
    console.log(`Server was started at ${PROTOCOL}://localhost:${APP_PORT}`);
  });
}

main();
