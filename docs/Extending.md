# Extending the System

There is no plugin architecture, dependency-injection container, or
dynamic module-loading mechanism in this repository — extension means
directly editing the swagger spec, adding controller/service files, and
adding to the shared dictionaries in `api/`. This page describes the
patterns the existing code follows, inferred from the current step types;
it is not a documented extension API from the maintainers.

## Adding a new step type

Based on the consistent pattern across all ~30 existing step types
(`api/step_definitions.js`, `api/controllers/*`,
`api/swagger/swagger.yaml`), adding a new step type `MY_STEP` would require:

1. **Template** — add a `"MY_STEP"` entry to `step_dict` in
   `api/step_definitions.js`, following the shape of an existing entry
   (`elem_type: "STEP"`, `step_type`, `specification.{authoring_user_input,
   execution_user_input, results}`, `execution.meta_data`, `executable`,
   `verifiable`, `code`).
2. **Swagger paths** — add the six-operation path group for both the
   execution side (`/executions/{execution_id}/my_step_steps...`) and the
   authoring side (`/procedures/{procedure_id}/my_step_steps...`), mirroring
   an existing type such as `WAIT_DATA_PRODUCTS`
   (`api/swagger/swagger.yaml:11680+`) — same six operations
   (create/list/get/get-input/get-result/update/update-input), same
   `x-swagger-router-controller` naming convention, and add `MY_STEP` to the
   `step_type` enum (`api/swagger/swagger.yaml`, `parameters.step_type`).
3. **Controllers** — add `api/controllers/MY_STEP.js` /
   `MY_STEPService.js` and `api/controllers/Procedure_MY_STEP.js` /
   `Procedure_MY_STEPService.js`, copying an existing pair
   (`WAIT_DATA_PRODUCTS.js`/`WAIT_DATA_PRODUCTSService.js` and its
   `Procedure_` counterpart) and updating the step-type string and function
   names. The service layer should call the **same** generic `node_funcs`
   functions (`createArchiveElement`, `getStep`, `get_step_input`,
   `get_step_result`, `updateStep`, `update_step_input`) — no new
   `node_funcs` code should be needed for a step type that only carries
   data (no special execution semantics on the `core_server` side; actual
   execution behavior lives in the EXECUTION service, outside this repo).
4. **Search (optional)** — if the new step type introduces fields that
   should be searchable, add entries to the relevant maps in
   `api/search_definitions.js`.
5. **Coverage** — add `MY_STEP` and `Procedure_MY_STEP` to the
   `stepModules`/`procedureStepModules` arrays in `jest.config.js` once
   tests are written, so the 100% coverage threshold applies to the new
   files (see [Testing](Testing.md#coverage-enforcement)).
6. **Tests** — see [Adding tests](#adding-tests) below.

## Adding a new endpoint to an existing resource

1. Add the path/operation to `api/swagger/swagger.yaml` under the
   appropriate resource, including `operationId`, `parameters`, `responses`,
   a `security:` block (or rely on the document default), and
   `x-swagger-router-controller`.
2. Add the corresponding exported function to the controller
   (`(req, res, next) => Service.operationId(req.swagger.params, res, next,
   req.headers)`) and to the `*Service.js` file (extract args from
   `args[name].value`, call into `node_funcs`, shape the response).
3. If the operation needs new business logic, add a function to
   `api/node_funcs.js` following the existing conventions: accept a
   trailing `key` (the raw `Authorization` header), use `axios` against
   `archiveLocation`/`executionLocation`/`dictionaryLocation`, and reject
   with `transform_axios_error(err)` on failure.
4. Export the new `node_funcs` function at the bottom of the file.

## Adding tests

Follow the conventions in [Testing](Testing.md#conventions-observed-in-the-suite):

- **Controller test** — mock the `*Service` module (or use
  `tests/unit/mocks/proxyServiceMock.js`), call the controller with a
  `{swagger: {params}, headers}` fake request, assert delegation.
- **Service test** — mock `api/node_funcs.js` with `jest.mock()`, drive the
  handler with `swaggerArg(value)`-wrapped args
  (`tests/unit/mocks/testHelpers.js`) and a response double from
  `createMockResponse()`, assert on `res.status`/`res.json`/`res.set` and on
  how `node_funcs` was called.
- **`node_funcs` test** — mock `axios`/`aws-sdk`/`async-redis`/
  `jsonwebtoken` at the module level; assert on the exact URL/payload/
  headers passed to `axios` and on the shape of resolved/rejected values.

Add new files under `tests/unit/` (matched by `jest.config.js`'s
`testMatch: ['**/tests/unit/**/*.test.js']`) and update
`collectCoverageFrom`/`coverageThreshold` in `jest.config.js` if a
previously-uncovered file should now be held at 100%.

## Contribution workflow

Per the top-level [`README.md`](../README.md#contributing) (no separate
`CONTRIBUTING.md` exists in this repository):

1. Branch off `devel`.
2. `npm install`, make changes.
3. `npm run test:coverage` and ensure it passes (coverage thresholds are
   enforced per-file — see [Testing](Testing.md)).
4. Open a PR targeting `devel` — GitHub Actions CI
   (`.github/workflows/ci.yml`) runs automatically (see [CI/CD](CI-CD.md)).

There is no linter or formatter to run before committing (none is
configured — see [Development](Development.md#lint-format-type-check));
match the surrounding code's style.

## Related pages

- [Core Components](Core-Components.md)
- [Testing](Testing.md)
- [API Reference](API-Reference.md)
