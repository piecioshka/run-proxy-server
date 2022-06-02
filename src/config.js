const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

module.exports = {
  PORT: 8000,
  URL: argv.url,
};
