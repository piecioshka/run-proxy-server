const process = require("node:process");
const parseArgs = require("minimist");
const argv = parseArgs(process.argv.slice(2));

const DEFAULT_PORT = 8000;

if (!argv.url) {
  console.log(`USAGE: proxy-server --url URL [--port ${DEFAULT_PORT}] [--denylist PATTERNS]`);
  process.exit(1);
}

const url = new URL(argv.url);

// Cache parsed denylist patterns to avoid re-parsing on every access
let cachedDenylist = null;

/**
 * Parse denylist patterns from command line argument
 * @returns {string[]} Array of URL patterns to deny from caching
 */
function parseDenylist() {
  if (cachedDenylist !== null) {
    return cachedDenylist;
  }
  
  if (!argv.denylist) {
    cachedDenylist = [];
    return cachedDenylist;
  }
  
  cachedDenylist = argv.denylist.split(",").map((pattern) => pattern.trim()).filter(Boolean);
  return cachedDenylist;
}

// Cache compiled regex patterns for performance
const regexCache = new Map();

/**
 * Convert a wildcard pattern to a compiled regex
 * @param {string} pattern - Pattern with wildcards
 * @returns {RegExp} Compiled regular expression
 */
function patternToRegex(pattern) {
  if (regexCache.has(pattern)) {
    return regexCache.get(pattern);
  }
  
  // Convert wildcard pattern to regex
  // Escape special regex characters except *
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);
  
  regexCache.set(pattern, regex);
  return regex;
}

/**
 * Check if a URL matches any pattern in the denylist
 * Supports wildcards: * matches any characters
 * @param {string} urlToCheck - The URL to check
 * @param {string[]} patterns - Array of patterns to match against (optional, uses parsed denylist by default)
 * @returns {boolean} True if URL matches any denylist pattern
 */
function isUrlDenylisted(urlToCheck, patterns) {
  const patternsToCheck = patterns !== undefined ? patterns : parseDenylist();
  
  if (patternsToCheck.length === 0) {
    return false;
  }

  return patternsToCheck.some((pattern) => {
    const regex = patternToRegex(pattern);
    return regex.test(urlToCheck);
  });
}

module.exports = {
  get APP_PORT() {
    return argv.port ?? DEFAULT_PORT;
  },
  get URL() {
    return url;
  },
  get PROTOCOL() {
    return url.protocol.replace(":", "");
  },
  get HOST() {
    return url.host;
  },
  get DENYLIST() {
    return parseDenylist();
  },
  isUrlDenylisted,
};
