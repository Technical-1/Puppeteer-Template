# Kanfer D-Toolkit

Minimal Electron app that launches a Puppeteer-controlled Chrome against any URL.
Starting point for hand-written site automation.

## Develop

```bash
npm install
npm run download-chrome   # one-time: fetch Chrome into chrome-local/
npm start
```

Enter a URL, optionally check **Headless**, click **Launch**. Logs stream in the panel.

## Write automation

Edit `automation/runner.js` — fill in the `YOUR AUTOMATION HERE` block using the
toolkit in `automation/helpers.js` (`safeClick`, `safeType`, `waitAndGet`,
`screenshot`, `scroll`).

## Test

```bash
npm test
```

## Build installers

```bash
npm run build:mac   # or :win / :linux / :all
```

mac builds are code-signed + notarized when `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
and `APPLE_TEAM_ID` env vars are set (see `scripts/notarize.js`).
