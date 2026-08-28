const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("node:os");
const path = require("node:path");

const CONFIG_NAMESPACE = "run-proxy-server";

/**
 * Certificates belong to the user, not to the package. Installed globally the
 * package directory sits inside node_modules, which is read-only in many
 * setups and wiped on every reinstall.
 * @returns {string}
 */
function resolveCertsDir() {
  const configHome =
    process.env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), ".config");
  return path.join(configHome, CONFIG_NAMESPACE, "certs");
}

const CERTS_DIR = resolveCertsDir();
const CERT_KEY_PATH = path.join(CERTS_DIR, "key.pem");
const CERT_PATH = path.join(CERTS_DIR, "cert.pem");

function getMissingHttpsFiles() {
  const missing = [];

  if (!fs.existsSync(CERT_KEY_PATH)) {
    missing.push(CERT_KEY_PATH);
  }

  if (!fs.existsSync(CERT_PATH)) {
    missing.push(CERT_PATH);
  }

  return missing;
}

const createServer = (protocol) => {
  switch (protocol) {
    case "http":
      return http.createServer.bind(http);
    case "https": {
      const missingFiles = getMissingHttpsFiles();

      if (missingFiles.length > 0) {
        const error = new Error(
          [
            "HTTPS certificates are missing.",
            `Missing: ${missingFiles.join(", ")}`,
            "Run one-time setup first:",
            "  run-proxy-server --setup-https",
            "or",
            "  npx run-proxy-server --setup-https",
          ].join("\n"),
        );
        error.code = "HTTPS_CERTS_MISSING";
        throw error;
      }

      const options = {
        key: fs.readFileSync(CERT_KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
      };
      return https.createServer.bind(https, options);
    }
    default:
      throw new Error(`unsupported protocol=${protocol}`);
  }
};

module.exports = {
  createServer,
  CERTS_DIR,
  CERT_KEY_PATH,
  CERT_PATH,
};
