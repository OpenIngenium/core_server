# Configuration

`core_server` is configured entirely through environment variables. There is
no config file format, no CLI flags, and no `.env` loader (no `dotenv` in
`package.json`) — variables must be present in the process environment
before `node index.js` runs.

## Where variables are actually read

This matters for anyone tracing behavior: **not every variable is exposed
through `config.js`.** Some are read directly from `process.env` inside
`api/node_funcs.js`, at module-load time, bypassing `config.js` entirely.

| Read in `config.js` | Read directly in `api/node_funcs.js` |
|---|---|
| `EXECUTION_MONITOR_URL`, `FILE_SERVER_API_HOST`, `FILE_SERVER_ACCESS_KEY`, `FILE_SERVER_SECRET_KEY`, `MEDIA_BUCKET`, `REDIS_HOST`, `REDIS_PORT`, `SERVER_TIMEOUT_SEC`, `PUBLIC_PEM`, `EMS_SECRET` | `ARCHIVE`, `EXECUTION`, `DICTIONARY`, `LOG_LEVEL`, `LOG_FILE_PATH` |

Because `ARCHIVE`/`EXECUTION`/`DICTIONARY`/`LOG_LEVEL`/`LOG_FILE_PATH` are
read once when `api/node_funcs.js` is first `require`d, **changing them at
runtime (without restarting the process) has no effect**, even though
`LOG_LEVEL` can *also* be changed live through `PUT /logging` →
`node_funcs.updateLogging`, which mutates the already-created Winston
logger's `level` in place rather than re-reading the environment.

## All environment variables

| Variable | Default | Read in | Effect |
|---|---|---|---|
| `ARCHIVE` | `http://localhost:8010/api/v5` | `api/node_funcs.js:18` | Base URL of the archive service; target of nearly every procedure/execution/venue/comment/file CRUD call |
| `EXECUTION` | `http://localhost:9999/api/v4` | `api/node_funcs.js:19` | Base URL of the execution service; target of `run`/`halt` and venue-registration calls |
| `DICTIONARY` | `http://localhost:5000/api/v4` | `api/node_funcs.js:20` | Base URL of the command/telemetry dictionary service |
| `EXECUTION_MONITOR_URL` | `http://localhost:3000/api/v2/execution_event_publish` | `config.js:3-4` | Socket.IO endpoint `index.js` connects to for publishing execution/procedure events |
| `EMS_SECRET` | `''` | `config.js:20` | Sent as the `secret` query param when opening the Execution Monitor socket (`index.js:61`) |
| `PUBLIC_PEM` | `''` | `config.js:19` | RSA public key (PEM) used to verify RS256 JWT bearer tokens (`index.js:27`, `279-281`) |
| `FILE_SERVER_API_HOST` | `http://localhost:9000` | `config.js:9` | Endpoint of the S3-compatible file server (e.g. Minio) |
| `FILE_SERVER_ACCESS_KEY` | `''` | `config.js:10` | S3 access key |
| `FILE_SERVER_SECRET_KEY` | `''` | `config.js:11` | S3 secret key |
| `MEDIA_BUCKET` | `ingenium-media-test` | `config.js:12` | Bucket used for uploaded files/media; also used to build the file-path regexes at `api/node_funcs.js:45-48` |
| `REDIS_HOST` | `exec_redis` | `config.js:14` | Redis host for execution wait/switch coordination |
| `REDIS_PORT` | `6379` | `config.js:15` | Redis port (parsed with `parseInt`) |
| `SERVER_TIMEOUT_SEC` | `290` | `config.js:18` | Request timeout (seconds) before `express-timeout-handler` responds `504` |
| `LOG_LEVEL` | `debug` | `api/node_funcs.js:117` | Initial Winston level: `critical`, `error`, `warning`, `info`, `debug`, `trace` (custom levels, `api/node_funcs.js:55-59`) |
| `LOG_FILE_PATH` | *unset (console only)* | `api/node_funcs.js:105-113` | If set, also logs to this file, rotating at 5 MB with 2 files kept |
| `NODE_ENV` | — | `index.js:24` | Referenced only in a **commented-out** line controlling swagger-tools stub mode; has **no effect** in the current code |

`config.js` additionally defines two values with **no environment-variable
override** (hardcoded):

| Value | Source | Notes |
|---|---|---|
| `api_base_path` | `config.js:6` = `'api/v5'` | Must match `basePath: /api/v5` in `api/swagger/swagger.yaml`; changing one without the other would break routing |
| `server_port` | `config.js:7` = `8080` | Not overridable via environment in the current code — to change the listen port you must edit `config.js` (or override it, e.g. with a reverse proxy) |
| `EXECUTION_SWITCH_WAIT_SEC` | `config.js:23` = `10` | Default wait time (seconds) used by the execution-switch coordination flags in Redis |

## Precedence

For every variable above that has a default, precedence is simply:
`process.env.<VAR>` if set and non-empty, else the hardcoded default. There
is no layered configuration (no per-environment files, no CLI overrides).
Docker-built images receive these as container/orchestration environment
variables — this repository does not define what supplies them in any
particular deployment (that lives outside this repo).

## Required vs. optional in practice

Nothing is enforced as "required" at startup — the process will start with
every variable at its default. In practice:

- **`PUBLIC_PEM`** — if left empty, `jwt.verify(token, '', {algorithms:
  ['RS256']})` will fail verification for any real token, so every
  authenticated endpoint will return `403`. Required for a functional
  deployment.
- **`ARCHIVE`**, **`EXECUTION`**, **`DICTIONARY`** — nearly all business
  operations proxy to these; if unreachable, calls fail with a
  `transform_axios_error`-shaped `502`-ish payload (no dedicated retry or
  circuit breaker is implemented — see [Error Handling](Error-Handling.md)).
- **`FILE_SERVER_*`** — required only for file-attachment features; if the
  Minio bucket cannot be reached at startup, `init_file_server()` logs an
  error but does not prevent the server from otherwise starting
  (`index.js:91-97`).
- **`REDIS_HOST`/`REDIS_PORT`** — required only for execution switch-wait
  coordination; a connection failure is logged (`api/node_funcs.js:135-137`)
  but, like the file server, does not stop the process from starting.

## Related pages

- [Development](Development.md) — running the server locally with these variables
- [Security](Security.md) — how `PUBLIC_PEM` and scopes are used
- [Core Components](Core-Components.md) — the modules each variable configures
