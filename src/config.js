const process = require("node:process");
const parseArgs = require("minimist");
const argv = parseArgs(process.argv.slice(2));

const DEFAULT_PORT = 8000;

if (!argv.url) {
  console.log(`USAGE: proxy-server --url URL [--port ${DEFAULT_PORT}]`);
  process.exit(1);
}

const url = new URL(argv.url);

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
};
