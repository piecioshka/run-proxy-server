const { describe, it, before, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Readable } = require("node:stream");

// main.js pulls config (needs a URL in argv) and cache (resolves its directory
// on load), so both are redirected before the module is required.
const ORIGINAL_XDG_CACHE_HOME = process.env.XDG_CACHE_HOME;
const SANDBOX = fs.mkdtempSync(
  path.join(os.tmpdir(), "run-proxy-server-main-"),
);
process.env.XDG_CACHE_HOME = SANDBOX;
process.on("exit", () => {
  if (ORIGINAL_XDG_CACHE_HOME === undefined) {
    delete process.env.XDG_CACHE_HOME;
  } else {
    process.env.XDG_CACHE_HOME = ORIGINAL_XDG_CACHE_HOME;
  }
  fs.rmSync(SANDBOX, { recursive: true, force: true });
});

const MODULES = [
  "../src/config.js",
  "../src/proxy.js",
  "../src/cache.js",
  "../src/main.js",
];

function loadMain(argv = ["https://example.com"]) {
  process.argv = ["node", "run-proxy-server", ...argv];
  for (const name of MODULES) {
    delete require.cache[require.resolve(name)];
  }
  return require("../src/main.js");
}

/** Minimal IncomingMessage stand-in. */
function makeReq({ method = "GET", url = "/res", headers = {}, body } = {}) {
  const req =
    body === undefined ? Readable.from([]) : Readable.from([Buffer.from(body)]);
  req.method = method;
  req.url = url;
  req.headers = headers;
  return req;
}

/** Minimal ServerResponse stand-in that records what was written. */
function makeRes() {
  const res = {
    headersSent: false,
    status: null,
    headers: null,
    body: null,
    writeHead(status, headers) {
      res.headersSent = true;
      res.status = status;
      res.headers = headers;
      return res;
    },
    end(body) {
      res.body = body;
      res.done = new Promise((resolve) => resolve());
      return res;
    },
  };
  return res;
}

describe("main module - handleRequest", () => {
  let originalArgv;
  let originalFetch;
  let upstreamCalls;

  before(() => {
    originalArgv = process.argv.slice();
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    fs.rmSync(path.join(SANDBOX, "run-proxy-server"), {
      recursive: true,
      force: true,
    });
    upstreamCalls = [];
  });

  afterEach(() => {
    process.argv = originalArgv.slice();
    global.fetch = originalFetch;
    for (const name of MODULES) {
      delete require.cache[require.resolve(name)];
    }
  });

  function stubUpstream(factory) {
    global.fetch = async (url, opts) => {
      upstreamCalls.push({ url, opts });
      return factory(url, opts);
    };
  }

  const textResponse = (text, headers = {}) =>
    new Response(text, {
      status: 200,
      headers: { "content-type": "text/plain", ...headers },
    });

  it("serves a repeated GET from cache", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(() => textResponse("hello"));

    const first = makeRes();
    await handleRequest(makeReq(), first);
    const second = makeRes();
    await handleRequest(makeReq(), second);

    assert.strictEqual(upstreamCalls.length, 1);
    assert.strictEqual(String(first.body), "hello");
    assert.strictEqual(String(second.body), "hello");
    assert.strictEqual(second.headers["content-length"], "5");
  });

  it("does not let a HEAD response poison the cache for GET", async () => {
    const { handleRequest } = loadMain();
    stubUpstream((url, opts) =>
      opts.method === "HEAD" ? textResponse("") : textResponse("full"),
    );

    await handleRequest(makeReq({ method: "HEAD" }), makeRes());
    const res = makeRes();
    await handleRequest(makeReq({ method: "GET" }), res);

    assert.strictEqual(upstreamCalls.length, 2);
    assert.strictEqual(String(res.body), "full");
  });

  it("never caches POST requests", async () => {
    const { handleRequest } = loadMain();
    let counter = 0;
    stubUpstream(() => textResponse(`post-${++counter}`));

    const first = makeRes();
    await handleRequest(makeReq({ method: "POST", body: "a" }), first);
    const second = makeRes();
    await handleRequest(makeReq({ method: "POST", body: "b" }), second);

    assert.strictEqual(upstreamCalls.length, 2);
    assert.strictEqual(String(first.body), "post-1");
    assert.strictEqual(String(second.body), "post-2");
  });

  it("does not cache a response that sets a cookie", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(() =>
      textResponse("private", { "set-cookie": "session=secret" }),
    );

    await handleRequest(makeReq(), makeRes());
    await handleRequest(makeReq(), makeRes());

    assert.strictEqual(upstreamCalls.length, 2);
  });

  for (const directive of ["no-store", "private", "max-age=0, no-store"]) {
    it(`does not cache a response with cache-control: ${directive}`, async () => {
      const { handleRequest } = loadMain();
      stubUpstream(() => textResponse("x", { "cache-control": directive }));

      await handleRequest(makeReq(), makeRes());
      await handleRequest(makeReq(), makeRes());

      assert.strictEqual(upstreamCalls.length, 2);
    });
  }

  it("does not cache a response to an authorized request", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(() => textResponse("secret"));
    const headers = { authorization: "Bearer token" };

    await handleRequest(makeReq({ headers }), makeRes());
    await handleRequest(makeReq({ headers }), makeRes());

    assert.strictEqual(upstreamCalls.length, 2);
  });

  it("does not cache server errors", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(
      () =>
        new Response("boom", {
          status: 503,
          headers: { "content-type": "text/plain" },
        }),
    );

    const first = makeRes();
    await handleRequest(makeReq(), first);
    await handleRequest(makeReq(), makeRes());

    assert.strictEqual(first.status, 503);
    assert.strictEqual(upstreamCalls.length, 2);
  });

  it("respects --no-cache", async () => {
    const { handleRequest } = loadMain(["https://example.com", "--no-cache"]);
    stubUpstream(() => textResponse("fresh"));

    await handleRequest(makeReq(), makeRes());
    await handleRequest(makeReq(), makeRes());

    assert.strictEqual(upstreamCalls.length, 2);
  });

  it("keeps binary bodies intact and strips content-encoding", async () => {
    const { handleRequest } = loadMain();
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
    stubUpstream(
      () =>
        new Response(bytes, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "content-encoding": "gzip",
            "transfer-encoding": "chunked",
          },
        }),
    );

    const first = makeRes();
    await handleRequest(makeReq({ url: "/img.png" }), first);
    const second = makeRes();
    await handleRequest(makeReq({ url: "/img.png" }), second);

    for (const res of [first, second]) {
      assert.ok(Buffer.isBuffer(res.body));
      assert.deepStrictEqual(res.body, bytes);
      assert.strictEqual(res.headers["content-encoding"], undefined);
      assert.strictEqual(res.headers["transfer-encoding"], undefined);
      assert.strictEqual(res.headers["content-length"], "6");
    }
  });

  it("answers 502 when the upstream request fails", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(() => {
      throw new TypeError("fetch failed");
    });

    const res = makeRes();
    await handleRequest(makeReq(), res);

    assert.strictEqual(res.status, 502);
    assert.match(String(res.body), /fetch failed/);
  });

  it("answers 504 when the upstream request times out", async () => {
    const { handleRequest } = loadMain();
    stubUpstream(() => {
      const error = new Error("The operation was aborted due to timeout");
      error.name = "TimeoutError";
      throw error;
    });

    const res = makeRes();
    await handleRequest(makeReq(), res);

    assert.strictEqual(res.status, 504);
  });
});
