# Security

This page documents what is **actually implemented** in this repository. It
does not assert the service is "secure" — only what mechanisms exist and
where their boundaries are.

## Authentication: RS256 JWT

Every request (except the exceptions below) must carry
`Authorization: Bearer <jwt>`. The `UserSecurity` handler registered with
`swaggerTools.swaggerSecurity()` (`index.js:259-306`) does the following on
every request that reaches it:

1. If the operation's `required_scopes` is an explicitly **empty array**,
   skip verification entirely and call back with no error (`index.js:265-267`)
   — see [the health exception](#the-health-exception).
2. Read `Authorization` (or `authorization`) from request headers; if it does
   not start with `bearer ` (case-insensitive), respond `401
   {"message": "api key was not provided"}` and end the response directly
   (`index.js:301-304`).
3. Otherwise, verify the token with `jwt.verify(token, public_pem, {
   algorithms: ['RS256']})`. **`RS256` is hardcoded** — no other algorithm is
   accepted, and critically, `public_pem` (from `config.public_pem` /
   `PUBLIC_PEM`) means the server verifies against a public key, not a
   shared secret, consistent with an external identity provider signing
   tokens with a private key this service never sees.
4. On verification failure, respond `403 {"message": "access denied:
   <error>"}` (`index.js:279-286`).
5. On success, decode the token's `scopes` claim and intersect it with the
   operation's `required_scopes` (via `lodash.intersection`); if the
   intersection is non-empty, proceed with `req.jwt = decoded` set; otherwise
   respond `403 {"message": "user does not have the permission"}`
   (`index.js:288-304`).

`core_server` never issues, refreshes, or stores tokens — it is a **verifier
only**. Where tokens come from (an SSO/identity provider) is outside this
repository and not documented here.

## Authorization: scopes

Scopes are declared once, document-wide, in
`api/swagger/swagger.yaml#securityDefinitions.UserSecurity.scopes`:

| Scope | Declared meaning (verbatim from the spec) |
|---|---|
| `admin` | Administrative permission such as adding venues, managing users, etc. |
| `execute:wsts` | Execute procedures on WSTS Venues |
| `execute:testbed` | Execute procedures on Testbed Venues |
| `execute:sit` | Execute procedures on System I&T Venues |
| `execute:other` | Execute procedures on other Venues |
| `config_mgmt` | Make changes to project configurations such as command dictionary |
| `imcm` | Information management configuration management to release procedure |
| `test_lead` | Test lead |
| `author` | authoring procedure |
| `basic` | basic level permission that includes adding comments |

The document-level `security:` block lists **all ten** scopes as the
default — i.e. any authenticated user with at least one of the ten scopes
can call an operation that does not declare its own narrower `security:`
block. Individual operations narrow this: e.g. `POST /executions` requires
one of `execute:wsts`/`execute:testbed`/`execute:sit`/`execute:other`
specifically, and `POST /logging` requires `admin` only. **Scope
requirements are declared per-operation in the spec** — consult
`api/swagger/swagger.yaml` for any specific endpoint rather than assuming
the document default applies.

### Why OAuth2 for a JWT-only API?

`api/swagger/swagger.yaml`'s own comment (lines 16-20) explains this
directly: Swagger 2.0's native `apiKey` security type has no concept of
scopes, so the spec declares `type: oauth2` (`flow: implicit`) purely as a
vehicle to let `swagger-tools` enforce per-operation scopes — there is
**no actual OAuth2 authorization-code/implicit flow** implemented or
expected; `authorizationUrl: www.sample.com` is a placeholder, never used.

## The health exception

`GET /health` declares `security: []` (an explicitly empty array) in
`api/swagger/swagger.yaml`, which the `UserSecurity` handler special-cases
to skip verification entirely (`index.js:265-267`). This is the **only**
endpoint that requires no token at all — confirmed by inspecting every
operation's `security:` block; all others either use the document default
or declare a non-empty scope list.

## Transport security

`api/swagger/swagger.yaml` declares `schemes: [http]`, and `index.js` calls
`http.createServer(app)` (not `https`). **TLS is not implemented in this
repository** — if this service is exposed over HTTPS in any deployment, that
termination happens outside this codebase (a reverse proxy/load balancer).
This is an **observed absence**, not a claim about how it is deployed in
practice (unknown/not documented here).

## Execution Monitor socket secret

`EMS_SECRET` (`config.ems_secret`) is sent as a `secret` query parameter when
opening the Socket.IO connection to the Execution Monitor (`index.js:58-62`).
This repository does not implement or document how the Execution Monitor
uses this secret to authenticate the connection — that logic lives in the
Execution Monitor service, outside this repository.

## Input validation

Request bodies/parameters are validated against the JSON-Schema-like
definitions in `api/swagger/swagger.yaml` by `swaggerValidator()`
middleware — invalid requests are rejected with `400` before reaching any
controller (`index.js:308-338`). Beyond schema-shape validation, individual
`node_funcs.js` functions perform some semantic checks (e.g. "cannot resume
an execution that is not suspended"), but there is no centralized
input-sanitization layer (e.g. HTML sanitization, SQL/NoSQL injection
filtering) visible in this repository — `core_server` has no direct database
access, so classic injection surfaces would live in the ARCHIVE service, not
here.

## Body size limits

`body-parser` is configured with a **500 MB** limit for both JSON and
urlencoded bodies (`index.js:46-47`), explicitly to accommodate large file
uploads through the swagger middleware. This is a functional accommodation,
not a security control — there is no separate request-size-based rate
limiting or throttling implemented.

## What is not implemented (observed absence)

- No rate limiting or brute-force protection on authentication attempts.
- No CORS configuration visible in `index.js` (no `cors` package in
  `package.json`, no manual `Access-Control-*` headers set).
- No CSRF protection (expected for a token-based API with no cookie
  session, but noted for completeness).
- No secrets-management integration (e.g. Vault) — secrets
  (`PUBLIC_PEM`, `FILE_SERVER_SECRET_KEY`, `EMS_SECRET`) are plain
  environment variables.
- No `SECURITY.md` or documented vulnerability-disclosure process (also
  noted in the top-level README).

## Related pages

- [Configuration](Configuration.md) — `PUBLIC_PEM`, `EMS_SECRET`, file-server credentials
- [API Reference](API-Reference.md) — per-resource scope requirements
- [Error Handling](Error-Handling.md) — how auth failures surface to clients
