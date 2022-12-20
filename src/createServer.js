const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require('node:path');

const certs = path.join(__dirname, '..', 'certs');

const createServer = (protocol) => {
  switch (protocol) {
    case "http":
      return http.createServer.bind(http);
    case "https": {
      const options = {
        key: fs.readFileSync(certs + "/key.pem"),
        cert: fs.readFileSync(certs + "/cert.pem"),
      };
      return https.createServer.bind(http, options);
    }
    default:
      throw new Error(`unsupported protocol=${protocol}`);
  }
};

module.exports = {
  createServer,
};
