# API Reference

The full, authoritative contract is `api/swagger/swagger.yaml` — an OpenAPI
2.0 document with **314 paths** (counted directly from the spec). It is also
served interactively as a Swagger UI at `/docs` on a running server. This
page is a navigable map of that contract, organized by resource, plus the
repeating patterns you need to recognize to find any given operation quickly.

## Base path, auth, and content types

- `basePath: /api/v5` (also `config.api_base_path`) — every route below is
  relative to this.
- `schemes: [http]`, `consumes`/`produces: [application/json]`.
- `security` at the document root requires one of the scopes `admin`,
  `execute:wsts`, `execute:testbed`, `execute:sit`, `execute:other`,
  `config_mgmt`, `imcm`, `test_lead`, `author`, `basic` — individual
  operations narrow this list via a per-operation `security:` block. See
  [Security](Security.md) for how scopes are enforced.

## Resources

| Resource | Representative base paths | Controller(s) | Notes |
|---|---|---|---|
| Executions | `/executions`, `/executions/{execution_id}` | `Execution` | Create/list/get/update/delete, lifecycle (`run`, `halt`, `pause`, `continue`, `resume`, `suspend_resume`), `search`, `export`/`import`, `as_run`, `history`, `outline` |
| Execution elements | `/executions/{execution_id}/elements`, `.../elements/{elem_id}` | `Execution` | Generic element ops: `move`, `copy`, redline `modify`/`justify`/`approve`/`discard` (single + bulk) |
| Execution steps | `/executions/{execution_id}/steps/{elem_id}`, `.../input`, `.../result`, `.../new_run`, `.../override`, `.../discard_override` | `Step` | Generic (step-type-agnostic) step read/result/override operations |
| Per-step-type endpoints (execution) | `/executions/{execution_id}/<type>_steps...` — see [Step-type endpoint pattern](#step-type-endpoint-pattern) | `CMD`, `WAIT`, `VERIFY_EHA`, … (one controller per type) | Typed create/list/get/get-input/get-result/update/update-input |
| Procedures | `/procedures`, `/procedures/{procedure_id}`, `/procedures/import`, `.../replace`, `.../load`, `.../structure`, `.../tags` | `Procedure`, `Procedures` | Author/list/update/delete/replace/import a procedure |
| Procedure versions | `/procedures/{procedure_id}/versions`, `.../versions/{version}`, `.../status`, `.../validate`, `.../export`, `.../search` | `Procedure_Versions` | Version create/list/get/patch, status transitions (`WORKING`/`VERSIONED`/`RELEASED`/`OBSOLETE`), validation, export |
| Procedure elements | `/procedures/{procedure_id}/elements`, `.../elements/{elem_id}`, `.../replace`, `.../tags` | `Procedure_Element` | Mirrors execution elements for the authoring side |
| Per-step-type endpoints (authoring) | `/procedures/{procedure_id}/<type>_steps...` | `Procedure_CMD`, `Procedure_WAIT`, … | Authoring-side mirror of the execution step endpoints |
| Sections / Paragraphs / TOC / Procedure sections | `/executions/{id}/sections`, `/paragraphs`, `/procedure_sections`, `.../toc_steps`, and `Procedure_*` equivalents | `Section`, `Paragraph`, `TOC`, `ProcSection`, and `Procedure_*` variants | Structural (non-step) content elements |
| Venues | `/venues`, `/venues/{venue_id}`, `.../status` | `Venue` | Create/list/get/update a venue; get/set live venue status (`AVAILABLE`/`IN_USE`, current `execution_id`, `test_conductor`) |
| Venue groups | `/venue_groups`, `/venue_groups/{venue_group_id}` | `VenueGroup` | Group venues for organization |
| Comments / conversations | `.../conversations`, `.../conversations/{id}/comments`, `.../comments/{comment_id}` (nested under both execution and procedure elements) | `Comment`, `Procedure_Comment` | Threaded discussion on any element |
| Files | `.../files`, `.../files/{file_id}` (nested under execution elements, procedure elements, and comments) | `File`, `Procedure_File` | Upload/list/get/delete attachments (see [Data Flow](Data-Flow.md#file-attachment-upload)) |
| Search | `/executions/{execution_id}/search`, `/procedures/{procedure_id}/versions/{version}/search` | `Execution`, `Procedure_Versions` | Free-text search — see [Core Components](Core-Components.md#free-text-search) |
| Health / Logging | `/health`, `/logging` | `Health`, `Logging` | Liveness check (no auth) and runtime log-level get/set |

## Step-type endpoint pattern

Every step type in the `step_type` enum (`api/swagger/swagger.yaml`,
`parameters.step_type`) —

```
MANUAL_INPUT, MANUAL_EIP, VENUE_CONFIG_MANUAL, ENVIRONMENT_MANUAL, GDS_MANUAL,
VERIFICATION_ITEM, VERIFICATION_ITEM_STATUS, GRAPH_EHA, QUERY_EVR, VERIFY_EHA,
WAIT_EHA, BUS_1553, WAIT_EVR, LIST_DATA_PRODUCTS, WAIT_DATA_PRODUCTS, CMD,
CMD_FILE, CMD_SCMF, CMD_SSE, VENUE_CONFIG_GET, VENUE_CONFIG_UPDATE,
VENUE_CONFIG_CHECK, MANUAL_VERIFICATION, CUSTOM_SCRIPT, ANALYSIS, WAIT,
TIME_REFERENCE, TOC
```

— gets its own path prefix and controller, repeated for both executions and
procedures. Using `WAIT_DATA_PRODUCTS` as a concrete example
(`api/swagger/swagger.yaml:11680+`, controller
`api/controllers/WAIT_DATA_PRODUCTS.js` /
`WAIT_DATA_PRODUCTSService.js`):

| Method & path | Operation ID | `node_funcs` call |
|---|---|---|
| `POST /executions/{execution_id}/wait_data_products_steps` | `create_wait_data_products_step` | `createArchiveElement(execution_id, null, "STEP", "WAIT_DATA_PRODUCTS", ...)` |
| `GET /executions/{execution_id}/wait_data_products_steps` | `get_execution_wait_data_products_steps` | `getExecutionElements(execution_id, "STEP", "WAIT_DATA_PRODUCTS", ...)` |
| `GET .../wait_data_products_steps/{elem_id}` | `get_wait_data_products_step` | `getStep(execution_id, null, elem_id, key)` |
| `GET .../wait_data_products_steps/{elem_id}/input` | `get_wait_data_products_step_input` | `get_step_input(execution_id, null, elem_id, key)` |
| `GET .../wait_data_products_steps/{elem_id}/result` | `get_wait_data_products_step_result` | `get_step_result(execution_id, elem_id, key)` |
| `PATCH .../wait_data_products_steps/{elem_id}` | `update_wait_data_products_step` | `updateStep(execution_id, null, elem_id, step, key)` |
| `POST .../wait_data_products_steps/{elem_id}/input` | `update_wait_data_products_step_input` | `update_step_input(execution_id, null, elem_id, user_input, key)` |

The `Procedure_WAIT_DATA_PRODUCTS` controller exposes the identical set of
operations at `/procedures/{procedure_id}/wait_data_products_steps...`,
calling the same `node_funcs` functions with `procedure_id` in place of
`execution_id`. This pattern holds for every step type; consult
`api/swagger/swagger.yaml` or `/docs` for the exact path of any one type.

## Generic vs. typed step operations

`Step.js` / `StepService.js` expose **type-agnostic** operations
(`GET/PATCH .../steps/{elem_id}`, `.../input`, `.../result`, `.../new_run`,
`.../override`, `.../discard_override`) that work on any step regardless of
`step_type` — useful for UIs that need to act on a step without knowing its
concrete type ahead of time. The typed endpoints in the previous section
exist mainly for **creation** (where the type-specific default template must
be chosen) and for strongly-typed request/response schemas in the OpenAPI
spec.

## Health and Logging

- `GET /health` — no authentication required (empty `security` scopes list
  in the spec); always returns `{"status":"OK","message":""}`
  (`api/controllers/HealthService.js`).
- `GET /logging` (no scope restriction beyond the document-wide default) /
  `POST /logging` (requires the `admin` scope) — per
  `Logging.js`/`LoggingService.js`, read or change the live Winston log
  level (`node_funcs.getLogging`/`updateLogging`) without restarting the
  process.

## Related pages

- [Data Flow](Data-Flow.md) — how these endpoints compose into real workflows
- [Core Components](Core-Components.md) — the business logic behind each call
- [Security](Security.md) — scope requirements and token verification
- [Configuration](Configuration.md) — sibling-service URLs these endpoints depend on
