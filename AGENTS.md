# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, etc.) when working with code in this repository. CLAUDE.md is a symlink to this file.

Ultralytics OpenAPI (`@ultralytics/openapi`, AGPL-3.0, `private: true` — never published to npm, consumed only from Git) turns one OpenAPI 3.0–3.2 contract into two outputs: an interactive static documentation site (Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn `base-nova` components over Base UI) and a typed Python SDK (sync + async `httpx` clients). Everything runs on Bun; `uv`/`uvx` run Ruff over generated Python and are required for `bun run generate` and `bun run test`. There is no build step for the library code: `package.json` exports `./openapi` → `lib/openapi.ts` as raw TypeScript.

## Core Principles (CRITICAL)

**Less is more. The simplest solution is the best solution.** The action hierarchy for every change: **Delete > Replace > Add**.

1. **Solve at the owner**: Put behavior in the code path that owns or observes it. For fixes, never guard a symptom with a staleness check, initialization flag, skip-first-call branch, or `try/except` around broken logic; relocate the trigger and delete the wrong path. For features, extend the existing owner rather than creating a parallel abstraction.
2. **Search and reuse first**: Search the whole repository before creating a feature, component, helper, workflow, or utility. Reuse or adapt what exists, consolidate in-scope duplication in the shared owner, and delete duplicate paths. Three similar lines beat a helper nobody else calls.
3. **Delete and modify existing code before creating new code**: Bugfixes are net-negative by default unless deletion and relocation are demonstrably impossible. A new file must first prove it cannot fit cleanly in an existing owner.
4. **Keep scope minimal**: Implement only the simplest complete solution. Avoid impossible-state handling, speculative flags, compatibility shims, policy scaffolding, and unrelated cleanup. Tests are out of scope by default — rely on existing coverage and focused validation; only an uncovered, high-risk regression path justifies minimal new test code.
5. **Ship zero-regression, production-ready changes**: Understand what you remove instead of retaining broken code as insurance. Remove unused imports, functions, types, files, and comments; run relevant cleanup checks; and thoroughly debug and validate the changed owner. Do not break existing features or workflows unless the PR intentionally removes them with evidence.

**Review gate:** for every addition, the reviewer decides whether deleting or changing existing code would have fixed the problem instead — if it would, that is a blocking finding. A missing or thin PR description is never itself a finding.

NEVER push to `main`. NEVER force push. Always start work in a new git worktree (`git worktree add`) on a feature branch and open a PR — never edit the primary checkout directly, it may hold in-flight work.

## PR Workflow

After opening a PR:

1. Wait for the automated PR review and auto-format commit from Ultralytics Actions (`format.yml`), then pull and address every finding.
2. Review the full diff in-session against the Core Principles, performance, and the review gate above, then batch the fixes into one commit and push. After each round of bot or human commits, pull and resume the same reviewer on `<last-reviewed-sha>..HEAD` plus anything that delta could have invalidated. Repeat until the local head matches the live head.
3. Hand off or merge only on a clean final pass: one cold full-diff review returning LGTM with no findings, on a head that is still live at merge time.
4. Never fight other commits: Ultralytics Actions pushes auto-format and header commits, and multiple users may work on the same PR. `git pull --rebase` before pushing; never reset or revert commits you did not author.
5. After the PR merges, clean up: remove local worktrees and branches for it, then `git checkout main && git pull`.

## Commands

