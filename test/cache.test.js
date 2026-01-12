const assert = require("node:assert");
const { describe, it, before, after } = require("node:test");
const fs = require("fs");
const path = require("path");
const cache = require("../src/cache");

describe("Cache Module", () => {
  const testCacheDir = path.join(__dirname, "..", ".cache");
  
  after(() => {
    // Cleanup: Remove test cache directory
    if (fs.existsSync(testCacheDir)) {
      const files = fs.readdirSync(testCacheDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testCacheDir, file));
      });
      fs.rmdirSync(testCacheDir);
    }
  });

  describe("isCached", () => {
    it("should return false for uncached URLs", () => {
      const testUrl = "http://example.com/test-not-cached.html";
      assert.strictEqual(cache.isCached(testUrl), false);
    });

    it("should return true for cached URLs", async () => {
      const testUrl = "http://example.com/test-cached.html";
      const testBody = "Cached content";
      const testHeaders = { "content-type": "text/html" };
      
      await cache.saveToCache(testUrl, testBody, testHeaders, 200);
      assert.strictEqual(cache.isCached(testUrl), true);
    });
  });

  describe("saveToCache and loadFromCache", () => {
    it("should save and load text content", async () => {
      const testUrl = "http://example.com/test-text.html";
      const testBody = "Hello, World!";
      const testHeaders = { "content-type": "text/html", "content-length": "13" };
      const testStatus = 200;

      await cache.saveToCache(testUrl, testBody, testHeaders, testStatus);
      
      const loaded = await cache.loadFromCache(testUrl);
      assert.ok(loaded, "Cache should contain the saved resource");
      assert.strictEqual(loaded.status, testStatus);
      assert.deepStrictEqual(loaded.headers, testHeaders);
      
      const restoredBody = cache.restoreBody(loaded);
      assert.strictEqual(restoredBody, testBody);
    });

    it("should save and load binary content (Buffer)", async () => {
      const testUrl = "http://example.com/test-image.png";
      const testBody = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
      const testHeaders = { "content-type": "image/png" };
      const testStatus = 200;

      await cache.saveToCache(testUrl, testBody, testHeaders, testStatus);
      
      const loaded = await cache.loadFromCache(testUrl);
      assert.ok(loaded, "Cache should contain the saved resource");
      assert.strictEqual(loaded.isBuffer, true);
      
      const restoredBody = cache.restoreBody(loaded);
      assert.ok(Buffer.isBuffer(restoredBody), "Restored body should be a Buffer");
      assert.ok(restoredBody.equals(testBody), "Restored buffer should match original");
    });

    it("should return null for non-existent cached URLs", async () => {
      const testUrl = "http://example.com/non-existent.html";
      const loaded = await cache.loadFromCache(testUrl);
      assert.strictEqual(loaded, null);
    });

    it("should include metadata in cached data", async () => {
      const testUrl = "http://example.com/test-metadata.html";
      const testBody = "Test content";
      const testHeaders = { "content-type": "text/html" };
      
      await cache.saveToCache(testUrl, testBody, testHeaders, 200);
      
      const loaded = await cache.loadFromCache(testUrl);
      assert.ok(loaded.cachedAt, "Cache should include timestamp");
      assert.ok(new Date(loaded.cachedAt), "Timestamp should be valid ISO date");
    });
  });

  describe("restoreBody", () => {
    it("should restore text content", () => {
      const cacheData = {
        body: "Hello, World!",
        isBuffer: false,
      };
      
      const restored = cache.restoreBody(cacheData);
      assert.strictEqual(restored, "Hello, World!");
    });

    it("should restore Buffer content from base64", () => {
      const originalBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const cacheData = {
        body: originalBuffer.toString("base64"),
        isBuffer: true,
      };
      
      const restored = cache.restoreBody(cacheData);
      assert.ok(Buffer.isBuffer(restored));
      assert.ok(restored.equals(originalBuffer));
    });
  });

  describe("cache directory", () => {
    it("should create cache directory if it doesn't exist", async () => {
      // Remove cache directory if it exists
      if (fs.existsSync(testCacheDir)) {
        const files = fs.readdirSync(testCacheDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(testCacheDir, file));
        });
        fs.rmdirSync(testCacheDir);
      }

      const testUrl = "http://example.com/test-dir-creation.html";
      await cache.saveToCache(testUrl, "test", { "content-type": "text/html" }, 200);
      
      assert.ok(fs.existsSync(testCacheDir), "Cache directory should be created");
    });
  });
});
