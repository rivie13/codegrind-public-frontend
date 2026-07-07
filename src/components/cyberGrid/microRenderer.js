/**
 * microRenderer.js — Level 2: Processor-Internals view.
 *
 * Renders a single cluster's problems as IC components on a rich
 * cyber-PCB background.  Visual language matches Level 1 (grid dots,
 * data streams, glitch bits, noise) so the transition feels seamless.
 */

import {
  createRng,
  drawCircuitTrace,
  drawDataStream,
  drawGlitchBit,
  drawPixelRect,
  drawScanlines,
  drawVoltageBar,
  hexToRgb,
  rgbStr,
} from './pixelUtils';
import { getUnlockedOrderedSlugs } from '../../utils/progression/orderedUnlocks';

/* ── Layout constants (screen-space px) ─────────────────────── */
const DEFAULT_HEADER_H = 54;
const DEFAULT_COMP_W = 128;
const DEFAULT_COMP_H = 58;
const DEFAULT_PAD_X = 40;
const DEFAULT_MARGIN_BOTTOM = 50;
const TRACE_W = 2;

const resolveMicroMetrics = (w, h, options = {}) => {
  const forceCompact = Boolean(options?.compactMode);
  const isCompactViewport = forceCompact || w <= 760 || h <= 560;
  const isTightViewport = w <= 560 || h <= 460;

  const headerH = isTightViewport ? 46 : isCompactViewport ? 50 : DEFAULT_HEADER_H;
  const padX = isTightViewport ? 12 : isCompactViewport ? 22 : DEFAULT_PAD_X;
  const compW = isTightViewport ? 96 : isCompactViewport ? 112 : DEFAULT_COMP_W;
  const compH = isTightViewport ? 48 : isCompactViewport ? 54 : DEFAULT_COMP_H;
  const padTop = headerH + (isTightViewport ? 14 : isCompactViewport ? 20 : 32);
  const marginBottom = isTightViewport ? 44 : DEFAULT_MARGIN_BOTTOM;

  return {
    isCompactViewport,
    isTightViewport,
    headerH,
    padX,
    padTop,
    compW,
    compH,
    marginBottom,
  };
};

/* ── Node color palette (varied cyberpunk colors) ────────────── */
const NODE_PALETTE = [
  '#2f6d34',
  '#8a4a32',
  '#25508d',
  '#7a4b78',
  '#9a7421',
  '#5b4b8a',
  '#9a5f1f',
  '#2c6d64',
];

/** Fallback max free problems for guests in trial cluster */
const DEFAULT_GUEST_FREE_PROBLEM_LIMIT = 3;
const RETRO_NODE_FACE = 'rgb(223, 216, 204)';
const RETRO_NODE_FACE_LOCKED = 'rgb(191, 185, 175)';
const RETRO_NODE_TEXT = '#1f1f1f';
const RETRO_NODE_MUTED = '#5f594e';

function getNodeFaceFill(locked) {
  return locked ? RETRO_NODE_FACE_LOCKED : RETRO_NODE_FACE;
}

/** Pick a color from palette based on slug hash */
function getNodeColor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 7) - h + slug.charCodeAt(i)) | 0;
  return NODE_PALETTE[Math.abs(h) % NODE_PALETTE.length];
}

/** Pick shape variant 0-5 from slug hash */
function getShapeVariant(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return Math.abs(h) % 6;
}

/* ── Master shape dispatcher ─────────────────────────────────── */
function drawNodeShape(ctx, x, y, w, h, color, state, time, label, diff, variant) {
  const [r, g, b] = hexToRgb(color);
  switch (variant) {
    case 1:
      drawShapeDiamond(ctx, x, y, w, h, r, g, b, state, time);
      break;
    case 2:
      drawShapeCircle(ctx, x, y, w, h, r, g, b, state, time);
      break;
    case 3:
      drawShapeStar(ctx, x, y, w, h, r, g, b, state, time);
      break;
    case 4:
      drawShapeHexagon(ctx, x, y, w, h, r, g, b, state, time);
      break;
    case 5:
      drawShapeTriangle(ctx, x, y, w, h, r, g, b, state, time);
      break;
    default:
      drawShapeChip(ctx, x, y, w, h, r, g, b, state, time);
      break;
  }
  // Label (on top of shape)
  drawNodeLabel(ctx, x, y, w, h, r, g, b, state, label, diff);
  // BIG state overlays — unmistakable
  if (state === 'complete') drawBigCheck(ctx, x, y, w, h, r, g, b);
  else if (state === 'locked-complete') drawBigLockedComplete(ctx, x, y, w, h, r, g, b);
  else if (state === 'locked') drawBigLock(ctx, x, y, w, h);
  else if (state === 'active') drawActivePulse(ctx, x, y, w, h, r, g, b, time);
}

/* ══════════════════════════════════════════════════════════════
   SHAPE VARIANTS — visually distinct geometric forms
   ═════════════════════════════════════════════════════════════ */

