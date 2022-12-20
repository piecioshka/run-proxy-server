require("isomorphic-fetch");
const debug = require("debug");
const { APP_PORT, PROTOCOL } = require("./config");
const { createServer } = require("./createServer");
const { proxy } = require("./proxy");

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

    res.writeHead(response.status, newHeaders).end(body);
  } catch (err) {
    console.error(err);
  }
}

function main() {
  const server = createServer(PROTOCOL)(handleRequest);
  server.listen(APP_PORT, () => {
    console.log(`Server started on ${PROTOCOL}://localhost:${APP_PORT}`);
  });
}

main();
