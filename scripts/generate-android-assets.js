import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 8 bits, color type 6 (RGBA)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * rowSize;
    rawData[rawOffset] = 0; // Filter None
    const srcOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rawOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buf = Buffer.alloc(width * height * 4, 0); // Transparent black
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a === 255) {
      this.buf[idx] = r;
      this.buf[idx + 1] = g;
      this.buf[idx + 2] = b;
      this.buf[idx + 3] = 255;
    } else {
      // Alpha blending
      const curA = this.buf[idx + 3] / 255;
      const srcA = a / 255;
      const outA = srcA + curA * (1 - srcA);
      if (outA > 0) {
        this.buf[idx] = Math.round((r * srcA + this.buf[idx] * curA * (1 - srcA)) / outA);
        this.buf[idx + 1] = Math.round((g * srcA + this.buf[idx + 1] * curA * (1 - srcA)) / outA);
        this.buf[idx + 2] = Math.round((b * srcA + this.buf[idx + 2] * curA * (1 - srcA)) / outA);
        this.buf[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  fillGradientRect(x1, y1, x2, y2, c1, c2, radius = 0) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        // Rounded corner check
        if (radius > 0) {
          const dx = Math.max(0, Math.max(x1 + radius - x, x - (x2 - radius)));
          const dy = Math.max(0, Math.max(y1 + radius - y, y - (y2 - radius)));
          if (dx * dx + dy * dy > radius * radius) continue;
        }

        const t = (y - y1 + (x - x1) * 0.5) / (y2 - y1 + (x2 - x1) * 0.5);
        const clampedT = Math.max(0, Math.min(1, t));
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * clampedT);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * clampedT);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * clampedT);
        const a = c1[3] !== undefined ? Math.round(c1[3] + (c2[3] - c1[3]) * clampedT) : 255;
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  fillRect(x1, y1, x2, y2, color, radius = 0) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (radius > 0) {
          const dx = Math.max(0, Math.max(x1 + radius - x, x - (x2 - radius)));
          const dy = Math.max(0, Math.max(y1 + radius - y, y - (y2 - radius)));
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        this.setPixel(x, y, color[0], color[1], color[2], color[3] ?? 255);
      }
    }
  }

  fillCircle(cx, cy, radius, color) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 <= r2) {
          this.setPixel(x, y, color[0], color[1], color[2], color[3] ?? 255);
        }
      }
    }
  }

  drawRing(cx, cy, radius, strokeWidth, color) {
    const outer2 = radius * radius;
    const inner2 = (radius - strokeWidth) * (radius - strokeWidth);
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 <= outer2 && d2 >= inner2) {
          this.setPixel(x, y, color[0], color[1], color[2], color[3] ?? 255);
        }
      }
    }
  }

  toPng() {
    return encodeRgbaPng(this.width, this.height, this.buf);
  }
}

// Color Palette
const MIDNIGHT_NAVY = [11, 25, 40, 255];   // #0B1928
const DEEP_NAVY = [6, 14, 24, 255];        // #060E18
const EMERALD_DARK = [6, 78, 59, 255];     // #064E3B
const EMERALD_RICH = [5, 150, 105, 255];   // #059669
const EMERALD_LIGHT = [52, 211, 153, 255]; // #34D399
const GOLD_RICH = [245, 158, 11, 255];     // #F59E0B
const GOLD_LIGHT = [251, 191, 36, 255];    // #FBBF24
const GOLD_DARK = [180, 83, 9, 255];       // #B45309
const PURE_WHITE = [255, 255, 255, 255];
const SUBTLE_WHITE = [255, 255, 255, 210];

/**
 * Draws the high-end luxury Wallet & Gold Coin financial emblem
 */
function drawFinancialEmblem(canvas, centerX, centerY, scale = 1.0) {
  const w = 56 * scale;
  const h = 42 * scale;

  // Wallet outer body (Deep Emerald with Gold Border)
  const x1 = Math.round(centerX - w / 2);
  const y1 = Math.round(centerY - h / 2 + 4 * scale);
  const x2 = Math.round(centerX + w / 2);
  const y2 = Math.round(centerY + h / 2 + 4 * scale);
  const cornerRadius = Math.round(9 * scale);

  // Outer Gold trim shadow
  canvas.fillRect(x1 - 2, y1 - 2, x2 + 2, y2 + 2, GOLD_LIGHT, cornerRadius + 2);
  // Main wallet leather (Emerald gradient)
  canvas.fillGradientRect(x1, y1, x2, y2, EMERALD_RICH, EMERALD_DARK, cornerRadius);

  // Top bill/cash fold peaking out of wallet (Crisp White and Mint)
  const billW = w * 0.76;
  const billH = 14 * scale;
  const bx1 = Math.round(centerX - billW / 2);
  const by1 = Math.round(y1 - 8 * scale);
  const bx2 = Math.round(centerX + billW / 2);
  const by2 = Math.round(y1 + 4 * scale);
  canvas.fillRect(bx1, by1, bx2, by2, PURE_WHITE, Math.round(4 * scale));
  canvas.fillRect(bx1 + 2, by1 + 2, bx2 - 2, by1 + 5 * scale, EMERALD_LIGHT, Math.round(2 * scale));

  // Front wallet flap / card holder
  const flapH = h * 0.52;
  const fy1 = Math.round(y1 + h * 0.38);
  canvas.fillGradientRect(x1, fy1, x2, y2, EMERALD_DARK, [4, 60, 45, 255], cornerRadius);

  // Gold stitched seam line across flap
  for (let sx = x1 + cornerRadius; sx <= x2 - cornerRadius; sx += 4 * scale) {
    canvas.fillRect(Math.round(sx), Math.round(fy1 + 1), Math.round(sx + 2 * scale), Math.round(fy1 + 2 * scale), GOLD_LIGHT);
  }

  // Luxury Gold Coin Clasp / Crest on the right side
  const coinCx = Math.round(centerX + w * 0.24);
  const coinCy = Math.round(y1 + h * 0.44);
  const coinR = 12 * scale;

  // Clasp leather tab
  canvas.fillRect(
    Math.round(coinCx - 14 * scale),
    Math.round(coinCy - 8 * scale),
    Math.round(coinCx + 8 * scale),
    Math.round(coinCy + 8 * scale),
    EMERALD_DARK,
    Math.round(4 * scale)
  );

  // Gold Coin Outer
  canvas.fillCircle(coinCx, coinCy, coinR, GOLD_RICH);
  // Inner Gold ring
  canvas.drawRing(coinCx, coinCy, coinR - 1 * scale, Math.round(2 * scale), GOLD_LIGHT);
  canvas.fillCircle(coinCx, coinCy, coinR - 3 * scale, GOLD_DARK);

  // Financial Symbol inside Coin (Sparkling Star / Diamond / Currency Bar)
  canvas.fillRect(
    Math.round(coinCx - 1.5 * scale),
    Math.round(coinCy - 5 * scale),
    Math.round(coinCx + 1.5 * scale),
    Math.round(coinCy + 5 * scale),
    PURE_WHITE
  );
  canvas.fillRect(
    Math.round(coinCx - 4 * scale),
    Math.round(coinCy - 1.5 * scale),
    Math.round(coinCx + 4 * scale),
    Math.round(coinCy + 1.5 * scale),
    PURE_WHITE
  );
}