/* ── Shape 0: Classic Chip (rectangle + pins) ─────────────── */
function drawShapeChip(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const m = 6;
  const bx = x + m,
    by = y + m,
    bw = w - m * 2,
    bh = h - m * 2;
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fillRect(bx, by, bw, bh);
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.3);
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
  } else if (state === 'active') {
    const a = 0.08 + Math.sin(time * 3) * 0.05;
    ctx.fillStyle = rgbStr(r, g, b, a);
    ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
  }
  drawPixelRect(
    ctx,
    bx,
    by,
    bw,
    bh,
    rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5),
    2
  );
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fillRect(bx, by, 4, 4);
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.3);
  ctx.fillStyle = pc;
  for (let px = bx + 6; px < bx + bw - 4; px += 6) {
    ctx.fillRect(px, y, 2, m);
    ctx.fillRect(px, y + h - m, 2, m);
  }
  for (let py = by + 6; py < by + bh - 4; py += 6) {
    ctx.fillRect(x, py, m, 2);
    ctx.fillRect(x + w - m, py, m, 2);
  }
}

/* ── Shape 1: Diamond ──────────────────────────────────────── */
function drawShapeDiamond(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const cx = x + w / 2,
    cy = y + h / 2;
  const hw = w * 0.42,
    hh = h * 0.44;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fill();
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fill();
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.28);
    ctx.fill();
  } else if (state === 'active') {
    ctx.fillStyle = rgbStr(r, g, b, 0.06 + Math.sin(time * 3) * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner diamond
  if (!locked) {
    ctx.beginPath();
    const s = 0.55;
    ctx.moveTo(cx, cy - hh * s);
    ctx.lineTo(cx + hw * s, cy);
    ctx.lineTo(cx, cy + hh * s);
    ctx.lineTo(cx - hw * s, cy);
    ctx.closePath();
    ctx.strokeStyle = rgbStr(r, g, b, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.35);
  ctx.fillStyle = pc;
  ctx.fillRect(cx - 1, y, 2, 6);
  ctx.fillRect(cx - 1, y + h - 6, 2, 6);
  ctx.fillRect(x, cy - 1, 6, 2);
  ctx.fillRect(x + w - 6, cy - 1, 6, 2);
}

/* ── Shape 2: Circle ───────────────────────────────────────── */
function drawShapeCircle(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const cx = x + w / 2,
    cy = y + h / 2;
  const rx = w * 0.4,
    ry = h * 0.42;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fill();
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fill();
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.28);
    ctx.fill();
  } else if (state === 'active') {
    ctx.fillStyle = rgbStr(r, g, b, 0.06 + Math.sin(time * 2.5) * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!locked) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 6, ry - 6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rgbStr(r, g, b, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.3);
  ctx.fillStyle = pc;
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [0.7, -0.7],
    [0.7, 0.7],
    [-0.7, -0.7],
    [-0.7, 0.7],
  ];
  for (const [dx, dy] of dirs) {
    ctx.fillRect(Math.round(cx + dx * (rx + 3)) - 1, Math.round(cy + dy * (ry + 3)) - 1, 2, 2);
  }
}

/* ── Shape 3: Star (5-pointed) ─────────────────────────────── */
function drawShapeStar(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const cx = x + w / 2,
    cy = y + h / 2;
  const or2 = Math.min(w * 0.44, h * 0.46);
  const ir = or2 * 0.38;
  const aspect = w / h > 1.8 ? 1.3 : 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? or2 : ir;
    const px = cx + Math.cos(angle) * rad * aspect;
    const py = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fill();
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fill();
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.28);
    ctx.fill();
  } else if (state === 'active') {
    ctx.fillStyle = rgbStr(r, g, b, 0.06 + Math.sin(time * 3.5) * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.35);
  ctx.fillStyle = pc;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const px = cx + Math.cos(angle) * (or2 + 4) * aspect;
    const py = cy + Math.sin(angle) * (or2 + 4);
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
  }
}

/* ── Shape 4: Hexagon ──────────────────────────────────────── */
function drawShapeHexagon(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const cx = x + w / 2,
    cy = y + h / 2;
  const rx = w * 0.44,
    ry = h * 0.46;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const px = cx + Math.cos(angle) * rx;
    const py = cy + Math.sin(angle) * ry;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fill();
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fill();
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.28);
    ctx.fill();
  } else if (state === 'active') {
    ctx.fillStyle = rgbStr(r, g, b, 0.07 + Math.sin(time * 2.8) * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!locked) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = cx + Math.cos(angle) * rx * 0.6;
      const py = cy + Math.sin(angle) * ry * 0.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgbStr(r, g, b, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.3);
  ctx.fillStyle = pc;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const px = cx + Math.cos(angle) * (rx + 4);
    const py = cy + Math.sin(angle) * (ry + 4);
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
  }
}