```bash
bun install --frozen-lockfile   # Bun + uv are the whole toolchain; CI also installs Python 3.11 and 3.14
bun run sync                    # scripts/sync.ts: read `source` from openapi.config.json → public/openapi.json (gitignored)
bun run generate                # sync → scripts/generate.ts → generated/python (deleted and rewritten) → uvx ruff@0.16.2 format → scripts/headers.ts
bun run dev                     # sync → next dev (docs at http://localhost:3000; rewrites the nextjs-agent-rules block at the end of this file)
bun run build                   # sync → next build (static export to out/) → scripts/headers.ts out
bun run typecheck               # next typegen && tsgo --noEmit (works without public/openapi.json)
bun run lint                    # biome check . (lint:fix writes); generated/, public/openapi.json, .next, out are excluded in biome.json
bun run knip                    # knip --exclude binaries (no knip.json; exports of lib/openapi.ts are public via package.json "exports")
bun run test                    # bun test — the single test file lib/generators/python.test.ts (20 tests, ~2 s); needs uv + python3
bun test lib/generators/python.test.ts -t "multipart"   # filter tests by name

# Generated-Python checks that CI runs after `bun run generate` (Python 3.11 and 3.14)
python3 -m compileall -q generated/python/src
uv pip install --system ./generated/python       # CI then imports <python.package>.<python.client> and Async<python.client>
uvx ruff@0.16.2 check generated/python

# Generate for a consumer's configuration (relative paths inside it resolve against that file; output still lands in generated/python)
OPENAPI_CONFIG=../sdk/openapi.config.json bun run generate
```

Run checks through the package scripts. Generated Python additionally supports `python3 -m compileall -q generated/python/src` and `uvx ruff@0.16.2 check generated/python`.

- `dev`, `build`, and `generate` always sync first; `typecheck`, `lint`, `knip`, and `test` do not touch the contract. Never run `next build` directly: both `next.config.ts` (`generateBuildId` hashes `public/openapi.json`) and `app/page.tsx` (`readFileSync("public/openapi.json")`) fail with `ENOENT` without a prior sync.
- Workflows in `.github/workflows/`:
  - `ci.yml` (CI) — on PRs, pushes to `main`, a daily cron, and manual dispatch; one `Test` job per Python version (3.11, 3.14), 15-minute timeout. Steps in order: `bun install --frozen-lockfile`; `bun run generate` twice with `diff --recursive` between the two outputs (determinism gate); `bun run typecheck && bun run lint && bun run knip && bun run test && bun run build` (lint IS in CI here); `python -m compileall -q generated/python/src`; `uv pip install --system ./generated/python` followed by importing the configured client and `Async` client; `uvx ruff@0.16.2 check generated/python`.
  - `format.yml` (Ultralytics Actions) — on PR open/sync/close/review-request and new issues; runs Ruff on Python, Prettier on YAML/JSON/Markdown/CSS (`.prettierignore` excludes `public/openapi.json`), codespell, Lychee link checks, AI labels and PR summary, and pushes auto-format commits to the PR branch. `python_docstrings: false` is deliberate — generated Google-style docstrings are owned by the generator.
  - `cla.yml` — CLA check on PR open/reopen/sync and on `recheck`/signature comments.
  - `.github/dependabot.yml` — weekly npm and GitHub Actions update PRs labeled `dependencies`.

## Conventions

- Ultralytics-owned PyPI packages use `MAJOR.MINOR.PATCH` versions only; no suffixes.
- License headers (`# Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license`) are added automatically by Ultralytics Actions — don't add or revert them manually.
- Generated output must be deterministic and is validated in CI.
- Google-style docstrings, modern type hints, and a 120-character Python line length are formatted by Ruff.

## Product Boundary (CRITICAL)

This repository is a standalone, general-purpose OpenAPI-to-SDK and API documentation product, intended to compete with products such as Stainless and Scalar. Third-party users must be able to generate SDKs and documentation for their own APIs without inheriting Ultralytics application behavior.

- Never add Ultralytics ML-package or Platform-specific integrations, endpoint knowledge, credential stores, filesystem conventions, business rules, or dependencies to the converter or its generated defaults. Configurable product names do not make application-specific policy generic.
- Ultralytics-specific SDK behavior belongs in `ultralytics/sdk`, which owns the Python SDK and future language SDKs. Platform API behavior and contracts belong in the Platform repository.
- Extend the converter only with reusable, opt-in capabilities that make sense for independent API providers. Keep language-specific customization under that language's configuration; default generation must remain independent of any consumer.
- Keep consumer customizations reproducible through generation and synchronization. Never hand-edit generated output or make the converter depend on a consumer repository.
- Review every change against this boundary. Relocate application-specific work to its owner instead of teaching the converter about one application.

