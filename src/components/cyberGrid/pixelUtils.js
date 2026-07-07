/**
 * pixelUtils.js — Low-level pixel-art drawing helpers for the cyberspace cluster grid.
 *
 * All coordinates are in "canvas pixels" (real device pixels handled by the caller via scale).
 * Shapes are intentionally aliased / blocky — no anti-aliasing, no sub-pixel drawing.
 */

/* ── Seeded PRNG (xoshiro128**) for deterministic yet random-looking visuals ── */
export function createRng(seed) {
  let s0 = seed | 0 || 1;
  let s1 = (seed * 2654435761) | 0 || 1;
  let s2 = (seed * 340573321) | 0 || 1;
  let s3 = (seed * 1013904243) | 0 || 1;
  return function next() {
    const t = s1 << 9;
    let r = s0 * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return (r >>> 0) / 4294967296;
  };
}

/* ── Colour helpers ───────────────────────────────────────────── */
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbStr(r, g, b, a = 1) {
  return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}

export function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return rgbStr(r, g, b, a);
}

/* ── Dithered rectangle (ordered 4×4 Bayer matrix) ───────────── */
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function drawDitheredRect(ctx, x, y, w, h, color, intensity = 0.5, pixelSize = 2) {
  const [r, g, b] = hexToRgb(color);
  const threshold = intensity * 16;
  for (let py = 0; py < h; py += pixelSize) {
    for (let px = 0; px < w; px += pixelSize) {
      const bx = ((px / pixelSize) | 0) % 4;
      const by = ((py / pixelSize) | 0) % 4;
      if (BAYER4[by][bx] < threshold) {
        ctx.fillStyle = rgbStr(r, g, b, 0.8);
        ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
      }
    }
  }
}

/* ── Fill a blocky pixel at grid coords ──────────────────────── */
export function fillPixel(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

/* ── Draw a chunky pixelated rectangle outline ───────────────── */
export function drawPixelRect(ctx, x, y, w, h, color, thickness = 2) {
  ctx.fillStyle = color;
  // top
  ctx.fillRect(x, y, w, thickness);
  // bottom
  ctx.fillRect(x, y + h - thickness, w, thickness);
  // left
  ctx.fillRect(x, y + thickness, thickness, h - thickness * 2);
  // right
  ctx.fillRect(x + w - thickness, y + thickness, thickness, h - thickness * 2);
}

/* ── Draw scanlines over a region ────────────────────────────── */
export function drawScanlines(ctx, x, y, w, h, gap = 3, alpha = 0.06) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let row = y; row < y + h; row += gap) {
    ctx.fillRect(x, row, w, 1);
  }
}

/* ── Chunky jagged data-stream line between two points ───────── */
export function drawDataStream(ctx, x0, y0, x1, y1, color, time, rng, intensity = 1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return;

  const segLen = 6;
  const steps = Math.max(2, Math.ceil(dist / segLen));
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const [r, g, b] = hexToRgb(color);

  const pixSize = 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseX = x0 + dx * t;
    const baseY = y0 + dy * t;

    // jagged offset
    const jitter = (rng() - 0.5) * 8 * intensity + Math.sin(time * 3 + i * 0.7) * 4 * intensity;
    const px = Math.round(baseX + perpX * jitter);
    const py = Math.round(baseY + perpY * jitter);

    const alpha = 0.3 + intensity * 0.5 + Math.sin(time * 5 + i * 0.4) * 0.15;
    ctx.fillStyle = rgbStr(r, g, b, Math.min(1, alpha));
    ctx.fillRect(px, py, pixSize, pixSize);

    // secondary glow pixels
    if (rng() < 0.4 * intensity) {
      const gx = px + Math.round((rng() - 0.5) * 6);
      const gy = py + Math.round((rng() - 0.5) * 6);
      ctx.fillStyle = rgbStr(r, g, b, 0.2);
      ctx.fillRect(gx, gy, pixSize, pixSize);
    }
  }
}

/* ── Glitch-bit particle burst (used for "data pulse" travellingeffect) ── */
export function drawGlitchBit(ctx, cx, cy, radius, color, time) {
  const [r, g, b] = hexToRgb(color);
  const pixSize = 2;
  const count = Math.ceil(radius * 1.5);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + time * 2;
    const dist = (Math.sin(time * 4 + i) * 0.5 + 0.5) * radius;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    ctx.fillStyle = rgbStr(r, g, b, 0.6 + Math.sin(time * 6 + i * 0.5) * 0.3);
    ctx.fillRect(Math.round(px), Math.round(py), pixSize, pixSize);
  }

  // core
  ctx.fillStyle = rgbStr(Math.min(255, r + 60), Math.min(255, g + 60), Math.min(255, b + 60), 0.9);
  ctx.fillRect(Math.round(cx - 2), Math.round(cy - 2), 4, 4);
}

