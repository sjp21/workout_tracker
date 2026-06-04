// Generate placeholder PWA icons as solid-color PNGs.
// Pure-JS PNG encoder so we don't pull in node-canvas or sharp for placeholders.
// Drop in a real icon set later (e.g. via Figma + PWA Asset Generator).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../public/icons');
mkdirSync(outDir, { recursive: true });

const BG = [0x0b, 0x0d, 0x0c]; // app background
const FG = [0xd4, 0xff, 0x4a]; // accent green
const MASK_BG = [0xd4, 0xff, 0x4a];
const MASK_FG = [0x0b, 0x0d, 0x0c];

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crc = u32(zlib.crc32(Buffer.concat([t, data])));
  return Buffer.concat([u32(data.length), t, data, crc]);
}

function encodePng(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.concat([
    u32(width),
    u32(height),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit depth, color type 2 (RGB)
  ]);
  // pixels: width*height RGB triples. We need to prefix each scanline with a
  // filter byte (0 = none).
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// Draw a centered filled rectangle "logo block" — a simple square with a smaller
// inset square in the contrasting color. Crude but recognizable as a logo
// placeholder. Real icons can replace this verbatim later.
function drawIcon(size, bg, fg, maskable) {
  const buf = Buffer.alloc(size * size * 3);
  // Safe zone for maskable: per spec, content should stay within central
  // 80% of the icon. We honour that by shrinking the foreground block.
  const inset = Math.floor(size * (maskable ? 0.28 : 0.22));
  const inner = size - inset * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      const inFg = x >= inset && x < inset + inner && y >= inset && y < inset + inner;
      const col = inFg ? fg : bg;
      buf[idx] = col[0];
      buf[idx + 1] = col[1];
      buf[idx + 2] = col[2];
    }
  }
  return encodePng(size, size, buf);
}

const targets = [
  { size: 192, name: 'icon-192.png', bg: BG, fg: FG, maskable: false },
  { size: 512, name: 'icon-512.png', bg: BG, fg: FG, maskable: false },
  { size: 512, name: 'icon-maskable-512.png', bg: MASK_BG, fg: MASK_FG, maskable: true },
  { size: 180, name: 'apple-touch-icon.png', bg: BG, fg: FG, maskable: false }
];

for (const t of targets) {
  const png = drawIcon(t.size, t.bg, t.fg, t.maskable);
  writeFileSync(resolve(outDir, t.name), png);
  console.log('wrote', t.name, png.length, 'bytes');
}
