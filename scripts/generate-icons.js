import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = isMaskable ? size * 0.42 : size * 0.46;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background (Deep navy to cyan/blue)
      const gradFactor = (x + y) / (size * 2);
      const rBg = Math.round(15 + gradFactor * 2);
      const gBg = Math.round(23 + gradFactor * 110);
      const bBg = Math.round(42 + gradFactor * 180);

      // Outer squircle or circle
      if (isMaskable || dist <= radius) {
        // Draw inner branding icon (Clipboard / Building outline)
        const inCenterBox = Math.abs(dx) < radius * 0.55 && Math.abs(dy) < radius * 0.55;
        const isBorder = (Math.abs(Math.abs(dx) - radius * 0.55) < size * 0.03 && Math.abs(dy) < radius * 0.55) ||
                         (Math.abs(Math.abs(dy) - radius * 0.55) < size * 0.03 && Math.abs(dx) < radius * 0.55);

        // Checkmark geometry
        const checkX = dx + size * 0.05;
        const checkY = dy + size * 0.05;
        const isCheckStem = Math.abs(checkX + checkY) < size * 0.035 && checkX >= -size * 0.15 && checkX <= size * 0.02;
        const isCheckLong = Math.abs(checkY - checkX * 0.8) < size * 0.035 && checkX >= -size * 0.02 && checkX <= size * 0.22;

        if (isCheckStem || isCheckLong) {
          // Bright emerald green
          png.data[idx] = 52;
          png.data[idx + 1] = 211;
          png.data[idx + 2] = 153;
          png.data[idx + 3] = 255;
        } else if (isBorder) {
          // Cyan glowing border
          png.data[idx] = 56;
          png.data[idx + 1] = 189;
          png.data[idx + 2] = 248;
          png.data[idx + 3] = 255;
        } else {
          png.data[idx] = rBg;
          png.data[idx + 1] = gBg;
          png.data[idx + 2] = bBg;
          png.data[idx + 3] = 255;
        }
      } else {
        // Transparent outside radius if not maskable
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }

  return PNG.sync.write(png);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180, false));

console.log('Successfully generated PWA PNG icons in /public!');
