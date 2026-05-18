# Kanfer D-Toolkit — Design Spec

**Date:** 2026-05-18
**Status:** Approved (pending user spec review)

## Summary

A minimal Electron desktop app that launches a Puppeteer-controlled Chrome
against a user-supplied URL. It is built by stripping the
[redfin-scraper](https://github.com/Technical-1/redfin-scraper.git) baseline
down to its reusable shell (Electron + bundled Chrome + packaging pipeline) and
replacing all Redfin/CSV logic with a barebones, templateable automation script
plus a small reusable helper toolkit. The app is the starting point for
hand-written site automation; ~90% of the baseline is deleted.

## Goals

- Single clean screen: URL input, headless on/off checkbox, Launch button, live log panel.
- Chrome bundled into the installer at build time (works on any new device, no first-run download).
- Barebones Puppeteer script with a clearly-fenced `YOUR AUTOMATION HERE` section.
- Reusable helper toolkit (`safeClick`, `safeType`, `waitAndGet`, `screenshot`, `scroll`).
- Full distribution pipeline preserved: cross-platform builds, Apple code-signing,
  notarization, GitHub release workflows.

## Non-Goals

- No CSV/checkpoint/batch processing (deleted from baseline).
- No site-specific automation logic shipped (that is what the user writes later).
- No runtime Chrome download (build-time bundle chosen instead).

## Naming

| Thing | Value |
|---|---|
| App product name | Kanfer D-Toolkit |
| Folder / repo slug | `kanfer-d-toolkit` |
| Electron appId | `com.kanfer.d-toolkit` |
| Location | `/Users/jacobkanfer/Desktop/Code/kanfer-d-toolkit` |
| Git | Fresh history (new repo). Cloned `redfin-scraper` deleted after migration. |

## Architecture

Three layers, reusing the baseline's Electron shell and security model
(`contextIsolation: true`, `nodeIntegration: false`, preload contextBridge).

### 1. Main process — `main.js`
- Creates the BrowserWindow, loads `index.html`.
- IPC handlers:
  - `run-automation(url, headless)` → calls `automation/runner.js`, streams logs back.
  - `pick-screenshot-dir()` → optional dialog helper for the `screenshot` helper output location.
- Drops all baseline IPC (`select-csv-file`, `check-checkpoint`, `start-scrape`, `download-template`).
- Keeps standard app lifecycle (`window-all-closed` → quit).

### 2. Automation layer (replaces all `modules/` + `scraper-v4.js`)
- `automation/runner.js` — the templateable script. Flow:
  1. Resolve Chrome via reused `chrome-path.js`.
  2. `puppeteer-core.launch({ executablePath, headless })`.
  3. `page.goto(url, { waitUntil: 'domcontentloaded' })`.
  4. `// ─── YOUR AUTOMATION HERE ───` fenced block with commented helper examples.
  5. Cleanup (close browser unless headed + user wants it open — see Open Questions resolved below).
  6. Emits log lines via an `onLog(message, level)` callback.
- `automation/helpers.js` — reusable toolkit, each function JSDoc'd, ~5–15 lines, no site assumptions:
  - `safeClick(page, selector, opts?)` — wait for selector, then click; logs + throws clearly on miss.
  - `safeType(page, selector, text, opts?)` — wait, focus, type with optional delay.
  - `waitAndGet(page, selector, opts?)` — wait for selector, return trimmed `textContent`.
  - `screenshot(page, name)` — timestamped PNG to a `screenshots/` folder in the
    app's working directory by default; overridable via `pickScreenshotDir()`.
  - `scroll(page, opts?)` — scroll to bottom (or by amount) to trigger lazy content.

### 3. Renderer — `index.html` + `renderer.js` + `preload.js`
- Single screen, no sidebar/tabs (baseline's instructions/scraper tabs removed).
- Elements: URL text input, "Headless" checkbox, "Launch" button (disabled while running),
  scrolling log panel with level-colored lines.
- `preload.js` exposes `window.api = { runAutomation(url, headless), onLog(cb), pickScreenshotDir() }`.

## Data Flow

```
User input (URL, headless)
  → renderer.js  → window.api.runAutomation(url, headless)   [preload contextBridge]
  → main.js IPC 'run-automation'
  → runner.run({ url, headless, onLog })
  → chrome-path.getChromePath() → puppeteer-core.launch → page.goto(url)
  → YOUR AUTOMATION HERE (uses helpers.js)
  → onLog(...) lines stream → mainWindow.webContents.send('automation-log', ...)
  → renderer appends to log panel
  → run resolves → button re-enabled, summary line logged
```

## Chrome Delivery (kept from baseline, unchanged)

- `scripts/download-chrome.js` — pinned Chrome version downloaded via `@puppeteer/browsers`.
- `package.json` `prebuild` hook runs it before `electron-builder`.
- `extraResources` copies `chrome-local/${os}` → `resources/chrome` in the installer.
- `modules/chrome-path.js` carried forward verbatim: packaged → `process.resourcesPath/chrome`,
  dev → `chrome-local/` then `~/.cache/puppeteer` fallback.

## Packaging (kept from baseline, repointed only)

- `electron-builder` mac (dmg+zip, x64+arm64), win (nsis+portable), linux (AppImage+deb).
- `scripts/notarize.js` + `build/entitlements.mac.plist` + `entitlements.mac.inherit.plist`
  carried forward **unchanged** — the hardened-runtime entitlements are what allow a
  notarized app to spawn the bundled child Chrome process.
- `.github/workflows/build.yml` + `release.yml` carried forward, env/appId repointed.
- Only edits: `appId` → `com.kanfer.d-toolkit`, `productName` → "Kanfer D-Toolkit",
  copyright/author, icon assets (reuse baseline placeholder icons unless replaced later).

## What Gets Deleted

- `scraper-v4.js`, `scraper-v4.test.js`.
- All of `modules/` **except** `chrome-path.js` (logger/config/api-client/csv-validator/utils/puppeteer-scraper).
- Dependencies removed: `csv-parse`, `csv-stringify`, `puppeteer-extra`,
  `puppeteer-extra-plugin-stealth`. **Kept:** `puppeteer-core`.
- Baseline `docs/` (Redfin implementation trackers) and `.portfolio/` Redfin content.
- Baseline README replaced with a Kanfer D-Toolkit README.

## Error Handling

- Invalid/empty URL → renderer-side guard before IPC; inline error, no launch.
- Chrome not resolvable → `runner` throws a clear message ("Bundled Chrome not found —
  run `npm run download-chrome`"), surfaced as an error log line, button re-enabled.
- Puppeteer launch/navigation failure → caught in `runner`, logged at `error` level,
  browser force-closed in a `finally`, run resolves with failure (UI never hangs).
- Helper failures (selector not found) throw with the selector in the message so the
  user's automation fails loudly, not silently.

## Testing

- `vitest` retained. One test file: `automation/helpers.test.js`.
- Helpers tested against a mocked `page` object (stubbed `waitForSelector`, `click`,
  `$eval`, `evaluate`) — verifies success path + the clear-throw-on-miss path.
- No browser-integration test (avoids notarization/CI flakiness); manual `npm start` smoke check documented in README.

## Resolved Decisions

- Chrome delivery: **build-time bundle** (not runtime download).
- Launch behavior: **UI headless toggle** per run.
- Template scope: **minimal + helper toolkit**.
- Project: **new folder, fresh git history**, clone deleted after.
- Packaging: **keep everything** (signing, notarization, release workflows).
- Headed-run lifecycle: browser **closes when the `runner` function returns**. A commented
  `// await new Promise(() => {})` line in the template lets the user keep a headed browser
  open indefinitely while developing automation.

## Build Sequence (for the implementation plan)

1. Scaffold `kanfer-d-toolkit/` by copying reusable baseline files; delete Redfin code.
2. Rewrite `package.json` (name, deps, appId, productName, scripts).
3. Write `automation/helpers.js` + `automation/runner.js`.
4. Rewrite `main.js` IPC + `preload.js` + `index.html` + `renderer.js`.
5. Repoint packaging config + GitHub workflows.
6. `helpers.test.js`; `npm install`; `npm start` smoke; `npm test`.
7. New README; commit; delete cloned `redfin-scraper`.
</content>
</invoke>
