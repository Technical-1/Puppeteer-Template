# PptrKit GUI

A desktop (Electron) starter for browser automation, built on the
[`@technical-1`](https://www.npmjs.com/org/technical-1) Puppeteer suite. Enter a
URL, toggle Stealth / Fingerprint / Screenshot, hit Launch, and watch structured
logs stream into the panel. The automation runner is built by composing the
published packages — fork it and edit one file.

## Develop

```bash
pnpm install               # node-linker=hoisted (required for electron-builder)
pnpm run download-chrome    # fetch the pinned Chrome to bundle (dev + build)
pnpm start                 # launch the app
pnpm test                  # runner unit tests
```

## Package

```bash
pnpm run build             # current OS; or build:mac / build:win / build:linux
```

macOS signing/notarization uses `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
`APPLE_TEAM_ID` env vars (see `scripts/notarize.js`).

## How it works

`automation/runner.js` composes the suite:
`@technical-1/chrome-setup` (resolve the bundled Chrome) →
`@technical-1/launcher` (`withBrowser`) → optional `@technical-1/stealth` /
`@technical-1/fingerprint` → `@technical-1/navigation` (`goto`) →
`@technical-1/extract` / `@technical-1/interaction-helpers` → optional
`@technical-1/screenshots`. `@technical-1/logger`'s EventEmitter streams logs to
the UI, so the packages never import Electron.

Edit the `your automation here` block in `automation/runner.js`. Add more suite
packages (`session`, `network`, `pdf`, `downloads`, `proxy`, `captcha`, `retry`,
`config`) the same way — install and `require` them.

## License

MIT — © 2026 Jacob Kanfer
