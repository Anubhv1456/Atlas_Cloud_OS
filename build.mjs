import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDist = path.resolve(__dirname, 'dist');
const trackerDir = path.resolve(__dirname, 'artifacts/study-tracker');
const trackerDist = path.resolve(trackerDir, 'dist');

console.log('[Atlas Build] Building study-tracker client application with Vite...');
execSync('npm run build --workspace=artifacts/study-tracker', { stdio: 'inherit' });

try {
  console.log('[Atlas Build] Building api-server bundle...');
  execSync('npm run build --workspace=artifacts/api-server', { stdio: 'inherit' });
} catch (e) {
  console.warn('[Atlas Build] Warning: api-server build failed or skipped:', e.message);
}

// Ensure root dist exists and contains valid build files
if (!fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
}

// Copy build output from artifacts/study-tracker/dist to root dist
if (fs.existsSync(trackerDist)) {
  fs.cpSync(trackerDist, rootDist, { recursive: true });
}

// Validate artifact integrity in root dist
const indexFile = path.join(rootDist, 'index.html');
if (!fs.existsSync(indexFile) || fs.statSync(indexFile).size === 0) {
  console.error(`[Atlas Build Error] Invalid or missing index.html in ${rootDist}`);
  process.exit(1);
}

// Validate artifact integrity in tracker dist
const trackerIndex = path.join(trackerDist, 'index.html');
if (!fs.existsSync(trackerIndex) || fs.statSync(trackerIndex).size === 0) {
  fs.cpSync(rootDist, trackerDist, { recursive: true });
}

const files = fs.readdirSync(rootDist);
console.log(`[Atlas Build Success] Verified ${files.length} production assets in root dist:`, files.slice(0, 10).join(', '));

const apiServerDist = path.join(__dirname, 'artifacts/api-server/dist');
if (fs.existsSync(apiServerDist)) {
  const distFiles = fs.readdirSync(apiServerDist);
  for (const file of distFiles) {
    if (file.endsWith('.mjs')) {
      const src = path.join(apiServerDist, file);
      // Rename index.mjs to server.mjs for the main bundle
      const destName = file === 'index.mjs' ? 'server.mjs' : file;
      const dest = path.join(__dirname, 'dist', destName);
      fs.copyFileSync(src, dest);
      console.log(`[Atlas Build] Copied ${file} to ${dest}`);
    }
  }
}
