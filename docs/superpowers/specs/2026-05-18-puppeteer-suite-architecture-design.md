# Puppeteer Suite — Complete Architecture Spec

**Date:** 2026-05-18
**Status:** Approved (pending user spec review)
**Type:** North-star architecture spec spanning two repositories. This is the
complete vision; implementation phasing is decided later in the implementation
plan(s), not here. Nothing in this document is descoped.

## 1. Purpose

A comprehensive, reusable Puppeteer capability suite so that starting a new
browser-automation project never begins from scratch. Two repositories:

- **`Puppeteer-Packages`** — a publishable pnpm monorepo of ~19 independently
  versioned TypeScript packages under the npm scope `@technical-1`. The
  capability library, installed à la carte.
- **`Puppeteer-Template`** — a templates repository (the existing repo, currently
  seeded with the Kanfer D-Toolkit code). Runnable starter applications that
  *consume* the published `@technical-1/*` packages. Cloned and shaped per
  project; never contains package source.

Consumers may install the published packages with any package manager (npm,
pnpm, yarn, bun) — the npm registry is package-manager-neutral. The internal
pnpm tooling is a maintainer concern only.

The Kanfer D-Toolkit repo (`Technical-1/Kanfer-D-Toolkit`) is unrelated to this
work and is left untouched.

## 2. Repository Relationship

```
Puppeteer-Packages (publish) ──npm registry──> @technical-1/*
        ▲                                            │
        │ pnpm link / pnpm pack / changeset canary   │ npm|pnpm|yarn install
        │ (cross-repo dev only)                      ▼
Puppeteer-Template (clone & shape) ── depends on published @technical-1/* ──>
```

- Templates depend on **published** `@technical-1/*` version ranges, decoupled
  from package source.
- Cross-repo development (changing a package and testing it inside a template)
  uses `pnpm link --global`, `pnpm pack`, or a Changesets canary/prerelease
  publish. This is a documented workflow, not a structural coupling.

## 3. Locked Decisions

| Decision | Value |
|---|---|
| npm scope | `@technical-1` (user already owns this scope; `@technical-1/email-archive-parser` is published) |
| Language | TypeScript → compiled to ESM + CJS + `.d.ts` |
| Packages monorepo tooling | pnpm workspaces + Changesets + Turborepo |
| Distribution | Packages published to npm; templates cloned and consume published versions |
| Packages repo | https://github.com/Technical-1/Puppeteer-Packages.git |
| Templates repo | https://github.com/Technical-1/Puppeteer-Template.git (exists, seeded) |
| Naming constraint | The string "autom8ops" must never appear anywhere in either repo |

## 4. Cross-Cutting Conventions

These keep all ~19 packages coherent and independently usable.

1. **`puppeteer-core` is a `peerDependency`** on every package that drives a
   browser. The consumer owns the Puppeteer/Chrome version; packages never bundle
   it. `chrome-setup` additionally depends on `@puppeteer/browsers` (it is the
   package whose job is fetching Chrome).
2. **`@technical-1/core`** is the foundational package. It contains:
   - Shared TypeScript types and common option shapes.
   - A typed error hierarchy: `PptrKitError` (base) → `SelectorNotFoundError`,
     `NavigationError`, `TimeoutError`, `CaptchaError`, `ProxyError`,
     `SessionError`.
   - The `Logger` **interface** (not an implementation).
   Every capability package depends on `core` for shared contracts. Packages
   may also depend on clearly lower-level **utility** packages (`retry`,
   `logger`, `config`), but the dependency graph must remain **acyclic** and no
   two *capability* packages may cross-depend. This guarantees no circular
   dependencies, genuine interoperability, and that any capability package is
   usable standalone (pulling at most `core` + a utility or two).
3. **Dependency-injected logging.** Packages accept an optional
   `logger?: Logger` parameter and never import a logger implementation.
   `@technical-1/logger` ships a console implementation and an EventEmitter
   implementation. The EventEmitter implementation is what lets the Electron
   template stream package log lines into its UI panel without any package
   knowing Electron exists.
