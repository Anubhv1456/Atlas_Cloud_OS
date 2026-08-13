import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const emblemSvgPath = path.join(publicDir, 'emblem.svg');

if (!fs.existsSync(emblemSvgPath)) {
  console.error('emblem.svg not found in public directory!');
  process.exit(1);
}

const svgBuffer = fs.readFileSync(emblemSvgPath);

const iconConfigs = [
  { name: 'pwa-512x512.png', width: 512, height: 512 },
  { name: 'pwa-192x192.png', width: 192, height: 192 },
  { name: 'pwa-maskable-512x512.png', width: 512, height: 512 },
  { name: 'pwa-maskable-192x192.png', width: 192, height: 192 },
  { name: 'apple-touch-icon.png', width: 180, height: 180 },
  { name: 'apple-touch-icon-180x180.png', width: 180, height: 180 },
  { name: 'apple-touch-icon-167x167.png', width: 167, height: 167 },
  { name: 'apple-touch-icon-152x152.png', width: 152, height: 152 },
  { name: 'apple-touch-icon-120x120.png', width: 120, height: 120 },
  { name: 'apple-touch-icon-precomposed.png', width: 180, height: 180 },
  { name: 'favicon-32x32.png', width: 32, height: 32 },
  { name: 'favicon-16x16.png', width: 16, height: 16 },
  { name: 'favicon.png', width: 64, height: 64 },
  { name: 'favicon.ico', width: 48, height: 48 },
];

async function generateIcons() {
  console.log('Generating high-density Truecolor PWA icons...');
  
  for (const config of iconConfigs) {
    const outputPath = path.join(publicDir, config.name);
    await sharp(svgBuffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .removeAlpha() // Ensures 100% opaque background, eliminating iPadOS black box bug!
      .flatten({ background: '#14161a' })
      .png({ palette: false, quality: 100, compressionLevel: 6 }) // Forces Truecolor RGB (PNG-24) required by WebKit
      .toFile(outputPath);
      
    console.log(`Generated: ${config.name} (${config.width}x${config.height})`);
  }

  console.log('All PWA icons generated successfully as Truecolor RGB PNGs!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