/* ── Shape 5: Triangle (pointing up) ──────────────────────── */
function drawShapeTriangle(ctx, x, y, w, h, r, g, b, state, time) {
  const locked = state === 'locked' || state === 'locked-complete';
  const complete = state === 'complete';
  const lockedComplete = state === 'locked-complete';
  const cx = x + w / 2;
  const m = 4;
  ctx.beginPath();
  ctx.moveTo(cx, y + m);
  ctx.lineTo(x + w - m, y + h - m);
  ctx.lineTo(x + m, y + h - m);
  ctx.closePath();
  ctx.fillStyle = getNodeFaceFill(locked);
  ctx.fill();
  if (lockedComplete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.1);
    ctx.fill();
  } else if (complete) {
    ctx.fillStyle = rgbStr(r, g, b, 0.28);
    ctx.fill();
  } else if (state === 'active') {
    ctx.fillStyle = rgbStr(r, g, b, 0.06 + Math.sin(time * 3) * 0.04);
    ctx.fill();
  }
  ctx.strokeStyle = rgbStr(r, g, b, lockedComplete ? 0.25 : locked ? 0.12 : complete ? 0.8 : 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!locked) {
    ctx.beginPath();
    ctx.moveTo(cx, y + m + 10);
    ctx.lineTo(x + w - m - 14, y + h - m - 6);
    ctx.lineTo(x + m + 14, y + h - m - 6);
    ctx.closePath();
    ctx.strokeStyle = rgbStr(r, g, b, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const pc = rgbStr(r, g, b, locked ? 0.08 : 0.3);
  ctx.fillStyle = pc;
  ctx.fillRect(cx - 1, y - 2, 2, m + 2);
  ctx.fillRect(x - 2, y + h - m, m + 2, 2);
  ctx.fillRect(x + w - m, y + h - m, m + 2, 2);
}

/* ══════════════════════════════════════════════════════════════
   STATE OVERLAYS — BIG, OBVIOUS, UNMISTAKABLE
   ═════════════════════════════════════════════════════════════ */

/** Active: pulsing glow border + animated pip */
function drawActivePulse(ctx, x, y, w, h, r, g, b, time) {
  const pulse = 0.3 + Math.sin(time * 3) * 0.2;
  ctx.strokeStyle = rgbStr(r, g, b, pulse);
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  const dotA = 0.5 + Math.sin(time * 4) * 0.45;
  ctx.fillStyle = rgbStr(r, g, b, Math.max(0, dotA));
  ctx.beginPath();
  ctx.arc(x + w - 4, y + 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

/** Complete: bright wash + checkmark + SOLVED badge */
function drawBigCheck(ctx, x, y, w, h, r, g, b) {
  ctx.fillStyle = 'rgba(244, 239, 231, 0.34)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgbStr(r, g, b, 0.62);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  // Checkmark path
  const cx2 = x + w / 2,
    cy2 = y + h / 2 - 2;
  const s = Math.min(w, h) * 0.18;
  ctx.beginPath();
  ctx.moveTo(cx2 - s, cy2);
  ctx.lineTo(cx2 - s * 0.2, cy2 + s * 0.7);
  ctx.lineTo(cx2 + s, cy2 - s * 0.6);
  ctx.strokeStyle = rgbStr(r, g, b, 0.95);
  ctx.lineWidth = 3;
  ctx.stroke();
  // "SOLVED" badge
  ctx.fillStyle = RETRO_NODE_TEXT;
  ctx.font = 'bold 8px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SOLVED', x + w / 2, y + h - 8);
}

/** Locked: dark overlay + cross hatch + lock icon + LOCKED text */
function drawBigLock(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(185, 180, 170, 0.68)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let d = -h; d < w; d += 12) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
  }
  const cx2 = x + w / 2,
    cy2 = y + h / 2 - 2;
  // Shackle
  ctx.fillStyle = 'rgba(108, 117, 138, 0.72)';
  ctx.fillRect(cx2 - 5, cy2 - 10, 2, 7);
  ctx.fillRect(cx2 + 3, cy2 - 10, 2, 7);
  ctx.fillRect(cx2 - 5, cy2 - 11, 10, 2);
  // Body
  ctx.fillStyle = 'rgba(128, 132, 147, 0.9)';
  ctx.fillRect(cx2 - 7, cy2 - 3, 14, 10);
  ctx.strokeStyle = 'rgba(245, 241, 231, 0.58)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx2 - 7, cy2 - 3, 14, 10);
  // Keyhole
  ctx.fillStyle = 'rgba(51, 58, 72, 0.92)';
  ctx.beginPath();
  ctx.arc(cx2, cy2 + 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx2 - 1, cy2 + 1, 2, 4);
  // "LOCKED" text
  ctx.fillStyle = RETRO_NODE_MUTED;
  ctx.font = 'bold 8px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOCKED', x + w / 2, cy2 + 16);
}

/** Locked-Complete: solved outside cluster but locked by progression.
 *  Shows a dimmed color wash, small checkmark, lock icon, and "COMPLETED" text.
 *  Visually distinct from pure locked (has color + check) and pure complete (dimmer + lock). */
function drawBigLockedComplete(ctx, x, y, w, h, r, g, b) {
  ctx.fillStyle = 'rgba(215, 209, 198, 0.54)';
  ctx.fillRect(x, y, w, h);
  // Subtle color border to hint completion
  ctx.strokeStyle = rgbStr(r, g, b, 0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  // Cross hatch (subtler than locked)
  ctx.strokeStyle = rgbStr(r, g, b, 0.06);
  ctx.lineWidth = 1;
  for (let d = -h; d < w; d += 12) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
  }
  const cx2 = x + w / 2;
  const cy2 = y + h / 2 - 4;
  // Small checkmark (upper-left area, in node color)
  const s = Math.min(w, h) * 0.12;
  const ckx = x + 14;
  const cky = y + 14;
  ctx.beginPath();
  ctx.moveTo(ckx - s, cky);
  ctx.lineTo(ckx - s * 0.2, cky + s * 0.7);
  ctx.lineTo(ckx + s, cky - s * 0.6);
  ctx.strokeStyle = rgbStr(r, g, b, 0.75);
  ctx.lineWidth = 2;
  ctx.stroke();
  // Small lock icon (centre)
  ctx.fillStyle = rgbStr(r, g, b, 0.35);
  ctx.fillRect(cx2 - 4, cy2 - 8, 2, 5);
  ctx.fillRect(cx2 + 2, cy2 - 8, 2, 5);
  ctx.fillRect(cx2 - 4, cy2 - 9, 8, 2);
  ctx.fillStyle = rgbStr(r, g, b, 0.45);
  ctx.fillRect(cx2 - 6, cy2 - 3, 12, 8);
  ctx.strokeStyle = rgbStr(r, g, b, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(cx2 - 6, cy2 - 3, 12, 8);
  // Keyhole
  ctx.fillStyle = 'rgba(51, 58, 72, 0.75)';
  ctx.beginPath();
  ctx.arc(cx2, cy2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx2 - 0.5, cy2, 1, 3);
  // "COMPLETED" text in node color (brighter than LOCKED)
  ctx.fillStyle = rgbStr(r, g, b, 0.65);
  ctx.font = 'bold 7px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMPLETED', x + w / 2, cy2 + 14);
}

