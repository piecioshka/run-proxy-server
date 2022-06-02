require("isomorphic-fetch");
const http = require("http");
const config = require("./config");

const toDict = (o) => Object.fromEntries(new Map(o));

function proxy(req) {
  const headers = {
    ...req.headers,
    host: new URL(config.URL).host,
    referer: config.URL,
    "sec-fetch-site": "same-origin",
  };
  delete headers["sec-fetch-user"];
  const url = `${config.URL}${req.url}`;
  console.debug("[proxy]", url, headers);
  return fetch(url, {
    headers,
  });
}

const server = http.createServer(async (req, res) => {
  const response = await proxy(req);
  const headers = toDict(response.headers);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(await response.text());
});

server.listen(config.PORT, () => {
  console.log(`Server started on http://localhost:${config.PORT}`);
});
