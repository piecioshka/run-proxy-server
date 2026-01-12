const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { getCached, saveToCache } = require("../src/cache");

const TEST_CACHE_DIR = path.join(__dirname, "..", ".cache");

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
      assert.strictEqual(cached !== null, true, "Cache should not be null");
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
      assert.strictEqual(cached !== null, true, "Cache should not be null");
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
      assert.strictEqual(cached !== null, true, "Cache should not be null");
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
      assert.strictEqual(cached !== null, true, "Cache should not be null");
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

      assert.strictEqual(cached !== null, true);
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

      assert.strictEqual(cached !== null, true);
      assert.strictEqual(Buffer.isBuffer(cached.body), true);
      assert.deepStrictEqual(cached.body, body);
    });

    it("should handle corrupt cache files gracefully", () => {
      const url = "http://example.com/test";
      const headers = { "content-type": "text/plain" };
      
      // First save valid cache
      saveToCache(url, "test", headers, 200);
      
      // Corrupt the cache file
      const crypto = require("crypto");
      const cacheKey = crypto.createHash("md5").update(url).digest("hex");
      const cacheFile = path.join(TEST_CACHE_DIR, cacheKey);
      fs.writeFileSync(cacheFile, "invalid json content");

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

      assert.strictEqual(cached1 !== null, true);
      assert.strictEqual(cached2 !== null, true);
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
});
