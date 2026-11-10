# Core Components

## `index.js`

**Purpose:** process bootstrap — wires together Express, swagger-tools,
auth, logging, and the Execution Monitor socket.

**Responsibilities & implementation details:**

- **Timeout handling.** `express-timeout-handler` wraps every request with a
  timeout of `config.server_timeout_sec` seconds (default `290`, intentionally
  shorter than an assumed 300s upstream proxy timeout — see the comment at
  `config.js:17`). On timeout it responds `504 {"message": "Core service
  timed out"}` (`index.js:35-41`).
- **Body size.** `body-parser` is configured with a **500 MB** limit for both
  JSON and urlencoded bodies, set *before* the swagger middleware
  (`index.js:46-47`), with a comment noting this must happen before
  swagger-tools' own body parsing or large uploads fail.
- **Request logging.** Every incoming request is logged at `info` level as
  `[REQUEST] <method> <url>` (`index.js:50-53`).
- **Execution Monitor connection.** A Socket.IO **client** (`socket.io-client`)
  connects to `config.EXECUTION_MONITOR_URL` with `autoConnect: false` and a
  `secret` query param from `config.ems_secret`, then `.open()`s explicitly
  (`index.js:58-88`). `core_server` only emits on this socket
  (`execution-event`, `procedure-event`); it registers no inbound listeners
  beyond connection lifecycle events (`connect`, `disconnect`,
  `reconnect(_attempt)`, `error`).
- **File server bootstrap.** `node_funcs.init_file_server()` runs once at
  startup, fire-and-forget (`index.js:91-97`) — a failure here is logged but
  does **not** stop the server from starting.
- **Response interceptor / eventing.** `express-interceptor` wraps every
  `POST`/`PUT`/`PATCH`/`DELETE` response that matched a swagger operation
  (`index.js:99-248`). After the response is sent, it:
  1. Parses the response body as JSON (falls back to `util.inspect` on parse
     failure).
  2. Resolves the acting username from the `Authorization` header — via
     `node_funcs.parse_username` for `Bearer` tokens, or `req.params.user` for
     `Basic` auth.
  3. Builds an event message (`msg_id`, `msg_time`, `user_name`, `event`
     [the swagger `operationId`], `params`, `request_body`, `status_code`,
     `response_body`) and emits it as `execution-event` (if the request had an
     `execution_id` param) or `procedure-event` (if it had `procedure_id`);
     requests with neither are not published.
  4. Writes a structured Winston log entry, escalating to `error` for
     non-2xx responses (or `execution.meta_data.status === 'ERROR'` on
     `run_execution`/`update_step_result`), `warning` for `status ===
     'FAIL'`, and `info` otherwise.
- **Auth middleware.** Passed to `swaggerSecurity()` as the `UserSecurity`
  handler (see [Security](Security.md) for the full breakdown).
- **Validation error formatting.** The final middleware
  (`index.js:318-338`) converts `err.failedValidation` swagger errors into
  `400 {message: 'Failed schema validation', details: [...]}`, and otherwise
  delegates to Express's default error handling.

## `config.js`

A flat module of `module.exports.<NAME> = process.env.<NAME> || <default>`
statements. **Important nuance:** not every environment variable the service
reads is exposed through `config.js` — `ARCHIVE`, `EXECUTION`, `DICTIONARY`,
`LOG_LEVEL`, and `LOG_FILE_PATH` are read directly from `process.env` inside
`api/node_funcs.js` at module-load time (`api/node_funcs.js:18-20`, `104-117`),
bypassing `config.js` entirely. See [Configuration](Configuration.md) for the
complete, precisely-sourced variable list.

## `api/node_funcs.js`

The orchestration layer. No classes; a flat collection of `var x = async
function(...) {...}` / `function x(...) {...}` declarations, each exported
individually at the bottom of the file. Grouped here by concern:

