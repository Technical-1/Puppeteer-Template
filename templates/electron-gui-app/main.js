const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { run } = require('./automation/runner');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 640,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle("run-automation", async (_event, opts) => {
  try {
    await run(opts, (message, level = "info") => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("automation-log", { message, level });
      }
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message ?? String(err) };
  }
});

ipcMain.handle('pick-screenshot-dir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose screenshot folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});

app.on('window-all-closed', () => app.quit());
