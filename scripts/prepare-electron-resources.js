const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'apps', 'electron');
const backendDir = path.join(rootDir, 'apps', 'backend');
const frontendOutDir = path.join(rootDir, 'apps', 'frontend', 'out');
const resourcesDir = path.join(electronDir, 'resources');
const stagedFrontendDir = path.join(resourcesDir, 'frontend');
const stagedBackendDir = path.join(resourcesDir, 'backend');
const desktopSeedDb = path.join(backendDir, 'desktop-seed.db');
const backendInstallDir = path.join(os.tmpdir(), 'bridge-electron-backend-runtime');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, options = {}) {
  const isWindowsShim = process.platform === 'win32' && (command.endsWith('.cmd') || command.endsWith('.bat'));
  const spawnCommand = isWindowsShim ? 'cmd.exe' : command;
  const spawnArgs = isWindowsShim ? ['/d', '/s', '/c', command, ...args] : args;

  execFileSync(spawnCommand, spawnArgs, {
    cwd: options.cwd || rootDir,
    env: { ...process.env, ...(options.env || {}) },
    stdio: 'inherit',
  });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  fs.cpSync(from, to, {
    recursive: true,
    filter: (source) => {
      const name = path.basename(source);
      return name !== '.env' && !name.startsWith('.env.');
    },
  });
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function writeBackendPackage() {
  const backendPackage = JSON.parse(
    fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8')
  );
  const stagedPackage = {
    name: 'bridge-backend-runtime',
    version: backendPackage.version,
    private: true,
    main: backendPackage.main,
    dependencies: backendPackage.dependencies,
  };
  fs.writeFileSync(
    path.join(stagedBackendDir, 'package.json'),
    `${JSON.stringify(stagedPackage, null, 2)}\n`
  );
}

function installBackendDependencies() {
  cleanDir(backendInstallDir);
  fs.copyFileSync(
    path.join(stagedBackendDir, 'package.json'),
    path.join(backendInstallDir, 'package.json')
  );
  run(npmCmd, ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: backendInstallDir,
  });
  copyDir(path.join(backendInstallDir, 'node_modules'), path.join(stagedBackendDir, 'node_modules'));
  const lockFile = path.join(backendInstallDir, 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    fs.copyFileSync(lockFile, path.join(stagedBackendDir, 'package-lock.json'));
  }
  fs.rmSync(backendInstallDir, { recursive: true, force: true });
}

function createSeedDatabase() {
  fs.rmSync(desktopSeedDb, { force: true });
  fs.closeSync(fs.openSync(desktopSeedDb, 'w'));
  const env = { DATABASE_URL: 'file:./../desktop-seed.db' };
  run(npxCmd, ['prisma', 'db', 'push', '--schema', 'prisma/schema.prisma'], {
    cwd: backendDir,
    env,
  });
  run(npmCmd, ['run', 'seed'], { cwd: backendDir, env });
  fs.copyFileSync(desktopSeedDb, path.join(stagedBackendDir, 'dev.db'));
  fs.rmSync(desktopSeedDb, { force: true });
}

function copyGeneratedPrismaClient() {
  const rootPrismaClient = path.join(rootDir, 'node_modules', '@prisma', 'client');
  const rootPrismaGenerated = path.join(rootDir, 'node_modules', '.prisma');
  const stagedPrismaClient = path.join(stagedBackendDir, 'node_modules', '@prisma', 'client');
  const stagedPrismaGenerated = path.join(stagedBackendDir, 'node_modules', '.prisma');

  fs.rmSync(stagedPrismaClient, { recursive: true, force: true });
  fs.rmSync(stagedPrismaGenerated, { recursive: true, force: true });
  copyDir(rootPrismaClient, stagedPrismaClient);
  copyDir(rootPrismaGenerated, stagedPrismaGenerated);
}

function main() {
  console.log('Preparing Electron resources...');

  cleanDir(resourcesDir);

  run(npmCmd, ['-w', 'packages/ui', 'run', 'build']);
  run(npmCmd, ['-w', 'apps/backend', 'run', 'prisma:generate'], {
    env: { DATABASE_URL: 'file:./../dev.db' },
  });
  run(npmCmd, ['-w', 'apps/backend', 'run', 'build']);
  run(npmCmd, ['-w', 'apps/frontend', 'run', 'build']);

  if (!fs.existsSync(frontendOutDir)) {
    throw new Error(`Missing frontend export at ${frontendOutDir}`);
  }

  copyDir(frontendOutDir, stagedFrontendDir);
  requireFile(path.join(stagedFrontendDir, 'index.html'), 'packaged frontend home page');
  requireFile(path.join(stagedFrontendDir, 'manifest.webmanifest'), 'packaged frontend manifest');
  requireFile(path.join(stagedFrontendDir, 'icon-192.png'), 'packaged frontend 192px icon');
  requireFile(path.join(stagedFrontendDir, 'icon-512.png'), 'packaged frontend 512px icon');

  fs.mkdirSync(stagedBackendDir, { recursive: true });
  copyDir(path.join(backendDir, 'dist'), path.join(stagedBackendDir, 'dist'));
  copyDir(path.join(backendDir, 'prisma'), path.join(stagedBackendDir, 'prisma'));
  writeBackendPackage();
  createSeedDatabase();

  installBackendDependencies();
  copyGeneratedPrismaClient();

  console.log('Electron resources ready.');
}

main();
