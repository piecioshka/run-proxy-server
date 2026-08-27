const { describe, it, before, afterEach } = require("node:test");
const assert = require("node:assert");

// proxy.js pulls config, which requires a URL in argv on load.
function loadProxy() {
  process.argv = ["node", "run-proxy-server", "https://example.com"];
  delete require.cache[require.resolve("../src/config.js")];
  delete require.cache[require.resolve("../src/proxy.js")];
  return require("../src/proxy.js");
}

describe("proxy module", () => {
  let originalArgv;
  let originalFetch;

  before(() => {
    originalArgv = process.argv.slice();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    process.argv = originalArgv.slice();
    global.fetch = originalFetch;
    delete require.cache[require.resolve("../src/config.js")];
    delete require.cache[require.resolve("../src/proxy.js")];
  });

  it("exposes the hop-by-hop header set", () => {
    const { HOP_BY_HOP } = loadProxy();
    for (const name of ["connection", "transfer-encoding", "upgrade", "content-length"]) {
      assert.ok(HOP_BY_HOP.has(name), `${name} should be hop-by-hop`);
    }
  });

  it("strips hop-by-hop headers and forwards the request body", async () => {
    const { proxy } = loadProxy();
    let seen;
    global.fetch = async (url, opts) => {
      seen = { url, opts };
      return new Response("ok");
    };

    // Minimal IncomingMessage-like stream for a POST with a body.
    const { Readable } = require("node:stream");
    const req = Readable.from([Buffer.from("payload")]);
    req.method = "POST";
    req.url = "/submit";
    req.headers = {
      connection: "keep-alive",
      "transfer-encoding": "chunked",
      "content-type": "text/plain",
    };

    await proxy(req);

    assert.strictEqual(seen.url, "https://example.com/submit");
    assert.strictEqual(seen.opts.headers.connection, undefined);
    assert.strictEqual(seen.opts.headers["transfer-encoding"], undefined);
    assert.strictEqual(seen.opts.headers["content-type"], "text/plain");
    assert.ok(Buffer.isBuffer(seen.opts.body));
    assert.strictEqual(seen.opts.body.toString(), "payload");
    assert.ok(seen.opts.signal, "an abort signal (timeout) should be set");
  });

  it("does not read a body for GET requests", async () => {
    const { proxy } = loadProxy();
    let seen;
    global.fetch = async (url, opts) => {
      seen = opts;
      return new Response("ok");
    };
    const req = { method: "GET", url: "/", headers: {} };
    await proxy(req);
    assert.strictEqual(seen.body, undefined);
  });
});
