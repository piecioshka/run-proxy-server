const { createServer } = require("./src/createServer");
const { getCached, saveToCache } = require("./src/cache");

module.exports = {
  createServer,
  getCached,
  saveToCache,
};
