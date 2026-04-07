/**
 * Run this script to generate placeholder icon/splash assets.
 * Requires: npm install -g sharp-cli (or use any image tool)
 *
 * For production, replace these with your designed assets:
 * - assets/icon.png          (1024x1024)
 * - assets/adaptive-icon.png (1024x1024)
 * - assets/splash-icon.png   (512x512)
 *
 * Quick generation with ImageMagick:
 *   magick -size 1024x1024 xc:#6366f1 -fill white -gravity center -pointsize 400 -annotate 0 "F" assets/icon.png
 *   magick -size 1024x1024 xc:#6366f1 -fill white -gravity center -pointsize 400 -annotate 0 "F" assets/adaptive-icon.png
 *   magick -size 512x512 xc:#6366f1 -fill white -gravity center -pointsize 200 -annotate 0 "F" assets/splash-icon.png
 */

const fs = require('fs');
const path = require('path');

function createMinimalPng(width, height) {
  // 1x1 purple pixel PNG, scaled by metadata (placeholder only)
  const header = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return ~crc;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Image data: rows of [filter_byte, R, G, B * width]
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // no filter
    for (let x = 0; x < width; x++) {
      raw.push(0x63, 0x66, 0xf1); // #6366f1
    }
  }
  const rawBuf = Buffer.from(raw);

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawBuf);

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// Small placeholders (8x8 to keep file size tiny)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createMinimalPng(8, 8));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createMinimalPng(8, 8));
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), createMinimalPng(8, 8));

console.log('Placeholder assets generated in assets/');
console.log('Replace with production-quality 1024x1024 icons before publishing.');
