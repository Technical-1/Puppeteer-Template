/**
 * Build-time: download a pinned Chrome into chrome-local/<os>/ for electron-builder
 * to bundle (see build.extraResources). Reproducible via DEFAULT_CHROME_BUILD.
 */
const path = require("path");
const fs = require("fs");
const { detectBrowserPlatform } = require("@puppeteer/browsers");
const { downloadChrome, DEFAULT_CHROME_BUILD } = require("@technical-1/chrome-setup");

const OUTPUT_DIR = path.join(__dirname, "..", "chrome-local");
const PLATFORM_TO_DIR = { mac_arm: "mac", mac: "mac", win64: "win", win32: "win", linux: "linux" };

async function main() {
  const platform = detectBrowserPlatform();
  if (!platform) {
    console.error("Could not detect browser platform");
    process.exit(1);
  }
  const osDir = PLATFORM_TO_DIR[platform] || platform;
  const destDir = path.join(OUTPUT_DIR, osDir);

  if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    console.log(`Chrome already present for ${osDir} at ${destDir}`);
    return;
  }
  console.log(`Downloading pinned Chrome ${DEFAULT_CHROME_BUILD} for ${platform}...`);
  const { executablePath } = await downloadChrome({ buildId: DEFAULT_CHROME_BUILD, cacheDir: destDir });
  console.log(`Chrome ready: ${executablePath}`);
}

main().catch((err) => {
  console.error("Failed to download Chrome:", err?.message ?? String(err));
  process.exit(1);
});
