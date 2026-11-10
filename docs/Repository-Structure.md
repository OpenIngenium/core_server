# Repository Structure

```text
.
├── api/
│   ├── controllers/          # ~150 files: swagger-routed controllers + *Service business logic
│   ├── swagger/swagger.yaml  # OpenAPI 2.0 spec — source of truth for routes, params, schemas, auth scopes
│   ├── node_funcs.js         # Shared orchestration/business logic (~6,000 lines, ~150 exports)
│   ├── search_definitions.js # Field maps that drive free-text search
│   └── step_definitions.js   # Step-type template dictionary (step_dict)
├── tests/unit/
│   ├── controllers/          # Controller + Service unit tests, grouped by resource
│   ├── mocks/                # Reusable jest mocks (aws-sdk, async-redis, service proxy, response helper)
│   ├── setupEnv.js           # Forces LOG_LEVEL=critical before any module loads
│   ├── node_funcs*.test.js   # node_funcs.js coverage, split by concern (archive CRUD, compute, elements, conversations, validation)
│   ├── config.test.js
│   ├── search_definitions.test.js
│   └── step_definitions.test.js
├── .github/workflows/ci.yml  # GitHub Actions: test + docker-build jobs
├── config.js                  # Runtime configuration (env-var driven)
├── index.js                   # Express + swagger-tools bootstrap, auth, logging, Socket.IO client
├── jest.config.js             # Jest test matching + per-file coverage thresholds
├── Dockerfile                  # Production image build (npm ci --omit=dev)
├── package.json / package-lock.json
└── README.md                   # Public-facing entry point (see docs/README.md for how this wiki relates to it)
```

## `api/controllers/`

The largest directory (158 files). Each REST resource or step type has
**exactly two files**:

- `<Name>.js` — the controller. Registered in `api/swagger/swagger.yaml` via
  `x-swagger-router-controller: <Name>`; every exported function simply
  forwards `req.swagger.params`, `res`, `next`, and `req.headers` to the
  matching function in `<Name>Service.js`.
- `<Name>Service.js` — the service. Contains the real per-endpoint logic:
  argument extraction, calling into `api/node_funcs.js`, and shaping the HTTP
  response.

Naming reflects the two parallel families described in
[Architecture](Architecture.md#apicontrollersjs--routed-controllers):

| Family | Examples | Targets |
|---|---|---|
| Execution-side step types | `CMD.js`, `WAIT.js`, `VERIFY_EHA.js`, `QUERY_EVR.js`, … | `/executions/{execution_id}/...` |
| Authoring-side step types | `Procedure_CMD.js`, `Procedure_WAIT.js`, `Procedure_VERIFY_EHA.js`, … | `/procedures/{procedure_id}/...` |
| Content/structure | `Section.js`, `Paragraph.js`, `TOC.js`, `Step.js`, `ProcSection.js`, and their `Procedure_*` counterparts | Both |
| Cross-cutting resources | `Execution.js`, `Procedure.js`, `Procedures.js`, `Procedure_Versions.js`, `Venue.js`, `VenueGroup.js`, `Comment.js`, `Procedure_Comment.js`, `File.js`, `Procedure_File.js`, `Health.js`, `Logging.js` | Resource-specific |

The authoritative, machine-checkable enumeration of every step-type module
lives in `jest.config.js` as `stepModules` and `procedureStepModules`.

## `api/swagger/swagger.yaml`

A single ~19,500-line OpenAPI 2.0 document: `swagger: "2.0"`, `basePath:
/api/v5`, one `securityDefinitions.UserSecurity` (OAuth2 "implicit" flow used
only as a vehicle for scope declarations — see
[Security](Security.md#why-oauth2-for-a-jwt-only-api)), 314 `paths`, and a
`definitions:` section (starting at the `definitions:` key) describing every
request/response schema. This file is the **single source of truth** for
routes, parameters, response shapes, and required scopes — `index.js` loads
it at startup and both `swagger-tools` (for routing/validation/security) and
the Swagger UI (served at `/docs`) are generated from it directly.

## `api/node_funcs.js`

See [Core Components](Core-Components.md#apinode_funcsjs) for a full
breakdown. At a glance, the file is organized (not with section markers, but
observably by grouping) into:

- Winston logger setup + custom log levels (`critical` … `trace`)
- S3/Minio bucket bootstrap (`init_file_server`, `check_bucket`)
- Redis client setup for execution wait/switch flags
- File upload/download helpers (execution- and procedure-scoped)
- Element CRUD (`createArchiveElement`, `updateElement`, `moveElement`, `copyElement`, `delete_element`, `replace_element`, redline workflow)
- Execution lifecycle (`createExecution`, `runExecution`, `halt_execution`, `pause_execution`, `continue_execution`, `resume_execution`, `suspend_resume_execution`, `updateExecutionStatus`)
- Procedure/version lifecycle (`createProcedure`, `createProcedureVersion`, `updateVersionStatus`, `exportProcedureVersion(s)`, `importProcedureVersion(s)`)
- Venue & venue group management
- Comments/conversations (execution- and procedure-scoped)
- Free-text search (`searchExecution`, `searchProcedureVersion`, `construct_regexp`, `find_matches`)
- Verification item (VI) status aggregation (`getVIs`, `getProcedureVIs`, `getVI_Status_Dict`)
- JWT + error-handling utilities (`parse_token`, `parse_username`, `transform_axios_error`, `push_error`, `get_auth_key`)

## `tests/unit/`

Mirrors the source layout. `tests/unit/controllers/` groups tests by
resource rather than 1:1 with `api/controllers/` files (e.g.
`step_controllers.test.js` covers many step-type controllers at once using a
table-driven pattern). `tests/unit/mocks/` holds hand-rolled, reusable Jest
mocks — there is no HTTP-mocking library (e.g. `nock`) in `package.json`;
`axios`, `aws-sdk`, and `async-redis` are mocked directly with `jest.mock()`.
See [Testing](Testing.md) for details.

## Root files

| File | Role |
|---|---|
| `index.js` | Process entry point (`package.json#main` and `npm start`) |
| `config.js` | Central config module for a subset of environment variables (not all — see [Configuration](Configuration.md)) |
| `jest.config.js` | Test matching (`tests/unit/**/*.test.js`), coverage collection, and **per-file** coverage thresholds |
| `Dockerfile` | Builds a production image from `node:22.23.2-slim`, `npm ci --omit=dev`, `ENTRYPOINT ["npm", "start"]` |
| `.github/workflows/ci.yml` | GitHub Actions CI: `test` then `docker` build |
| `.nvmrc` | Pins Node to `22.23.2` |

## Related pages

- [Core Components](Core-Components.md)
- [Architecture](Architecture.md)
- [Testing](Testing.md)
- [CI/CD](CI-CD.md)
