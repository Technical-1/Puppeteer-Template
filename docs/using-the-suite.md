# Using the @technical-1 suite

Both templates install the suite from npm and declare `puppeteer-core` as the
browser-driver peer:

```bash
pnpm add @technical-1/launcher @technical-1/navigation puppeteer-core
```

Each `@technical-1/*` package does one thing and shares a typed error model and
an injectable `Logger`. Compose what you need; see each package's README on npm.

## Develop against a local Puppeteer-Packages checkout (optional)

To iterate on the suite and a template together before publishing, point a
package at your local build via pnpm `overrides` in the template's
`package.json`:

```json
"pnpm": { "overrides": { "@technical-1/launcher": "link:../../Puppeteer-Packages/packages/launcher" } }
```

Build the suite first (`pnpm -C ../../Puppeteer-Packages build`) so the linked
package has a `dist/`. Remove the override to return to the published version.
