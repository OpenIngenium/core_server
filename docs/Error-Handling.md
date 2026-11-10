# Error Handling

## Error shapes

Two related but distinct error shapes exist:

1. **Normalized sibling-service error** — produced by
   `transform_axios_error(err)` (`api/node_funcs.js:5716-5764`):
   ```json
   {
     "message": "...",
     "details": ["..."],
     "error_type": "",
     "error_source": "",
     "http_code_at_source": 0
   }
   ```
   Populated from `err.response.data` when the failure came from an axios
   call to ARCHIVE/EXECUTION/DICTIONARY (falling back to `err.message` and
   `err.stack` if the downstream response has no recognizable shape). Nearly
   every `node_funcs.js` function that calls a sibling service rejects with
   this shape on failure.

2. **Controller-facing wrapped error** — produced by
   `push_error(message, err)` (`api/node_funcs.js:5766-5804`): re-serializes
   `err` (via `JSON.stringify`/`JSON.parse`, deliberately avoiding `extend()`
   to sidestep circular-reference issues — see the `ING-4322` comment),
   overwrites `message` with the caller-supplied top-level message, and
   ensures a `details` array exists (pushing `err.message` or
   `util.inspect(err)` into it if nothing else is present). Every
   `*Service.js` catch block calls this before responding.

## Propagation path

```text
axios call to ARCHIVE/EXECUTION/DICTIONARY fails
  → transform_axios_error(err)              [in api/node_funcs.js]
  → Promise.reject(normalized_error)
  → awaited in a *Service.js handler's catch block
  → push_error('Error when <doing X>', normalized_error)
  → res.status(<code>).json(wrapped_error)
```

## HTTP status code selection is inconsistent by design (observed)

Two different patterns exist side-by-side in the controller/service layer:

- **Status-code-aware pattern** (used throughout `ExecutionService.js` and
  several others):
  ```js
  const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
  res.status(status_code).json(err_data);
  ```
  This propagates the *original* HTTP status from the sibling service (e.g.
  a `404` from ARCHIVE surfaces as `404` to the client) when
  `http_code_at_source` was populated, falling back to `400`.

- **Fixed-400 pattern** (used throughout the step-type services, e.g.
  `api/controllers/WAIT_DATA_PRODUCTSService.js`):
  ```js
  res.status(400).json(err_data);
  ```
  Every failure — regardless of whether the underlying cause was a `404`
  from ARCHIVE, a `403` from an authorization check inside `node_funcs`, or
  a network error — surfaces as `400`.

Some `node_funcs.js` functions manually attach `http_code_at_source` to a
rejected object for authorization-style failures they raise directly (e.g.
`continue_execution` rejects with `{message: '...', http_code_at_source:
403}` when the caller is not the test conductor,
`api/node_funcs.js:4282-4287`) — but that code is only honored by callers
using the status-code-aware pattern. Callers using the fixed-400 pattern will
still respond `400` even for these logically-403 conditions. This is a real,
observable inconsistency in the codebase, not a documentation gap — treat it
as something to be aware of when a client needs to distinguish
"forbidden" from "bad request" on step-type endpoints specifically.

## Validation errors

Schema-validation failures (from `swaggerValidator()`) never reach a
controller — they are caught by the final error-handling middleware in
`index.js:318-338` and returned as:
```json
{"message": "Failed schema validation", "details": ["<stringified swagger-tools error>"]}
```
with HTTP status `400`.

## Timeout errors

If a request handler does not respond within `SERVER_TIMEOUT_SEC` (default
290s), `express-timeout-handler` responds `504 {"message": "Core service
timed out"}` (`index.js:35-41`) — this happens regardless of whether the
underlying handler eventually completes; there is no cancellation of
in-flight downstream calls.

## Auth errors

Authentication/authorization failures are generated **before** any
controller runs, directly by the `UserSecurity` handler in `index.js`, and
do not go through `transform_axios_error`/`push_error` at all:
- `401 {"message": "api key was not provided"}` — missing/malformed bearer token
- `403 {"message": "access denied: <jwt error>"}` — token failed `jwt.verify`
- `403 {"message": "user does not have the permission"}` — token valid but
  lacks a required scope

## Best-effort / swallowed errors

Some operations deliberately continue on failure of a non-critical
sub-step, logging rather than propagating:
- `halt_execution` treats a `404` from the EXECUTION service as benign
  ("already closed") and always attempts to reset the archive status to
  `IDLE` even if the halt call itself failed (`api/node_funcs.js:4234-4258`).
- `updateExecutionStatus`'s cascade into `CLOSED`
  (`halt_execution`/`remove_break_points`/`refresh_execution`) logs each
  step's failure independently rather than aborting the whole transition
  (`api/node_funcs.js:4119-4139`).
- `init_file_server()` at startup logs failures but does not stop the
  process (`index.js:91-97`).
- Redis connection errors are logged, not thrown, since (per the code
  comment at `api/node_funcs.js:133-134`) try/catch does not reliably work
  for this Redis client's error events.

## Retries

There is **no retry logic** for calls to ARCHIVE/EXECUTION/DICTIONARY or the
file server, with one narrow exception: `check_bucket` (used only during
`init_file_server` startup) retries up to 10 times, 4 seconds apart, waiting
for the file server to become reachable (`api/node_funcs.js:165-207`). No
circuit breaker, exponential backoff, or request-level retry exists
elsewhere in the codebase.

## Logging on error

Every mutating request's response is logged by the `index.js` response
interceptor (`index.js:206-244`): responses with `status_code < 200 ||
status_code >= 400` are logged at `error`; `run_execution`/
`update_step_result` responses whose embedded `execution.meta_data.status`
is `ERROR` are also logged at `error` (or `warning` for `FAIL`), even when
the HTTP status itself was 200 — i.e. some domain-level failures are
represented as a 200 response with an error status embedded in the body,
not as an HTTP error.

## Related pages

- [Core Components](Core-Components.md#cross-cutting-utilities)
- [Security](Security.md)
- [Data Flow](Data-Flow.md)
- [Troubleshooting](Troubleshooting.md)
