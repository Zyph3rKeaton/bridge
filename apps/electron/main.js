const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let frontendServer = null;
let frontendServerUrl = null;

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

function appIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, 'assets', 'icon.png');
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
  };
  return contentTypes[extension] || 'application/octet-stream';
}

function resolveFrontendFile(frontendDir, requestUrl) {
  const root = path.resolve(frontendDir);
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  let filePath = path.resolve(root, `.${pathname}`);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  return filePath;
}

function serveFrontendFile(frontendDir, req, res) {
  const filePath = resolveFrontendFile(frontendDir, req.url || '/');
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const cacheControl = filePath.includes(`${path.sep}_next${path.sep}static${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  res.writeHead(200, {
    'Cache-Control': cacheControl,
    'Content-Type': contentTypeFor(filePath),
  });
  fs.createReadStream(filePath).pipe(res);
}

function startFrontendServer(frontendDir) {
  if (frontendServerUrl) return Promise.resolve(frontendServerUrl);

  return new Promise((resolve, reject) => {
    frontendServer = http.createServer((req, res) => serveFrontendFile(frontendDir, req, res));
    frontendServer.once('error', reject);
    frontendServer.listen(0, '127.0.0.1', () => {
      const address = frontendServer.address();
      frontendServerUrl = `http://127.0.0.1:${address.port}`;
      log(`Started frontend server at ${frontendServerUrl}`);
      resolve(frontendServerUrl);
    });
  });
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
  const frontendDir = resourcePath('frontend');
  const indexHtml = path.join(frontendDir, 'index.html');
  if (process.env.ELECTRON_START_URL) {
    await win.loadURL(process.env.ELECTRON_START_URL);
    return;
  }

  await waitForBackend(Number(process.env.PORT || 4000));
  if (fs.existsSync(indexHtml)) {
    const url = await startFrontendServer(frontendDir);
    await win.loadURL(url);
    return;
  }

  await win.loadURL('http://localhost:3000');
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    show: false,
    backgroundColor: '#f8fafc',
    icon: appIconPath(),
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
  if (frontendServer) {
    try { frontendServer.close(); } catch (_) {}
  }
  if (process.platform !== 'darwin') app.quit();
});
