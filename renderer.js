// Pure DOM. Uses window.api exposed by preload.js.
window.addEventListener('DOMContentLoaded', () => {
  const urlEl = document.getElementById('url');
  const headlessEl = document.getElementById('headless');
  const launchBtn = document.getElementById('launch');
  const errEl = document.getElementById('err');
  const logEl = document.getElementById('log');
  const stealthEl = document.getElementById('stealth');
  const fingerprintEl = document.getElementById('fingerprint');
  const screenshotEl = document.getElementById('screenshot');

  function appendLog({ message, level }) {
    const line = document.createElement('div');
    line.className = 'l-' + (level || 'info');
    const ts = new Date().toLocaleTimeString();
    line.textContent = `${ts}  ${message}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  window.api.onLog(appendLog);

  function isValidUrl(v) {
    try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
  }

  launchBtn.addEventListener("click", async () => {
    const url = urlEl.value.trim();
    errEl.textContent = "";
    if (!isValidUrl(url)) { errEl.textContent = "Enter a valid http(s) URL."; return; }

    let screenshotDir;
    if (screenshotEl.checked) {
      screenshotDir = await window.api.pickScreenshotDir();
      if (!screenshotDir) { errEl.textContent = "Pick a screenshot folder (or uncheck Screenshot)."; return; }
    }

    launchBtn.disabled = true;
    appendLog({ message: `Run started → ${url}`, level: "step" });
    try {
      const result = await window.api.runAutomation({
        url,
        headless: headlessEl.checked,
        stealth: stealthEl.checked,
        fingerprint: fingerprintEl.checked,
        screenshot: screenshotEl.checked,
        screenshotDir,
      });
      if (!result.success) appendLog({ message: result.error, level: "error" });
      appendLog({ message: "Run finished", level: result.success ? "success" : "error" });
    } catch (err) {
      appendLog({ message: `IPC error: ${err?.message ?? String(err)}`, level: "error" });
    } finally {
      launchBtn.disabled = false;
    }
  });
});
