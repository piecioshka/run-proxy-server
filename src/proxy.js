const { URL, HOST, PROTOCOL } = require("./config");

// Upstream request timeout (ms); a hanging origin must not block a handler
// forever. Overridable via env for slow upstreams.
const REQUEST_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS) || 30000;

// Hop-by-hop headers are connection-specific and must not be forwarded
// (RFC 7230 6.1). content-length is recomputed from the (re-encoded) body.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

/**
 * Build the absolute upstream URL for an incoming request.
 * @param {import("http").IncomingMessage} req
 * @returns {string}
 */
function upstreamUrl(req) {
  return `${PROTOCOL}://${HOST}${req.url}`;
}

/**
 * Read the raw request body (for methods that carry one).
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<Buffer|undefined>}
 */
function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () =>
      resolve(chunks.length ? Buffer.concat(chunks) : undefined),
    );
    req.on("error", reject);
  });
}

async function proxy(req) {
  const requestHeaders = {
    ...req.headers,
    host: HOST,
    referer: URL.toString(),
    "sec-fetch-site": "same-origin",
  };
  delete requestHeaders["sec-fetch-user"];
  for (const name of HOP_BY_HOP) {
    delete requestHeaders[name];
  }

  const body = await readBody(req);

  return await fetch(upstreamUrl(req), {
    method: req.method,
    headers: requestHeaders,
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

module.exports = {
  proxy,
  upstreamUrl,
  HOP_BY_HOP,
};