/* ── Draw a pixel-art "CPU chip" node ────────────────────────── */
export function drawChipNode(ctx, x, y, size, color, state, time, label, opts = {}) {
  const [r, g, b] = hexToRgb(color);
  const half = size / 2;
  const pinLen = 6;
  const pinW = 2;
  const pinGap = 6;
  const bodyInset = pinLen + 2;

  // Body
  const bx = x + bodyInset;
  const by = y + bodyInset;
  const bw = size - bodyInset * 2;
  const bh = size - bodyInset * 2;

  // Dark fill
  ctx.fillStyle = 'rgb(12, 14, 18)';
  ctx.fillRect(bx, by, bw, bh);

  // Inner glow based on state (skip when expanded to show problems inside)
  if (!opts.skipInterior && (state === 'active' || state === 'complete')) {
    const glowAlpha =
      state === 'complete' ? 0.25 + Math.sin(time * 2) * 0.08 : 0.12 + Math.sin(time * 3) * 0.06;
    drawDitheredRect(ctx, bx + 2, by + 2, bw - 4, bh - 4, color, glowAlpha * 3, 2);
  }

  // Border
  const borderAlpha = state === 'locked' ? 0.2 : state === 'complete' ? 0.8 : 0.5;
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, borderAlpha), 2);

  // Corner notches
  ctx.fillStyle = 'rgb(12, 14, 18)';
  ctx.fillRect(bx, by, 4, 4);
  ctx.fillRect(bx + bw - 4, by, 4, 4);
  ctx.fillRect(bx, by + bh - 4, 4, 4);
  ctx.fillRect(bx + bw - 4, by + bh - 4, 4, 4);
  // Notch border pixels
  ctx.fillStyle = rgbStr(r, g, b, borderAlpha * 0.6);
  ctx.fillRect(bx + 4, by, 1, 2);
  ctx.fillRect(bx, by + 4, 2, 1);

  // Pins (top, bottom, left, right)
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  const numPinsH = Math.floor((bw - 8) / pinGap);
  const numPinsV = Math.floor((bh - 8) / pinGap);

  for (let i = 0; i < numPinsH; i++) {
    const px = bx + 4 + i * pinGap;
    // Top pins
    ctx.fillStyle = pinColor;
    ctx.fillRect(px, y, pinW, pinLen);
    // Bottom pins
    ctx.fillRect(px, y + size - pinLen, pinW, pinLen);
  }
  for (let i = 0; i < numPinsV; i++) {
    const py = by + 4 + i * pinGap;
    // Left pins
    ctx.fillStyle = pinColor;
    ctx.fillRect(x, py, pinLen, pinW);
    // Right pins
    ctx.fillRect(x + size - pinLen, py, pinLen, pinW);
  }

  // Label text with dark backdrop for readability (skip when expanded / problems inside)
  if (label && !opts.skipLabel) {
    ctx.font = `bold 10px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Solid dark backdrop behind text so dithered glow doesn't obscure it
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(12, 14, 18, 0.88)';
    ctx.fillRect(
      Math.round(x + half - textW / 2 - 3),
      Math.round(y + half - 4 - 7),
      Math.round(textW + 6),
      14
    );
    ctx.fillStyle = rgbStr(r, g, b, state === 'locked' ? 0.3 : 0.9);
    ctx.fillText(label, x + half, y + half - 4);
  }

  // Problem count or status below label
  if (state === 'complete') {
    // Checkmark pixels
    const cx = x + half - 4;
    const cy = y + half + 6;
    ctx.fillStyle = rgbStr(r, g, b, 0.9);
    ctx.fillRect(cx, cy + 4, 2, 2);
    ctx.fillRect(cx + 2, cy + 6, 2, 2);
    ctx.fillRect(cx + 4, cy + 4, 2, 2);
    ctx.fillRect(cx + 6, cy + 2, 2, 2);
    ctx.fillRect(cx + 8, cy, 2, 2);
  }

  // Aura for active/complete
  if (state === 'active' || state === 'complete') {
    const auraR = size / 2 + 8;
    const particleCount = state === 'complete' ? 24 : 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * (state === 'complete' ? 1.5 : 0.8);
      const dist = auraR + Math.sin(time * 3 + i * 1.3) * 6;
      const px = x + half + Math.cos(angle) * dist;
      const py = y + half + Math.sin(angle) * dist;
      const a = 0.15 + Math.sin(time * 4 + i * 0.7) * 0.1;
      ctx.fillStyle = rgbStr(0, 255, 255, a);
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }
}

/* ── Mini chip for world-space problem nodes inside cluster chips ── */
export function drawMiniChip(ctx, x, y, size, color, state, time) {
  const [r, g, b] = hexToRgb(color);

  // Body fill
  ctx.fillStyle = state === 'locked' ? 'rgb(20, 22, 26)' : 'rgb(12, 14, 18)';
  ctx.fillRect(x, y, size, size);

  // Pixel border
  const ba = state === 'locked' ? 0.12 : state === 'complete' ? 0.85 : 0.45;
  ctx.fillStyle = rgbStr(r, g, b, ba);
  ctx.fillRect(x, y, size, 0.5); // top
  ctx.fillRect(x, y + size - 0.5, size, 0.5); // bottom
  ctx.fillRect(x, y, 0.5, size); // left
  ctx.fillRect(x + size - 0.5, y, 0.5, size); // right

  // Interior glow
  if (state === 'active') {
    const ga = 0.1 + Math.sin(time * 3 + x * 0.5) * 0.04;
    ctx.fillStyle = rgbStr(r, g, b, ga);
    ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
  } else if (state === 'complete') {
    const ga = 0.22 + Math.sin(time * 2) * 0.06;
    ctx.fillStyle = rgbStr(r, g, b, ga);
    ctx.fillRect(x + 0.5, y + 0.5, size - 1, size - 1);
    // Tiny checkmark dots
    ctx.fillStyle = rgbStr(r, g, b, 0.9);
    ctx.fillRect(x + size * 0.25, y + size * 0.6, 0.8, 0.8);
    ctx.fillRect(x + size * 0.45, y + size * 0.75, 0.8, 0.8);
    ctx.fillRect(x + size * 0.65, y + size * 0.5, 0.8, 0.8);
  }
}

/* ── Circuit trace (orthogonal PCB-style line between two points) ── */
export function drawCircuitTrace(ctx, x0, y0, x1, y1, color, lineW = 2, alpha = 0.5) {
  const [r, g, b] = hexToRgb(color);
  ctx.fillStyle = rgbStr(r, g, b, alpha);

  // Route: horizontal from x0, then vertical, then horizontal to x1
  const midX = (x0 + x1) / 2;

  // Horizontal segment from x0 to midX
  const hx = Math.min(x0, midX);
  const hw = Math.abs(midX - x0);
  if (hw > 0) ctx.fillRect(Math.round(hx), Math.round(y0 - lineW / 2), Math.round(hw), lineW);

  // Vertical segment from y0 to y1 at midX
  const vy = Math.min(y0, y1);
  const vh = Math.abs(y1 - y0);
  if (vh > 0) ctx.fillRect(Math.round(midX - lineW / 2), Math.round(vy), lineW, Math.round(vh));

  // Horizontal segment from midX to x1
  const hx2 = Math.min(midX, x1);
  const hw2 = Math.abs(x1 - midX);
  if (hw2 > 0) ctx.fillRect(Math.round(hx2), Math.round(y1 - lineW / 2), Math.round(hw2), lineW);

  // Junction dots at turns
  ctx.fillStyle = rgbStr(r, g, b, alpha * 1.5);
  ctx.fillRect(Math.round(midX - 1), Math.round(y0 - 1), 3, 3);
  ctx.fillRect(Math.round(midX - 1), Math.round(y1 - 1), 3, 3);
}

/* ── IC Component block (labeled rectangle with pins for micro view) ── */
export function drawComponentBlock(ctx, x, y, w, h, color, state, time, label, diff) {
  const [r, g, b] = hexToRgb(color);
  const locked = state === 'locked';
  const complete = state === 'complete';

  // Body fill
  ctx.fillStyle = locked ? 'rgb(16,18,22)' : 'rgb(10,12,16)';
  ctx.fillRect(x, y, w, h);

  // Inner glow — static for complete, animated for active, none for locked
  if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.22);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  } else if (!locked) {
    const ga = 0.08 + Math.sin(time * 3 + x * 0.01) * 0.03;
    ctx.fillStyle = rgbStr(r, g, b, ga);
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  // Border
  const ba = locked ? 0.15 : complete ? 0.85 : 0.5;
  drawPixelRect(ctx, x, y, w, h, rgbStr(r, g, b, ba), 2);

  // Pin stubs on all sides
  const pinColor = rgbStr(r, g, b, locked ? 0.1 : 0.3);
  const pinLen = 3;
  const pinGap = 8;

  // Top/bottom pins
  const hPins = Math.max(1, Math.floor((w - 6) / pinGap));
  for (let i = 0; i < hPins; i++) {
    const px = x + 4 + i * pinGap;
    ctx.fillStyle = pinColor;
    ctx.fillRect(px, y - pinLen, 2, pinLen);
    ctx.fillRect(px, y + h, 2, pinLen);
  }

  // Left/right pins
  const vPins = Math.max(1, Math.floor((h - 6) / pinGap));
  for (let i = 0; i < vPins; i++) {
    const py = y + 4 + i * pinGap;
    ctx.fillStyle = pinColor;
    ctx.fillRect(x - pinLen, py, pinLen, 2);
    ctx.fillRect(x + w, py, pinLen, 2);
  }

  // Orientation notch (top-left corner)
  ctx.fillStyle = rgbStr(r, g, b, ba * 0.4);
  ctx.fillRect(x + 3, y + 3, 3, 3);

  // Title text
  if (label) {
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let displayLabel = label;
    const maxChars = Math.floor(w / 7);
    if (displayLabel.length > maxChars) displayLabel = displayLabel.slice(0, maxChars - 1) + '…';
    ctx.fillStyle = rgbStr(r, g, b, locked ? 0.2 : 0.85);
    ctx.fillText(displayLabel, x + w / 2, y + h / 2 - (diff ? 6 : 0));
  }

  // Difficulty badge below title
  if (diff && !locked) {
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgbStr(r, g, b, 0.5);
    ctx.fillText(diff, x + w / 2, y + h / 2 + 8);
  }

  // Completion indicator — larger, brighter
  if (complete) {
    const ox = x + w - 16,
      oy = y + 3;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(ox, oy, 12, 12);
    drawPixelRect(ctx, ox, oy, 12, 12, rgbStr(0, 255, 140, 0.5), 1);
    ctx.fillStyle = rgbStr(0, 255, 140, 0.95);
    ctx.fillRect(ox + 2, oy + 6, 2, 2);
    ctx.fillRect(ox + 4, oy + 8, 2, 2);
    ctx.fillRect(ox + 6, oy + 6, 2, 2);
    ctx.fillRect(ox + 8, oy + 4, 2, 2);
  }

  // Lock overlay for locked problems
  if (locked) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    // Small padlock icon
    const lx = x + w / 2 - 4,
      ly = y + h - 16;
    ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
    ctx.fillRect(lx, ly + 2, 8, 6);
    drawPixelRect(ctx, lx, ly + 2, 8, 6, 'rgba(120,120,145,0.4)', 1);
    ctx.fillStyle = 'rgba(80, 80, 100, 0.55)';
    ctx.fillRect(lx + 1, ly - 1, 2, 3);
    ctx.fillRect(lx + 5, ly - 1, 2, 3);
    ctx.fillRect(lx + 1, ly - 1, 6, 2);
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.fillRect(lx + 3, ly + 4, 2, 2);
  }
}

/* ── PCB background pattern (green circuit board traces) ─────── */
export function drawPcbBackground(ctx, w, h, time, color = '#00FF8C') {
  const [r, g, b] = hexToRgb(color);

  // Dark PCB base
  ctx.fillStyle = '#080a0e';
  ctx.fillRect(0, 0, w, h);

  // Faint grid
  const gridSize = 24;
  for (let gy = 0; gy < h; gy += gridSize) {
    ctx.fillStyle = rgbStr(r, g, b, 0.02);
    ctx.fillRect(0, gy, w, 1);
  }
  for (let gx = 0; gx < w; gx += gridSize) {
    ctx.fillStyle = rgbStr(r, g, b, 0.02);
    ctx.fillRect(gx, 0, 1, h);
  }

  // Ground plane traces (random-looking but deterministic)
  const rng = createRng(Math.floor(time * 0.5) + 7777);
  const traceCount = Math.floor((w * h) / 30000);
  for (let i = 0; i < traceCount; i++) {
    const tx = Math.floor(rng() * w);
    const ty = Math.floor(rng() * h);
    const horizontal = rng() > 0.5;
    const len = 20 + Math.floor(rng() * 60);
    const traceA = 0.03 + rng() * 0.02;
    ctx.fillStyle = rgbStr(r, g, b, traceA);
    if (horizontal) {
      ctx.fillRect(tx, ty, len, 1);
    } else {
      ctx.fillRect(tx, ty, 1, len);
    }
  }

  // Via dots
  const viaCount = Math.floor((w * h) / 50000);
  for (let i = 0; i < viaCount; i++) {
    const vx = Math.floor(rng() * w);
    const vy = Math.floor(rng() * h);
    ctx.fillStyle = rgbStr(r, g, b, 0.06);
    ctx.fillRect(vx - 1, vy - 1, 3, 3);
    ctx.fillStyle = rgbStr(r, g, b, 0.12);
    ctx.fillRect(vx, vy, 1, 1);
  }
}

/* ── Dithered screen flash overlay ───────────────────────────── */
export function drawFlashOverlay(ctx, w, h, progress, color = '#00FFFF') {
  const [r, g, b] = hexToRgb(color);
  // Peak at progress=0.5, ease in and out
  const intensity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

  if (intensity <= 0) return;

  // Solid fill with varying alpha
  const alpha = intensity * 0.7;
  ctx.fillStyle = rgbStr(r, g, b, alpha);
  ctx.fillRect(0, 0, w, h);

  // Dithered fringe
  if (intensity > 0.3) {
    drawDitheredRect(
      ctx,
      0,
      0,
      w,
      h,
      `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
      intensity * 0.5,
      4
    );
  }
}

