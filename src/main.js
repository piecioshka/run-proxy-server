const debug = require("debug");
const {
  APP_PORT,
  PROTOCOL,
  HOST,
  IS_SETUP_HTTPS,
  IS_CACHE_ENABLED,
  IS_CLEAR_CACHE,
} = require("./config");
const { createServer } = require("./createServer");
const { proxy } = require("./proxy");
const { getCached, saveToCache, clearCache } = require("./cache");
const { setupHttps } = require("./setupHttps");

debug.enable("proxy:*");

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
    const url = `${PROTOCOL}://${HOST}${req.url}`;

    if (IS_CACHE_ENABLED) {
      // Check if the resource is cached
      const cached = getCached(url);
      if (cached) {
        console.debug(url, "- CACHED");
        res.writeHead(cached.status, cached.headers).end(cached.body);
        return;
      }
    }

    // Not cached, make the request
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

    if (IS_CACHE_ENABLED) {
      // Save to cache
      saveToCache(url, body, newHeaders, response.status);
    }

    res.writeHead(response.status, newHeaders).end(body);
  } catch (err) {
    console.error(err);
  }
}

function main() {
  if (IS_CLEAR_CACHE) {
    const removed = clearCache();
    if (removed) {
      process.stdout.write("Cache cleared.\n");
    } else {
      process.stdout.write("Cache is already empty.\n");
    }
    return;
  }

  if (IS_SETUP_HTTPS) {
    setupHttps();
    return;
  }

  try {
    const server = createServer(PROTOCOL)(handleRequest);
    server.listen(APP_PORT, () => {
      console.log(`Server was started at ${PROTOCOL}://localhost:${APP_PORT}`);
    });
  } catch (error) {
    if (error && error.code === "HTTPS_CERTS_MISSING") {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }

    throw error;
  }
}

module.exports = {
  main,
};
