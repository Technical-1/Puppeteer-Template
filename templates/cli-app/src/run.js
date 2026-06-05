/**
 * pptr-cli — automation runner. Composes the @technical-1 suite, headless.
 * `logger` is injected (console logger from cli.js). `_deps` is a test seam
 * (vitest can't intercept CJS require()s of the suite; omit in production).
 */
const fs = require("fs");

async function run(options, logger, _deps) {
  const d = _deps || {
    puppeteer: require("puppeteer-core"),
    ensureChrome: require("@technical-1/chrome-setup").ensureChrome,
    withBrowser: require("@technical-1/launcher").withBrowser,
    goto: require("@technical-1/navigation").goto,
    extractText: require("@technical-1/extract").extractText,
    applyStealth: require("@technical-1/stealth").applyStealth,
    randomFingerprint: require("@technical-1/fingerprint").randomFingerprint,
    applyFingerprint: require("@technical-1/fingerprint").applyFingerprint,
    screenshot: require("@technical-1/screenshots").screenshot,
    timestampedPath: require("@technical-1/screenshots").timestampedPath,
  };
  const { url, headless = true, stealth, fingerprint, screenshot: doShot, screenshotDir } = options;
  const log = (m, l = "info") => logger.log(m, l);

  const executablePath = await d.ensureChrome({ logger });
  const pptr = stealth ? d.applyStealth(d.puppeteer) : d.puppeteer;
  if (stealth) log("Stealth plugin applied", "step");

  return d.withBrowser(
    pptr,
    { executablePath, headless: headless !== false, logger },
    async (browser) => {
      const page = await browser.newPage();
      if (fingerprint) {
        const fp = d.randomFingerprint();
        await d.applyFingerprint(page, fp);
        log(`Fingerprint applied (${fp.locale} / ${fp.timezoneId})`, "step");
      }
      await d.goto(page, url, { logger });

      // ─────────────── your automation here ───────────────
      const heading = await d.extractText(page, "h1").catch(() => ""); // example; missing <h1> is fine
      if (heading) log(`<h1>: ${heading}`, "info");
      // ─────────────────────────────────────────────────────

      if (doShot) {
        const bytes = await d.screenshot(page, { fullPage: true });
        fs.mkdirSync(screenshotDir, { recursive: true });
        const file = d.timestampedPath(screenshotDir, "shot");
        fs.writeFileSync(file, bytes);
        log(`Saved screenshot: ${file}`, "success");
      }
      log("Done", "success");
    },
  );
}

module.exports = { run };