/* ── Voltage bar (progress bar with pixel energy fill) ───────── */
export function drawVoltageBar(ctx, x, y, w, h, progress, color, time) {
  const [r, g, b] = hexToRgb(color);

  // Stone/rock channel border
  drawPixelRect(ctx, x, y, w, h, 'rgb(60, 60, 65)', 2);
  ctx.fillStyle = 'rgb(18, 20, 24)';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  if (progress <= 0) return;

  const fillW = Math.round((w - 4) * Math.min(1, progress));
  const fx = x + 2;
  const fy = y + 2;
  const fh = h - 4;

  if (progress >= 1) {
    // Full — chaotic hyper-saturated cyan-lime
    for (let px = 0; px < fillW; px += 2) {
      for (let py = 0; py < fh; py += 2) {
        const noise = Math.sin(time * 5 + px * 0.3 + py * 0.5) * 0.5 + 0.5;
        const flicker = Math.sin(time * 8 + px * 0.7) > 0.3 ? 1 : 0.6;
        if (noise > 0.15) {
          const isLime = Math.sin(time * 3 + px * 0.2) > 0;
          const cr = isLime ? 0 : 0;
          const cg = isLime ? 255 : 255;
          const cb = isLime ? 128 : 255;
          ctx.fillStyle = rgbStr(cr, cg, cb, noise * flicker * 0.85);
          ctx.fillRect(fx + px, fy + py, 2, 2);
        }
      }
    }
    // Arc sparks
    for (let i = 0; i < 6; i++) {
      const sx = fx + Math.random() * fillW;
      const sy = fy + Math.random() * fh;
      ctx.fillStyle = 'rgba(200,255,255,0.9)';
      ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
  } else {
    // Partial — flickering cyan pixel shards
    for (let px = 0; px < fillW; px += 2) {
      for (let py = 0; py < fh; py += 2) {
        const noise = Math.sin(time * 4 + px * 0.4 + py * 0.6) * 0.5 + 0.5;
        if (noise > 0.3) {
          const flicker = Math.sin(time * 6 + px * 0.5) * 0.3 + 0.5;
          ctx.fillStyle = rgbStr(r, g, b, noise * flicker);
          ctx.fillRect(fx + px, fy + py, 2, 2);
        }
      }
    }
    // Leading-edge arc
    const edgeX = fx + fillW;
    for (let i = 0; i < 4; i++) {
      const ey = fy + (fh * (i + 0.5)) / 4;
      const jitter = Math.sin(time * 7 + i * 2) * 4;
      ctx.fillStyle = rgbStr(r, g, b, 0.7);
      ctx.fillRect(Math.round(edgeX + jitter), Math.round(ey), 2, 2);
    }
  }
}
