const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { CERTS_DIR, CERT_KEY_PATH, CERT_PATH } = require("./createServer");

function hasHttpsCerts() {
  return fs.existsSync(CERT_KEY_PATH) && fs.existsSync(CERT_PATH);
}

function setupHttps() {
  if (hasHttpsCerts()) {
    process.stdout.write(`HTTPS certificates already exist in ${CERTS_DIR}.\n`);
    return;
  }

  fs.mkdirSync(CERTS_DIR, { recursive: true });

  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-keyout",
        CERT_KEY_PATH,
        "-out",
        CERT_PATH,
        "-days",
        "365",
        "-nodes",
        "-subj",
        "/CN=localhost",
      ],
      { stdio: "inherit" },
    );

    process.stdout.write(
      `HTTPS setup complete. Certificates saved to ${CERTS_DIR}.\n`,
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      process.stderr.write(
        "Could not run openssl. Install OpenSSL and try again, or generate certs manually in certs/key.pem and certs/cert.pem.\n",
      );
      process.exit(1);
    }

    throw error;
  }
}

module.exports = {
  setupHttps,
};
