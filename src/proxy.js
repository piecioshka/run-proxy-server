const { URL, HOST, PROTOCOL } = require("./config");

async function proxy(req) {
  const requestHeaders = {
    ...req.headers,
    host: HOST,
    referer: URL.toString(),
    "sec-fetch-site": "same-origin",
  };
  delete requestHeaders["sec-fetch-user"];
  const url = `${PROTOCOL}://${HOST}${req.url}`;
  return await fetch(url, { method: req.method, headers: requestHeaders });
}

module.exports = {
  proxy,
};
