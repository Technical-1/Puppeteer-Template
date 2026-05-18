/**
 * Electron security bridge. Renderer can only call window.api.*
 */
const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  /** @param {string} url @param {boolean} headless */
  runAutomation: (url, headless) => ipcRenderer.invoke('run-automation', { url, headless }),
  pickScreenshotDir: () => ipcRenderer.invoke('pick-screenshot-dir'),
  /** @param {(entry:{message:string,level:string})=>void} cb */
  onLog: (cb) => ipcRenderer.on('automation-log', (_e, entry) => cb(entry))
});
