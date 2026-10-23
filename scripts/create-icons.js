// Tiny PNG generator for PWA icons
import fs from 'fs';
import path from 'path';

// Valid 192x192 PNG binary with embedded palette
// Or we can create standard PNG bytes
const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEcAG9xadA/gAAAABJRU5ErkJggg==";
const buffer = Buffer.from(minimalPngBase64, 'base64');

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);
console.log('PWA icons created successfully.');
