const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

// The cache directory is resolved when the module loads, so it has to be
// redirected before the require below.
const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), "run-proxy-server-"));
process.env.XDG_CACHE_HOME = SANDBOX;

const {
  getCached,
  saveToCache,
  clearCache,
  getCacheDir,
} = require("../src/cache");

const TEST_CACHE_DIR = path.join(SANDBOX, "run-proxy-server");

/** Rewrites the stamp of a cached entry, in days back. */
function ageEntry(url, days) {
  const file = cacheFileFor(url);
  const entry = JSON.parse(fs.readFileSync(file, "utf-8"));
  entry.cachedAt = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  fs.writeFileSync(file, JSON.stringify(entry), "utf-8");
}

function cacheFileFor(url) {
  const key = crypto
    .createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);
  return path.join(TEST_CACHE_DIR, `${key}.json`);
}

describe("Cache Module", () => {
  beforeEach(() => {
    // Clean cache directory before each test
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  describe("saveToCache", () => {
    it("should save text content to cache", () => {
      const url = "http://example.com/test.html";
      const body = "<html><body>Test</body></html>";
      const headers = { "content-type": "text/html" };
      const status = 200;

      saveToCache(url, body, headers, status);

      const cached = getCached(url);
      assert.ok(cached, "Cache should not be null");
      assert.strictEqual(cached.body, body);
      assert.deepStrictEqual(cached.headers, headers);
      assert.strictEqual(cached.status, status);
    });

    it("should save binary content to cache", () => {
      const url = "http://example.com/test.png";
      const body = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
      const headers = { "content-type": "image/png" };
      const status = 200;

      saveToCache(url, body, headers, status);

      const cached = getCached(url);
      assert.ok(cached, "Cache should not be null");
      assert.strictEqual(Buffer.isBuffer(cached.body), true);
      assert.deepStrictEqual(cached.body, body);
      assert.deepStrictEqual(cached.headers, headers);
      assert.strictEqual(cached.status, status);
    });

    it("should save JSON content to cache", () => {
      const url = "http://example.com/api/data";
      const body = JSON.stringify({ message: "Hello World" });
      const headers = { "content-type": "application/json" };
      const status = 200;

      saveToCache(url, body, headers, status);

      const cached = getCached(url);
      assert.ok(cached, "Cache should not be null");
      assert.strictEqual(cached.body, body);
      assert.deepStrictEqual(cached.headers, headers);
      assert.strictEqual(cached.status, status);
    });

    it("should handle different status codes", () => {
      const url = "http://example.com/not-found";
      const body = "Not Found";
      const headers = { "content-type": "text/plain" };
      const status = 404;

      saveToCache(url, body, headers, status);

      const cached = getCached(url);
      assert.ok(cached, "Cache should not be null");
      assert.strictEqual(cached.status, 404);
    });

    it("should create cache directory if it doesn't exist", () => {
      assert.strictEqual(fs.existsSync(TEST_CACHE_DIR), false);

      const url = "http://example.com/test";
      saveToCache(url, "test", {}, 200);

      assert.strictEqual(fs.existsSync(TEST_CACHE_DIR), true);
    });
  });

  describe("getCached", () => {
    it("should return null for non-existent cache", () => {
      const url = "http://example.com/not-cached";
      const cached = getCached(url);
      assert.strictEqual(cached, null);
    });

    it("should retrieve cached text content", () => {
      const url = "http://example.com/test.html";
      const body = "<html><body>Test</body></html>";
      const headers = { "content-type": "text/html" };
      const status = 200;

      saveToCache(url, body, headers, status);
      const cached = getCached(url);

      assert.ok(cached);
      assert.strictEqual(cached.body, body);
      assert.deepStrictEqual(cached.headers, headers);
      assert.strictEqual(cached.status, status);
    });

    it("should retrieve cached binary content", () => {
      const url = "http://example.com/test.png";
      const body = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const headers = { "content-type": "image/png" };
      const status = 200;

      saveToCache(url, body, headers, status);
      const cached = getCached(url);

      assert.ok(cached);
      assert.strictEqual(Buffer.isBuffer(cached.body), true);
      assert.deepStrictEqual(cached.body, body);
    });

    it("should handle corrupt cache files gracefully", () => {
      const url = "http://example.com/test";
      const headers = { "content-type": "text/plain" };

      // First save valid cache
      saveToCache(url, "test", headers, 200);

      // Corrupt the cache file
      fs.writeFileSync(cacheFileFor(url), "invalid json content");

      // Should return null for corrupt cache
      const cached = getCached(url);
      assert.strictEqual(cached, null);
    });

    it("should handle different URLs with unique cache keys", () => {
      const url1 = "http://example.com/page1";
      const url2 = "http://example.com/page2";
      const body1 = "Page 1 content";
      const body2 = "Page 2 content";

      saveToCache(url1, body1, {}, 200);
      saveToCache(url2, body2, {}, 200);

      const cached1 = getCached(url1);
      const cached2 = getCached(url2);

      assert.strictEqual(cached1.body, body1);
      assert.strictEqual(cached2.body, body2);
      assert.notStrictEqual(cached1.body, cached2.body);
    });
  });

  describe("Cache key generation", () => {
    it("should generate consistent cache keys for the same URL", () => {
      const url = "http://example.com/test";
      const body = "test content";

      saveToCache(url, body, {}, 200);
      const cached1 = getCached(url);

      saveToCache(url, body, {}, 200);
      const cached2 = getCached(url);

      assert.ok(cached1);
      assert.ok(cached2);
      assert.strictEqual(cached1.body, cached2.body);
    });

    it("should generate different cache keys for different URLs", () => {
      const url1 = "http://example.com/page1";
      const url2 = "http://example.com/page2";

      saveToCache(url1, "content1", {}, 200);
      saveToCache(url2, "content2", {}, 200);

      const files = fs.readdirSync(TEST_CACHE_DIR);
      assert.strictEqual(files.length, 2);
      assert.notStrictEqual(files[0], files[1]);
    });
  });

  describe("Cache location", () => {
    it("should live in the user cache directory, not in the package", () => {
      const packageDir = path.join(__dirname, "..");

      assert.strictEqual(path.basename(getCacheDir()), "run-proxy-server");
      assert.strictEqual(
        getCacheDir().startsWith(packageDir),
        false,
        "the cache must not sit inside the package - installed globally, that is node_modules",
      );
    });

    it("should honour XDG_CACHE_HOME", () => {
      assert.strictEqual(getCacheDir(), path.join(SANDBOX, "run-proxy-server"));
    });
  });

  describe("Expiry", () => {
    it("should drop an entry older than the TTL", () => {
      const url = "http://example.com/old";
      saveToCache(url, "stale", {}, 200);
      ageEntry(url, 400);

      assert.strictEqual(getCached(url), null);
    });

    it("should keep an entry younger than the TTL", () => {
      const url = "http://example.com/fresh";
      saveToCache(url, "fresh", {}, 200);
      ageEntry(url, 300);

      assert.strictEqual(getCached(url).body, "fresh");
    });

    it("should keep entries forever when CACHE_TTL_HOURS is 0", () => {
      const url = "http://example.com/eternal";
      saveToCache(url, "eternal", {}, 200);
      ageEntry(url, 4000);

      process.env.CACHE_TTL_HOURS = "0";
      try {
        assert.strictEqual(getCached(url).body, "eternal");
      } finally {
        delete process.env.CACHE_TTL_HOURS;
      }
    });

    it("should honour a custom CACHE_TTL_HOURS", () => {
      const url = "http://example.com/short";
      saveToCache(url, "short", {}, 200);
      ageEntry(url, 2);

      process.env.CACHE_TTL_HOURS = "12";
      try {
        assert.strictEqual(getCached(url), null);
      } finally {
        delete process.env.CACHE_TTL_HOURS;
      }
    });

    it("should fall back to the default TTL for a nonsense value", () => {
      const url = "http://example.com/nonsense-ttl";
      saveToCache(url, "kept", {}, 200);
      ageEntry(url, 1);

      process.env.CACHE_TTL_HOURS = "soon";
      try {
        assert.strictEqual(getCached(url).body, "kept");
      } finally {
        delete process.env.CACHE_TTL_HOURS;
      }
    });

    it("should drop an entry with an unreadable timestamp", () => {
      const url = "http://example.com/no-stamp";
      saveToCache(url, "body", {}, 200);

      const file = cacheFileFor(url);
      const entry = JSON.parse(fs.readFileSync(file, "utf-8"));
      entry.cachedAt = "whenever";
      fs.writeFileSync(file, JSON.stringify(entry), "utf-8");

      assert.strictEqual(getCached(url), null);
    });
  });

  describe("clearCache", () => {
    it("should remove cache directory when cache exists", () => {
      const url = "http://example.com/test";
      saveToCache(url, "test body", {}, 200);

      assert.strictEqual(fs.existsSync(TEST_CACHE_DIR), true);

      const removed = clearCache();

      assert.strictEqual(removed, true);
      assert.strictEqual(fs.existsSync(TEST_CACHE_DIR), false);
    });

    it("should return false when cache directory does not exist", () => {
      assert.strictEqual(fs.existsSync(TEST_CACHE_DIR), false);

      const removed = clearCache();

      assert.strictEqual(removed, false);
    });
  });
});