/* ── Label helper ────────────────────────────────────────────── */
function drawNodeLabel(ctx, x, y, w, h, r, g, b, state, label, diff) {
  const locked = state === 'locked';
  const lockedComplete = state === 'locked-complete';
  if (label) {
    ctx.font = 'bold 9px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let disp = label;
    const maxC = Math.floor(w / 7);
    if (disp.length > maxC) disp = disp.slice(0, maxC - 1) + '\u2026';
    const tw = ctx.measureText(disp).width;
    ctx.fillStyle = locked ? 'rgba(227, 221, 210, 0.72)' : 'rgba(244, 239, 231, 0.88)';
    ctx.fillRect(
      Math.round(x + w / 2 - tw / 2 - 3),
      Math.round(y + h / 2 - 12),
      Math.round(tw + 6),
      12
    );
    ctx.fillStyle = lockedComplete
      ? rgbStr(r, g, b, 0.45)
      : locked
        ? RETRO_NODE_MUTED
        : RETRO_NODE_TEXT;
    ctx.fillText(disp, x + w / 2, y + h / 2 - 6);
  }
  if (diff && !locked) {
    ctx.font = '7px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = RETRO_NODE_MUTED;
    ctx.fillText(diff, x + w / 2, y + h / 2 + 6);
  }
}

/**
 * Compute a screen-space layout for problem components inside a cluster.
 *
 * Uses a zone-based "IC functional-block" layout instead of a boring grid:
 * problems are distributed across named zones on the PCB (like ALU, cache,
 * register-file) with small sub-patterns (L-shape, diagonal, triangle, etc.)
 * within each zone. Edges form a minimum-spanning-tree for natural routing.
 *
 * Returns { nodes: [{slug, title, difficulty, x, y, w, h, cx, cy}], edges }
 */
