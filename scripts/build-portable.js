const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_DIR, 'dist');
const TARGET_DIR = path.join(os.homedir(), 'bin');
const EXE_NAME = 'y2mate.exe';

console.log('[build:portable] Building portable exe...');
execSync('npx electron-builder --win portable', {
  cwd: PROJECT_DIR,
  stdio: 'inherit'
});

// Find the built exe — electron-builder names it via artifactName
let exePath = path.join(DIST_DIR, EXE_NAME);

// If artifactName didn't apply (older builder), search for *.exe
if (!fs.existsSync(exePath)) {
  const files = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.exe'));
  if (files.length === 0) {
    console.error('[build:portable] No exe found in dist/');
    process.exit(1);
  }
  // Use the most recently built exe
  files.sort((a, b) => fs.statSync(path.join(DIST_DIR, b)).mtimeMs - fs.statSync(path.join(DIST_DIR, a)).mtimeMs);
  exePath = path.join(DIST_DIR, files[0]);
}

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const destPath = path.join(TARGET_DIR, EXE_NAME);

// Kill old process if running (avoids EBUSY)
try {
  execSync('taskkill /f /im y2mate.exe 2>nul || exit /b 0', { stdio: 'pipe' });
} catch (_) {}

// Copy with retry on EBUSY
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    fs.copyFileSync(exePath, destPath);
    break;
  } catch (err) {
    if (err.code === 'EBUSY' && attempt < 2) {
      console.log(`[build:portable] File locked, retrying in 1s... (attempt ${attempt + 1})`);
      execSync('timeout /t 1 /nobreak >nul', { stdio: 'pipe' });
    } else {
      throw err;
    }
  }
}
console.log(`[build:portable] Copied ${exePath} → ${destPath}`);

// Auto-add to User PATH if missing
const userPath = process.env.PATH || '';
const inPath = userPath.split(';').some(p => path.resolve(p).toLowerCase() === TARGET_DIR.toLowerCase());
if (inPath) {
  console.log('[build:portable] DONE. Restart terminal, type "y2mate" to launch.');
} else {
  console.log(`[build:portable] Adding ${TARGET_DIR} to User PATH...`);
  try {
    execSync(
      `powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';${TARGET_DIR}', 'User')"`,
      { stdio: 'pipe' }
    );
    console.log('[build:portable] Added to User PATH successfully.');
    console.log('[build:portable] DONE. Restart terminal, type "y2mate" to launch.');
  } catch (err) {
    console.error(`[build:portable] Failed to add PATH: ${err.message}`);
    console.log('[build:portable] Run this manually in PowerShell (no admin needed):');
    console.log(`  [Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';${TARGET_DIR}', 'User')`);
  }
}
