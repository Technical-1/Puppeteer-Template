/**
 * Reusable Puppeteer helper toolkit for Kanfer D-Toolkit.
 * Import these into automation/runner.js. No site-specific assumptions.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT = 15000;

/**
 * Wait for a selector to be visible, then click it.
 * @param {import('puppeteer-core').Page} page
 * @param {string} selector
 * @param {{timeout?:number}} [opts]
 */
async function safeClick(page, selector, opts = {}) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: opts.timeout ?? DEFAULT_TIMEOUT });
  } catch {
    throw new Error(`safeClick: selector not found: ${selector}`);
  }
  await page.click(selector);
}

/**
 * Wait for a selector, then type text into it.
 * @param {import('puppeteer-core').Page} page
 * @param {string} selector
 * @param {string} text
 * @param {{timeout?:number, delay?:number}} [opts]
 */
async function safeType(page, selector, text, opts = {}) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: opts.timeout ?? DEFAULT_TIMEOUT });
  } catch {
    throw new Error(`safeType: selector not found: ${selector}`);
  }
  await page.type(selector, text, { delay: opts.delay ?? 0 });
}

/**
 * Wait for a selector, return its trimmed textContent.
 * @param {import('puppeteer-core').Page} page
 * @param {string} selector
 * @param {{timeout?:number}} [opts]
 * @returns {Promise<string>}
 */
async function waitAndGet(page, selector, opts = {}) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: opts.timeout ?? DEFAULT_TIMEOUT });
  } catch {
    throw new Error(`waitAndGet: selector not found: ${selector}`);
  }
  const text = await page.evaluate(
    (sel) => { const el = document.querySelector(sel); return el ? el.textContent : ''; },
    selector
  );
  return (text || '').trim();
}

/**
 * Take a timestamped PNG screenshot.
 * @param {import('puppeteer-core').Page} page
 * @param {string} name
 * @param {{dir?:string}} [opts]
 * @returns {Promise<string>} absolute path to the screenshot
 */
async function screenshot(page, name, opts = {}) {
  const dir = opts.dir || path.join(process.cwd(), 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(dir, `${name}-${stamp}.png`);
  await page.screenshot({ path: out });
  return out;
}

/**
 * Scroll the page. Default: jump to the bottom (triggers lazy content).
 * @param {import('puppeteer-core').Page} page
 * @param {{by?:number}} [opts] - if `by` given, scroll by that many pixels instead
 */
async function scroll(page, opts = {}) {
  await page.evaluate((by) => {
    if (typeof by === 'number') window.scrollBy(0, by);
    else window.scrollTo(0, document.body.scrollHeight);
  }, opts.by);
}

module.exports = { safeClick, safeType, waitAndGet, screenshot, scroll };