## Downstream Consumers (what a merge to `main` ships immediately)

Both consumers track this repository's `main` with no pin, so every merged commit is live in their next CI run or build. Treat these surfaces as public API:

- **`ultralytics/portal`** (Platform docs and contract). `apps/alpha/package.json` script `openapi:main` is exactly `bun add --dev --no-save @ultralytics/openapi@github:ultralytics/openapi#main`; alpha's `dev`, `build`, `api-docs`, and `openapi` scripts run it, and portal CI asserts that string before refreshing. Portal's `scripts/generate-openapi.ts` then calls `(await import("@ultralytics/openapi/openapi")).addPythonCodeSamples(document, { client, environment, package })` on an `openapi: "3.2.0"` document that portal generated itself, and alpha's `next.config.mjs` lists the package in `transpilePackages`. Contract: the `./openapi` export path, the `addPythonCodeSamples(document, PythonCodeSampleConfig)` signature, the `OpenApiDocument` type, `x-codeSamples` entries labeled `"Python SDK"`, and acceptance of 3.2.0 documents. `lib/openapi.ts` must stay import-free and isomorphic — it runs in the browser (`components/api-reference.tsx`), in Bun scripts here, and inside portal's generator and Next build.
- **`ultralytics/sdk`** (`ultralytics-platform` on PyPI). Its `ci.yml` checks out `ultralytics/openapi` at `ref: main` into `.generator/`, runs `bun install --frozen-lockfile` and `OPENAPI_CONFIG=<sdk>/openapi.config.json bun run generate`, then `diff --recursive sdk/python .generator/generated/python`. Any byte of changed Python output fails every sdk PR until sdk's `Live` job (main push, daily, or dispatch) regenerates and auto-merges an "Update Platform API contract" PR whose branch hash includes this repository's `main` SHA. sdk's config exercises `header`, `python.cli` (`ul` from `cli.py`), `python.authProvider` (`auth.py`), `python.readme`, omits `python.version` (so the version is the contract's `info.version`), and carries an sdk-only `upstream` key that `getConfig` neither validates nor reads. Contract: every key in `lib/config.ts` `OpenApiConfig`, the `generate` script name, the `generated/python` output path, `bun.lock` installing with `--frozen-lockfile`, and deterministic output.
- Before merging a generator change, reproduce the sdk drift check locally: `OPENAPI_CONFIG=/path/to/sdk/openapi.config.json bun run generate && diff -r generated/python /path/to/sdk/sdk/python` — a non-empty diff is expected only when the change intends to alter the published SDK, and it means sdk CI goes red until its `Live` job runs.

## Architecture

- Downstream API docs and SDK consumers must track this repository's `main` branch. Never introduce a commit SHA or tag pin for `ultralytics/openapi` in Portal, SDK, or related automation.
- `openapi.config.json` points to the sole local or remote API contract. Never duplicate or patch endpoint definitions in a generator.
- `lib/openapi.ts` owns parsing, schema normalization, examples, and operation names shared by documentation and every SDK.
- `lib/generators/` contains language-specific renderers. Add another language only when its implementation is ready; do not add placeholder abstractions.
- `generated/` contains ignored local SDK output and is never committed or edited manually. Change the contract, shared representation, or renderer, then regenerate.
- `components/api-reference.tsx` renders the interactive reference from the same shared operation model. API keys remain in browser memory and never appear in copied examples.
- The documentation uses shadcn's `base-nova` style with Base UI primitives and Ultralytics design tokens.