export function computeMicroLayout(cluster, problemMetas, w, h, options = {}) {
  const metrics = resolveMicroMetrics(w, h, options);
  const { isCompactViewport, isTightViewport, padX, padTop, compW, compH, marginBottom } = metrics;

  const metaMap = {};
  for (const m of problemMetas) metaMap[m.slug || m.titleSlug] = m;

  const slugs = cluster.slugs;
  const count = slugs.length;

  // Seeded RNG from cluster ID for deterministic layout
  let seed = 0;
  const id = cluster.id || '';
  for (let i = 0; i < id.length; i++) seed = ((seed << 5) - seed + id.charCodeAt(i)) | 0;
  const rng = createRng(Math.abs(seed) + 1000);

  // Usable canvas area
  const areaW = w - padX * 2;
  const areaH = h - padTop - marginBottom;
  const cx = w / 2;
  const cy = padTop + areaH / 2;

  /* ── Zone centres (relative offsets) ───────────────────────── */
  const ALL_ZONES = [
    { rx: 0.0, ry: -0.03 }, // centre — primary
    { rx: -0.28, ry: -0.26 }, // top-left
    { rx: 0.28, ry: -0.26 }, // top-right
    { rx: -0.3, ry: 0.24 }, // bottom-left
    { rx: 0.3, ry: 0.24 }, // bottom-right
    { rx: 0.0, ry: -0.34 }, // top-centre
    { rx: 0.0, ry: 0.34 }, // bottom-centre
    { rx: -0.34, ry: 0.0 }, // left-centre
    { rx: 0.34, ry: 0.0 }, // right-centre
  ];

  /* ── Sub-patterns (offsets in COMP_W/H multiples) ─────────── */
  const PATTERNS = [
    [
      [0, 0],
      [1.3, 0],
      [0, 1.15],
    ], // L
    [
      [0, 0],
      [1.3, 0],
    ], // horiz pair
    [
      [0, 0],
      [0.8, 1.0],
    ], // diagonal
    [
      [0, 0],
      [1.3, 0],
      [2.6, 0],
      [1.3, 1.15],
    ], // T
    [
      [0, 0],
      [0, 1.15],
    ], // vert pair
    [
      [0, 0],
      [1.3, 0],
      [-1.3, 0],
      [0, 1.15],
    ], // cross
    [
      [0, 0],
      [1.5, 0],
      [0.75, 1.0],
    ], // triangle
    [
      [0, 0],
      [1.2, 0.5],
      [2.4, 1.0],
    ], // staircase
  ];

  // How many zones
  const numZones = Math.min(ALL_ZONES.length, Math.max(1, Math.ceil(count / 3)));

  // Shuffle zone order (but keep centre first when there's only 1)
  const zoneOrder = Array.from({ length: ALL_ZONES.length }, (_, i) => i);
  for (let i = zoneOrder.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [zoneOrder[i], zoneOrder[j]] = [zoneOrder[j], zoneOrder[i]];
  }
  const ci = zoneOrder.indexOf(0);
  if (ci > 0) [zoneOrder[0], zoneOrder[ci]] = [zoneOrder[ci], zoneOrder[0]];

  // Round-robin distribute
  const zoneCounts = new Array(numZones).fill(0);
  for (let i = 0; i < count; i++) zoneCounts[i % numZones]++;

  /* ── Build raw positions per zone ─────────────────────────── */
  const rawPos = [];

  if (isCompactViewport) {
    const gapX = isTightViewport ? 10 : 14;
    const gapY = isTightViewport ? 10 : 16;
    const maxCompactCols = count <= 4 ? 2 : 3;
    const fitCols = Math.floor((areaW + gapX) / (compW + gapX));
    const cols = Math.max(1, Math.min(maxCompactCols, fitCols || 1));
    const rows = Math.ceil(count / cols);
    const gridW = cols * compW + (cols - 1) * gapX;
    const gridH = rows * compH + (rows - 1) * gapY;
    const startX = padX + Math.max(0, Math.floor((areaW - gridW) / 2));
    const startY = padTop + Math.max(0, Math.floor((areaH - gridH) / 2));

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const jitterX = (i % 2 === 0 ? -1 : 1) * (isTightViewport ? 1 : 2);
      const jitterY = (row % 2 === 0 ? -1 : 1) * (isTightViewport ? 1 : 2);
      rawPos.push({
        x: Math.round(startX + col * (compW + gapX) + jitterX),
        y: Math.round(startY + row * (compH + gapY) + jitterY),
      });
    }
  } else {
    for (let z = 0; z < numZones; z++) {
      const zc = zoneCounts[z];
      if (zc === 0) continue;

      const zone = ALL_ZONES[zoneOrder[z]];
      const zx = cx + zone.rx * areaW;
      const zy = cy + zone.ry * areaH;

      const pat = PATTERNS[Math.floor(rng() * PATTERNS.length)];
      const offsets = [];
      for (let i = 0; i < zc; i++) {
        const si = i % pat.length;
        const wrap = Math.floor(i / pat.length);
        offsets.push({
          ox: pat[si][0] * (compW + 12) + wrap * 24,
          oy: pat[si][1] * (compH + 14) + wrap * (compH + 20),
        });
      }

      // Centre the group around the zone anchor
      let sx = 0,
        sy = 0;
      for (const o of offsets) {
        sx += o.ox;
        sy += o.oy;
      }
      sx /= offsets.length;
      sy /= offsets.length;

      for (const o of offsets) {
        let px = zx + (o.ox - sx) + (rng() - 0.5) * 10;
        let py = zy + (o.oy - sy) + (rng() - 0.5) * 8;
        // Clamp inside usable area
        px = Math.max(padX + 4, Math.min(w - padX - compW - 4, px));
        py = Math.max(padTop + 4, Math.min(h - marginBottom - compH, py));
        rawPos.push({ x: Math.round(px), y: Math.round(py) });
      }
    }
  }

  /* ── Assemble node array ──────────────────────────────────── */
  const nodes = [];
  const edges = [];

  for (let i = 0; i < slugs.length; i++) {
    const pos = rawPos[i] || { x: padX, y: padTop };
    const meta = metaMap[slugs[i]] || {};
    nodes.push({
      slug: slugs[i],
      index: i,
      title: meta.title || slugToTitle(slugs[i]),
      difficulty: meta.difficulty || null,
      x: pos.x,
      y: pos.y,
      w: compW,
      h: compH,
      cx: pos.x + compW / 2,
      cy: pos.y + compH / 2,
    });
  }

  /* ── Minimum-spanning-tree edges (nearest-unconnected) ────── */
  if (nodes.length > 1) {
    const connected = new Set([0]);
    const remaining = new Set();
    for (let i = 1; i < nodes.length; i++) remaining.add(i);

    while (remaining.size > 0) {
      let bestDist = Infinity,
        bestFrom = 0,
        bestTo = 1;
      for (const ci2 of connected) {
        for (const ri of remaining) {
          const dx = nodes[ci2].cx - nodes[ri].cx;
          const dy = nodes[ci2].cy - nodes[ri].cy;
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            bestFrom = ci2;
            bestTo = ri;
          }
        }
      }
      edges.push({ from: nodes[bestFrom], to: nodes[bestTo] });
      connected.add(bestTo);
      remaining.delete(bestTo);
    }
  }

  return { nodes, edges, cols: 0 };
}

/**
 * Render the Level 2 micro view onto the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}   w            – canvas width
 * @param {number}   h            – canvas height
 * @param {object}   cluster      – cluster data
 * @param {object[]} problemMetas – meta enrichment
 * @param {Set}      solvedSlugs  – solved problem slugs
 * @param {string|null} hoveredSlug – currently hovered problem slug
 * @param {number}   time         – animation time (seconds)
 * @param {boolean}  isAuthenticated
 * @param {object}   opts         – { freeProblemsRemaining, hasReachedWall }
 */
