import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const publicDir = '/app/applet/artifacts/study-tracker/public';

const rawSvg = fs.readFileSync(path.join(publicDir, 'emblem.svg'), 'utf8');

// Function to generate PNG buffer from SVG with given width, height, and inner scale percentage
function renderIcon(width, height, scalePercent = 100) {
  let svgContent = rawSvg;
  if (scalePercent !== 100) {
    // For maskable icons, wrap in a group with scale & translate so it fits within the 80% safe zone
    const innerSize = 512 * (scalePercent / 100);
    const offset = (512 - innerSize) / 2;
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#121315" />
  <g transform="translate(${offset}, ${offset}) scale(${scalePercent / 100})">
    <g transform="translate(256, 256)">
      <path d="M0,-160 L-120,110 L0,50 Z" fill="#1fa89b" />
      <path d="M0,-160 L0,50 L120,110 Z" fill="#2b3a4e" />
      <path d="M0,-160 L0,50" stroke="#38d9a9" stroke-width="4" stroke-linecap="round" />
      <path d="M0,-210 Q0,-180 25,-180 Q0,-180 0,-150 Q0,-180 -25,-180 Q0,-180 0,-210 Z" fill="#62f0d0" />
    </g>
  </g>
</svg>`;
  }

  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}

const icons = [
  { name: 'pwa-192x192.png', width: 192, height: 192, scale: 100 },
  { name: 'maskable-192x192.png', width: 192, height: 192, scale: 78 },
  { name: 'pwa-512x512.png', width: 512, height: 512, scale: 100 },
  { name: 'maskable-512x512.png', width: 512, height: 512, scale: 78 },
  { name: 'apple-touch-icon.png', width: 180, height: 180, scale: 100 },
  { name: 'apple-touch-icon-precomposed.png', width: 180, height: 180, scale: 100 },
  { name: 'favicon.png', width: 64, height: 64, scale: 100 },
  { name: 'favicon-32x32.png', width: 32, height: 32, scale: 100 },
  { name: 'favicon-16x16.png', width: 16, height: 16, scale: 100 },
  { name: 'emblem.png', width: 512, height: 512, scale: 100 },
];

console.log('Generating PWA Icons...');
for (const icon of icons) {
  const pngBuf = renderIcon(icon.width, icon.height, icon.scale);
  const outPath = path.join(publicDir, icon.name);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`✓ Generated ${icon.name} (${icon.width}x${icon.height}, ${pngBuf.length} bytes)`);
}
console.log('All PWA icons generated successfully!');
