# Ingenium Core Server

Backend REST API that powers procedure authoring and execution for the Ingenium
test-procedure platform.

[![CI](https://github.com/OpenIngenium/core_server/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenIngenium/core_server/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.23.2-brightgreen)](.nvmrc)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

📖 **For architecture, internals, and how-it-works detail, see the
[DeepWiki](docs/README.md).** This README covers installation and usage
only.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing & CI](#testing--ci)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Overview

Ingenium Core Server is the central REST API of the Ingenium platform, used
for spacecraft/mission integration & test (I&T) operations. It lets test
engineers **author** structured, versioned test procedures made of typed steps
(commands, telemetry/EHA checks, EVR queries, manual verification, waits,
custom scripts, etc.) and **execute** those procedures against test venues
(`WSTS`, `Testbed`, `ATLO`, `Other`) while tracking live status, redlines,
comments, and file attachments.

The service itself does not own a database or object store directly. Instead
it is a stateless API/orchestration layer that talks to a set of sibling
Ingenium services over HTTP/WebSocket:

- an **archive** service (`ARCHIVE`) that persists procedures and executions
- an **execution** service (`EXECUTION`) that drives step execution
- a **dictionary** service (`DICTIONARY`) for command/telemetry definitions
- an **execution monitor** (`EXECUTION_MONITOR_URL`), reached over Socket.IO,
  for real-time event publishing
- an S3-compatible **file server** (e.g. Minio) for file/media attachments
- **Redis** for execution wait/switch coordination flags

The REST API itself is defined as an OpenAPI (Swagger) 2.0 specification and
served with [swagger-tools](https://github.com/apigee-127/swagger-tools)
middleware on top of [Express](https://expressjs.com/).

## Features

- **OpenAPI 2.0 REST API** (`api/swagger/swagger.yaml`) with a built-in
  Swagger UI for interactive exploration.
- **JWT (RS256) authentication** with scope-based authorization (`admin`,
  `execute:wsts`, `execute:testbed`, `execute:sit`, `execute:other`,
  `config_mgmt`, `imcm`, `test_lead`, `author`, `basic`).
- **Procedure authoring** — sections, paragraphs, a table of contents, labels,
  and versioning for reusable test procedures.
- **Execution management** — create, run, pause, resume, suspend, and halt
  executions, with per-step results and outline/status tracking.
- **Rich step-type library**, including `CMD`, `CMD_FILE`, `CMD_SCMF`,
  `CMD_SSE`, `ANALYSIS`, `BUS_1553`, `CUSTOM_SCRIPT`, `GRAPH_EHA`,
  `VERIFY_EHA`, `QUERY_EVR`, `WAIT`, `WAIT_EHA`, `WAIT_EVR`,
  `WAIT_DATA_PRODUCTS`, `LIST_DATA_PRODUCTS`, `MANUAL_VERFICATION`,
  `Manual_Input`, `Manual_EIP`, `GDS`, `GET_CONFIG`/`UPDATE_CONFIG`,
  `TIME_REFERENCE`, `VI`/`VI_STATUS`, `Environment`, and `Venue_Config`.
- **Venue & venue group management** for organizing where procedures run.
- **Redline/blueline workflow** — modify, justify, approve, or discard element
  changes during execution with a recorded audit trail.
- **Comments & conversations** threaded on procedures, executions, and
  individual elements.
- **File attachments** backed by S3-compatible object storage.
- **Real-time event publishing** of execution/procedure activity over
  Socket.IO to an external Execution Monitor.
- **Import/export** of procedures, procedure versions, and executions as
  gzip archives.
- **Free-text search** across procedures and executions using configurable
  searchable field maps (`api/search_definitions.js`).

## Installation

### Prerequisites

- Node.js `22.23.2` (pinned in [`.nvmrc`](.nvmrc) and used as the Docker base
  image; the `engines` field in [`package.json`](package.json) requires
  `>=22.23.2 <23.0.0`)

### From source

```bash
nvm use            # use the pinned Node version
npm install
```

### Docker

```bash
docker build -t core_server .
docker run -p 8080:8080 core_server
```

The [`Dockerfile`](Dockerfile) installs production dependencies only
(`npm ci --omit=dev`) and runs `npm start` as its entrypoint.

## Quick Start

```bash
npm start
```

By default the server listens on `http://localhost:8080` (`server_port` in
[`config.js`](config.js)). Once it is up:

```bash
# Interactive Swagger UI
open http://localhost:8080/docs

# Unauthenticated health check
curl http://localhost:8080/api/v5/health
# => {"status":"OK","message":""}
```

The `health` endpoint requires no token. Every other endpoint requires a
bearer JWT (see [Usage](#usage)) and, for most read/write operations on
procedures or executions, one of the sibling services (`ARCHIVE`,
`EXECUTION`, `DICTIONARY`) to be reachable.

## Usage

All routes are namespaced under the API base path `/api/v5`
(`api_base_path` in `config.js`, matching `basePath` in
`api/swagger/swagger.yaml`).

### Authentication

Requests must include an `Authorization: Bearer <token>` header containing a
JWT signed with RS256. The server verifies the token against the RSA public
key configured via `PUBLIC_PEM` and checks the token's `scopes` claim against
the scopes required by each operation (defined in
`api/swagger/swagger.yaml`). Requests without a recognized bearer token
receive `401`; requests with a token lacking the required scope receive
`403`.

### Core resources

The API is organized around a small set of resources, browsable via the
Swagger UI at `/docs`:

| Resource | Base path | Purpose |
|---|---|---|
| Procedures | `/procedures` | Author reusable test procedures (sections, steps, versions) |
| Executions | `/executions` | Run procedures against a venue and track live status |
| Venues / Venue Groups | `/venues`, `/venue_groups` | Manage where executions run |
| Steps & Elements | nested under procedures/executions | Typed step content (commands, telemetry checks, waits, etc.) |
| Comments | nested under procedures/executions/elements | Threaded discussion |
| Files | nested under procedures/executions/comments | Attachments stored in the file server |
| Health / Logging | `/health`, `/logging` | Service status and runtime log level |

Example — list the 10 most recently started executions:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v5/executions?limit=10"
```

For the full set of operations, parameters, and response schemas, see
[`api/swagger/swagger.yaml`](api/swagger/swagger.yaml) or the live Swagger UI.

## Configuration

The server is configured entirely through environment variables. Defaults
(from [`config.js`](config.js) and [`api/node_funcs.js`](api/node_funcs.js))
are used when a variable is unset.

| Variable | Default | Description |
|---|---|---|
| `ARCHIVE` | `http://localhost:8010/api/v5` | Base URL of the archive service that persists procedures/executions |
| `EXECUTION` | `http://localhost:9999/api/v4` | Base URL of the execution service |
| `DICTIONARY` | `http://localhost:5000/api/v4` | Base URL of the command/telemetry dictionary service |
| `EXECUTION_MONITOR_URL` | `http://localhost:3000/api/v2/execution_event_publish` | Socket.IO endpoint used to publish execution/procedure events |
| `EMS_SECRET` | *(empty)* | Shared secret sent to the Execution Monitor socket on connect |
| `PUBLIC_PEM` | *(empty)* | RSA public key (PEM) used to verify RS256 JWT bearer tokens |
| `FILE_SERVER_API_HOST` | `http://localhost:9000` | Endpoint of the S3-compatible (e.g. Minio) file server |
| `FILE_SERVER_ACCESS_KEY` | *(empty)* | Access key for the file server |
| `FILE_SERVER_SECRET_KEY` | *(empty)* | Secret key for the file server |
| `MEDIA_BUCKET` | `ingenium-media-test` | Bucket used to store uploaded files/media |
| `REDIS_HOST` | `exec_redis` | Redis host used for execution wait/switch flags |
| `REDIS_PORT` | `6379` | Redis port |
| `SERVER_TIMEOUT_SEC` | `290` | Request timeout, in seconds, before the server responds `504` |
| `LOG_LEVEL` | `debug` | Winston log level: `critical`, `error`, `warning`, `info`, `debug`, `trace` |
| `LOG_FILE_PATH` | *(unset — console only)* | If set, also write logs to this file (5&nbsp;MB rotation, 2 files kept) |

## Project Structure

```text
.
├── api/
│   ├── controllers/          # Swagger-routed controllers + *Service business logic
│   ├── swagger/swagger.yaml  # OpenAPI 2.0 spec — source of truth for the REST API
│   ├── node_funcs.js         # Shared business logic (procedures, executions, files, ...)
│   ├── search_definitions.js # Searchable field maps
│   └── step_definitions.js   # Step-type schema definitions
├── tests/unit/                # Jest unit tests, mocks, and fixtures
├── .github/workflows/ci.yml   # GitHub Actions CI pipeline
├── config.js                  # Runtime configuration (env-var driven)
├── index.js                   # Express + swagger-tools bootstrap
├── jest.config.js             # Jest test/coverage configuration
├── Dockerfile
└── package.json
```

## Development

```bash
nvm use               # match the pinned Node version
npm install            # install dependencies (including devDependencies)
npm start              # run the server
npm test               # run the Jest unit suite
npm run test:watch     # run tests in watch mode
npm run test:coverage  # run tests with coverage reporting
```

These are the only scripts currently defined in `package.json`; there is no
separate lint, format, or build step configured in this repository.

## Testing & CI

Fast, isolated Jest unit tests live in `tests/unit/`. All external
dependencies (the archive/execution/dictionary services, Redis, S3/Minio,
and other HTTP clients) are mocked (see `tests/unit/mocks/`), so the suite
performs no real I/O and can run anywhere.

Coverage is enforced per-file via `coverageThreshold` in
[`jest.config.js`](jest.config.js): fully migrated controllers/services are
held at 100% branch/function/statement/line coverage, while the large legacy
`api/node_funcs.js` module has a floor threshold that only ratchets upward as
more of it is covered.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and
pull request targeting `devel` or `main`:

1. **Test** — checks out the repo, sets up Node using the version in
   `.nvmrc`, runs `npm ci`, then `npm run test:coverage`.
2. **Docker Build** (after Test passes) — builds the Docker image
   (`docker build -t core_server:<sha> .`) to verify the image builds
   cleanly.

This Docker build tag uses the commit SHA and is for CI verification only;
it is not the artifact tagging scheme used for releases.

## Documentation

This README is the entry point for installing and running the service. The
authoritative reference for every endpoint, request/response schema, and
security scope is the OpenAPI spec at
[`api/swagger/swagger.yaml`](api/swagger/swagger.yaml), browsable
interactively via the Swagger UI at `/docs` on a running server.

For everything else — architecture, request lifecycle, the execution state
machine, the step-type system, error handling, and how to safely extend the
service — see the **[DeepWiki](docs/README.md)**, a set of developer-oriented
pages that go deeper than this README:

- [Overview](docs/Overview.md) & [Architecture](docs/Architecture.md)
- [Repository Structure](docs/Repository-Structure.md) & [Core Components](docs/Core-Components.md)
- [API Reference](docs/API-Reference.md) & [Data Flow](docs/Data-Flow.md)
- [Configuration](docs/Configuration.md) (full env-var reference with source citations)
- [Development](docs/Development.md), [Testing](docs/Testing.md), [CI/CD](docs/CI-CD.md)
- [Security](docs/Security.md), [Error Handling](docs/Error-Handling.md)
- [Extending the System](docs/Extending.md) & [Troubleshooting](docs/Troubleshooting.md)

## Contributing

There is currently no `CONTRIBUTING.md` in this repository. In the meantime:

1. Clone the repository and create a branch off `devel`.
2. Install dependencies with `npm install` and make your changes.
3. Run `npm run test:coverage` and ensure the suite passes.
4. Open a pull request targeting `devel` (CI runs automatically via
   `.github/workflows/ci.yml`).

## Security

There is currently no `SECURITY.md` or published vulnerability-disclosure
process in this repository. If you discover a security issue, please report
it to the repository maintainers directly rather than opening a public
issue.

## License

This project is licensed under the **Apache License 2.0**. See the
[`LICENSE`](LICENSE) file in the repository root for the full text.
