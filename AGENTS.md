# AGENTS.md

Repository guidance for coding agents. `CLAUDE.md` is a symlink to this file.

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

## Product Boundary (CRITICAL)

This repository is a standalone, general-purpose OpenAPI-to-SDK and API documentation product, intended to compete with products such as Stainless and Scalar. Third-party users must be able to generate SDKs and documentation for their own APIs without inheriting Ultralytics application behavior.

- Never add Ultralytics ML-package or Platform-specific integrations, endpoint knowledge, credential stores, filesystem conventions, business rules, or dependencies to the converter or its generated defaults. Configurable product names do not make application-specific policy generic.
- Ultralytics-specific SDK behavior belongs in `ultralytics/sdk`, which owns the Python SDK and future language SDKs. Platform API behavior and contracts belong in the Platform repository.
- Extend the converter only with reusable, opt-in capabilities that make sense for independent API providers. Keep language-specific customization under that language's configuration; default generation must remain independent of any consumer.
- Keep consumer customizations reproducible through generation and synchronization. Never hand-edit generated output or make the converter depend on a consumer repository.
- Review every change against this boundary. Relocate application-specific work to its owner instead of teaching the converter about one application.

## Commands and validation

```bash
bun install --frozen-lockfile
bun run generate
bun run typecheck
bun run lint
bun run knip
bun run test
bun run build
```

Use package scripts: `dev`, `build`, and `generate` synchronize the contract first. Bun, Node, uv, and Python are required; the CLI test runs generated Python. Generator changes also require CI's deterministic regeneration, Python compile/import checks, and Ruff checks (`.github/workflows/ci.yml`). `generatePython` deletes its output directory before writing; use only a disposable output path.

## Where to look

- Shared contract interpretation and samples → `lib/openapi.ts`.
- Python output → `lib/generators/python.ts`, `lib/generators/python.test.ts`.
- Generation and synchronization → `scripts/generate.ts`, `scripts/sync.ts`.
- Configuration and fixtures → `openapi.config.json`, `examples/openapi.json`.
- Documentation UI → `app/`, `components/`.

## Conventions

- Ultralytics-owned PyPI packages use `MAJOR.MINOR.PATCH` versions only; no suffixes.
- License headers (`# Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license`) are added automatically by Ultralytics Actions — don't add or revert them manually.
- Generated output must be deterministic and is validated in CI.
- Google-style docstrings, modern type hints, and a 120-character Python line length are formatted by Ruff.

## Pitfalls

- Determinism is enforced (CI generates twice and diffs). Resource order follows the contract's path order via `Map` insertion; exports are sorted explicitly (`resourceExports.sort()`). Avoid timestamps, randomness, or unordered iteration in generator code.
- `format.yml` reformats JSON/Markdown/YAML with Prettier and pushes to your branch; `git pull --rebase` before every push.

Consumers must follow this repository's `main`, never a SHA or tag. Keep contract definitions in the configured input, language output in its renderer, and generated files untracked. API keys stay in browser memory and out of copied examples. Compose the existing Base UI primitives with `render`, not Radix `asChild`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
