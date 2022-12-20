const process = require("node:process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

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