### HTTP client conventions
Nearly every exported function follows the same shape:
```js
var someOp = async function(...ids, payload, key) {
  try {
    const url = `${archiveLocation}/...`;
    const response = await axios.<verb>(url, payload, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}
```
`key` is always the raw `Authorization` header value, forwarded unmodified
to the downstream service — `core_server` re-uses the caller's JWT for
service-to-service calls rather than minting its own credentials.

### Element CRUD & the step template system
`createArchiveElement(execution_id, procedure_id, elem_type, step_type, data,
insert_after_id, level, key)` (`api/node_funcs.js:284-379`) is the single
entry point for creating any element:
- For `elem_type === "STEP"`, it looks up `step_type` in `step_dict`
  (imported from `api/step_definitions.js`), deep-copies the template, then
  deep-merges (`extend(true, ...)`) any caller-supplied `data` on top —
  caller data wins on conflicts.
- For `"PROCEDURE_SECTION"`, same pattern against `step_dict["PROCEDURE_SECTION"]`.
- For `"SECTION"` / `"PARAGRAPH"`, the caller-supplied data is posted as-is
  (no template).
- The resulting payload is `POST`ed to `<archiveLocation>/executions/{id}/...`
  or `/procedures/{id}/...` depending on which id was supplied.

Other element operations follow the execution/procedure symmetry described in
[Architecture](Architecture.md#procedure-vs-execution-symmetry):
`getStep`, `get_step_input`, `get_step_result`, `update_step_result`,
`updateStep`, `updateElement(s)`, `moveElement`, `copyElement`,
`delete_element`, `replace_element`.

### Redline / blueline workflow
`modifyElement`, `justifyElement(s)`, `approveElement(s)`,
`discardElement(s)` implement the change-tracking workflow described in
[Architecture](Architecture.md#redline--blueline-workflow). `override_step` /
`update_override_step` / `discard_override_step` (`api/node_funcs.js:4492+`)
implement a related but distinct concept: manually flipping a step's
recorded `PASS`/`FAIL` result to `OVERRIDE_PASS`/`OVERRIDE_FAIL` with a
recorded justification, restricted to steps whose `executable` field is
`EXECUTED`.

### Execution lifecycle
- `createExecution` (`api/node_funcs.js:3697-3748`): resolves the acting
  username from the JWT, fetches the target venue, `POST`s the execution to
  ARCHIVE, `PUT`s the venue info to the EXECUTION service, then marks the
  venue `IN_USE` with the new `execution_id` and test conductor.
- `runExecution` / `runExecution_` (`api/node_funcs.js:736-782`): checks the
  execution is `IDLE`, resolves the venue's current test conductor, verifies
  the caller **is** that test conductor, then calls `runStep` against the
  EXECUTION service (`POST /executions/{id}/run`). On failure, it forces the
  execution status back to `IDLE`.
- `halt_execution` (`api/node_funcs.js:4234-4258`): best-effort `POST
  /executions/{id}/halt` against EXECUTION (a `404` there is treated as
  benign — "already closed"), then always attempts to set the archive
  execution status to `IDLE`.
- `pause_execution` / `continue_execution` / `resume_execution` /
  `suspend_resume_execution`: see [Data Flow](Data-Flow.md#execution-lifecycle)
  for the full state-transition walkthrough.
- `updateExecutionStatus` (`api/node_funcs.js:4109-4176`) is the guarded
  entry point for status changes: it rejects illegal transitions out of a
  completed status, and on transition to `CLOSED` cascades
  `halt_execution` → `remove_break_points` → `refresh_execution` → releasing
  the venue (if still held by this execution); on transition to `SUSPENDED`
  it releases the venue via `_releaseVenueToSuspend`.

### Procedure & version lifecycle
`createProcedure`, `createProcedureVersion`, `updateProcedure`,
`updateVersion`, `updateVersionStatus`, `removeVersion`, `removeProcedure`,
`replaceProcedure`, `loadProcedure`, `getStructure`. Version status is
derived (for legacy versions lacking an explicit `status` field) by
`deriveVersionStatus` (`api/node_funcs.js:2056-2072`) from timestamps:
`WORKING` → `VERSIONED` (has `time_versioned`) → `RELEASED` (has
`time_released`) or `OBSOLETE` (`deprecated` flag set).

### Import / export
`exportProcedureVersion(s)` / `importProcedureVersion(s)` and
`exportExecution` / `importExecution` build/consume gzip archives via the
`targz` package, staging files in a temp directory (`tmp`, `fs-extra`,
`recursive-readdir`) before compressing/extracting. This is the
integration-heavy code the coverage floor in `jest.config.js` explicitly
calls out as hard to unit test without real I/O.

### Free-text search
`searchExecution` / `searchProcedureVersion` (`api/node_funcs.js:2603+`) pull
the full element list for the target, resolve which dotted field paths to
scan from `api/search_definitions.js`'s field maps (optionally narrowed by
caller-supplied `field_filters`), build a case/whole-word-aware regex via
`construct_regexp`, and scan each field with `find_matches` / `search_with_regex`
(HTML fields are tokenized with `html-tokenize` so matches inside tags are
excluded). Results are capped at 1000 matches total, 100 match-texts per
field. Supports narrowing by `step_type_filters`, `status_filters`,
`from_time`/`to_time`, and a `start_elem_id`/`end_elem_id` window.

### Sub-procedure calling
`call_procedure_section` / `import_procedure_section` /
`check_procedure_for_import` — see
[Architecture](Architecture.md#sub-procedure-calling) and
[Data Flow](Data-Flow.md#sub-procedure-call--import).

### File storage
`init_file_server` / `check_bucket` (`api/node_funcs.js:157-282`) poll (up to
10 times, 4s apart) for the configured Minio bucket to exist, creating it and
attaching a public-read bucket policy if missing. `upload_file` /
`download_from_file_server` / `object_exists` wrap the `aws-sdk` `S3` client
(`api/node_funcs.js:124-130`) configured with `s3ForcePathStyle: true` (a
Minio compatibility requirement) and `signatureVersion: 'v4'`. `writeFile` /
`procedureWriteFile` (execution- vs. procedure-scoped) upload the buffer then
register the resulting URL as a `FileInfo` record in ARCHIVE.

### Redis-backed execution coordination
A single shared `async-redis` client (`api/node_funcs.js:132-140`) backs
`set_switch_wait` / `get_switch_wait` / `get_switch_wait_flag` /
`delete_switch_wait_flag`, keyed by `execution-switch-wait(:flag):
<execution_id>`. Used to coordinate the delay/flag semantics around
switching which execution is actively running on a venue
(`config.EXECUTION_SWITCH_WAIT_SEC`, `config.js:23`).

### Cross-cutting utilities
`parse_token` / `parse_username` — split an `Authorization: Bearer <jwt>`
header and decode the `username` claim (verifying signature with
`public_pem`, algorithm `RS256`). `transform_axios_error` — normalizes any
axios error (or a structured error object already shaped like
`{message, details, error_type, error_source, http_code_at_source}` returned
by a sibling service) into that same shape. `push_error(message, err)` —
wraps a normalized error with a caller-supplied top-level `message` while
preserving `details`/`http_code_at_source`. `get_auth_key(headers)` — reads
`headers.authorization` verbatim (no `Bearer ` stripping).

## `api/controllers/*` — the generated layer

See [Repository Structure](Repository-Structure.md#apicontrollers) for the
directory-level breakdown and [API Reference](API-Reference.md) for the
resource-by-resource endpoint list. Two representative examples:

- **Minimal:** `api/controllers/Health.js` / `HealthService.js` — no auth
  (see [Security](Security.md#the-health-exception)), no `node_funcs` call,
  returns a static `{"status":"OK","message":""}`.
- **Typical step-type pair:** `api/controllers/WAIT_DATA_PRODUCTS.js` /
  `WAIT_DATA_PRODUCTSService.js` — 6 operations (`create`, `get_execution_...`,
  `get`, `get_..._input`, `get_..._result`, `update`, `update_..._input`), each
  delegating to a `node_funcs` element/step function. This exact
  create/list/get/get-input/get-result/update/update-input shape repeats for
  every step type in both the execution-side and authoring-side families.

## `api/step_definitions.js`

Exports `step_dict`, keyed by step-type string (`MANUAL_INPUT`, `MANUAL_EIP`,
`VENUE_CONFIG_MANUAL`, `ENVIRONMENT_MANUAL`, `GDS_MANUAL`,
`VERIFICATION_ITEM`, `VERIFICATION_ITEM_STATUS`, `GRAPH_EHA`, `QUERY_EVR`,
`VERIFY_EHA`, `WAIT_EHA`, `BUS_1553`, `WAIT_EVR`, `CUSTOM_SCRIPT`,
`LIST_DATA_PRODUCTS`, `WAIT_DATA_PRODUCTS`, `CMD`, `CMD_FILE`, `CMD_SCMF`,
`CMD_SSE`, `VENUE_CONFIG_GET`, `VENUE_CONFIG_UPDATE`, `VENUE_CONFIG_CHECK`,
`MANUAL_VERIFICATION`, `ANALYSIS`, `WAIT`, `TIME_REFERENCE`, `TOC`, and more —
enumerate the file directly for the exhaustive, current list). Each entry
defines `elem_type`, `step_type`, a `specification` (default
`authoring_user_input` / `execution_user_input` / `results` shapes), an
`execution.meta_data` template, `executable` (`EXECUTED` or not),
`verifiable`, and a `code` block (`name`/`commit`/`release` — presumably
identifying the executor implementation the `EXECUTION` service should run,
though `core_server` itself does not interpret this field further; this is
a **strong inference**, not confirmed elsewhere in this repository).

**Naming note (observed inconsistency):** the `step_dict` key strings do not
always match the corresponding controller directory name exactly — e.g.
controller `MANUAL_VERFICATION.js` (note the typo) vs. template key
`MANUAL_VERIFICATION`; controllers `Manual_Input.js` / `Manual_EIP.js` /
`GDS.js` / `Environment.js` / `Venue_Config.js` vs. template keys
`MANUAL_INPUT` / `MANUAL_EIP` / `GDS_MANUAL` / `ENVIRONMENT_MANUAL` /
`VENUE_CONFIG_MANUAL`/`_GET`/`_UPDATE`/`_CHECK`. The actual `step_type` value
used for routing/templating is always the swagger operation's `step_type`
parameter or body field, not the controller file name — this is a naming
inconsistency in the codebase, not a functional bug, and is documented here
so it isn't mistaken for a typo in this wiki.

## `api/search_definitions.js`

Exports field maps consumed only by `searchExecution` /
`searchProcedureVersion` in `api/node_funcs.js`. Each map entry's key is a
dotted field path (e.g. `execution.meta_data.status`,
`conversations.comments.content`) and its value declares `replaceable`
(whether a search-and-replace may safely rewrite this field) and `is_html`
(whether the field content must be tokenized before matching, to avoid
matching inside markup). `field_map` groups these by logical category
(`TITLE`, `DESCRIPTION`, `STATUS`, `COMMENT`, `START_TIME`, `DURATION`,
`TIMEOUT`, `LOOKBACK`, `DATA_PATH`, …) — callers can filter a search by these
category names via the `field_filters` search parameter.

## Related pages

- [Architecture](Architecture.md)
- [Data Flow](Data-Flow.md)
- [API Reference](API-Reference.md)
- [Error Handling](Error-Handling.md)
