/**
 * Downloads Chrome for bundling with the Electron app.
 * Run before `electron-builder` to ensure Chrome is available in chrome-local/.
 *
 * Supports: mac (arm64 + x64), win (x64), linux (x64)
 */

const { install, Browser, detectBrowserPlatform } = require('@puppeteer/browsers');
const path = require('path');
const fs = require('fs');

const CHROME_VERSION = '144.0.7559.96';
const OUTPUT_DIR = path.join(__dirname, '..', 'chrome-local');

// Map Puppeteer platform names to our directory convention
const PLATFORM_TO_DIR = {
  'mac_arm': 'mac',
  'mac': 'mac',
  'win64': 'win',
  'win32': 'win',
  'linux': 'linux'
};

async function main() {
  const platform = detectBrowserPlatform();
  if (!platform) {
    console.error('Could not detect browser platform');
    process.exit(1);
  }

  const osDir = PLATFORM_TO_DIR[platform] || platform;
  const destDir = path.join(OUTPUT_DIR, osDir);

  // Skip if already downloaded
  if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    console.log(`Chrome already downloaded for ${osDir} at ${destDir}`);
    return;
  }

  console.log(`Downloading Chrome ${CHROME_VERSION} for ${platform}...`);

  const result = await install({
    browser: Browser.CHROME,
    buildId: CHROME_VERSION,
    cacheDir: path.join(OUTPUT_DIR, osDir),
    platform
  });

  console.log(`Chrome downloaded to: ${result.path}`);
  console.log(`Executable: ${result.executablePath}`);
}

main().catch(err => {
  console.error('Failed to download Chrome:', err?.message ?? String(err));
  process.exit(1);
});
