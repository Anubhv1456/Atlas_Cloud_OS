import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let distPath = path.resolve(__dirname, "../../..", "dist");
if (fs.existsSync(path.resolve(__dirname, "index.html"))) {
  distPath = __dirname;
}
console.log({__dirname, distPath});
