const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function serveFrontend(win) {
  // Serve exported Next.js static from resources/app/frontend
  const indexHtml = path.join(process.resourcesPath, 'frontend', 'index.html');
  // On dev fallback to localhost
  if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    win.loadFile(indexHtml).catch(() => {
      win.loadURL('http://localhost:3000');
    });
  }
}

function startBackend() {
  try {
    const backendDir = path.join(process.resourcesPath, 'backend');
    // Run Node backend using ts-node-dev fallback to compiled js if exists
    const entryTs = path.join(backendDir, 'src', 'main.ts');
    const entryJs = path.join(backendDir, 'dist', 'main.js');
    const env = {
      ...process.env,
      PORT: process.env.PORT || '4000',
      DATABASE_URL: process.env.DATABASE_URL || `file:${path.join(backendDir, 'dev.db')}`,
    };
    if (require('fs').existsSync(entryJs)) {
      backendProcess = spawn(process.execPath, [entryJs], { cwd: backendDir, env, stdio: 'inherit' });
    } else {
      backendProcess = spawn(process.execPath, ['-r', 'ts-node/register', entryTs], { cwd: backendDir, env, stdio: 'inherit' });
    }
  } catch (e) {
    console.error('Failed to start backend', e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  serveFrontend(win);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    try { backendProcess.kill(); } catch (_) {}
  }
  if (process.platform !== 'darwin') app.quit();
}); 