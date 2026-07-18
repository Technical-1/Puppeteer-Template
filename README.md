# Puppeteer Templates

Starter templates for browser automation on the
[`@technical-1`](https://www.npmjs.com/org/technical-1) Puppeteer suite.

| Template | What it is |
|----------|------------|
| [`electron-gui-app`](templates/electron-gui-app) | Desktop (Electron) GUI: URL + toggles + live log panel, bundled Chrome, signed installers. |
| [`cli-app`](templates/cli-app) | Command-line tool: `pptr-cli <url> [flags]`, console logs, exit codes. |

## Scaffold a project

```bash
node scripts/new.js <template> <target-dir>
# e.g.
node scripts/new.js cli-app ../my-scraper
cd ../my-scraper && pnpm install && pnpm test

# electron-gui-app also needs a Chrome download before `pnpm start`:
#   pnpm run download-chrome && pnpm start
```

See [docs/using-the-suite.md](docs/using-the-suite.md) for how the templates
consume the suite (and how to dev-link a local Puppeteer-Packages checkout).

## License

MIT — © 2026 Jacob Kanfer
