/**
 * Kanfer D-Toolkit — templateable automation runner.
 *
 * Edit the "YOUR AUTOMATION HERE" block below. Use the helpers from
 * ./helpers.js. `onLog(message, level)` streams lines to the app UI;
 * levels: 'info' | 'success' | 'warn' | 'error' | 'step'.
 */
const puppeteer = require('puppeteer-core');
const { getChromePath } = require('../modules/chrome-path');
const { safeClick, safeType, waitAndGet, screenshot, scroll } = require('./helpers');

/**
 * @param {{url:string, headless:boolean, onLog?:(m:string,l?:string)=>void}} options
 */
async function run({ url, headless, onLog }) {
  const log = (m, l = 'info') => { if (onLog) onLog(m, l); };

  const executablePath = getChromePath();
  if (!executablePath) {
    throw new Error('Chrome not found. Run "npm run download-chrome" (dev) or rebuild the installer.');
  }

  log(`Launching Chrome (${headless ? 'headless' : 'headed'})`, 'step');
  const browser = await puppeteer.launch({
    executablePath,
    headless: !!headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    log(`Navigating to ${url}`, 'step');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    log('Page loaded', 'success');

    // ─────────────── YOUR AUTOMATION HERE ───────────────
    // Examples (uncomment / adapt):
    //
    //   await safeType(page, 'input[name="q"]', 'hello world');
    //   await safeClick(page, 'button[type="submit"]');
    //   const heading = await waitAndGet(page, 'h1');
    //   log(`Heading: ${heading}`, 'info');
    //   await scroll(page);
    //   const shot = await screenshot(page, 'result');
    //   log(`Saved screenshot: ${shot}`, 'success');
    //
    // To keep a HEADED browser open while you build automation,
    // uncomment the next line (the run will not finish until you close it):
    //   await new Promise(() => {});
    // ─────────────────────────────────────────────────────

    log('Automation complete', 'success');
  } catch (err) {
    log(`Error: ${err?.message ?? String(err)}`, 'error');
    throw err;
  } finally {
    await browser.close();
    log('Browser closed', 'info');
  }
}

module.exports = { run };
