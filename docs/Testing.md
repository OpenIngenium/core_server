# Testing

## Framework & commands

[Jest](https://jestjs.io/) 27.x is the only test framework in this
repository (`package.json#devDependencies`). There is no separate
integration or end-to-end test suite, and no HTTP-mocking library (e.g.
`nock`, `msw`) — all mocking is done directly with `jest.mock()` against
`axios`, `aws-sdk`, `async-redis`, and `jsonwebtoken`.

```bash
npm test               # jest — run the full suite once
npm run test:watch     # jest --watch
npm run test:coverage  # jest --coverage — also enforces the thresholds below
```

## Layout

```text
tests/unit/
├── setupEnv.js                     # forces LOG_LEVEL=critical before any module loads
├── config.test.js
├── search_definitions.test.js
├── step_definitions.test.js
├── node_funcs.test.js              # pure/mockable helpers, logging, sleep, JWT parsing, ...
├── node_funcs_archive.test.js      # venues, venue groups, procedures, versions (archive CRUD)
├── node_funcs_compute.test.js      # compute_execution_element, refresh_execution, getVIs,
│                                    # resume_execution, init_file_server
├── node_funcs_conversations.test.js# comment/conversation CRUD, element move/copy, as_run,
│                                    # redis-backed switch-wait timeout loop
├── node_funcs_elements.test.js     # element/step/section/paragraph dispatch branches
│                                    # (execution vs procedure vs neither), redline guards,
│                                    # override transitions, dictionary-consistency enrichment
├── node_funcs_validation.test.js   # validate_procedure_version / validate_procedure_element,
│                                    # VI / VI_STATUS / CUSTOM_SCRIPT / PROCEDURE_SECTION drift detection
├── controllers/
│   ├── Health.test.js / HealthService.test.js
│   ├── Logging.test.js / LoggingService.test.js
│   ├── ANALYSIS.test.js / ANALYSISService.test.js
│   ├── big_controllers.test.js          # coarse smoke coverage for large controllers
│   ├── step_controllers.test.js         # delegation test for ~25 step-type controllers at once
│   ├── step_services.test.js
│   ├── procedure_controllers.test.js / procedure_service.test.js / procedure_services.test.js
│   ├── procedures_service.test.js
│   ├── procedure_versions_service.test.js
│   ├── procedure_section_controllers.test.js / procedure_section_services.test.js
│   ├── execution_service.test.js
│   ├── venue_controllers.test.js / venue_services.test.js
│   ├── comment_controllers.test.js / comment_services.test.js
│   ├── file_controllers.test.js / file_services.test.js
│   └── misc_controllers.test.js / misc_services.test.js
└── mocks/
    ├── testHelpers.js       # createMockResponse(), swaggerArg(value)
    ├── mockAwsSdk.js        # shared S3 instance mock (aws-sdk)
    ├── mockRedis.js         # shared client mock (async-redis)
    └── proxyServiceMock.js  # Proxy returning a jest.fn for any accessed property
```

Test file granularity does not mirror source file granularity 1:1 — several
`api/controllers/*.js` files are covered together in one grouped test file
(e.g. `step_controllers.test.js` covers ~25 step-type controllers with a
single table-driven `pairs` map), while `api/node_funcs.js` is split across
five `node_funcs*.test.js` files by concern rather than one giant file.

## Conventions observed in the suite

- **`tests/unit/setupEnv.js`** is registered as a Jest `setupFiles` entry
  (`jest.config.js`) specifically because `api/node_funcs.js` reads
  `LOG_LEVEL` at `require`-time to configure Winston — it must be set before
  any test imports that module, or log noise leaks into `console` during
  test runs.
- **Controller tests** assert pure delegation: mock the `*Service` module,
  call the controller with a `{swagger: {params}, headers}`-shaped fake
  request, and assert the service was called with
  `(req.swagger.params, res, next, headers)`.
  `tests/unit/mocks/proxyServiceMock.js` is used when a test wants to
  assert delegation across many operations without hand-declaring every
  `jest.fn()`.
- **Service tests** mock `api/node_funcs.js` directly (per-function
  `jest.fn()`), drive the service with `swaggerArg(value)`-wrapped args
  (mimicking swagger-tools' `args[name].value` shape) and a
  `createMockResponse()` double, then assert on `res.status`/`res.json`/
  `res.set` calls and on how `node_funcs` was invoked.
- **`node_funcs*.test.js`** mock `aws-sdk`, `async-redis`, `jsonwebtoken`,
  and `axios` at the module level (no real network, filesystem, or Redis
  I/O), then assert on the exact URLs/payloads/headers passed to `axios`
  and on error transformation (`transform_axios_error`).

## Coverage enforcement

`jest.config.js` collects coverage from an explicit allow-list
(`collectCoverageFrom`) and enforces **per-file** thresholds
(`coverageThreshold`), not a single repo-wide number:

- **`fullyCovered`** — `config.js`, `api/search_definitions.js`,
  `api/step_definitions.js`, every step-type controller+service pair (the
  `stepModules`/`procedureStepModules` lists), and the large
  fully-migrated controllers (`Procedures`, `Procedure`, `Execution`,
  `Procedure_Versions`, and the miscellaneous content controllers) are held
  at **100%** branches/functions/statements/lines. A regression in any of
  these fails `npm run test:coverage`.
- **`partiallyCovered`** — currently only
  `api/controllers/Procedure_VersionsService.js`, pinned at **99%
  branches** (100% elsewhere). The one uncoverable branch is documented in
  `jest.config.js`: `update_version_status` dereferences
  `version_status_input.action` before a null-coalescing check can be
  reached, so the `undefined → null` branch cannot be exercised without
  triggering a pre-existing `500` — a known, documented limitation, not an
  oversight.
- **`api/node_funcs.js`** — a **floor** threshold only (`branches: 64,
  functions: 73, statements: 75, lines: 75`), explicitly allowed to be
  below 100% because the remaining uncovered code is import/export
  (`targz`), streaming HTML rewriting, and filesystem staging that the
  `jest.config.js` comments describe as not exercisable as isolated unit
  tests without real I/O. This floor can only be **raised**, never lowered,
  as more of the module gets test coverage — per the comment in
  `jest.config.js`.

Coverage reporters are `text`, `text-summary`, `lcov`, and `html`
(`jest.config.js` — the `html` report is written to `coverage/`, already
present as an empty/generated directory in the repo tree).

## CI enforcement

`npm run test:coverage` (not plain `npm test`) is what CI runs — see
[CI/CD](CI-CD.md#test-job). A coverage-threshold violation fails the `test`
job and therefore blocks the dependent `docker` job.

## Related pages

- [Development](Development.md)
- [CI/CD](CI-CD.md)
- [Core Components](Core-Components.md)
- [Extending the System](Extending.md#adding-tests)
