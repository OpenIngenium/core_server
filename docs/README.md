# Ingenium Core Server — DeepWiki

This is the technical knowledge base for `core_server`, the backend REST API of
the Ingenium test-procedure platform. It is written for developers who need to
understand, operate, debug, or extend the service — not just run it.

The top-level [`README.md`](../README.md) is the public-facing entry point: it
answers "should I use this and how do I start it". This DeepWiki answers
**"how does this actually work, and how do I change it safely"**. The two are
complementary; this wiki intentionally does not repeat the README's
installation/quick-start instructions except where necessary for context.

## How this wiki is organized

| Page | Answers |
|---|---|
| [Overview](Overview.md) | What the system is, what it does, and the technologies it's built on |
| [Architecture](Architecture.md) | The major components, how they depend on each other, and why the service has the shape it has |
| [Repository Structure](Repository-Structure.md) | What lives in each directory and how the pieces relate |
| [Core Components](Core-Components.md) | Deep dive into `index.js`, `config.js`, `api/node_funcs.js`, the controller/service pairs, `step_definitions.js`, and `search_definitions.js` |
| [API Reference](API-Reference.md) | The REST surface: resources, representative endpoints, auth scopes, and the step-type endpoint pattern |
| [Data Flow](Data-Flow.md) | End-to-end walkthroughs: request lifecycle, execution lifecycle, procedure versioning, redlines, sub-procedure calls, search, import/export |
| [Configuration](Configuration.md) | Every environment variable, where it is read, and its default |
| [Development](Development.md) | Local setup, running the server, and day-to-day dev workflow |
| [Testing](Testing.md) | Jest layout, mocking conventions, and coverage enforcement |
| [CI/CD](CI-CD.md) | The GitHub Actions pipeline |
| [Security](Security.md) | Authn/authz mechanics and what is (and is not) implemented |
| [Error Handling](Error-Handling.md) | How failures propagate from sibling services back to API clients |
| [Extending the System](Extending.md) | How to add a new step type, endpoint, or test |
| [Troubleshooting](Troubleshooting.md) | Known failure modes documented in the code and tests |

## Conventions used in this wiki

- **Observed implementation** — stated directly from the code, with a file
  reference.
- **Strong inference** — a reasonable conclusion drawn from the code, called
  out explicitly as inference rather than as documented fact.
- **Unknown / not documented** — the repository does not contain enough
  information to state this as fact; it is flagged rather than guessed at.
- File paths are relative to the repository root unless otherwise noted.
- Terminology matches the codebase: **procedure** (authored, reusable test
  definition), **execution** (a running/completed instance of a procedure
  against a venue), **element** (the umbrella type for sections, paragraphs,
  and steps), **step** (a typed unit of work, e.g. `CMD`, `WAIT_EHA`), and
  **venue** (`WSTS`, `Testbed`, `ATLO`, `Other` — where an execution runs).