export function renderMicroView(
  ctx,
  w,
  h,
  cluster,
  problemMetas,
  solvedSlugs,
  hoveredSlug,
  time,
  isAuthenticated,
  _opts = {}
) {
  const metrics = resolveMicroMetrics(w, h, _opts);
  const { isCompactViewport, headerH, padX } = metrics;

  const freeProblemLimit = Number.isFinite(Number(_opts.freeProblemLimit))
    ? Math.max(0, Number(_opts.freeProblemLimit))
    : DEFAULT_GUEST_FREE_PROBLEM_LIMIT;
  const accent = cluster.accent || '#25508d';
  const [ar, ag, ab] = hexToRgb(accent);

  /* ── Rich cyber background (matches macro level style) ────── */
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, h);
  backgroundGradient.addColorStop(0, '#7a8d6c');
  backgroundGradient.addColorStop(1, '#55654d');
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, w, 16);

  // Animated dotted grid — same style as macro drawBackground
  const gridSize = 40;
  const pixSize = 2;
  for (let gy = 0; gy < h; gy += gridSize) {
    for (let gx = 0; gx < w; gx += gridSize) {
      const a = 0.045 + Math.sin(time * 0.6 + gx * 0.012 + gy * 0.006) * 0.02;
      ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, a));
      for (let px = gx; px < gx + gridSize && px < w; px += pixSize * 3) {
        ctx.fillRect(px, gy, pixSize, pixSize);
      }
      for (let py = gy; py < gy + gridSize && py < h; py += pixSize * 3) {
        ctx.fillRect(gx, py, pixSize, pixSize);
      }
    }
  }

  // Ambient noise particles (like macro level)
  const noiseRng = createRng(Math.floor(time * 2) + 4242);
  const noiseCount = Math.floor((w * h) / 10000);
  for (let i = 0; i < noiseCount; i++) {
    const nx = Math.floor(noiseRng() * w);
    const ny = Math.floor(noiseRng() * h);
    ctx.fillStyle =
      noiseRng() > 0.55
        ? rgbStr(255, 255, 255, noiseRng() * 0.05)
        : rgbStr(164, 122, 48, noiseRng() * 0.06);
    ctx.fillRect(nx, ny, 2, 2);
  }

  // Long PCB ground-plane traces (visible, animated)
  const bgTraceRng = createRng(7788);
  const traceCount = 20 + Math.floor(w / 60);
  for (let i = 0; i < traceCount; i++) {
    const tx = Math.floor(bgTraceRng() * w);
    const ty = Math.floor(bgTraceRng() * h);
    const horiz = bgTraceRng() > 0.5;
    const len = 30 + Math.floor(bgTraceRng() * 120);
    const ta = 0.06 + Math.sin(time * 1.2 + i * 0.8) * 0.025;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, ta));
    if (horiz) ctx.fillRect(tx, ty, len, 1);
    else ctx.fillRect(tx, ty, 1, len);
  }

  // Via dots scattered
  for (let i = 0; i < 30; i++) {
    const vx = Math.floor(bgTraceRng() * w);
    const vy = Math.floor(bgTraceRng() * h);
    const va = 0.08 + Math.sin(time * 2.5 + i * 1.3) * 0.03;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, va));
    ctx.fillRect(vx - 1, vy - 1, 3, 3);
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, va * 1.6));
    ctx.fillRect(vx, vy, 1, 1);
  }

  // Compute layout
  const layout = computeMicroLayout(cluster, problemMetas, w, h, _opts);
  const { nodes, edges } = layout;

  /* ── Data stream traces between components ────────────────── */
  for (let ei = 0; ei < edges.length; ei++) {
    const e = edges[ei];
    const midX = (e.from.cx + e.to.cx) / 2;
    const pulseA = 0.3 + Math.sin(time * 2 + ei * 0.9) * 0.15;
    const traceColor = rgbStr(ar, ag, ab, pulseA);

    // L-shaped orthogonal trace
    drawCircuitTrace(ctx, e.from.cx, e.from.cy, midX, e.from.cy, traceColor, TRACE_W, pulseA);
    drawCircuitTrace(ctx, midX, e.from.cy, midX, e.to.cy, traceColor, TRACE_W, pulseA);
    drawCircuitTrace(ctx, midX, e.to.cy, e.to.cx, e.to.cy, traceColor, TRACE_W, pulseA);

    // Data stream effect along the edge
    const streamRng = createRng(ei * 97 + Math.floor(time * 0.5));
    const streamIntensity = 0.35 + Math.sin(time * 1.5 + ei) * 0.15;
    drawDataStream(
      ctx,
      e.from.cx,
      e.from.cy,
      e.to.cx,
      e.to.cy,
      accent,
      time,
      streamRng,
      streamIntensity * 0.4
    );
  }

  // Bright pulse dots travelling along traces
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const period = 2.5 + (i % 3) * 0.4;
    const t = ((time + i * 0.7) % period) / period;
    const px = e.from.cx + (e.to.cx - e.from.cx) * t;
    const py = e.from.cy + (e.to.cy - e.from.cy) * t;
    // Bright core
    ctx.fillStyle = rgbStr(ar, ag, ab, 0.9);
    ctx.fillRect(Math.round(px) - 2, Math.round(py) - 2, 5, 5);
    // Glow halo
    ctx.fillStyle = rgbStr(ar, ag, ab, 0.2);
    ctx.fillRect(Math.round(px) - 5, Math.round(py) - 5, 11, 11);
    // Trailing particle
    const t2 = ((time + i * 0.7 + period * 0.4) % period) / period;
    const px2 = e.from.cx + (e.to.cx - e.from.cx) * t2;
    const py2 = e.from.cy + (e.to.cy - e.from.cy) * t2;
    ctx.fillStyle = rgbStr(ar, ag, ab, 0.45);
    ctx.fillRect(Math.round(px2) - 1, Math.round(py2) - 1, 3, 3);
  }

  /* ── Glitch-bit particles scattered around components ─────── */
  const glitchRng = createRng(Math.floor(time * 0.8) + 5555);
  const glitchCount = 3 + Math.floor(nodes.length / 3);
  for (let i = 0; i < glitchCount; i++) {
    const targetNode = nodes[Math.floor(glitchRng() * nodes.length)];
    const gx = targetNode.cx + (glitchRng() - 0.5) * 160;
    const gy = targetNode.cy + (glitchRng() - 0.5) * 100;
    drawGlitchBit(ctx, gx, gy, 4 + glitchRng() * 4, accent, time + i * 2.0);
  }

  /* ── Voltage bar (progress indicator below header) ──────── */
  const solvedCount = cluster.slugs.filter((s) => solvedSlugs.has(s)).length;
  const progress = cluster.slugs.length > 0 ? solvedCount / cluster.slugs.length : 0;
  drawVoltageBar(ctx, padX, headerH + 4, w - padX * 2, 10, progress, accent, time);

  /* ── Component blocks (problems) — SEQUENTIAL unlock logic ── */
  const isTrial = _opts.isTrial || false;
  const unlockedSlugs = new Set(getUnlockedOrderedSlugs(cluster.slugs, solvedSlugs));

  for (const node of nodes) {
    const solved = solvedSlugs.has(node.slug);
    const isUnlockedByProgress = unlockedSlugs.has(node.slug);
    let state;

    if (!isAuthenticated && !isTrial) {
      // Guest not in trial cluster: everything locked
      state = solved ? 'locked-complete' : 'locked';
    } else if (!isUnlockedByProgress) {
      // Locked until contiguous progression reaches this node.
      // Show as locked-complete if already solved outside cluster mode.
      state = solved ? 'locked-complete' : 'locked';
    } else if (!isAuthenticated && node.index >= freeProblemLimit) {
      // Guest free-problem cap
      state = solved ? 'locked-complete' : 'locked';
    } else if (solved) {
      // Solved and currently unlocked by progression.
      state = 'complete';
    } else {
      state = 'active';
    }

    const diff = node.difficulty || 'Easy';
    const color = getNodeColor(node.slug);
    const isHov = hoveredSlug === node.slug;
    const variant = getShapeVariant(node.slug);

    // Active component ambient glow
    if (state === 'active') {
      const [cr, cg, cb] = hexToRgb(color);
      const glowA = 0.06 + Math.sin(time * 2.5 + node.x * 0.02) * 0.03;
      ctx.fillStyle = rgbStr(cr, cg, cb, Math.max(0, glowA));
      ctx.fillRect(node.x - 4, node.y - 4, node.w + 8, node.h + 8);
    }

    // Hover glow
    if (isHov && state !== 'locked') {
      const [hr, hg, hb] = hexToRgb(color);
      ctx.fillStyle = rgbStr(hr, hg, hb, 0.12 + Math.sin(time * 4) * 0.04);
      ctx.fillRect(node.x - 8, node.y - 8, node.w + 16, node.h + 16);
    }

    // Draw shape variant (chip/diamond/circle/star/hexagon/triangle)
    drawNodeShape(
      ctx,
      node.x,
      node.y,
      node.w,
      node.h,
      color,
      state,
      time,
      node.title,
      diff,
      variant
    );

    // Sequential order indicator (number badge)
    if (isTrial && !isAuthenticated) {
      const numX = node.x + 2,
        numY = node.y + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(numX, numY, 14, 12);
      drawPixelRect(
        ctx,
        numX,
        numY,
        14,
        12,
        state === 'locked' ? 'rgba(122, 119, 113, 0.55)' : 'rgba(37, 80, 141, 0.65)',
        1
      );
      ctx.fillStyle = state === 'locked' ? 'rgba(94,91,86,0.75)' : 'rgba(37,80,141,0.92)';
      ctx.font = 'bold 8px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${node.index + 1}`, numX + 7, numY + 6);
    }
  }

  /* ── Decorative edge elements ────────────────────────────── */
  // Left/right edge scanline accents
  const edgeA = 0.04 + Math.sin(time * 1.5) * 0.02;
  ctx.fillStyle = rgbStr(214, 194, 148, edgeA);
  for (let ey = headerH + 20; ey < h - 20; ey += 12) {
    const ew = 4 + Math.abs(Math.sin(time * 0.8 + ey * 0.03)) * 14;
    ctx.fillRect(6, ey, ew, 1);
    ctx.fillRect(w - 6 - ew, ey, ew, 1);
  }

  // Bottom-edge data bus line
  const busY = h - (isCompactViewport ? 20 : 24);
  ctx.fillStyle = rgbStr(214, 194, 148, 0.12);
  ctx.fillRect(padX, busY, w - padX * 2, 1);
  for (let bx = padX; bx < w - padX; bx += 18) {
    const ba = 0.1 + Math.sin(time * 3 + bx * 0.05) * 0.06;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, ba));
    ctx.fillRect(bx, busY - 2, 2, 5);
  }

  // Scanlines over everything (matching macro level)
  drawScanlines(ctx, 0, headerH, w, h - headerH, 3, 0.035);

  /* ── Header bar ──────────────────────────────────────────── */
  ctx.fillStyle = '#d6d1c8';
  ctx.fillRect(0, 0, w, headerH);
  const headerGradient = ctx.createLinearGradient(0, 0, w, 0);
  headerGradient.addColorStop(0, '#173d84');
  headerGradient.addColorStop(1, '#335fae');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, w, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 18, w, 1);
  ctx.fillStyle = '#5a544c';
  ctx.fillRect(0, headerH - 2, w, 2);

  // Animated header edge pixels (like tier headers in macro)
  const hdrRng = createRng(42);
  for (let px = 0; px < w; px += 3) {
    const jitter = Math.round(hdrRng() * 2 - 1);
    const pa = 0.12 + Math.sin(time * 2 + px * 0.05) * 0.05;
    ctx.fillStyle = rgbStr(181, 132, 39, pa);
    ctx.fillRect(px, headerH - 4 + jitter, 2, 2);
  }

  // Cluster title
  ctx.fillStyle = '#1f1f1f';
  ctx.font = isCompactViewport ? 'bold 14px Tahoma, sans-serif' : 'bold 16px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cluster.shortTitle || cluster.id, w / 2, headerH / 2 - (isCompactViewport ? 4 : 6));

  // Problem count subtitle
  ctx.fillStyle = '#595959';
  ctx.font = isCompactViewport ? '10px Tahoma, sans-serif' : '11px Tahoma, sans-serif';
  ctx.fillText(
    `${solvedCount}/${cluster.slugs.length} PROBLEMS`,
    w / 2,
    headerH / 2 + (isCompactViewport ? 10 : 12)
  );

  // "← BACK" button — prominent, clickable-looking
  {
    const bx = 6,
      by = 4,
      bw = isCompactViewport ? 118 : 170,
      bh = headerH - 8;
    // Button background
    const backGradient = ctx.createLinearGradient(bx, by, bx, by + bh);
    backGradient.addColorStop(0, '#f4efe7');
    backGradient.addColorStop(1, '#d5cec5');
    ctx.fillStyle = backGradient;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
    ctx.fillRect(bx + 1, by + 1, 1, bh - 2);
    ctx.fillStyle = 'rgba(64,64,64,0.9)';
    ctx.fillRect(bx + bw - 2, by + 1, 1, bh - 2);
    ctx.fillRect(bx + 1, by + bh - 2, bw - 2, 1);
    // Border
    ctx.strokeStyle = '#2b2926';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    // Main label
    ctx.fillStyle = '#1f1f1f';
    ctx.font = isCompactViewport ? 'bold 13px Tahoma, sans-serif' : 'bold 16px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← BACK', bx + bw / 2, by + bh / 2 - (isCompactViewport ? 1 : 7));
    if (!isCompactViewport) {
      // Hint text
      ctx.fillStyle = '#595959';
      ctx.font = '10px Tahoma, sans-serif';
      ctx.fillText('click or press ESC', bx + bw / 2, by + bh / 2 + 10);
    }
  }

  /* ── Trial messaging banner — DRAWN LAST for max visibility ── */
  if (isTrial && !isAuthenticated) {
    const bannerH = isCompactViewport ? 34 : 38;
    const bannerY = h - bannerH - 6;
    // Retro banner backdrop
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(0, bannerY, w, bannerH);
    // Bright accent borders (top + bottom)
    const bdrPulse = 0.6 + Math.sin(time * 2.5) * 0.3;
    ctx.fillStyle = `rgba(47,109,52,${bdrPulse})`;
    ctx.fillRect(0, bannerY, w, 2);
    ctx.fillStyle = `rgba(43,41,38,${0.8})`;
    ctx.fillRect(0, bannerY + bannerH - 2, w, 2);

    const configuredFreeLeft = Number.isFinite(Number(_opts.freeProblemsRemaining))
      ? Math.max(0, Number(_opts.freeProblemsRemaining))
      : null;
    const freeLeft = configuredFreeLeft ?? Math.max(0, freeProblemLimit - solvedCount);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (freeLeft > 0) {
      const pA = 0.85 + Math.sin(time * 2) * 0.15;
      ctx.fillStyle = `rgba(47,109,52,${pA})`;
      ctx.font = isCompactViewport
        ? 'bold 12px Tahoma, sans-serif'
        : 'bold 14px Tahoma, sans-serif';
      ctx.fillText(
        `★  ${freeProblemLimit} FREE PROBLEMS  —  ${freeLeft} REMAINING  ★`,
        w / 2,
        bannerY + bannerH / 2
      );
    } else {
      const pA = 0.85 + Math.sin(time * 3) * 0.15;
      ctx.fillStyle = `rgba(154,116,33,${pA})`;
      ctx.font = isCompactViewport
        ? 'bold 12px Tahoma, sans-serif'
        : 'bold 14px Tahoma, sans-serif';
      ctx.fillText('⚡  SIGN UP TO UNLOCK ALL PROBLEMS  ⚡', w / 2, bannerY + bannerH / 2);
    }
  }
}

/**
 * Hit-test for micro view. Returns { slug, index } or null.
 */
export function microHitTest(mx, my, cluster, problemMetas, w, h, options = {}) {
  const layout = computeMicroLayout(cluster, problemMetas, w, h, options);
  for (const node of layout.nodes) {
    if (mx >= node.x && mx <= node.x + node.w && my >= node.y && my <= node.y + node.h) {
      return { slug: node.slug, index: node.index };
    }
  }
  return null;
}

/* ── helpers ─────────────────────────────────────────────────── */
function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
