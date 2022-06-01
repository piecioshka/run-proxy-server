/**
 * Example 1: Basic Usage
 *
 * This example shows how to start the proxy server with a simple denylist
 * that excludes JSON files from caching.
 */

// Command line usage:
// npm run start -- https://api.example.com --port 8080 --denylist "*.json"

// All JSON files will not be cached
// Examples of URLs that would be denied:
// - https://api.example.com/data.json
// - https://api.example.com/config.json
// - https://api.example.com/users/profile.json

// Examples of URLs that would be cached:
// - https://api.example.com/page.html
// - https://api.example.com/style.css
// - https://api.example.com/script.js
