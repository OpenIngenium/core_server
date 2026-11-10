# Development

## Setup

```bash
nvm use            # pins to the Node version in .nvmrc (22.23.2)
npm install         # installs dependencies, including devDependencies (jest)
```

`package.json#engines` requires `>=22.23.2 <23.0.0`; there is no `.node-version`
file or alternate version manager configuration beyond `.nvmrc`.

## Running the server

```bash
npm start
# node --max-old-space-size=4096 index.js
```

The server listens on `http://localhost:8080` (`config.server_port`) and
serves Swagger UI at `/docs`. `npm start` is the **only** run script —
there is no `dev`/`watch` script and no `nodemon` (or equivalent) dependency,
so the process must be restarted manually after code changes.

### Running against real sibling services vs. locally

Only `GET /health` (and `GET /logging`) work with zero external
dependencies. Nearly everything else calls out to `ARCHIVE`, `EXECUTION`,
and/or `DICTIONARY` (see [Configuration](Configuration.md)) — for local
development against those, set `ARCHIVE`/`EXECUTION`/`DICTIONARY` to
wherever those sibling services are running, e.g.:

```bash
ARCHIVE=http://localhost:8010/api/v5 \
EXECUTION=http://localhost:9999/api/v4 \
DICTIONARY=http://localhost:5000/api/v4 \
PUBLIC_PEM="$(cat path/to/public.pem)" \
npm start
```

If those services (or Redis, or the Minio/S3 file server) are not reachable,
`core_server` still starts — see
[Configuration → required vs. optional](Configuration.md#required-vs-optional-in-practice)
— but the affected endpoints will fail at request time.

### Generating a token for manual testing

There is no token-issuing endpoint in this repository — `core_server` only
**verifies** RS256 JWTs against `PUBLIC_PEM`; tokens must be minted
elsewhere (an identity/auth service outside this repo, or, for local testing,
signed by hand with the matching private key using a `scopes` claim
containing whichever scope(s) the target operation requires — see
`api/swagger/swagger.yaml`'s per-operation `security:` blocks and
[Security](Security.md)).

## Docker

```bash
docker build -t core_server .
docker run -p 8080:8080 core_server
```

The `Dockerfile` builds from `node:22.23.2-slim`, runs
`npm ci --omit=dev`, creates `/app/data`, and sets `ENTRYPOINT ["npm",
"start"]`. It does **not** set any environment variables — pass them with
`docker run -e VAR=value ...` or an orchestrator's env mechanism.

## Debugging

- **Increase log verbosity:** `LOG_LEVEL=trace npm start` (levels, from
  quietest to loudest: `critical`, `error`, `warning`, `info`, `debug`,
  `trace` — `api/node_funcs.js:55-59`). The default is `debug`.
- **Persist logs to a file:** set `LOG_FILE_PATH=/path/to/log` — a 5 MB
  rotating file (2 files kept) is added alongside the console transport.
- **Change log level live** without restarting: `POST /logging` with scope
  `admin` (`Logging.js`/`LoggingService.js` → `node_funcs.updateLogging`).
- **Inspect the live API contract:** open `http://localhost:8080/docs` for
  the interactive Swagger UI, generated directly from
  `api/swagger/swagger.yaml`.
- **Trace a request end-to-end:** every request is logged at `info` as
  `[REQUEST] <method> <url>` on the way in (`index.js:50-53`), and every
  mutating request's outcome is logged again by the response interceptor
  on the way out (`index.js:99-248`) — grep logs for the same URL/operation
  to see both.

## Lint, format, type-check

**None are configured.** There is no ESLint/Prettier config, no
`tsconfig.json`, and no corresponding `npm` script in `package.json`. Code
style is enforced only by review, not tooling — keep this in mind when
contributing (match the surrounding file's style rather than introducing a
new one).

## Build process

There is no build/transpile step — this is plain CommonJS Node.js run
directly by `node index.js`. "Building" in CI/Docker means installing
dependencies and (in CI) constructing a Docker image, not compiling source.

## Related pages

- [Configuration](Configuration.md)
- [Testing](Testing.md)
- [CI/CD](CI-CD.md)
- [Troubleshooting](Troubleshooting.md)
