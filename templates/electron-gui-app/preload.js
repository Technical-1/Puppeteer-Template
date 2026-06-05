/**
 * Electron security bridge. Renderer can only call window.api.*
 */
const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  /** @param {{url:string,headless:boolean,stealth:boolean,fingerprint:boolean,screenshot:boolean,screenshotDir?:string}} opts */
  runAutomation: (opts) => ipcRenderer.invoke("run-automation", opts),
  pickScreenshotDir: () => ipcRenderer.invoke("pick-screenshot-dir"),
  /** @param {(entry:{message:string,level:string})=>void} cb */
  onLog: (cb) => ipcRenderer.on("automation-log", (_e, entry) => cb(entry)),
});
