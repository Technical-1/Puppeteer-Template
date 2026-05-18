/**
 * Resolves the Chrome executable path for both dev and packaged Electron builds.
 */

const path = require('path');
const fs = require('fs');

/**
 * Get the Chrome executable path.
 * - In packaged app: looks in resources/chrome/ (bundled via extraResources)
 * - In dev: uses the default Puppeteer cache location
 * @returns {string|undefined} Path to Chrome executable, or undefined to let Puppeteer find it
 */
function getChromePath() {
  let isPackaged = false;
  try {
    isPackaged = require('electron').app?.isPackaged ?? false;
  } catch {
    // Outside Electron (e.g. tests) — treat as dev mode
  }

  if (isPackaged) {
    // In packaged app, Chrome is in resources/chrome/
    const resourcesPath = process.resourcesPath;
    const chromeDirInResources = path.join(resourcesPath, 'chrome');

    const execPath = findChromeExecutable(chromeDirInResources);
    if (execPath) return execPath;

    throw new Error(
      `Bundled Chrome not found in ${chromeDirInResources}. ` +
      'The app may have been built without running "npm run download-chrome" first.'
    );
  }

  // Dev mode: check chrome-local/ first, then fall back to Puppeteer cache
  const localChrome = path.join(__dirname, '..', 'chrome-local');
  const execPath = findChromeExecutableInDir(localChrome);
  if (execPath) return execPath;

  // Fall back to default Puppeteer cache
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const cacheDir = path.join(homeDir, '.cache', 'puppeteer');
  const cachePath = findChromeExecutableInDir(cacheDir);
  if (cachePath) return cachePath;

  return undefined;
}

/**
 * Search a directory tree for a Chrome executable
 * @param {string} baseDir - Directory to search
 * @returns {string|null}
 */
function findChromeExecutableInDir(baseDir) {
  if (!fs.existsSync(baseDir)) return null;

  // Walk subdirectories to find chrome binary
  return findChromeExecutable(baseDir);
}

/**
 * Recursively find Chrome executable in a directory
 * @param {string} dir - Directory to search
 * @returns {string|null}
 */
function findChromeExecutable(dir) {
  if (!fs.existsSync(dir)) return null;

  const platform = process.platform;

  // Known Chrome executable names by platform
  const names = platform === 'win32'
    ? ['chrome.exe']
    : platform === 'darwin'
      ? ['Google Chrome for Testing', 'Chromium', 'Google Chrome']
      : ['chrome', 'chromium'];

  // BFS through directory to find executable
  const queue = [dir];
  while (queue.length > 0) {
    const current = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // On macOS, look inside .app bundles
        if (entry.name.endsWith('.app')) {
          const macOSPath = path.join(fullPath, 'Contents', 'MacOS');
          if (fs.existsSync(macOSPath)) queue.unshift(macOSPath);
        } else {
          queue.push(fullPath);
        }
      } else if (names.includes(entry.name)) {
        return fullPath;
      }
    }
  }

  return null;
}

module.exports = { getChromePath };
