import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const trackerDir = path.resolve(__dirname, 'artifacts/study-tracker');
const viteBin = path.resolve(trackerDir, 'node_modules/.bin/vite');

console.log('[Dev Server] Starting Vite on port 3000 host 0.0.0.0 in', trackerDir);

const child = spawn(process.execPath, [viteBin, '--port', '3000', '--host', '0.0.0.0'], {
  cwd: trackerDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3000',
    HOST: '0.0.0.0',
  },
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