Paths below are relative to the repository root.

**Data flow.** `lib/config.ts` `getConfig()` reads `OPENAPI_CONFIG` or `openapi.config.json`, throws on a missing `source`, `name`, `apiKey.environment`, `python.client`, `python.package`, or `python.project`, defaults `python.install` to `pip install <project>` and `license` to this repository's AGPL-3.0 `LICENSE`, and resolves relative `source`, `license.file`, `python.readme`, `python.authProvider`, and `python.cli.source` against the config file's directory. `scripts/sync.ts` loads `source` (local file, or `https://` with `redirect: "error"`; `http://` is rejected), requires `openapi`, `info`, and `paths` keys, and writes `public/openapi.json`. Two consumers read that one file: `app/page.tsx` (Server Component, `readFileSync`) hands the document plus `apiKey.environment`, `python`, and `specUrl` to the client `ApiReference`, and `scripts/generate.ts` calls `generatePython(document, config, "generated/python")`. Both go through `lib/openapi.ts` `getOperations(document)`, which flattens `paths` into `ApiOperation[]`: `id` (`operationId`, else `<method>-<path>`, de-duplicated with `-2`, `-3`, …), `tag` (first tag, else `"Other"`), `resource` (`sdkIdentifier(tag)`), `sdkMethod`, parameters merged from path-item and operation level with `$ref`s resolved, resolved `requestBody`/`responses`, and `server` (operation → path item → document).

