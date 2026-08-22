import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const emblemSvgPath = path.join(publicDir, 'emblem.svg');

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
  if (!fs.existsSync(emblemSvgPath)) {
    console.warn('emblem.svg not found in public directory. Skipping icon generation.');
    return;
  }

  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    const svgBuffer = fs.readFileSync(emblemSvgPath);

    console.log('Generating high-density Truecolor PWA icons...');
    for (const config of iconConfigs) {
      const outputPath = path.join(publicDir, config.name);
      await sharp(svgBuffer)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center'
        })
        .removeAlpha()
        .flatten({ background: '#14161a' })
        .png({ palette: false, quality: 100, compressionLevel: 6 })
        .toFile(outputPath);
    }
    console.log('All PWA icons generated successfully as Truecolor RGB PNGs!');
  } catch (err) {
    console.warn('Sharp not available or failed; using existing pre-generated icons in public directory:', err?.message || err);
  }
}

generateIcons().catch((err) => {
  console.warn('Icon generation notice:', err?.message || err);
});

