const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const CACHE_NAMESPACE = "run-proxy-server";

// A proxied asset is worth keeping for a long time, but "forever" is not a
// TTL - without one the only way to drop a stale entry is --clear-cache.
const DEFAULT_TTL_HOURS = 365 * 24;

/**
 * The cache belongs to the user, not to the package. Installed globally the
 * package directory sits inside node_modules, which is read-only in many
 * setups and wiped on every reinstall.
 * @returns {string}
 */
function resolveCacheDir() {
  const cacheHome =
    process.env.XDG_CACHE_HOME?.trim() || path.join(os.homedir(), ".cache");
  return path.join(cacheHome, CACHE_NAMESPACE);
}

const CACHE_DIR = resolveCacheDir();

/**
 * How long an entry stays valid, in hours. A malformed or negative value
 * would silently disable the cache, so it falls back to the default. An empty
 * value counts as unset too - reading it as 0 would mean "keep forever".
 * @returns {number}
 */
function getCacheTtlHours() {
  const raw = process.env.CACHE_TTL_HOURS?.trim();

  if (!raw) {
    return DEFAULT_TTL_HOURS;
  }

  const hours = Number(raw);
  return Number.isFinite(hours) && hours >= 0 ? hours : DEFAULT_TTL_HOURS;
}

/**
 * Generate a cache key from a URL
 * @param {string} url
 * @returns {string}
 */
function getCacheKey(url) {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 32);
}

/**
 * Get the cache file path for a URL
 * @param {string} url
 * @returns {string}
 */
function getCacheFilePath(url) {
  const key = getCacheKey(url);
  return path.join(CACHE_DIR, `${key}.json`);
}

/**
 * Whether an entry is past its TTL. An entry with no usable stamp cannot be
 * aged, so it is dropped rather than trusted indefinitely.
 * @param {unknown} cachedAt ISO timestamp written by saveToCache
 * @returns {boolean}
 */
function isExpired(cachedAt) {
  const ttlHours = getCacheTtlHours();

  // A TTL of 0 means "keep forever".
  if (ttlHours === 0) {
    return false;
  }

  const savedAt = Date.parse(String(cachedAt));

  if (Number.isNaN(savedAt)) {
    return true;
  }

  return Date.now() - savedAt > ttlHours * 60 * 60 * 1000;
}

/**
 * Get cached resource
 * @param {string} url
 * @returns {{ body: Buffer | string, headers: Record<string, string>, status: number } | null}
 */
function getCached(url) {
  try {
    const filePath = getCacheFilePath(url);
    const data = fs.readFileSync(filePath, "utf-8");
    const cached = JSON.parse(data);

    if (isExpired(cached.cachedAt)) {
      return null;
    }

    // Convert body back to Buffer if it was stored as a buffer
    if (cached.isBuffer) {
      cached.body = Buffer.from(cached.body, "base64");
    }

    return {
      body: cached.body,
      headers: cached.headers,
      status: cached.status,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Save a resource to cache
 * @param {string} url
 * @param {string | Buffer} body
 * @param {Record<string, string>} headers
 * @param {number} status
 */
function saveToCache(url, body, headers, status) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const filePath = getCacheFilePath(url);
    const isBuffer = Buffer.isBuffer(body);

    const cacheData = {
      url,
      body: isBuffer ? body.toString("base64") : body,
      isBuffer,
      headers,
      status,
      cachedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheData), "utf-8");
  } catch (error) {
    // Silently fail if caching doesn't work
  }
}

/**
 * Clear all cached resources
 * @returns {boolean} True if cache directory was removed, false if it did not exist
 */
function clearCache() {
  if (!fs.existsSync(CACHE_DIR)) {
    return false;
  }

  fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  return true;
}

module.exports = {
  getCached,
  saveToCache,
  clearCache,
  getCacheDir: () => CACHE_DIR,
};
