/**
 * chipVariants.js — Unique visual variants for cluster chip nodes.
 *
 * Each cluster gets a deterministic shape variant based on its properties,
 * so the macro grid shows visually distinct "CPUs" rather than identical squares.
 *
 *   variant 0 : standard  – balanced pins, square body
 *   variant 1 : wide-bus  – wide body, heavy top/bottom pins, data-bus markings
 *   variant 2 : dual-core – split body with bridge section
 *   variant 3 : compact   – smaller body, dense pins, heat-spreader lid
 *   variant 4 : comms     – antenna-style extended pins, asymmetric
 *   variant 5 : gpu-style – wide body, grid of small cores inside
 */

import { drawDitheredRect, drawPixelRect, hexToRgb, rgbStr } from './pixelUtils';

const RETRO_CHIP_FACE = 'rgb(223, 216, 204)';
const RETRO_CHIP_FACE_LOCKED = 'rgb(191, 185, 175)';
const RETRO_CHIP_TEXT = '#1f1f1f';
const RETRO_CHIP_MUTED = '#5f594e';

function getChipFaceFill(state) {
  return state === 'locked' ? RETRO_CHIP_FACE_LOCKED : RETRO_CHIP_FACE;
}

/* ── Variant assignment ──────────────────────────────────────── */

/** Deterministic variant index from cluster id */
export function getVariantIndex(cluster) {
  let hash = 0;
  const id = cluster.id || '';
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 6;
}

/* ── Master draw function ────────────────────────────────────── */

/**
 * Draw a chip node with variant-specific styling.
 * All variants fit within the same (x, y, size) bounding box.
 */
