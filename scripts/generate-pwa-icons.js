import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, bgColor, drawLogo = true, isMaskable = false) {
  // CRC32 implementation
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
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
    const chunkToCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(chunkToCrc), 0);
    return Buffer.concat([lenBuf, chunkToCrc, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // Deflate
  ihdr.writeUInt8(0, 11); // Filter 0
  ihdr.writeUInt8(0, 12); // Interlace 0

  // Pixel data (RGBA) with 1 filter byte per scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;

  // Colors:
  // bgColor (Teal #2ec4b6: 46, 196, 182)
  // Yellow (#f6ae2d: 246, 174, 45)
  // Dark slate (#0f172a: 15, 23, 42)
  // White (255, 255, 255)

  const pad = isMaskable ? Math.round(width * 0.15) : Math.round(width * 0.08);
  const cardLeft = pad;
  const cardTop = pad;
  const cardRight = width - pad;
  const cardBottom = height - pad;

  const borderWidth = Math.max(2, Math.round(width * 0.025));

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter 0 (None)
    for (let x = 0; x < width; x++) {
      let r = bgColor[0];
      let g = bgColor[1];
      let b = bgColor[2];
      let a = 255;

      if (drawLogo) {
        // Center retro computer card / window
        const inCard = x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom;
        const inBorder = inCard && (
          x <= cardLeft + borderWidth ||
          x >= cardRight - borderWidth ||
          y <= cardTop + borderWidth ||
          y >= cardBottom - borderWidth
        );

        if (inBorder) {
          r = 15; g = 23; b = 42; // dark slate
        } else if (inCard) {
          // Inside window
          const headerHeight = Math.round((cardBottom - cardTop) * 0.22);
          if (y <= cardTop + headerHeight) {
            // Header bar in yellow #f6ae2d
            r = 246; g = 174; b = 45;
          } else {
            // Window canvas in warm cream #FAF7EE
            r = 250; g = 247; b = 238;

            // Retro "WS" terminal text block
            const midX = width / 2;
            const midY = height / 2 + headerHeight / 3;
            const blockSize = width * 0.16;

            // Simple decorative geometric terminal pixel art / "WS" box
            const inBadge = Math.abs(x - midX) < blockSize && Math.abs(y - midY) < blockSize * 0.75;
            if (inBadge) {
              r = 46; g = 196; b = 182; // teal
            }
          }
        }
      }

      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    pngSignature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e4decb" stroke-width="1"/>
    </pattern>
  </defs>
  <!-- Background Canvas -->
  <rect width="512" height="512" fill="#FAF7EE"/>
  <rect width="512" height="512" fill="url(#grid)"/>
  
  <!-- Outer Window Shadow -->
  <rect x="54" y="54" width="414" height="414" rx="36" fill="#18181b"/>
  
  <!-- Outer Window Frame -->
  <rect x="44" y="44" width="414" height="414" rx="36" fill="#FAF7EE" stroke="#18181b" stroke-width="12"/>
  
  <!-- Window Header Bar (Teal) -->
  <path d="M 44 80 C 44 56, 56 44, 80 44 L 422 44 C 446 44, 458 56, 458 80 L 458 130 L 44 130 Z" fill="#2EC4B6" stroke="#18181b" stroke-width="12"/>
  
  <!-- Window Controls -->
  <circle cx="90" cy="87" r="14" fill="#FAF7EE" stroke="#18181b" stroke-width="6"/>
  <circle cx="130" cy="87" r="14" fill="#F6AE2D" stroke="#18181b" stroke-width="6"/>
  <circle cx="170" cy="87" r="14" fill="#FF70A6" stroke="#18181b" stroke-width="6"/>
  
  <!-- Address Bar Pill -->
  <rect x="210" y="67" width="220" height="40" rx="12" fill="#FAF7EE" stroke="#18181b" stroke-width="6"/>
  <text x="225" y="93" font-family="monospace" font-weight="bold" font-size="18" fill="#18181b">workstation.local</text>
  
  <!-- Inner Workstation Icon Box (Yellow Neo-Brutalist) -->
  <rect x="136" y="196" width="240" height="190" rx="24" fill="#F6AE2D" stroke="#18181b" stroke-width="10"/>
  <rect x="146" y="206" width="240" height="190" rx="24" fill="none" stroke="#18181b" stroke-width="6" opacity="0.3"/>
  
  <!-- Inner Screen & WS text -->
  <rect x="160" y="220" width="192" height="110" rx="14" fill="#0f172a" stroke="#18181b" stroke-width="6"/>
  <text x="256" y="295" text-anchor="middle" font-family="monospace" font-weight="900" font-size="70" fill="#2EC4B6" letter-spacing="4">WS</text>
  
  <!-- Status LED -->
  <circle cx="340" cy="235" r="7" fill="#4ade80" stroke="#0f172a" stroke-width="3"/>
  
  <!-- Keyboard / Base details -->
  <rect x="175" y="348" width="162" height="16" rx="6" fill="#FAF7EE" stroke="#18181b" stroke-width="5"/>
  <circle cx="210" cy="415" r="8" fill="#FF70A6" stroke="#18181b" stroke-width="4"/>
  <circle cx="256" cy="415" r="8" fill="#2EC4B6" stroke="#18181b" stroke-width="4"/>
  <circle cx="302" cy="415" r="8" fill="#F6AE2D" stroke="#18181b" stroke-width="4"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// 2. Generate PNGs using binary buffer
const p192 = createPNG(192, 192, [46, 196, 182], true, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), p192);

const p512 = createPNG(512, 512, [46, 196, 182], true, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), p512);

const pMask = createPNG(512, 512, [46, 196, 182], true, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pMask);

const appleTouch = createPNG(180, 180, [46, 196, 182], true, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// Also copy or generate favicon.ico (can use 192 or 64px)
const pFavicon = createPNG(64, 64, [46, 196, 182], true, false);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pFavicon);

console.log('PWA icons successfully generated in /public!');
