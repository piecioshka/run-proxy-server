### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### [v1.1.0](https://github.com/piecioshka/run-proxy-server/compare/v1.0.1...v1.1.0)

> 28 August 2026

- Cache: move to ~/.cache, add a 365-day TTL, switch MD5 to SHA-256 [`#13`](https://github.com/piecioshka/run-proxy-server/pull/13)
- chore: use https for license link [`#11`](https://github.com/piecioshka/run-proxy-server/pull/11)
- chore: add MIT license [`#10`](https://github.com/piecioshka/run-proxy-server/pull/10)
- docs: add VHS demo to README [`#9`](https://github.com/piecioshka/run-proxy-server/pull/9)
- Cache: move to ~/.cache, add a 365-day TTL, switch MD5 to SHA-256 (#13) [`#12`](https://github.com/piecioshka/run-proxy-server/issues/12)
- fix: cache only GET responses, bind to loopback, keep certs in user config dir [`78576a8`](https://github.com/piecioshka/run-proxy-server/commit/78576a8294e9d4cb186d9ea00c345e32b8b81f69)
- fix: return proper error responses, wire up denylist, harden upstream requests [`c8934b9`](https://github.com/piecioshka/run-proxy-server/commit/c8934b92aa2970eac835295ce9f5b4b96612cc88)
- test: add proxy hop-by-hop, body forwarding and timeout tests [`e5ebd80`](https://github.com/piecioshka/run-proxy-server/commit/e5ebd80eb0a802ff469a7173951b02a39777a501)
- chore: add Prettier and ESLint, check both in CI [`945d2af`](https://github.com/piecioshka/run-proxy-server/commit/945d2afb6a6d7df22c8117df7b13e22d5ef6b54f)
- refactor: point bin mapping to bin/cli.js [`60fc038`](https://github.com/piecioshka/run-proxy-server/commit/60fc038acfdff9e101e11e61b13655cf03449d89)
- ci: test on Node 20/22/24, bump actions, add concurrency and job timeout [`2a9b6f2`](https://github.com/piecioshka/run-proxy-server/commit/2a9b6f20bd1e327c54591ff3191fb73b6d9446ab)
- style: replace em dashes with plain hyphens [`d3d7aca`](https://github.com/piecioshka/run-proxy-server/commit/d3d7aca82cf203a651e1f39290958593ee8cc4f8)
- ci: limit GITHUB_TOKEN to contents: read [`c9ce0d5`](https://github.com/piecioshka/run-proxy-server/commit/c9ce0d5d80bf23689f9e7e624326fd84b0580627)
- fix: return proper error responses, wire up denylist, harden upstream requests [`61f51e5`](https://github.com/piecioshka/run-proxy-server/commit/61f51e557b72bd0b571ead32013491b52be53157)
- ci: rename testing workflow to ci.yml [`b0a207a`](https://github.com/piecioshka/run-proxy-server/commit/b0a207a0c332e6e632f9f593d7668c7eb1c880bc)
- docs: drop dead RunKit link from badge [`5f6c50c`](https://github.com/piecioshka/run-proxy-server/commit/5f6c50cb695a8ec781cecd42aa5207d13b2d81d5)
- refactor: rename bin/run-proxy-server.js to bin/cli.js [`7666bd2`](https://github.com/piecioshka/run-proxy-server/commit/7666bd229498434b16422c3091c07fc297cf3ba5)

#### [v1.0.1](https://github.com/piecioshka/run-proxy-server/compare/v1.0.0...v1.0.1)

> 21 April 2026

- package.json: Add repository & author (object) [`bf3e2c2`](https://github.com/piecioshka/run-proxy-server/commit/bf3e2c2c2fb7185dd828fae0c2abfe582b19035a)
- Update GH workflow name [`0f771db`](https://github.com/piecioshka/run-proxy-server/commit/0f771db7e686966655c0adbcd3afe517435ea406)

#### v1.0.0

> 9 April 2026

- Initialize project [`f633b62`](https://github.com/piecioshka/run-proxy-server/commit/f633b6214f4195a1235207987a905ef82d1396f7)