export function drawVariantChip(ctx, x, y, size, color, state, time, label, variant, opts = {}) {
  const [r, g, b] = hexToRgb(color);
  const half = size / 2;
  const locked = state === 'locked';
  const complete = state === 'complete';
  const ba = locked ? 0.2 : complete ? 0.8 : 0.5;

  switch (variant) {
    case 1:
      drawWideBus(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
    case 2:
      drawDualCore(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
    case 3:
      drawCompact(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
    case 4:
      drawComms(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
    case 5:
      drawGpuStyle(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
    default:
      drawStandard(ctx, x, y, size, r, g, b, ba, state, time, label, opts);
      break;
  }

  // Orbiting aura particles (active only — animated)
  if (state === 'active') {
    const auraR = half + 8;
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 0.8;
      const dist = auraR + Math.sin(time * 3 + i * 1.3) * 6;
      const px = x + half + Math.cos(angle) * dist;
      const py = y + half + Math.sin(angle) * dist;
      const a = 0.15 + Math.sin(time * 4 + i * 0.7) * 0.1;
      ctx.fillStyle = rgbStr(r, g, b, Math.max(0.05, a * 0.7));
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }

  // Static completion ring (complete — no animation)
  if (complete) {
    const auraR = half + 6;
    const dotCount = 24;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const px = x + half + Math.cos(angle) * auraR;
      const py = y + half + Math.sin(angle) * auraR;
      ctx.fillStyle = rgbStr(r, g, b, 0.25);
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }

  // Lock overlay for locked chips
  if (locked) {
    drawLockOverlay(ctx, x, y, size);
  }
}

/* ── Shared helpers ──────────────────────────────────────────── */

function drawPins(ctx, x, y, size, color, pinLen, pinW, pinGap, sides = 'all') {
  const bodyInset = pinLen + 2;
  const bx = x + bodyInset;
  const by = y + bodyInset;
  const bw = size - bodyInset * 2;
  const bh = size - bodyInset * 2;
  const numH = Math.floor((bw - 8) / pinGap);
  const numV = Math.floor((bh - 8) / pinGap);

  ctx.fillStyle = color;
  if (sides === 'all' || sides.includes('t')) {
    for (let i = 0; i < numH; i++) ctx.fillRect(bx + 4 + i * pinGap, y, pinW, pinLen);
  }
  if (sides === 'all' || sides.includes('b')) {
    for (let i = 0; i < numH; i++)
      ctx.fillRect(bx + 4 + i * pinGap, y + size - pinLen, pinW, pinLen);
  }
  if (sides === 'all' || sides.includes('l')) {
    for (let i = 0; i < numV; i++) ctx.fillRect(x, by + 4 + i * pinGap, pinLen, pinW);
  }
  if (sides === 'all' || sides.includes('r')) {
    for (let i = 0; i < numV; i++)
      ctx.fillRect(x + size - pinLen, by + 4 + i * pinGap, pinLen, pinW);
  }
}

function drawLabel(ctx, x, y, size, r, g, b, state, label, opts = {}) {
  if (!label || opts.skipLabel) return;
  const half = size / 2;
  ctx.font = 'bold 10px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textW = ctx.measureText(label).width;
  ctx.fillStyle = state === 'locked' ? 'rgba(227, 221, 210, 0.72)' : 'rgba(244, 239, 231, 0.88)';
  ctx.fillRect(
    Math.round(x + half - textW / 2 - 3),
    Math.round(y + half - 11),
    Math.round(textW + 6),
    14
  );
  ctx.fillStyle = state === 'locked' ? RETRO_CHIP_MUTED : RETRO_CHIP_TEXT;
  ctx.fillText(label, x + half, y + half - 4);
}

function drawBodyGlow(ctx, bx, by, bw, bh, color, state, time, opts) {
  if (opts.skipInterior) return;
  if (state === 'complete') {
    // Static solid glow — no animation
    drawDitheredRect(ctx, bx + 2, by + 2, bw - 4, bh - 4, color, 0.6, 2);
  } else if (state === 'active') {
    // Pulsing animated glow
    const a = 0.12 + Math.sin(time * 3) * 0.06;
    drawDitheredRect(ctx, bx + 2, by + 2, bw - 4, bh - 4, color, a * 3, 2);
  }
}

function drawCompletionMark(ctx, cx, cy) {
  // Larger, clearly visible completion indicator
  const ox = cx - 2,
    oy = cy - 2;
  ctx.fillStyle = 'rgba(244, 239, 231, 0.92)';
  ctx.fillRect(ox, oy, 14, 14);
  drawPixelRect(ctx, ox, oy, 14, 14, 'rgba(47, 109, 52, 0.7)', 1);
  // Pixel-art checkmark (retro green)
  ctx.fillStyle = 'rgba(47, 109, 52, 0.96)';
  ctx.fillRect(ox + 2, oy + 8, 2, 2);
  ctx.fillRect(ox + 4, oy + 10, 2, 2);
  ctx.fillRect(ox + 6, oy + 8, 2, 2);
  ctx.fillRect(ox + 8, oy + 6, 2, 2);
  ctx.fillRect(ox + 10, oy + 4, 2, 2);
}

/** Dimmed lock overlay for locked chips */
function drawLockOverlay(ctx, x, y, size) {
  const half = size / 2;
  const cx = x + half,
    cy = y + half;
  // Dark scrim
  const bodyIn = 8;
  ctx.fillStyle = 'rgba(188, 182, 171, 0.46)';
  ctx.fillRect(x + bodyIn, y + bodyIn, size - bodyIn * 2, size - bodyIn * 2);
  // Lock body
  const lx = cx - 5,
    ly = cy - 3;
  ctx.fillStyle = 'rgba(128, 132, 147, 0.82)';
  ctx.fillRect(lx, ly + 3, 10, 8);
  drawPixelRect(ctx, lx, ly + 3, 10, 8, 'rgba(245,241,231,0.52)', 1);
  // Shackle arch
  ctx.fillStyle = 'rgba(108, 117, 138, 0.72)';
  ctx.fillRect(lx + 2, ly - 1, 2, 4);
  ctx.fillRect(lx + 6, ly - 1, 2, 4);
  ctx.fillRect(lx + 2, ly - 1, 6, 2);
  // Keyhole
  ctx.fillStyle = 'rgba(51, 58, 72, 0.92)';
  ctx.fillRect(lx + 4, ly + 5, 2, 2);
  ctx.fillRect(lx + 4, ly + 7, 2, 3);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 0 — Standard CPU (similar to original but refined)
   ═══════════════════════════════════════════════════════════════ */
function drawStandard(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 6;
  const bodyIn = pinLen + 2;
  const bx = x + bodyIn,
    by = y + bodyIn;
  const bw = size - bodyIn * 2,
    bh = size - bodyIn * 2;

  // Body
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, bh);
  drawBodyGlow(
    ctx,
    bx,
    by,
    bw,
    bh,
    `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
    state,
    time,
    opts
  );
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, ba), 2);

  // Corner notches
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, 4, 4);
  ctx.fillRect(bx + bw - 4, by, 4, 4);
  ctx.fillRect(bx, by + bh - 4, 4, 4);
  ctx.fillRect(bx + bw - 4, by + bh - 4, 4, 4);

  // Orientation dot (top-left)
  ctx.fillStyle = rgbStr(r, g, b, ba * 0.8);
  ctx.fillRect(bx + 6, by + 6, 3, 3);

  // Pins
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  drawPins(ctx, x, y, size, pinColor, pinLen, 2, 6);

  drawLabel(ctx, x, y, size, r, g, b, state, label, opts);
  if (state === 'complete') drawCompletionMark(ctx, x + size / 2 - 4, y + size / 2 + 2, r, g, b);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 1 — Wide Bus (heavy top/bottom pins, data-bus lines)
   ═══════════════════════════════════════════════════════════════ */
function drawWideBus(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 8;
  const bodyIn = 6;
  const bx = x + bodyIn,
    by = y + pinLen + 4;
  const bw = size - bodyIn * 2,
    bh = size - (pinLen + 4) * 2;

  // Body (wider rectangle)
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, bh);
  drawBodyGlow(
    ctx,
    bx,
    by,
    bw,
    bh,
    `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
    state,
    time,
    opts
  );
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, ba), 2);

  // Heavy top pins (double row)
  const numPinsTop = Math.floor((bw - 4) / 5);
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.45);
  for (let i = 0; i < numPinsTop; i++) {
    const px = bx + 2 + i * 5;
    ctx.fillStyle = pinColor;
    ctx.fillRect(px, y, 2, pinLen); // top
    ctx.fillRect(px, y + size - pinLen, 2, pinLen); // bottom
  }

  // Side pins (fewer, shorter)
  const sidePin = 4;
  for (let i = 0; i < 3; i++) {
    const py = by + 6 + i * 10;
    ctx.fillStyle = pinColor;
    ctx.fillRect(x, py, sidePin, 2);
    ctx.fillRect(x + size - sidePin, py, sidePin, 2);
  }

  // Data bus lines inside body (horizontal parallel lines)
  if (!opts.skipInterior && state !== 'locked') {
    const busAlpha = state === 'active' ? 0.12 + Math.sin(time * 2) * 0.04 : 0.14;
    for (let i = 0; i < 3; i++) {
      const ly = by + 8 + i * 8;
      ctx.fillStyle = rgbStr(r, g, b, busAlpha);
      ctx.fillRect(bx + 4, ly, bw - 8, 1);
    }
  }

  // Corner brackets
  ctx.fillStyle = rgbStr(r, g, b, ba * 0.5);
  ctx.fillRect(bx, by, 6, 2);
  ctx.fillRect(bx, by, 2, 6);
  ctx.fillRect(bx + bw - 6, by, 6, 2);
  ctx.fillRect(bx + bw - 2, by, 2, 6);

  drawLabel(ctx, x, y, size, r, g, b, state, label, opts);
  if (state === 'complete') drawCompletionMark(ctx, x + size / 2 - 4, y + size / 2 + 2, r, g, b);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 2 — Dual Core (two body sections with bridge)
   ═══════════════════════════════════════════════════════════════ */
function drawDualCore(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 6;
  const bodyIn = pinLen + 2;
  const bx = x + bodyIn,
    by = y + bodyIn;
  const bw = size - bodyIn * 2,
    bh = size - bodyIn * 2;
  const halfH = (bh - 6) / 2;

  // Two body halves
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, halfH);
  ctx.fillRect(bx, by + halfH + 6, bw, halfH);

  // Bridge between cores
  const bridgeW = 10;
  const bridgeX = bx + (bw - bridgeW) / 2;
  const bridgeA =
    state === 'active' ? 0.15 + Math.sin(time * 4) * 0.08 : state === 'complete' ? 0.2 : 0.06;
  ctx.fillStyle = rgbStr(r, g, b, bridgeA);
  ctx.fillRect(bridgeX, by + halfH, bridgeW, 6);
  ctx.fillStyle = rgbStr(r, g, b, ba * 0.6);
  ctx.fillRect(bridgeX, by + halfH, bridgeW, 1);
  ctx.fillRect(bridgeX, by + halfH + 5, bridgeW, 1);

  // Glow per core
  if (!opts.skipInterior) {
    const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    drawBodyGlow(ctx, bx, by, bw, halfH, hex, state, time, {});
    drawBodyGlow(ctx, bx, by + halfH + 6, bw, halfH, hex, state, time, {});
  }

  // Borders
  drawPixelRect(ctx, bx, by, bw, halfH, rgbStr(r, g, b, ba), 2);
  drawPixelRect(ctx, bx, by + halfH + 6, bw, halfH, rgbStr(r, g, b, ba), 2);

  // Core labels
  if (!opts.skipLabel && state !== 'locked') {
    ctx.fillStyle = rgbStr(r, g, b, 0.35);
    ctx.font = '7px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CORE-0', x + size / 2, by + halfH / 2);
    ctx.fillText('CORE-1', x + size / 2, by + halfH + 6 + halfH / 2);
  }

  // Pins
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  drawPins(ctx, x, y, size, pinColor, pinLen, 2, 6);

  // Main label above
  if (label && !opts.skipLabel) {
    ctx.fillStyle = rgbStr(r, g, b, state === 'locked' ? 0.3 : 0.9);
    ctx.font = 'bold 9px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, x + size / 2, by - 1);
  }

  if (state === 'complete')
    drawCompletionMark(ctx, x + size / 2 - 4, by + halfH + 6 + halfH / 2 + 2, r, g, b);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 3 — Compact (smaller body, dense pins, heat spreader)
   ═══════════════════════════════════════════════════════════════ */
function drawCompact(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 10;
  const bodyIn = pinLen + 2;
  const bx = x + bodyIn,
    by = y + bodyIn;
  const bw = size - bodyIn * 2,
    bh = size - bodyIn * 2;

  // Body
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, bh);

  // Heat spreader lid (inner rectangle)
  const lidPad = 4;
  ctx.fillStyle = rgbStr(r, g, b, 0.06);
  ctx.fillRect(bx + lidPad, by + lidPad, bw - lidPad * 2, bh - lidPad * 2);
  drawPixelRect(
    ctx,
    bx + lidPad,
    by + lidPad,
    bw - lidPad * 2,
    bh - lidPad * 2,
    rgbStr(r, g, b, ba * 0.3),
    1
  );

  // Diagonal hash marks on lid
  if (!opts.skipInterior && state !== 'locked') {
    const hatchAlpha = state === 'active' ? 0.08 + Math.sin(time * 2) * 0.03 : 0.09;
    for (let d = 0; d < bw; d += 6) {
      const sx = bx + lidPad + d;
      const sy = by + lidPad;
      const len = Math.min(6, bw - lidPad * 2 - d, bh - lidPad * 2);
      for (let k = 0; k < len; k++) {
        ctx.fillStyle = rgbStr(r, g, b, hatchAlpha);
        ctx.fillRect(sx + k, sy + k, 1, 1);
      }
    }
  }

  drawBodyGlow(
    ctx,
    bx,
    by,
    bw,
    bh,
    `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
    state,
    time,
    opts
  );
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, ba), 2);

  // Dense pins (closer spacing)
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  drawPins(ctx, x, y, size, pinColor, pinLen, 2, 4);

  drawLabel(ctx, x, y, size, r, g, b, state, label, opts);
  if (state === 'complete') drawCompletionMark(ctx, x + size / 2 - 4, y + size / 2 + 2, r, g, b);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 4 — Comms (antenna pins, asymmetric)
   ═══════════════════════════════════════════════════════════════ */
function drawComms(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 6;
  const bodyIn = pinLen + 2;
  const bx = x + bodyIn,
    by = y + bodyIn;
  const bw = size - bodyIn * 2,
    bh = size - bodyIn * 2;

  // Body
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, bh);
  drawBodyGlow(
    ctx,
    bx,
    by,
    bw,
    bh,
    `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
    state,
    time,
    opts
  );
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, ba), 2);

  // Normal pins left and bottom
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  drawPins(ctx, x, y, size, pinColor, pinLen, 2, 6, 'lb');

  // Extended "antenna" pins on top (longer)
  const antLen = 12;
  const numAnt = 3;
  const antGap = Math.floor(bw / (numAnt + 1));
  for (let i = 0; i < numAnt; i++) {
    const ax = bx + antGap * (i + 1) - 1;
    ctx.fillStyle = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.5);
    ctx.fillRect(ax, y - 4, 2, antLen + 4);
    // Antenna tip dot
    const tipA =
      state === 'active'
        ? 0.3 + Math.sin(time * 5 + i * 2) * 0.2
        : state === 'complete'
          ? 0.35
          : 0.1;
    ctx.fillStyle = rgbStr(r, g, b, tipA);
    ctx.fillRect(ax - 1, y - 6, 4, 4);
  }

  // Broadcast wave arcs on right (active only — animated)
  if (state === 'active') {
    const waveX = x + size;
    const waveY = y + size / 2;
    for (let i = 0; i < 3; i++) {
      const waveR = 6 + i * 5;
      const waveAlpha = 0.15 - i * 0.04 + Math.sin(time * 3 + i) * 0.06;
      ctx.fillStyle = rgbStr(r, g, b, Math.max(0, waveAlpha));
      // Draw arc pixels
      for (let a = -0.4; a <= 0.4; a += 0.15) {
        const wx = waveX + Math.cos(a) * waveR;
        const wy = waveY + Math.sin(a) * waveR;
        ctx.fillRect(Math.round(wx), Math.round(wy), 2, 2);
      }
    }
  }

  // Side pins on right (shorter, staggered)
  for (let i = 0; i < 4; i++) {
    const py = by + 4 + i * 8;
    const pLen = i % 2 === 0 ? 4 : 6;
    ctx.fillStyle = pinColor;
    ctx.fillRect(x + size - pLen, py, pLen, 2);
  }

  drawLabel(ctx, x, y, size, r, g, b, state, label, opts);
  if (state === 'complete') drawCompletionMark(ctx, x + size / 2 - 4, y + size / 2 + 2, r, g, b);
}

