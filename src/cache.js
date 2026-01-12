const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "..", ".cache");

/**
 * Generate a cache key from a URL
 * @param {string} url
 * @returns {string}
 */
function getCacheKey(url) {
  return crypto.createHash("md5").update(url).digest("hex");
}

/**
 * Get the cache file path for a URL
 * @param {string} url
 * @returns {string}
 */
function getCacheFilePath(url) {
  const key = getCacheKey(url);
  return path.join(CACHE_DIR, key);
}

/**
 * Check if a resource is cached
 * @param {string} url
 * @returns {boolean}
 */
function isCached(url) {
  const filePath = getCacheFilePath(url);
  return fs.existsSync(filePath);
}

/**
 * Get cached resource
 * @param {string} url
 * @returns {{ body: Buffer | string, headers: Record<string, string>, status: number } | null}
 */
function getCached(url) {
  try {
    const filePath = getCacheFilePath(url);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, "utf-8");
    const cached = JSON.parse(data);
    
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

module.exports = {
  isCached,
  getCached,
  saveToCache,
};
