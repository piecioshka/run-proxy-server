const { describe, it, before, afterEach } = require("node:test");
const assert = require("node:assert");

describe("config module - denylist functionality", () => {
  let originalArgv;

  before(() => {
    // Save original argv
    originalArgv = process.argv.slice();
  });

  afterEach(() => {
    // Restore original argv and clear require cache
    process.argv = originalArgv.slice();
    delete require.cache[require.resolve("../src/config.js")];
  });

  describe("URL argument parsing", () => {
    it("should parse URL from positional argument", () => {
      process.argv = [
        "node",
        "script.js",
        "https://example.com",
        "--port",
        "8000",
      ];
      const config = require("../src/config.js");

      assert.strictEqual(config.URL.toString(), "https://example.com/");
      assert.strictEqual(config.PROTOCOL, "https");
      assert.strictEqual(config.HOST, "example.com");
    });

    it("should still support legacy --url option", () => {
      process.argv = ["node", "script.js", "--url", "https://example.com"];
      const config = require("../src/config.js");

      assert.strictEqual(config.URL.toString(), "https://example.com/");
    });

    it("should enable cache by default", () => {
      process.argv = ["node", "script.js", "https://example.com"];
      const config = require("../src/config.js");

      assert.strictEqual(config.IS_CACHE_ENABLED, true);
    });

    it("should disable cache with --no-cache", () => {
      process.argv = ["node", "script.js", "https://example.com", "--no-cache"];
      const config = require("../src/config.js");

      assert.strictEqual(config.IS_CACHE_ENABLED, false);
    });

    it("should allow running with --clear-cache without URL", () => {
      process.argv = ["node", "script.js", "--clear-cache"];
      const config = require("../src/config.js");

      assert.strictEqual(config.IS_CLEAR_CACHE, true);
      assert.strictEqual(config.URL, null);
    });
  });

  describe("parseDenylist and DENYLIST getter", () => {
    it("should return empty array when no denylist is provided", () => {
      process.argv = ["node", "script.js", "--url", "https://example.com"];
      const config = require("../src/config.js");
      assert.deepStrictEqual(config.DENYLIST, []);
    });

    it("should parse single pattern from denylist", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json",
      ];
      const config = require("../src/config.js");
      assert.deepStrictEqual(config.DENYLIST, ["*.json"]);
    });

    it("should parse multiple patterns from comma-separated denylist", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*/api/*,*.json,*.xml",
      ];
      const config = require("../src/config.js");
      assert.deepStrictEqual(config.DENYLIST, ["*/api/*", "*.json", "*.xml"]);
    });

    it("should trim whitespace from patterns", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        " */api/* , *.json , *.xml ",
      ];
      const config = require("../src/config.js");
      assert.deepStrictEqual(config.DENYLIST, ["*/api/*", "*.json", "*.xml"]);
    });

    it("should filter out empty patterns", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json,,*.xml,",
      ];
      const config = require("../src/config.js");
      assert.deepStrictEqual(config.DENYLIST, ["*.json", "*.xml"]);
    });

    it("should cache parsed denylist on multiple accesses", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json",
      ];
      const config = require("../src/config.js");
      const firstAccess = config.DENYLIST;
      const secondAccess = config.DENYLIST;
      assert.strictEqual(firstAccess, secondAccess);
    });
  });

  describe("isUrlDenylisted", () => {
    it("should return false when no patterns are provided", () => {
      process.argv = ["node", "script.js", "--url", "https://example.com"];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/page.html"),
        false,
      );
    });

    it("should return false when URL does not match any pattern", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/page.html"),
        false,
      );
    });

    it("should match exact patterns", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "https://example.com/api",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api"),
        true,
      );
    });

    it("should match wildcard at the end", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/data.json"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/config.json"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/page.html"),
        false,
      );
    });

    it("should match wildcard at the beginning", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "https://api.github.com/*",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://api.github.com/users"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://api.github.com/repos/test"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://github.com/users"),
        false,
      );
    });

    it("should match wildcard in the middle", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*/api/*",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/users"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/v1/posts"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/public/page"),
        false,
      );
    });

    it("should match multiple wildcards", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*/api/*/users",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/v1/users"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/v2/users"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/v1/posts"),
        false,
      );
    });

    it("should match any pattern in the list", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json,*.xml,*/api/*",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/data.json"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/data.xml"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/users"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/page.html"),
        false,
      );
    });

    it("should work with explicit patterns parameter", () => {
      process.argv = ["node", "script.js", "--url", "https://example.com"];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/data.json", ["*.json"]),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/page.html", ["*.json"]),
        false,
      );
    });

    it("should escape special regex characters", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "https://example.com/api?page=1",
      ];
      const config = require("../src/config.js");
      // ? should be treated as literal character, not regex wildcard
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api?page=1"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/apixpage=1"),
        false,
      );
    });

    it("should handle complex patterns", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*/admin/*,*/api/*/private/*,*.log",
      ];
      const config = require("../src/config.js");
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/admin/dashboard"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/api/v1/private/data"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/debug.log"),
        true,
      );
      assert.strictEqual(
        config.isUrlDenylisted("https://example.com/public/page"),
        false,
      );
    });
  });

  describe("performance - caching", () => {
    it("should cache compiled regex patterns", () => {
      process.argv = [
        "node",
        "script.js",
        "--url",
        "https://example.com",
        "--denylist",
        "*.json",
      ];
      const config = require("../src/config.js");

      // First call should compile regex
      const firstResult = config.isUrlDenylisted(
        "https://example.com/data.json",
      );
      // Second call should use cached regex
      const secondResult = config.isUrlDenylisted(
        "https://example.com/config.json",
      );

      assert.strictEqual(firstResult, true);
      assert.strictEqual(secondResult, true);
    });
  });
});