/* ═══════════════════════════════════════════════════════════════
   Variant 5 — GPU Style (grid of small cores inside)
   ═══════════════════════════════════════════════════════════════ */
function drawGpuStyle(ctx, x, y, size, r, g, b, ba, state, time, label, opts) {
  const pinLen = 6;
  const bodyIn = pinLen + 2;
  const bx = x + bodyIn,
    by = y + bodyIn;
  const bw = size - bodyIn * 2,
    bh = size - bodyIn * 2;

  // Body
  ctx.fillStyle = getChipFaceFill(state);
  ctx.fillRect(bx, by, bw, bh);
  drawPixelRect(ctx, bx, by, bw, bh, rgbStr(r, g, b, ba), 2);

  // Grid of "shader cores" inside
  if (!opts.skipInterior && state !== 'locked') {
    const coreSize = 6;
    const corePad = 3;
    const cols = Math.floor((bw - 8) / (coreSize + corePad));
    const rows = Math.floor((bh - 8) / (coreSize + corePad));
    const gridW = cols * (coreSize + corePad) - corePad;
    const gridH = rows * (coreSize + corePad) - corePad;
    const ox = bx + (bw - gridW) / 2;
    const oy = by + (bh - gridH) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = ox + col * (coreSize + corePad);
        const cy = oy + row * (coreSize + corePad);
        const coreIdx = row * cols + col;
        const flicker = state === 'active' ? Math.sin(time * 3 + coreIdx * 0.5) * 0.15 : 0;
        const coreA = state === 'complete' ? 0.35 + flicker : 0.15 + flicker * 0.5;
        ctx.fillStyle = rgbStr(r, g, b, Math.max(0.05, coreA));
        ctx.fillRect(cx, cy, coreSize, coreSize);
        drawPixelRect(ctx, cx, cy, coreSize, coreSize, rgbStr(r, g, b, ba * 0.3), 1);
      }
    }
  } else {
    drawBodyGlow(
      ctx,
      bx,
      by,
      bw,
      bh,
      `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`,
      state,
      time,
      opts
    );
  }

  // Pins
  const pinColor = rgbStr(r, g, b, state === 'locked' ? 0.15 : 0.4);
  drawPins(ctx, x, y, size, pinColor, pinLen, 2, 5);

  drawLabel(ctx, x, y, size, r, g, b, state, label, opts);
  if (state === 'complete') drawCompletionMark(ctx, x + size / 2 - 4, y + size / 2 + 2, r, g, b);
}