/**
 * Generate legacy launcher icon (Square with rounded corners)
 */
function generateLauncherIcon(size, isRound = false) {
  const canvas = new Canvas(size, size);
  const radius = isRound ? Math.floor(size / 2) : Math.floor(size * 0.22);

  // Premium background: Deep Midnight Navy to Emerald Dark gradient
  canvas.fillGradientRect(0, 0, size - 1, size - 1, MIDNIGHT_NAVY, DEEP_NAVY, radius);

  // Subtle Outer Gold Accent Border
  const borderWidth = Math.max(1, Math.round(size * 0.025));
  if (isRound) {
    canvas.drawRing(size / 2, size / 2, size / 2 - 1, borderWidth, GOLD_RICH);
  } else {
    // Draw rounded rect border
    for (let i = 0; i < borderWidth; i++) {
      canvas.fillRect(i, i, size - 1 - i, size - 1 - i, GOLD_RICH, radius - i);
    }
    // Re-fill inner
    canvas.fillGradientRect(
      borderWidth,
      borderWidth,
      size - 1 - borderWidth,
      size - 1 - borderWidth,
      MIDNIGHT_NAVY,
      DEEP_NAVY,
      radius - borderWidth
    );
  }

  // Draw Financial Emblem centered
  const emblemScale = size / 100;
  drawFinancialEmblem(canvas, size / 2, size / 2, emblemScale);

  return canvas.toPng();
}

/**
 * Generate adaptive icon foreground (Transparent with centered emblem in safe-zone)
 */
function generateAdaptiveForeground(size) {
  const canvas = new Canvas(size, size);
  // Safe zone for adaptive icons is center 66% (radius 33% of canvas)
  const emblemScale = (size * 0.55) / 100;
  drawFinancialEmblem(canvas, size / 2, size / 2, emblemScale);
  return canvas.toPng();
}

/**
 * Generate high-res Splash Screen
 */
function generateSplashScreen(width, height) {
  const canvas = new Canvas(width, height);

  // Gradient background: Midnight Navy to Emerald
  canvas.fillGradientRect(0, 0, width - 1, height - 1, MIDNIGHT_NAVY, DEEP_NAVY, 0);

  // Center Badge
  const cx = width / 2;
  const cy = height * 0.44; // Slightly above center for visual balance
  const badgeRadius = Math.min(width, height) * 0.16;

  // Outer Gold Glow / Ring
  canvas.drawRing(cx, cy, badgeRadius + 3, 3, GOLD_RICH);
  canvas.fillGradientRect(
    Math.round(cx - badgeRadius),
    Math.round(cy - badgeRadius),
    Math.round(cx + badgeRadius),
    Math.round(cy + badgeRadius),
    DEEP_NAVY,
    EMERALD_DARK,
    badgeRadius
  );

  // Financial Emblem inside badge
  const scale = badgeRadius / 45;
  drawFinancialEmblem(canvas, cx, cy, scale);

  return canvas.toPng();
}

// Generate all assets
console.log('Generating premium Android launcher icons & splash screens...');

const resDir = path.resolve('android/app/src/main/res');

// Density configurations
const iconDensities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

for (const d of iconDensities) {
  const targetDir = path.join(resDir, d.name);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), generateLauncherIcon(d.size, false));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), generateLauncherIcon(d.size, true));
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), generateAdaptiveForeground(d.fgSize));
  console.log(`✓ Generated ${d.name} icons`);
}

// Splash densities
const splashPortDensities = [
  { dir: 'drawable', w: 480, h: 800 },
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];

for (const s of splashPortDensities) {
  const targetDir = path.join(resDir, s.dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'splash.png'), generateSplashScreen(s.w, s.h));
  console.log(`✓ Generated ${s.dir}/splash.png`);
}

// Update ic_launcher_background.xml to Midnight Navy (#0B1928)
const valuesDir = path.join(resDir, 'values');
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B1928</color>
</resources>
`;
fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), bgXml);
console.log('✓ Updated ic_launcher_background.xml to Midnight Navy (#0B1928)');

console.log('All premium Android icon and splash assets created successfully!');
