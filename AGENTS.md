# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, etc.) when working with code in this repository. CLAUDE.md is a symlink to this file.

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
bun install       # install application and generator dependencies
bun run dev       # run the documentation application
bun run sync      # fetch the configured OpenAPI contract
bun run generate  # generate and format all SDK outputs
bun run typecheck # type-check TypeScript
bun run lint      # check formatting and lint rules
bun run knip      # find unused files, exports, and dependencies
bun run test      # run focused generator tests
bun run build     # build the static documentation application
```

Run checks through the package scripts. Generated Python additionally supports `python3 -m compileall -q generated/python/src` and `uvx ruff@0.16.2 check generated/python`.

## Architecture

- Downstream API docs and SDK consumers must track this repository's `main` branch. Never introduce a commit SHA or tag pin for `ultralytics/openapi` in Portal, SDK, or related automation.
- `openapi.config.json` points to the sole local or remote API contract. Never duplicate or patch endpoint definitions in a generator.
- `lib/openapi.ts` owns parsing, schema normalization, examples, and operation names shared by documentation and every SDK.
- `lib/generators/` contains language-specific renderers. Add another language only when its implementation is ready; do not add placeholder abstractions.
- `generated/` contains ignored local SDK output and is never committed or edited manually. Change the contract, shared representation, or renderer, then regenerate.
- `components/api-reference.tsx` renders the interactive reference from the same shared operation model. API keys remain in browser memory and never appear in copied examples.
- The documentation uses shadcn's `base-nova` style with Base UI primitives and Ultralytics design tokens.

## Python Output

- Follow the OpenAI client shape: one client, grouped resources, keyword arguments, and environment-based authentication.
- Generate synchronous and asynchronous clients with the same resource tree.
- Generate Google-style docstrings. Types are parenthesized in `Args:`, `Returns:`, and `Raises:` sections.
- Generated SDK packages default to AGPL-3.0 and use the license configured in `openapi.config.json`.

## Conventions

- License headers (`# Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license`) are added automatically by Ultralytics Actions — don't add or revert them manually.
- Generated output must be deterministic and is validated in CI.
- Google-style docstrings, modern type hints, and a 120-character Python line length are formatted by Ruff.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