- `lib/config.ts` — `OpenApiConfig` (the full configuration schema; README "Configure" documents it for users) and `getConfig()`; `configPath` is also hashed by `next.config.ts`.
- `lib/openapi.ts` (no imports; browser-safe) —
  - Types: `JsonSchema`, `Parameter`, `OpenApiDocument`, `ApiOperation`, `SdkArgument`, `PythonCodeSampleConfig`, `ApiAuthentication`.
  - Identifiers: `sdkIdentifier` (camelCase and punctuation become `snake_case`, possessives are stripped, Python keywords get a trailing underscore, leading digits get a leading underscore), `allocateSdkIdentifiers` (collision suffixes `_<location>` then `_2`, `_3`, …; reserves `self`, `extra_headers`, `timeout`).
  - Method naming: `sdkMethodCandidates` + `SDK_VERBS` (`get`→`retrieve`/`list`, `post`→`create`, `put`/`patch`→`update`, `delete`→`delete`) — `x-sdk-method` wins (validated as a lowercase identifier, unique per resource), else the static path leaf after the resource segment, else the verb; a leafless GET with a path parameter is `retrieve` unless its summary starts with list/view/search. `getOperations` resolves collisions per resource (canonical names first, GET keeps the bare leaf, then `<leaf>_<parent>` / `<verb>_<leaf>`, then `_2` suffixes).
  - Arguments: `sdkArguments` — path params are positional-required, everything else keyword; a JSON/form/multipart object body is flattened into per-property keyword arguments unless it contains `oneOf`/`anyOf`, incompatible closed `allOf` branches, `additionalProperties` schemas, or `minProperties`/`maxProperties`, in which case a single `body` argument (`wholeBody: true`) is emitted. `readOnly` properties are skipped.
  - Auth: `getAuthentication` accepts only single-scheme security requirements that are `apiKey` in `header` or `http` `bearer` (returns `{ header, prefix }`); `getAuthenticationMode` → `none`/`optional`/`required`.
  - Servers: `resolveServerUrl(document, origin, operation?)`, `expandServerUrl` (substitutes `variables[*].default`); relative server URLs resolve against `http://localhost:3000` in the generator and `window.location.origin` in the browser.
  - Schemas: `resolveSchema` (local `#/components/schemas/` only, sibling keys and `properties`/`required` merged over the target, cycle-safe), `objectSchema` (merges `allOf` and object-shaped `anyOf`/`oneOf` into one object schema), `schemaExample`/`stringExample`/`schemaMatches` (example synthesis: `example` → `default` → `const` → first matching `enum` value → union/variant walk → format-aware strings), `schemaLabel`, `schemaConstraints`, `schemaFields`.
  - Responses: `successMediaEntries`/`successMedia`/`successSchema` (exact `2xx` codes first, else `2XX`; distinct shapes become `oneOf`), `requestMedia` (`preferredMedia` order: `application/json`, `+json`, form/multipart, `text/*`, first listed).
  - Samples and requests: `pythonCodeSample`, `addPythonCodeSamples` (rewrites the `"Python SDK"` entry of each operation's `x-codeSamples`), `curlCodeSample` (uses the `YOUR_API_KEY` placeholder), `requestBodyExample`, `buildApiRequest` (URL, headers, and `BodyInit` for the docs "Send" button; refuses cookie parameters and missing required parameters). The docs UI does not render `x-codeSamples`; it regenerates samples live from the current form values.
- `lib/generators/python.ts` — `generatePython(document, config, output)` → `prepare` (calls `getOperations`, then `validateOperation`, which throws `Unsupported …` for: security requirements with no supported scheme, non-`simple` path styles, `allowReserved` query params, array/object header or cookie params, schema-less request bodies, request `encoding`, and mixed JSON/text/binary success media) → `rm -rf output` → writes files. Rendering: `pythonType` (JSON Schema → `str`/`int`/`float`/`bool`/`Sequence[...]` for arguments and `list[...]` for responses/`dict[str, Any]`/`BinaryIO`/`Literal[...]`/`| None`), `docstring` (Google style, `Args:` types in parentheses), `methodSource` (one `self._client.request(...)` call with `params=[*_query_parameter(...)]`, `json=`/`data=_form_data(...)`/`files=`/`content=`, `auth=(header, prefix)`, `text=True` for text responses), `resourceSource`, `modelSource` (functional `TypedDict`s in `types.py` named `<Tag><Method>Response`, nested `…<Field>Item`, `NotRequired` for optional fields, wire keys preserved), `clientSource`/`apiClientSource` (the runtime: `_resolve_api_key`, `NotGiven`/`NOT_GIVEN`, `_path_parameter`, `_query_parameter`, `_form_data`, `_retry_delay`, `SyncAPIClient`/`AsyncAPIClient.request`), `EXCEPTIONS_SOURCE` (`APIError(status_code, body, request_id)` with `.json`, `APIConnectionError`), `publicClientSource` (`<Client>`/`Async<Client>` with `api_key`, `base_url`, `timeout=60.0`, `max_retries=2`, `http_client`, context managers). All Python lives inside TypeScript template literals — escape `\`, `${`, and backticks, and remember Ruff reformats the output afterwards.
  - Generated layout: `pyproject.toml` (`uv_build` backend, `httpx>=0.28,<1`, `[tool.ruff] line-length = 120`, `[project.scripts]` only with `python.cli`), `README.md`, `LICENSE`, `src/<package>/{__init__.py,_client.py,_exceptions.py,client.py,async_client.py,types.py,py.typed}`, `src/<package>/resources/{__init__.py,<resource>.py}`, plus optional `_auth.py` (copied `python.authProvider`), `cli.py` (copied `python.cli.source`), and `_cli_metadata.py` (`MULTIPART_FILES` mapping `resource.method` → binary field names of whole-body multipart operations).
  - Runtime behavior worth knowing before "fixing" a client bug: the auth header is added only when a key resolved (explicit → `apiKey.environment` → provider; `""` disables) and the operation has auth; retries apply to GET/HEAD/OPTIONS on connection errors and 408/409/429/5xx, plus 429 for JSON-bodied requests, honoring `Retry-After` (≤ 60 s) else `0.5·2^attempt` capped at 8 s; 204/empty → `None`, JSON media → parsed, `text=True` or `text/*` → `str`, else `bytes`.
- `components/api-reference.tsx` (`"use client"`) — `ApiReference` (API key held in React state only, ⌘/Ctrl+K focuses search, selection via URL hash `#operation=<id>`), `OperationNavigation`, `OverviewPanel` (version badges, "Download OpenAPI contract" from `specUrl`, servers, security schemes, Python quick start), `OperationPanel` (parameter inputs, body textarea seeded by `requestBodyExample`, file inputs for binary multipart fields, "Send" = `buildApiRequest` + browser `fetch`, so the target API must allow CORS), `codeExamples` (live cURL + Python), `Markdown` (react-markdown). `components/ui/*` are shadcn `base-nova` copies over `@base-ui/react` — compose with `render={<a … />}`, never Radix `asChild`. `components/logo.tsx` + `app/icon.svg` + `--brand-gradient-*` in `app/globals.css` are the only branding hooks.
- `app/` — `layout.tsx` (title `${config.name} Reference`, Geist fonts, skip link), `page.tsx`, `globals.css` (Tailwind v4 CSS-first with oklch tokens; no tailwind config), `icon.svg`. `next.config.ts`: `output: "export"`, `basePath` from `docs.basePath`, and `generateBuildId` = SHA-256 of `app/`, `components/`, `lib/`, `bun.lock`, `package.json`, `next.config.ts`, `postcss.config.mjs`, the config file, and `public/openapi.json`, so `out/` is byte-stable for the same inputs.
- `scripts/` — `sync.ts`, `generate.ts` (Python only; a new language is wired here), `headers.ts` (prepends `header` to `.html`, `.css`, `.js`, `.py`, `.toml` files under the given directories; a no-op when `header` is unset, which is the case for this repository's own config).
- `examples/openapi.json` — OpenAPI 3.1 fixture (7 paths, 8 operations) covering server variables, bearer auth, `allOf`/`anyOf`/`oneOf`, nullable, `writeOnly`, binary multipart, text and empty responses. It is both the `source` of the repository's `openapi.config.json` and the test fixture.

## Python Output

- Follow the OpenAI client shape: one client, grouped resources, keyword arguments, and environment-based authentication.
- Generate synchronous and asynchronous clients with the same resource tree.
- Generate Google-style docstrings. Types are parenthesized in `Args:`, `Returns:`, and `Raises:` sections.
- Generated SDK packages default to AGPL-3.0 and use the license configured in `openapi.config.json`.

## Where to look

- Wrong resource or method name in the SDK, docs sample, or `x-codeSamples` → `sdkIdentifier`, `sdkMethodCandidates`, and the collision pass in `getOperations` (`lib/openapi.ts`); contracts can pin a name with `x-sdk-method`.
- Wrong keyword arguments or a body that should/shouldn't be flattened → `sdkArguments`; Python-side rendering of those arguments → `methodSource`.
- Wrong Python type, `TypedDict`, or nullability → `pythonType`, `isNullable`, `literalValues`, `modelSource` in `lib/generators/python.ts`.
- `bun run generate` throws `Unsupported …` / `Unknown … reference` → `validateOperation` (python.ts) or `componentName`/`resolveParameter`/`resolveRequestBody`/`resolveResponse` (openapi.ts). Add opt-in, contract-driven support or fix the contract; never special-case one API (Product Boundary).
- Wrong example values in docs or samples → `schemaExample`, `stringExample`, `authoredSchemaExample`, `requestBodyExampleValue`, `pythonCodeSample`, `curlCodeSample`.
- HTTP behavior of generated clients (auth header, retries, encoding, response decoding) → `clientSource`/`apiClientSource`; errors → `EXCEPTIONS_SOURCE`; constructor surface → `publicClientSource`.
- Package metadata (`pyproject.toml`, README, LICENSE, CLI entry point, version validation) → the tail of `generatePython`.
- Docs page bug → `components/api-reference.tsx`; shell/metadata → `app/layout.tsx`; theme tokens → `app/globals.css`; static export/base path → `next.config.ts`.
- New configuration key → `OpenApiConfig` + `getConfig` in `lib/config.ts`, consume it in the generator or page, document it in the "Configure" section of `README.md` and `README.zh-CN.md`.
- New language → `lib/generators/<lang>.ts` exporting `generate<Lang>(document, config, output)` built on `getOperations`/`sdkArguments`, a `<lang>` block in `OpenApiConfig`, a call in `scripts/generate.ts`, a sibling `.test.ts`, and matching CI validation steps in `.github/workflows/ci.yml`.
- Header/licensing of emitted files → `scripts/headers.ts` and the `header`/`license` config keys.

## Gotchas

- `generatePython` deletes the output directory before writing. Never point `output` at a directory you care about; CI and the sdk repo rely on this to drop stale files.
- Determinism is enforced (CI generates twice and diffs). Resource order follows the contract's path order via `Map` insertion; exports are sorted explicitly (`resourceExports.sort()`). Avoid timestamps, randomness, or unordered iteration in generator code.
- `openapi.config.json` and `examples/openapi.json` are the test fixtures: `python.test.ts` imports the config, expects 8 operations, package `example_api`, client `Example`, the `Repository` URL, authors, and classifiers. Editing either file changes test expectations.
- `bun run test` executes Python: the CLI test runs `uv run --no-project --python python3 --with <generated>` twice. Without `uv` and `python3` on `PATH` that test fails.
- Ruff reformats generated Python after generation, so formatting inside the template literals is irrelevant, but syntax errors only surface in CI's `compileall`/import step — run those locally after touching `python.ts`.
- `python.version` omitted → the contract's `info.version` is used and must match `^\d+(\.\d+)*((a|b|rc)\d+)?(\.post\d+)?(\.dev\d+)?$`, otherwise generation throws `Set python.version …`.
- Every `sync` overwrites `public/openapi.json` (gitignored) from `source`; `source` must be a local path or `https://` (no `http://`, no redirects). A stale `public/openapi.json` is the usual reason docs and `generated/` disagree — re-run `bun run sync`.
- `tsconfig.json` excludes `generated/`, and Biome/Prettier ignore `generated/` and `public/openapi.json`; `tsconfig.tsbuildinfo`, `.next/`, `out/`, `.idea/` are gitignored — never commit them.
- `format.yml` reformats JSON/Markdown/YAML with Prettier and pushes to your branch; `git pull --rebase` before every push.
- `next dev` rewrites the `nextjs-agent-rules` block at the bottom of this file (see the block's own note); commit it rather than reverting it.
- `knip` has no config file: anything exported from `lib/openapi.ts` counts as public API (package `exports`), while an unused export elsewhere fails `bun run knip`.

## Tests

- One test file: `lib/generators/python.test.ts` (`describe("Python generator")`). `beforeAll` generates into a `mkdtemp` directory from `examples/openapi.json` with the repository `openapi.config.json`, after planting `stale.py` to prove the output is wiped. Tests clone the fixture with `structuredClone`, mutate schemas to hit edge cases, and assert on generated source text, thrown messages, `getOperations` naming, `sdkArguments`, `schemaExample`, `buildApiRequest`, and `curlCodeSample`. Separate temp directories cover `python.cli` (runs the generated CLI through `uv run`) and `python.readme`/`python.authProvider`.
- CI is the only place the generated package is installed and imported (`uv pip install --system ./generated/python`, then `importlib.import_module(package)` and `getattr(m, client)`/`getattr(m, "Async" + client)`), compiled, and Ruff-checked on Python 3.11 and 3.14.
- There are no browser or E2E tests; `bun run typecheck`, `bun run lint`, and `bun run build` are the only checks on `app/` and `components/`. Verify UI changes in `bun run dev`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