4. **Function-first APIs**, stateless where possible. Classes only where
   lifecycle/state is intrinsic (`launcher` pool, `session` store).
5. **Per-package layout:** `src/` TypeScript → `dist/` (ESM + CJS + `.d.ts` via
   `tsup`), an `exports` map in `package.json`, its own `vitest` suite, its own
   `README.md`, `peerDependencies` declared, side-effect-free for tree-shaking.
6. **Result/error contract:** functions throw typed errors from `core`; they do
   not return ad-hoc `{success:false}` shapes. Templates translate thrown errors
   into their UI/CLI surface.

## 5. Package Catalog (`Puppeteer-Packages`)

All names are `@technical-1/<name>`.

| Package | Responsibility | Key deps |
|---|---|---|
| `core` | Shared types, error hierarchy, `Logger` interface, option shapes | none (no runtime deps) |
| `chrome-setup` | Download/resolve a Chrome build; cross-platform path resolution (from Kanfer `chrome-path` + `download-chrome`) | `@puppeteer/browsers` |
| `launcher` | Launch options, headless toggle, browser/context **pool** for concurrency | `core`, peer `puppeteer-core` |
| `navigation` | `goto` with retry, `waitUntil` strategies, SPA/network-idle wait helpers | `core`, `retry`, peer `puppeteer-core` |
| `interaction-helpers` | `safeClick`, `safeType`, `waitAndGet`, `scroll` (from Kanfer, hardened) | `core`, peer `puppeteer-core` |
| `stealth` | `puppeteer-extra-plugin-stealth` wrapper + fingerprint hardening | `core`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` |
| `proxy` | Proxy config, rotation, authenticated proxies | `core`, peer `puppeteer-core` |
| `session` | Persist/restore cookies + localStorage; login reuse | `core`, peer `puppeteer-core` |
| `fingerprint` | UA / viewport / locale / timezone randomization | `core`, peer `puppeteer-core` |
| `human` | Humanized delays, mouse paths, typing cadence | `core`, peer `puppeteer-core` |
| `extract` | Table/list/schema-driven extraction helpers | `core`, peer `puppeteer-core` |
| `screenshots` | Timestamped, full-page, element capture (from Kanfer) | `core`, peer `puppeteer-core` |
| `pdf` | Page → PDF with sane defaults | `core`, peer `puppeteer-core` |
| `downloads` | Intercept/await file downloads to a target directory | `core`, peer `puppeteer-core` |
| `retry` | Generic backoff/retry wrappers (used by other packages) | `core` |
| `logger` | `Logger` implementations: console + EventEmitter (UI-streamable) | `core` |
| `network` | Request interception, resource blocking, HAR capture | `core`, peer `puppeteer-core` |
| `captcha` | Solver **adapter interface** + reference 2captcha adapter. **No bundled credentials**; API key supplied by the consumer via `config`. Explicit external paid-service boundary. | `core` |
| `config` | Env/options loader with typed schema + defaults | `core` |

Plus a non-published `examples/` directory: one tiny runnable demo per package.

## 6. Templates Repository (`Puppeteer-Template`)

Restructure the seeded Kanfer code into clean templates. The seeded
`Kanfer D-Toolkit` naming/branding is removed; the Kanfer repo itself is
untouched and unrelated.

| Template | Shape |
|---|---|
| `electron-gui-app` | Restructured Kanfer GUI: `main`/`preload`/`renderer` + a `runner` composing `@technical-1/*` packages. URL input, headless toggle, live log panel fed by `@technical-1/logger`'s EventEmitter implementation. Keeps build-time bundled Chrome + electron-builder signing/notarization/release pipeline from the Kanfer baseline. |
| `cli-app` | `commander`-based headless CLI. URL/flags in, runner out, structured stdout logging via `@technical-1/logger` console implementation, proper process exit codes. |

Supporting content:
- `docs/` — how each template is wired, which packages each uses, and how to
  swap/extend capabilities.
- `scripts/new` — optional degit-style helper that lifts a single template into a
  fresh standalone project directory.
- Each template's `package.json` depends on published `@technical-1/*` ranges.
  A documented dev mode links them to a local `Puppeteer-Packages` checkout.

## 7. Canonical Runner Data Flow

The composition the templates implement (each step an independent package):

```
config
  → chrome-setup (resolve/download Chrome)
  → launcher (pool, headless toggle)
  → apply stealth / fingerprint / proxy
  → session.restore
  → navigation.goto                (wrapped in retry)
  → interaction-helpers / extract  (the per-project automation)
  → screenshots / pdf / downloads
  → session.persist
  → logger (Logger injected through every step)
  → captcha (invoked on demand when a challenge is detected)
```

The template owns the wiring + UI/CLI surface. The packages own the
capabilities. A new project edits the runner's automation section and removes
unused steps/packages.

## 8. Error Handling

- Packages throw typed errors from `@technical-1/core` (`SelectorNotFoundError`
  carries the selector, `NavigationError` carries URL + cause, etc.).
- `retry` distinguishes retryable vs terminal errors via an error property on
  the `core` error types.
- `launcher` guarantees browser cleanup (close in `finally`) so a thrown error
  never leaks a browser process.
- Templates catch typed errors and render them: GUI → error-level log line +
  re-enabled controls; CLI → stderr + non-zero exit code.

## 9. Testing Strategy

- **Unit tier (every package):** `vitest` with a mocked `Page`/`Browser` object
  (the Kanfer helpers pattern). Fast, no browser, runs in CI by default.
- **Integration tier:** gated behind an env flag (e.g. `PPTR_IT=1`). Launches a
  real Chrome via `chrome-setup` against a **local static fixture HTTP server**
  (deterministic HTML in the repo) — never the live internet. Exercises real
  selectors/navigation/screenshots. Run in a dedicated CI job.
- **Templates:** smoke scripts that run the canonical runner headless against
  the local fixture server (mirrors the Kanfer end-to-end smoke).
- Coverage expectation: every exported function has at least one unit test;
  capability packages additionally have one integration test.

## 10. Tooling, CI & Release

**`Puppeteer-Packages`:**
- pnpm workspaces (`pnpm-workspace.yaml`), `workspace:*` for internal `core` dep
  (rewritten to real ranges on publish).
- Turborepo pipeline: `build → typecheck → lint → test` with local caching;
  remote cache off by default (documented as an opt-in future option).
- Changesets: independent per-package versioning, generated changelogs.
- `tsup` per package for ESM+CJS+`.d.ts`. Shared `tsconfig.base.json`.
- GitHub Actions:
  - `ci.yml` — install, typecheck, lint, unit test, build (matrix Node 20/22);
    separate `integration` job with `PPTR_IT=1`.
  - `release.yml` — Changesets action publishes changed packages to npm using
    an `NPM_TOKEN` repo secret (`--access public` for the scoped packages).

**`Puppeteer-Template`:**
- GitHub Actions `ci.yml` — typecheck/lint/test each template against published
  package versions; the `electron-gui-app` retains the Kanfer build/release
  workflows (signing/notarization) repointed to template identity.

## 11. Git Authorship

Commits use a personal identity (name `Jacob Kanfer`, email
`kanfer@users.noreply.github.com`) — never the autom8ops work email, per
standing user instruction.

## 12. Out of Scope

- No live-internet tests (fixtures only).
- No bundled captcha-solver credentials or paid API keys.
- No remote Turborepo cache initially (documented opt-in later).
- Implementation phasing/sequencing — deferred to the implementation plan(s).
- Any change to the `Kanfer-D-Toolkit` repository.
</content>
