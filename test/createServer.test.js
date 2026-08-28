const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ORIGINAL_XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME;

function loadCreateServer(configHome) {
  if (configHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = configHome;
  }
  delete require.cache[require.resolve("../src/createServer.js")];
  return require("../src/createServer.js");
}

describe("createServer module", () => {
  afterEach(() => {
    if (ORIGINAL_XDG_CONFIG_HOME === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = ORIGINAL_XDG_CONFIG_HOME;
    }
    delete require.cache[require.resolve("../src/createServer.js")];
  });

  it("keeps certificates in the user config directory, not in the package", () => {
    const { CERTS_DIR } = loadCreateServer(undefined);
    const packageRoot = path.resolve(__dirname, "..");

    assert.ok(!CERTS_DIR.startsWith(packageRoot), CERTS_DIR);
    assert.strictEqual(
      CERTS_DIR,
      path.join(os.homedir(), ".config", "run-proxy-server", "certs"),
    );
  });

  it("honours XDG_CONFIG_HOME", () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "run-proxy-server-"));
    try {
      const { CERTS_DIR, CERT_KEY_PATH, CERT_PATH } = loadCreateServer(sandbox);
      assert.strictEqual(
        CERTS_DIR,
        path.join(sandbox, "run-proxy-server", "certs"),
      );
      assert.strictEqual(CERT_KEY_PATH, path.join(CERTS_DIR, "key.pem"));
      assert.strictEqual(CERT_PATH, path.join(CERTS_DIR, "cert.pem"));
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it("returns an http factory for http", () => {
    const { createServer } = loadCreateServer(undefined);
    const server = createServer("http")(() => {});
    assert.strictEqual(typeof server.listen, "function");
    server.close();
  });

  it("explains how to create missing https certificates", () => {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "run-proxy-server-"));
    try {
      const { createServer } = loadCreateServer(sandbox);
      assert.throws(
        () => createServer("https"),
        (error) => {
          assert.strictEqual(error.code, "HTTPS_CERTS_MISSING");
          assert.match(error.message, /--setup-https/);
          return true;
        },
      );
    } finally {
      fs.rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it("rejects unknown protocols", () => {
    const { createServer } = loadCreateServer(undefined);
    assert.throws(() => createServer("ftp"), /unsupported protocol=ftp/);
  });
});
