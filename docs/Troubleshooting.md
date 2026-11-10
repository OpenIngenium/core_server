# Troubleshooting

This page only documents problems that can be traced directly to code
comments, error messages, or configuration in this repository. It does not
speculate about deployment-specific issues.

## `401 {"message": "api key was not provided"}`

Cause, per `index.js:270-304`: the `Authorization` header is missing or does
not start with `Bearer ` (case-insensitive). `Basic` auth is recognized only
for extracting a `req.params.user` username in the response-logging
interceptor (`index.js:144-146`) — it is **not** an accepted authentication
scheme for the `UserSecurity` check itself, so a `Basic` header alone will
still fail here.

## `403 {"message": "access denied: ..."}`

Cause: `jwt.verify(token, public_pem, {algorithms: ['RS256']})` threw
(`index.js:279-286`). Common reasons, grounded in the verification call
itself:
- `PUBLIC_PEM` is unset/empty or does not match the private key that signed
  the token (see [Configuration](Configuration.md#required-vs-optional-in-practice)).
- The token was signed with an algorithm other than `RS256` — the algorithm
  list is hardcoded and will reject anything else.
- The token is expired or otherwise malformed.

## `403 {"message": "user does not have the permission"}`

Cause: the token verified successfully, but its `scopes` claim has no
intersection with the operation's required scopes (`index.js:288-304`). Check
the specific operation's `security:` block in `api/swagger/swagger.yaml`
(see [API Reference](API-Reference.md) and [Security](Security.md)) against
the token's `scopes` claim.

## `400 {"message": "Failed schema validation", "details": [...]}`

Cause: `swaggerValidator()` rejected the request before it reached any
controller (`index.js:318-332`). The `details` array contains the raw
stringified swagger-tools validation error — inspect it for the specific
field/type mismatch against `api/swagger/swagger.yaml`.

## `504 {"message": "Core service timed out"}`

Cause: the handler did not respond within `SERVER_TIMEOUT_SEC` seconds
(default 290 — `index.js:35-41`). Since `core_server` calls out to
ARCHIVE/EXECUTION/DICTIONARY/S3/Redis for nearly every operation, this
usually indicates one of those sibling services (or the network path to it)
is slow or unresponsive rather than a bug in this service's own logic — check
their reachability first (see [Configuration](Configuration.md)).

## "Cannot execute when execution is not idle" / similar 4xx messages from `node_funcs`

Several `node_funcs.js` functions enforce state-machine preconditions and
reject with a descriptive message when violated, e.g.:
- `runExecution`: rejects if `execution.status != 'IDLE'`
  (`api/node_funcs.js:742-744`).
- `pause_execution`: silently no-ops (does not throw, but also does not
  change status) unless `execution.status == 'RUNNING'`
  (`api/node_funcs.js:4260-4268`) — if a pause request appears to do
  nothing, check the execution's current status first.
- `resume_execution` / `suspend_resume_execution`: reject if the
  execution/target execution is not in the expected `SUSPENDED`/`IDLE`
  status, or if the venue is not `AVAILABLE`
  (`api/node_funcs.js:4851-4969`).
- `continue_execution` / `runExecution_`: reject with a "not the current
  test conductor" message if the caller's JWT `username` does not match the
  venue's recorded `test_conductor`.

These are not bugs — they are the execution state machine documented in
[Data Flow](Data-Flow.md#execution-lifecycle) enforcing its invariants. If
you hit one unexpectedly, check the execution's/venue's current state via
`GET /executions/{execution_id}` and `GET /venues/{venue_id}/status`.

## File server / Minio unreachable at startup

`init_file_server()` retries `check_bucket` up to 10 times (4 seconds apart)
before giving up (`api/node_funcs.js:165-207`, `215-217`) and logs
`Failed to connect file_server: <FILE_SERVER_API_HOST>`. Per `index.js:91-97`,
this failure is logged but **does not prevent the server from starting** —
if file upload/attachment endpoints fail while everything else works,
check `FILE_SERVER_API_HOST`/`FILE_SERVER_ACCESS_KEY`/`FILE_SERVER_SECRET_KEY`
and the file server's reachability.

## Redis connection errors

Logged as `Failed to connect execution redis: <error>`
(`api/node_funcs.js:135-137`) rather than thrown, because — per the code
comment at that location — try/catch does not reliably work for this Redis
client's error events. If execution switch-wait coordination
(`GET/POST /executions/{execution_id}/switch_wait...`) behaves unexpectedly,
check `REDIS_HOST`/`REDIS_PORT` connectivity via the logs rather than
expecting an HTTP-level error.

## Coverage threshold failures in CI

If `npm run test:coverage` fails in CI with a threshold violation, check
whether the touched file is in `jest.config.js`'s `fullyCovered` list (100%
required) or the `partiallyCovered`/floor-only exceptions
(`api/controllers/Procedure_VersionsService.js`, `api/node_funcs.js`) — see
[Testing](Testing.md#coverage-enforcement) for exactly which files are held
to which threshold and why.

## Docker build fails to pull the base image

The `Dockerfile` bases on `node:22.23.2-slim` (`Dockerfile:1`). Building this
image requires network access to the configured container registry — if the
pull fails, check your Docker daemon's registry configuration and network
connectivity; this is not a bug in the Dockerfile itself.

## Related pages

- [Error Handling](Error-Handling.md)
- [Configuration](Configuration.md)
- [Data Flow](Data-Flow.md)
- [Development](Development.md)
