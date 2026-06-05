/**
 * PptrKit GUI — automation runner. Composes the @technical-1 suite.
 * Edit the "your automation here" block. onLog(message, level) streams to the UI.
 * Toggles (stealth/fingerprint/screenshot) come from the GUI.
 *
 * WHY _deps EXISTS (test seam — production callers never pass it):
 * runner.js is intentionally CJS so it loads cleanly in both Electron's main
 * process and Node.js scripts. vitest's vi.mock() operates on the ESM loader
 * registry and cannot intercept CJS require() calls — neither server.deps.inline
 * nor deps.inline patches the native Node CJS module cache. The _deps parameter
 * is the only reliable way to inject mock implementations in vitest 1.x without
 * converting runner.js to an ESM module (which would break Electron's main-process
 * require() chain). Remove _deps only when the project upgrades to vitest 2+ with
 * native CJS mock support, or when runner.js becomes an ES module.
 */
const path = require("path");
const fs = require("fs");
const { homedir } = require("os");

/** @param {boolean} isPackaged */
function chromeExecutable(resolveChromePath, isPackaged) {
  const searchDirs = isPackaged
    ? [path.join(process.resourcesPath, "chrome")]
    : [path.join(__dirname, "..", "chrome-local"), path.join(homedir(), ".cache", "puppeteer")];
  return resolveChromePath({ searchDirs });
}

/**
 * @param {object} options
 * @param {string} options.url
 * @param {boolean} options.headless
 * @param {boolean} [options.stealth]
 * @param {boolean} [options.fingerprint]
 * @param {boolean} [options.screenshot]
 * @param {string}  [options.screenshotDir]
 * @param {function(string, string): void} onLog
 * @param {object} [_deps]  — injectable for tests; omit in production
 */
async function run(options, onLog, _deps) {
  const { url, headless, stealth, fingerprint, screenshot: doShot, screenshotDir } = options;

  // Resolve dependencies — real packages in production, mocks in tests.
  // See module-level comment for why the _deps seam is necessary.
  const {
    puppeteer,
    resolveChromePath,
    withBrowser,
    goto,
    extractText,
    applyStealth,
    randomFingerprint,
    applyFingerprint,
    screenshot,
    timestampedPath,
    createEventLogger,
  } = _deps || {
    puppeteer:          require("puppeteer-core"),
    resolveChromePath:  require("@technical-1/chrome-setup").resolveChromePath,
    withBrowser:        require("@technical-1/launcher").withBrowser,
    goto:               require("@technical-1/navigation").goto,
    extractText:        require("@technical-1/extract").extractText,
    applyStealth:       require("@technical-1/stealth").applyStealth,
    randomFingerprint:  require("@technical-1/fingerprint").randomFingerprint,
    applyFingerprint:   require("@technical-1/fingerprint").applyFingerprint,
    screenshot:         require("@technical-1/screenshots").screenshot,
    timestampedPath:    require("@technical-1/screenshots").timestampedPath,
    createEventLogger:  require("@technical-1/logger").createEventLogger,
  };

  const logger = createEventLogger();
  logger.on("log", (e) => { if (onLog) onLog(e.message, e.level); });
  const log = (m, level = "info") => logger.log(m, level);

  let isPackaged = false;
  // Intentional: electron is absent in dev/test environments; the catch is the normal path there.
  try { isPackaged = require("electron").app?.isPackaged ?? false; } catch { /* dev/test fallback — no electron */ }

  const executablePath = chromeExecutable(resolveChromePath, isPackaged);
  if (!executablePath) {
    throw new Error('Chrome not found. Run "pnpm run download-chrome" (dev) or rebuild the installer.');
  }

  const pptr = stealth ? applyStealth(puppeteer) : puppeteer;
  if (stealth) log("Stealth plugin applied", "step");

  // Launcher logs "Launching Chrome (...)" via the injected logger — no duplicate log here.
  // Launcher also injects --no-sandbox/--disable-setuid-sandbox — no duplicate args needed.
  return withBrowser(
    pptr,
    { executablePath, headless: !!headless, logger },
    async (browser) => {
      const page = await browser.newPage();
      if (fingerprint) {
        const fp = randomFingerprint();
        await applyFingerprint(page, fp);
        log(`Fingerprint applied (${fp.locale} / ${fp.timezoneId})`, "step");
      }
      await goto(page, url, { logger });

      // ─────────────── your automation here ───────────────
      const heading = await extractText(page, "h1").catch(() => ""); // example: missing <h1> is fine here; log it if your automation needs it
      if (heading) log(`<h1>: ${heading}`, "info");
      // Add more suite packages (interaction-helpers, session, network, pdf, …) the same way.
      // ─────────────────────────────────────────────────────

      if (doShot) {
        try {
          const bytes = await screenshot(page, { fullPage: true });
          const dir = screenshotDir || path.join(__dirname, "..", "screenshots");
          fs.mkdirSync(dir, { recursive: true });
          const file = timestampedPath(dir, "shot");
          fs.writeFileSync(file, bytes);
          log(`Saved screenshot: ${file}`, "success");
        } catch (err) {
          log(`Screenshot failed: ${err?.message ?? String(err)}`, "error");
          throw err;
        }
      }
      log("Automation complete", "success");
    },
  );
}

module.exports = { run };
