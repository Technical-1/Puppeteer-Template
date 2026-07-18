# pptr-cli-app

A command-line browser-automation starter built on the
[`@technical-1`](https://www.npmjs.com/org/technical-1) Puppeteer suite.

```bash
pnpm install
pnpm start https://example.com --stealth --screenshot ./shots
```

> **First run** downloads a pinned Chrome-for-Testing build (~150–200 MB) if
> none is cached; on a slow connection this can take a few minutes. Subsequent
> runs reuse the cache.

Flags: `--no-headless`, `--stealth`, `--fingerprint`, `--screenshot <dir>`.
Exit code 0 on success, 1 on failure.

`src/run.js` composes the suite (`chrome-setup.ensureChrome` →
`launcher.withBrowser` → optional `stealth`/`fingerprint` → `navigation.goto` →
`extract` → optional `screenshots`) with `@technical-1/logger`'s console logger.
Edit the `your automation here` block; add more suite packages the same way.
