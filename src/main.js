const debug = require("debug");
const {
  APP_HOST,
  APP_PORT,
  PROTOCOL,
  IS_SETUP_HTTPS,
  IS_CACHE_ENABLED,
  IS_CLEAR_CACHE,
  isUrlDenylisted,
} = require("./config");
const { createServer } = require("./createServer");
const { proxy, upstreamUrl, HOP_BY_HOP } = require("./proxy");
const { getCached, saveToCache, clearCache } = require("./cache");
const { setupHttps } = require("./setupHttps");

// Let an explicit DEBUG selection win; otherwise show the proxy's own logs.
if (!process.env.DEBUG) {
  debug.enable("proxy:*");
}

const console = {
  log: debug("proxy:log"),
  debug: debug("proxy:debug"),
  error: debug("proxy:error"),
};

// A response is treated as binary (kept as a Buffer, not re-encoded as text)
// unless its type is a known textual one. Guards against corrupting PDFs,
// fonts, octet-streams and images that lack a matching content-type.
function isTextualType(type) {
  const value = (type ?? "").toLowerCase();
  return (
    value.startsWith("text/") ||
    value.includes("json") ||
    value.includes("xml") ||
    value.includes("javascript") ||
    value.includes("+text")
  );
}

/**
 * @param {Response} response
 * @param {Record<string, string>} headers
 * @returns {Promise<string | Buffer>}
 */
async function getResponseBody(response, headers) {
  if (isTextualType(headers["content-type"])) {
    return await response.text();
  }
  return Buffer.from(await (await response.blob()).arrayBuffer());
}

/**
 * The cache is keyed by URL alone, so only GET responses may enter it: a HEAD
 * (empty body) or a POST (body depends on the payload) stored under the same
 * key would be replayed to every later GET.
 * @param {import("http").IncomingMessage} req
 * @param {string} url
 * @returns {boolean}
 */
function isRequestCacheable(req, url) {
  return (
    IS_CACHE_ENABLED &&
    req.method === "GET" &&
    !req.headers.authorization &&
    !isUrlDenylisted(url)
  );
}

/**
 * Whether an upstream response may be stored and replayed to other clients.
 * Responses that set cookies or declare themselves private/no-store belong to
 * a single user; server errors are transient.
 * @param {Response} response
 * @param {Record<string, string>} headers
 * @returns {boolean}
 */
function isResponseCacheable(response, headers) {
  if (response.status >= 500) {
    return false;
  }
  if (headers["set-cookie"] !== undefined) {
    return false;
  }
  const cacheControl = (headers["cache-control"] ?? "").toLowerCase();
  return !/\b(no-store|private)\b/.test(cacheControl);
}

async function handleRequest(req, res) {
  const url = upstreamUrl(req);
  try {
    const cacheable = isRequestCacheable(req, url);

    if (cacheable) {
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

    // Strip content-encoding (body is already decoded) and every hop-by-hop
    // header (including transfer-encoding, which would conflict with a full
    // body), then set an accurate content-length.
    const newHeaders = { ...responseHeaders };
    delete newHeaders["content-encoding"];
    for (const name of HOP_BY_HOP) {
      delete newHeaders[name];
    }
    newHeaders["content-length"] = String(size);

    if (cacheable && isResponseCacheable(response, newHeaders)) {
      saveToCache(url, body, newHeaders, response.status);
    }

    res.writeHead(response.status, newHeaders).end(body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      const status = err && err.name === "TimeoutError" ? 504 : 502;
      res.writeHead(status, { "content-type": "text/plain" });
      res.end(
        `Proxy error: ${err && err.message ? err.message : "upstream request failed"}\n`,
      );
    } else {
      res.end();
    }
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
    server.listen(APP_PORT, APP_HOST, () => {
      console.log(
        `Server was started at ${PROTOCOL}://${APP_HOST}:${APP_PORT}`,
      );
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
  handleRequest,
};
