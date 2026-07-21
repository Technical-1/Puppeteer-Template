# Puppeteer Templates

**Go from zero to a working browser-automation app in minutes.** Pick a template, scaffold it with a single command, and you get a real project that already wires up the [`@technical-1`](https://www.npmjs.com/org/technical-1) Puppeteer suite — launch, navigate, extract, stealth, fingerprints, screenshots, and structured logging, all composed for you.

Two ready-to-run starting points, so you can begin wherever you're comfortable:

| Template | What you get |
|----------|--------------|
| [`cli-app`](templates/cli-app) | A headless command-line tool — `pptr-cli <url> [flags]` with console logs and clean exit codes. Perfect for scripts, cron jobs, and CI. |
| [`electron-gui-app`](templates/electron-gui-app) | **PptrKit GUI** — a desktop app. Type a URL, flip toggles for Stealth / Fingerprint / Screenshot, hit Launch, and watch logs stream in live. Ships as an installer for macOS, Windows, and Linux. |

## Scaffold a project

The scaffolder is a single dependency-free Node script — no install step, nothing to configure. It copies a template into a fresh directory (leaving build and dependency cruft behind) and tells you exactly what to run next.

```bash
node scripts/new.js <template> <target-dir>
```

### Try the CLI

```bash
node scripts/new.js cli-app ../my-scraper
cd ../my-scraper
pnpm install
pnpm start https://example.com --stealth --screenshot ./shots
```

Flags: `--no-headless` (show the browser window), `--stealth`, `--fingerprint`, `--screenshot <dir>`. Exit code `0` on success, `1` on failure.

> **Heads up:** the run command is `pnpm start <url> [flags]` — no leading `--` before the URL. On first run, a pinned Chrome-for-Testing build (~150–200 MB) downloads automatically if none is cached.

### Try the desktop GUI

```bash
node scripts/new.js electron-gui-app ../my-gui-app
cd ../my-gui-app
pnpm install
pnpm run download-chrome   # fetch the Chrome that gets bundled into the app
pnpm start
```

## Make it yours

Both templates are built the same way: an automation runner that composes the published `@technical-1` packages, with one clearly marked `your automation here` block. Edit that one spot and you've got a custom automation — no plumbing required.

The suite goes well beyond what ships in the templates. Need to log in before scraping, isolate a request behind its own browser context, check a page's accessibility, capture code coverage or a performance trace, reach for raw CDP, or track work happening in a worker? Those are all separate `@technical-1` packages you can `pnpm add` and pull into your runner alongside the ones already wired up.

See [docs/using-the-suite.md](docs/using-the-suite.md) for how the templates consume the suite (and how to dev-link a local suite checkout while you iterate).

## License

MIT — © 2026 Jacob Kanfer

## Author

Jacob Kanfer — [GitHub](https://github.com/Technical-1)
