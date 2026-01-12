const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "..", ".cache");

/**
 * Generates a cache key from a URL
 * @param {string} url
 * @returns {string}
 */
function getCacheKey(url) {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return hash;
}

/**
 * Gets the cache file path for a given URL
 * @param {string} url
 * @returns {string}
 */
function getCacheFilePath(url) {
  const key = getCacheKey(url);
  return path.join(CACHE_DIR, key);
}

/**
 * Checks if a resource is cached
 * @param {string} url
 * @returns {boolean}
 */
function isCached(url) {
  const filePath = getCacheFilePath(url);
  return fsSync.existsSync(filePath);
}

/**
 * Loads a cached resource
 * @param {string} url
 * @returns {Promise<{ body: Buffer | string, headers: Record<string, string>, status: number } | null>}
 */
async function loadFromCache(url) {
  if (!isCached(url)) {
    return null;
  }

  const filePath = getCacheFilePath(url);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

/**
 * Saves a resource to cache
 * @param {string} url
 * @param {Buffer | string} body
 * @param {Record<string, string>} headers
 * @param {number} status
 */
async function saveToCache(url, body, headers, status) {
  // Ensure cache directory exists
  if (!fsSync.existsSync(CACHE_DIR)) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }

  const filePath = getCacheFilePath(url);
  
  // Convert body to base64 if it's a Buffer
  const bodyToStore = Buffer.isBuffer(body) ? body.toString("base64") : body;
  const isBuffer = Buffer.isBuffer(body);

  const cacheData = {
    body: bodyToStore,
    headers,
    status,
    isBuffer,
    cachedAt: new Date().toISOString(),
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
  } catch (err) {
    // Silently fail if we can't write to cache
  }
}

/**
 * Restores body from cache data
 * @param {{ body: string, isBuffer: boolean }} cacheData
 * @returns {Buffer | string}
 */
function restoreBody(cacheData) {
  if (cacheData.isBuffer) {
    return Buffer.from(cacheData.body, "base64");
  }
  return cacheData.body;
}

module.exports = {
  isCached,
  loadFromCache,
  saveToCache,
  restoreBody,
  CACHE_DIR,
};
