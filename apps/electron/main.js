const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.appendFileSync(path.join(app.getPath('userData'), 'bridge.log'), line);
  } catch (_) {}
  if (!app.isPackaged) console.log(message);
}

function resourcePath(name) {
  return app.isPackaged
    ? path.join(process.resourcesPath, name)
    : path.join(__dirname, 'resources', name);
}

function toPrismaFileUrl(filePath) {
  return `file:${filePath.replace(/\\/g, '/')}`;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return env;
    const index = trimmed.indexOf('=');
    if (index === -1) return env;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key) env[key] = value;
    return env;
  }, {});
}

function ensureWritableDatabase(backendDir) {
  const userDataDir = app.getPath('userData');
  fs.mkdirSync(userDataDir, { recursive: true });

  const userDb = path.join(userDataDir, 'bridge.db');
  if (!fs.existsSync(userDb)) {
    const seedDb = path.join(backendDir, 'dev.db');
    if (fs.existsSync(seedDb)) {
      fs.copyFileSync(seedDb, userDb);
    }
  }

  return userDb;
}

function waitForBackend(port, timeoutMs = 7000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/api/health', timeout: 1000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('timeout', () => req.destroy());
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) resolve(false);
        else setTimeout(check, 250);
      });
    };
    check();
  });
}

function startBackend() {
  if (process.env.BRIDGE_SKIP_BACKEND === '1') return;

  const backendDir = resourcePath('backend');
  const entryJs = path.join(backendDir, 'dist', 'src', 'main.js');
  if (!fs.existsSync(entryJs)) {
    log(`Backend entry not found: ${entryJs}`);
    return;
  }

  const bridgeEnv = readEnvFile(path.join(app.getPath('userData'), 'bridge.env'));
  const port = process.env.PORT || bridgeEnv.PORT || '4000';
  const userDb = ensureWritableDatabase(backendDir);
  const env = {
    ...process.env,
    ...bridgeEnv,
    ELECTRON_RUN_AS_NODE: '1',
    PORT: port,
    DATABASE_URL: bridgeEnv.DATABASE_URL || toPrismaFileUrl(userDb),
  };

  backendProcess = spawn(process.execPath, [entryJs], {
    cwd: backendDir,
    env,
    stdio: app.isPackaged ? 'ignore' : 'inherit',
    windowsHide: true,
  });
  log(`Started backend process from ${entryJs} on port ${port}`);

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`Bridge backend exited with code ${code}`);
    }
  });
}

async function loadFrontend(win) {
  const indexHtml = path.join(resourcePath('frontend'), 'index.html');
  if (process.env.ELECTRON_START_URL) {
    await win.loadURL(process.env.ELECTRON_START_URL);
    return;
  }

  await waitForBackend(Number(process.env.PORT || 4000));
  await win.loadFile(indexHtml).catch(() => {
    win.loadURL('http://localhost:3000');
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    show: false,
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  await loadFrontend(win);
}

app.whenReady().then(async () => {
  startBackend();
  await createWindow();
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
