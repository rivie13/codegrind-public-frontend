/**
 * nanoRenderer.js — Level 3: Logic-Gate / Problem-Focus view.
 *
 * Renders a single focused problem at full-canvas resolution with:
 *   - Problem title, difficulty badge, solved status, per-mode progress cards
 *   - Four action buttons (2×2 grid) styled as logic gates:
 *     Problem Workspace | Challenge Options | Tower Defense | TD Settings
 *   - Pulsing core animation, orbiting data particles, energy-flow traces
 *   - Animated circuit-board traces and gate symbols
 *
 * Called by CyberGrid when the state machine is in NANO mode.
 */

import { createRng, hexToRgb, rgbStr } from './pixelUtils';
import { CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG } from '../../data/classicReferenceSlugByCyberSlug';

/* ── Difficulty theming ─────────────────────────────────────── */
const DIFF_THEME = {
  Easy: { color: '#2f6d34', label: 'EASY', glyph: '▸' },
  Medium: { color: '#9a7421', label: 'MEDIUM', glyph: '◆' },
  Hard: { color: '#8a4a32', label: 'HARD', glyph: '▾' },
};

/* ── Button dimensions (2×2 grid) ───────────────────────────── */
const DEFAULT_BTN_W = 186;
const DEFAULT_BTN_H = 52;
const DEFAULT_BTN_GAP_X = 24;
const DEFAULT_BTN_GAP_Y = 18;
const DEFAULT_BTN_Y_OFFSET = 70; // from vertical center

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/* ── Per-button colour & gate type ──────────────────────────── */
const BTN_COLORS = {
  workspace: '#25508d',
  challenge: '#7a4b78',
  td: '#2f6d34',
  'td-settings': '#9a7421',
};
const BTN_GATES = {
  workspace: 'and',
  challenge: 'or',
  td: 'and',
  'td-settings': 'or',
};

function resolveNanoLayout(w, h, towerDefenseOnly = false, options = {}) {
  const forceCompact = Boolean(options?.compactMode);
  const isCompactViewport = forceCompact || w <= 760 || h <= 560;
  const isStackedLayout = isCompactViewport || w <= 520;
  const buttonW = isStackedLayout ? clamp(w - 40, 164, 360) : DEFAULT_BTN_W;
  const buttonH = isCompactViewport ? 46 : DEFAULT_BTN_H;
  const gapX = isStackedLayout ? 0 : isCompactViewport ? 16 : DEFAULT_BTN_GAP_X;
  const gapY = isCompactViewport ? 12 : DEFAULT_BTN_GAP_Y;
  const centerY = isCompactViewport ? Math.round(h * 0.33) : Math.round(h / 2) - 40;

  const rowCount = towerDefenseOnly ? (isStackedLayout ? 2 : 1) : isStackedLayout ? 4 : 2;
  const totalHeight = rowCount * buttonH + (rowCount - 1) * gapY;
  const startYBase = isCompactViewport
    ? Math.round(h * 0.57)
    : Math.round(h / 2) + DEFAULT_BTN_Y_OFFSET;
  const minStartY = centerY + (isCompactViewport ? 84 : 104);
  const maxStartY = Math.max(minStartY, h - totalHeight - 18);
  const startY = clamp(startYBase, minStartY, maxStartY);

  if (towerDefenseOnly) {
    if (isStackedLayout) {
      const startX = Math.round((w - buttonW) / 2);
      return {
        isCompactViewport,
        isStackedLayout,
        centerY,
        showStatusCards: !isCompactViewport,
        buttons: [
          { id: 'td', label: 'TOWER DEFENSE', x: startX, y: startY, w: buttonW, h: buttonH },
          {
            id: 'workspace',
            label: 'PROBLEM WORKSPACE',
            x: startX,
            y: startY + buttonH + gapY,
            w: buttonW,
            h: buttonH,
          },
        ],
      };
    }

    const totalW = buttonW * 2 + gapX;
    const startX = Math.round((w - totalW) / 2);
    return {
      isCompactViewport,
      isStackedLayout,
      centerY,
      showStatusCards: !isCompactViewport,
      buttons: [
        { id: 'td', label: 'TOWER DEFENSE', x: startX, y: startY, w: buttonW, h: buttonH },
        {
          id: 'workspace',
          label: 'PROBLEM WORKSPACE',
          x: startX + buttonW + gapX,
          y: startY,
          w: buttonW,
          h: buttonH,
        },
      ],
    };
  }

  if (isStackedLayout) {
    const startX = Math.round((w - buttonW) / 2);
    return {
      isCompactViewport,
      isStackedLayout,
      centerY,
      showStatusCards: !isCompactViewport,
      buttons: [
        {
          id: 'workspace',
          label: 'PROBLEM WORKSPACE',
          x: startX,
          y: startY,
          w: buttonW,
          h: buttonH,
        },
        {
          id: 'challenge',
          label: 'CHALLENGE OPTIONS',
          x: startX,
          y: startY + (buttonH + gapY),
          w: buttonW,
          h: buttonH,
        },
        {
          id: 'td',
          label: 'TOWER DEFENSE',
          x: startX,
          y: startY + (buttonH + gapY) * 2,
          w: buttonW,
          h: buttonH,
        },
        {
          id: 'td-settings',
          label: 'TD SETTINGS',
          x: startX,
          y: startY + (buttonH + gapY) * 3,
          w: buttonW,
          h: buttonH,
        },
      ],
    };
  }

  const totalW = buttonW * 2 + gapX;
  const startX = Math.round((w - totalW) / 2);
  return {
    isCompactViewport,
    isStackedLayout,
    centerY,
    showStatusCards: !isCompactViewport,
    buttons: [
      {
        id: 'workspace',
        label: 'PROBLEM WORKSPACE',
        x: startX,
        y: startY,
        w: buttonW,
        h: buttonH,
      },
      {
        id: 'challenge',
        label: 'CHALLENGE OPTIONS',
        x: startX + buttonW + gapX,
        y: startY,
        w: buttonW,
        h: buttonH,
      },
      {
        id: 'td',
        label: 'TOWER DEFENSE',
        x: startX,
        y: startY + buttonH + gapY,
        w: buttonW,
        h: buttonH,
      },
      {
        id: 'td-settings',
        label: 'TD SETTINGS',
        x: startX + buttonW + gapX,
        y: startY + buttonH + gapY,
        w: buttonW,
        h: buttonH,
      },
    ],
  };
}

function getClassicReferenceName(problem) {
  const directName =
    problem?.referenceName ||
    problem?.metadata?.referenceName ||
    problem?.metaData?.referenceName ||
    null;
  if (directName) return directName;

  const referenceSlug =
    problem?.referenceSlug ||
    problem?.metadata?.referenceSlug ||
    problem?.metaData?.referenceSlug ||
    null;
  const fallbackReferenceSlug = problem?.slug
    ? CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG[problem.slug]
    : null;
  const canonicalReferenceSlug = referenceSlug || fallbackReferenceSlug;

  return canonicalReferenceSlug ? slugToTitle(canonicalReferenceSlug) : '';
}

function formatBestTime(bestTime) {
  if (!Number.isFinite(bestTime) || bestTime <= 0) return 'BEST TIME --';
  return `BEST TIME ${bestTime}s`;
}

function formatBestScore(score) {
  if (!Number.isFinite(score) || score <= 0) return 'BEST SCORE 0';
  return `BEST SCORE ${score}`;
}

function getWorkspaceCardDetails(modeStatus) {
  if (!modeStatus) {
    return {
      statusLabel: 'OPEN',
      detailA: 'No workspace clear yet',
      detailB: 'Launch to record a run',
    };
  }

  if (modeStatus.completed) {
    return {
      statusLabel: 'COMPLETE',
      detailA: formatBestScore(modeStatus.highScore),
      detailB: formatBestTime(modeStatus.bestTime),
    };
  }

  if (modeStatus.attempted) {
    return {
      statusLabel: 'ATTEMPTED',
      detailA: formatBestScore(modeStatus.highScore),
      detailB: formatBestTime(modeStatus.bestTime),
    };
  }

  return {
    statusLabel: 'OPEN',
    detailA: 'No workspace clear yet',
    detailB: 'Launch to record a run',
  };
}

function getTowerDefenseCardDetails(modeStatus) {
  if (!modeStatus) {
    return {
      statusLabel: 'OPEN',
      detailA: 'No tower clear yet',
      detailB: 'Launch to record a run',
    };
  }

  if (modeStatus.completed) {
    return {
      statusLabel: 'COMPLETE',
      detailA: formatBestScore(modeStatus.score),
      detailB: formatBestTime(modeStatus.bestTime),
    };
  }

  if (modeStatus.attempted) {
    return {
      statusLabel: 'ATTEMPTED',
      detailA: formatBestScore(modeStatus.score),
      detailB: formatBestTime(modeStatus.bestTime),
    };
  }

  return {
    statusLabel: 'OPEN',
    detailA: 'No tower clear yet',
    detailB: 'Launch to record a run',
  };
}

function drawModeStatusCard(ctx, x, y, w, h, title, color, details, time) {
  const [r, g, b] = hexToRgb(color);

  const cardGradient = ctx.createLinearGradient(x, y, x, y + h);
  cardGradient.addColorStop(0, '#f4efe7');
  cardGradient.addColorStop(1, '#d5cec5');
  ctx.fillStyle = cardGradient;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillStyle = '#4a4640';
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = rgbStr(r, g, b, 0.92 + Math.sin(time * 2.2) * 0.04);
  ctx.fillRect(x + 2, y + 2, w - 4, 12);

  ctx.fillStyle = '#f7f7f7';
  ctx.font = 'bold 10px Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + 10, y + 9);

  ctx.textAlign = 'right';
  ctx.fillText(details.statusLabel, x + w - 10, y + 9);

  ctx.fillStyle = '#1f1f1f';
  ctx.font = 'bold 12px Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(details.detailA, x + 12, y + 29);

  ctx.fillStyle = '#595959';
  ctx.font = '11px Tahoma, sans-serif';
  ctx.fillText(details.detailB, x + 12, y + 43);
}

/* ── Retro toolbar icon decorations ─────────────────────────── */
function drawGateSymbol(ctx, cx, cy, type, color, time) {
  const [r, g, b] = hexToRgb(color);
  const iconX = cx - 18;
  const iconY = cy - 12;
  const iconW = 34;
  const iconH = 24;

  ctx.fillStyle = 'rgba(244, 239, 231, 0.92)';
  ctx.fillRect(iconX, iconY, iconW, iconH);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillRect(iconX + 1, iconY + 1, iconW - 2, 1);
  ctx.fillRect(iconX + 1, iconY + 1, 1, iconH - 2);
  ctx.fillStyle = 'rgba(79, 73, 66, 0.88)';
  ctx.fillRect(iconX + iconW - 2, iconY + 1, 1, iconH - 2);
  ctx.fillRect(iconX + 1, iconY + iconH - 2, iconW - 2, 1);
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 1;
  ctx.strokeRect(iconX + 0.5, iconY + 0.5, iconW - 1, iconH - 1);

  ctx.fillStyle = rgbStr(r, g, b, 0.88 + Math.sin(time * 2) * 0.06);
  ctx.fillRect(iconX + 2, iconY + 2, iconW - 4, 6);

  ctx.fillStyle = 'rgba(31, 31, 31, 0.9)';
  if (type === 'and') {
    ctx.fillRect(iconX + 6, iconY + 12, 16, 2);
    ctx.fillRect(iconX + 6, iconY + 16, 12, 2);
    ctx.fillRect(iconX + 6, iconY + 20, 18, 2);
  } else {
    ctx.fillRect(iconX + 6, iconY + 12, 12, 2);
    ctx.fillRect(iconX + 6, iconY + 16, 18, 2);
    ctx.fillRect(iconX + 6, iconY + 20, 10, 2);
  }

  ctx.fillStyle = rgbStr(r, g, b, 0.28 + Math.sin(time * 2.6) * 0.08);
  ctx.beginPath();
  ctx.arc(iconX + 27, iconY + 17, 3, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Pulsing concentric rings around the problem core ───────── */
function drawPulsingCore(ctx, cx, cy, time, accent) {
  const [r, g, b] = hexToRgb(accent);
  for (let ring = 0; ring < 2; ring++) {
    const baseR = 28 + ring * 18;
    const radius = baseR + Math.sin(time * (2 - ring * 0.5)) * 4;
    const segments = 36;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + time * (0.3 + ring * 0.15);
      const pr = radius + Math.sin(time * 4 + i * 0.8 + ring) * 2;
      const px = cx + Math.cos(angle) * pr;
      const py = cy + Math.sin(angle) * pr;
      const a = 0.12 - ring * 0.04 + Math.sin(time * 3 + i) * 0.06;
      ctx.fillStyle = rgbStr(r, g, b, Math.max(0, a));
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }
  const panelX = cx - 26;
  const panelY = cy - 20;
  const panelW = 52;
  const panelH = 38;
  const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGradient.addColorStop(0, '#f4efe7');
  panelGradient.addColorStop(1, '#d5cec5');
  ctx.fillStyle = panelGradient;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillRect(panelX + 1, panelY + 1, panelW - 2, 1);
  ctx.fillRect(panelX + 1, panelY + 1, 1, panelH - 2);
  ctx.fillStyle = 'rgba(79, 73, 66, 0.88)';
  ctx.fillRect(panelX + panelW - 2, panelY + 1, 1, panelH - 2);
  ctx.fillRect(panelX + 1, panelY + panelH - 2, panelW - 2, 1);
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

  ctx.fillStyle = rgbStr(r, g, b, 0.88 + Math.sin(time * 2.2) * 0.05);
  ctx.fillRect(panelX + 2, panelY + 2, panelW - 4, 9);

  ctx.fillStyle = rgbStr(r, g, b, 0.18 + Math.sin(time * 2.5) * 0.05);
  ctx.fillRect(panelX + 7, panelY + 17, panelW - 14, 11);
  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(panelX + 9, panelY + 19, 16, 2);
  ctx.fillRect(panelX + 9, panelY + 23, 24, 2);
  ctx.fillStyle = rgbStr(r, g, b, 0.34 + Math.sin(time * 3) * 0.08);
  ctx.beginPath();
  ctx.arc(panelX + 39, panelY + 22, 4, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Orbiting pixel-data particles ──────────────────────────── */
function drawOrbitingParticles(ctx, cx, cy, time, accent) {
  const [r, g, b] = hexToRgb(accent);
  for (let orbit = 0; orbit < 3; orbit++) {
    const baseR = 55 + orbit * 28;
    const speed = 0.35 + orbit * 0.12;
    const count = 5 + orbit;
    for (let p = 0; p < count; p++) {
      const angle = (p / count) * Math.PI * 2 + time * speed + orbit * 1.1;
      const pr = baseR + Math.sin(time * 2.2 + p + orbit) * 6;
      const px = cx + Math.cos(angle) * pr;
      const py = cy + Math.sin(angle) * pr * 0.55;
      const a = 0.25 + Math.sin(time * 4.5 + p * 2) * 0.12;
      ctx.fillStyle = rgbStr(r, g, b, a);
      ctx.fillRect(Math.round(px), Math.round(py), 3, 3);
      for (let t = 1; t <= 3; t++) {
        const ta = angle - t * 0.07 * speed;
        const tx = cx + Math.cos(ta) * pr;
        const ty = cy + Math.sin(ta) * pr * 0.55;
        ctx.fillStyle = rgbStr(r, g, b, a * (1 - t * 0.28));
        ctx.fillRect(Math.round(tx), Math.round(ty), 2, 2);
      }
    }
  }
}

/**
 * Get button rects for hit-testing (2×2 grid, or 1×2 for TD-only clusters).
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {boolean} [towerDefenseOnly=false] - if true, only show TD buttons
 * @returns {NanoButton[]}
 */
export function getNanoButtons(w, h, towerDefenseOnly = false, options = {}) {
  return resolveNanoLayout(w, h, towerDefenseOnly, options).buttons;
}

/**
 * Render the Level 3 nano view (single problem focus).
 */
export function renderNanoView(
  ctx,
  w,
  h,
  problem,
  solved,
  hoveredBtn,
  time,
  accent,
  towerDefenseOnly = false,
  modeStatus = null,
  options = {}
) {
  const layout = resolveNanoLayout(w, h, towerDefenseOnly, options);
  const { isCompactViewport, isStackedLayout, centerY, showStatusCards, buttons } = layout;

  const diff = DIFF_THEME[problem.difficulty] || DIFF_THEME.Easy;

  // ─ Rich cyber background (same visual language as macro level) ─
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, h);
  backgroundGradient.addColorStop(0, '#7a8d6c');
  backgroundGradient.addColorStop(1, '#55654d');
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, w, 16);

  // Animated dotted grid (matching macro drawBackground)
  const gridSize = 40;
  const pixSize = 2;
  for (let gy = 0; gy < h; gy += gridSize) {
    for (let gx = 0; gx < w; gx += gridSize) {
      const a = 0.04 + Math.sin(time * 0.5 + gx * 0.01 + gy * 0.008) * 0.015;
      ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, a));
      for (let px = gx; px < gx + gridSize && px < w; px += pixSize * 3) {
        ctx.fillRect(px, gy, pixSize, pixSize);
      }
      for (let py = gy; py < gy + gridSize && py < h; py += pixSize * 3) {
        ctx.fillRect(gx, py, pixSize, pixSize);
      }
    }
  }

  // Ambient noise particles
  const noiseRng = createRng(Math.floor(time * 2) + 8989);
  const noiseCount = Math.floor((w * h) / 11000);
  for (let i = 0; i < noiseCount; i++) {
    const nx = Math.floor(noiseRng() * w);
    const ny = Math.floor(noiseRng() * h);
    ctx.fillStyle =
      noiseRng() > 0.55
        ? rgbStr(255, 255, 255, noiseRng() * 0.05)
        : rgbStr(164, 122, 48, noiseRng() * 0.05);
    ctx.fillRect(nx, ny, 2, 2);
  }

  // ─ Energy-flow traces (deterministic, slowly churning) ─
  const rng = createRng(Math.floor(time * 0.8) + 42);
  for (let i = 0; i < 16; i++) {
    const sx = Math.floor(rng() * w);
    const sy = Math.floor(rng() * h);
    const len = 30 + Math.floor(rng() * 100);
    const horiz = rng() > 0.5;
    const ta = 0.05 + Math.sin(time * 2 + i * 1.4) * 0.025;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, ta));
    if (horiz) ctx.fillRect(sx, sy, len, 1);
    else ctx.fillRect(sx, sy, 1, len);
  }

  // Via dots
  for (let i = 0; i < 14; i++) {
    const vx = Math.floor(rng() * w);
    const vy = Math.floor(rng() * h);
    const va = 0.07 + Math.sin(time * 2.5 + i) * 0.03;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, va));
    ctx.fillRect(vx - 1, vy - 1, 3, 3);
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, va * 1.6));
    ctx.fillRect(vx, vy, 1, 1);
  }

  // Scanlines (subtle, like macro)
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fillRect(0, y, w, 1);
  }

  // ─ Retro desktop frame chrome ─
  const borderInset = 16;
  ctx.fillStyle = 'rgba(245, 241, 231, 0.24)';
  ctx.fillRect(borderInset, borderInset, w - borderInset * 2, 2);
  ctx.fillRect(borderInset, borderInset, 2, h - borderInset * 2);
  ctx.fillStyle = 'rgba(79, 73, 66, 0.3)';
  ctx.fillRect(borderInset, h - borderInset - 2, w - borderInset * 2, 2);
  ctx.fillRect(w - borderInset - 2, borderInset, 2, h - borderInset * 2);
  ctx.strokeStyle = 'rgba(43, 41, 38, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    borderInset + 0.5,
    borderInset + 0.5,
    w - borderInset * 2 - 1,
    h - borderInset * 2 - 1
  );

  ctx.fillStyle = 'rgba(51, 95, 174, 0.18)';
  ctx.fillRect(borderInset + 8, borderInset + 8, w - (borderInset + 8) * 2, 10);
  ctx.fillRect(borderInset + 8, h - borderInset - 18, w - (borderInset + 8) * 2, 2);

  // ─ Decorative mini-status windows along the frame ─
  const decoRng = createRng(4567);
  for (let i = 0; i < 6; i++) {
    const dx = borderInset + 20 + Math.floor(decoRng() * (w - borderInset * 2 - 60));
    const dy = borderInset + 20 + Math.floor(decoRng() * (h - borderInset * 2 - 40));
    if (dx > w / 2 - 140 && dx < w / 2 + 120 && dy > h / 2 - 120 && dy < h / 2 + 140) continue;
    const dw = 16 + Math.floor(decoRng() * 24);
    const dh = 8 + Math.floor(decoRng() * 10);
    ctx.fillStyle = 'rgba(244, 239, 231, 0.08)';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = 'rgba(43, 41, 38, 0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
    ctx.fillStyle = 'rgba(51, 95, 174, 0.14)';
    ctx.fillRect(dx + 2, dy + 2, dw - 4, 3);
    ctx.fillStyle = 'rgba(214, 194, 148, 0.18)';
    ctx.fillRect(dx + 4, dy + dh - 4, Math.max(6, dw - 8), 1);
  }

  // ─ Pulsing core + orbiting particles ─
  drawPulsingCore(ctx, w / 2, centerY - 10, time, accent);
  drawOrbitingParticles(ctx, w / 2, centerY - 10, time, accent);

  // ─ Difficulty badge ─
  const badgeH = isCompactViewport ? 20 : 22;
  const badgeY = centerY - (isCompactViewport ? 54 : 60);
  ctx.fillStyle = rgbStr(244, 239, 231, 0.94);
  const badgeW = diff.label.length * 10 + 24;
  const badgeX = Math.round((w - badgeW) / 2);
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 1;
  ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
  ctx.fillStyle = diff.color;
  ctx.fillRect(badgeX + 2, badgeY + 2, badgeW - 4, 4);

  ctx.fillStyle = '#1f1f1f';
  ctx.font = isCompactViewport ? 'bold 11px Tahoma, sans-serif' : 'bold 12px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${diff.glyph} ${diff.label}`, w / 2, badgeY + badgeH / 2 + 3);

  // Problem title
  ctx.fillStyle = '#f5f0df';
  ctx.font = isCompactViewport ? 'bold 17px Tahoma, sans-serif' : 'bold 20px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const title = problem.title || slugToTitle(problem.slug);
  ctx.fillText(title, w / 2, centerY - (isCompactViewport ? 12 : 16));

  const classicReferenceName = getClassicReferenceName(problem);
  const hasClassicReference = Boolean(classicReferenceName);
  if (hasClassicReference) {
    const clippedReferenceName =
      classicReferenceName.length > 46
        ? `${classicReferenceName.slice(0, 43)}...`
        : classicReferenceName;
    const subtitle = `This problem relates to classic interview problem: ${clippedReferenceName}`;
    ctx.fillStyle = 'rgba(232, 212, 156, 0.92)';
    ctx.font = isCompactViewport ? '10px Tahoma, sans-serif' : '11px Tahoma, sans-serif';
    ctx.fillText(subtitle, w / 2, centerY + (isCompactViewport ? 4 : 2));
  }

  // Solved indicator
  const statusY = hasClassicReference
    ? centerY + (isCompactViewport ? 22 : 24)
    : centerY + (isCompactViewport ? 14 : 14);
  if (solved) {
    ctx.fillStyle = '#2f6d34';
    ctx.font = isCompactViewport ? 'bold 12px Tahoma, sans-serif' : 'bold 13px Tahoma, sans-serif';
    ctx.fillText('✓ SOLVED', w / 2, statusY);
  } else {
    ctx.fillStyle = 'rgba(240, 232, 214, 0.56)';
    ctx.font = isCompactViewport ? '12px Tahoma, sans-serif' : '13px Tahoma, sans-serif';
    ctx.fillText('UNSOLVED', w / 2, statusY);
  }

  // Decorative rule
  const lineY = centerY + (isCompactViewport ? 30 : 36);
  ctx.fillStyle = rgbStr(214, 194, 148, 0.24);
  ctx.fillRect(w / 2 - 100, lineY, 200, 1);
  ctx.fillStyle = rgbStr(214, 194, 148, 0.5 + Math.sin(time * 3) * 0.2);
  ctx.fillRect(w / 2 - 2, lineY - 1, 4, 3);

  // ─ Action buttons (2×2 grid, or 1×2 for TD-only) ─
  if (showStatusCards && (modeStatus?.workspace || modeStatus?.td)) {
    const cardY = lineY + 18;
    const cardW = 210;
    const cardH = 50;
    const cardDetailsByButtonId = {
      workspace: {
        title: 'WORKSPACE',
        color: BTN_COLORS.workspace,
        details: getWorkspaceCardDetails(modeStatus.workspace),
      },
      td: {
        title: 'TOWER DEFENSE',
        color: BTN_COLORS.td,
        details: getTowerDefenseCardDetails(modeStatus.td),
      },
    };

    for (const btn of buttons) {
      const card = cardDetailsByButtonId[btn.id];
      if (!card) continue;

      const proposedX = Math.round(btn.x + btn.w / 2 - cardW / 2);
      const cardX = Math.max(12, Math.min(w - cardW - 12, proposedX));

      drawModeStatusCard(
        ctx,
        cardX,
        cardY,
        cardW,
        cardH,
        card.title,
        card.color,
        card.details,
        time
      );
    }
  }

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const isHov = hoveredBtn === btn.id;
    const bColor = BTN_COLORS[btn.id] || '#25508d';
    const gateType = BTN_GATES[btn.id] || 'and';
    const [br, bg, bb] = hexToRgb(bColor);

    // Background
    const buttonGradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    buttonGradient.addColorStop(0, isHov ? '#fbf8f1' : '#f4efe7');
    buttonGradient.addColorStop(1, isHov ? '#e0dad1' : '#d5cec5');
    ctx.fillStyle = buttonGradient;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = 'rgba(255,255,255,0.76)';
    ctx.fillRect(btn.x + 1, btn.y + 1, btn.w - 2, 1);
    ctx.fillRect(btn.x + 1, btn.y + 1, 1, btn.h - 2);
    ctx.fillStyle = 'rgba(64,64,64,0.92)';
    ctx.fillRect(btn.x + btn.w - 2, btn.y + 1, 1, btn.h - 2);
    ctx.fillRect(btn.x + 1, btn.y + btn.h - 2, btn.w - 2, 1);

    // Border
    ctx.strokeStyle = isHov ? rgbStr(br, bg, bb, 0.92) : '#2b2926';
    ctx.lineWidth = isHov ? 2 : 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.w - 1, btn.h - 1);

    // Corner accents
    const cLen = 8;
    ctx.fillStyle = rgbStr(br, bg, bb, isHov ? 0.72 : 0.46);
    ctx.fillRect(btn.x, btn.y, cLen, 2);
    ctx.fillRect(btn.x, btn.y, 2, cLen);
    ctx.fillRect(btn.x + btn.w - cLen, btn.y, cLen, 2);
    ctx.fillRect(btn.x + btn.w - 2, btn.y, 2, cLen);
    ctx.fillRect(btn.x, btn.y + btn.h - 2, cLen, 2);
    ctx.fillRect(btn.x, btn.y + btn.h - cLen, 2, cLen);
    ctx.fillRect(btn.x + btn.w - cLen, btn.y + btn.h - 2, cLen, 2);
    ctx.fillRect(btn.x + btn.w - 2, btn.y + btn.h - cLen, 2, cLen);

    // Gate symbol
    drawGateSymbol(
      ctx,
      btn.x + (isCompactViewport ? (isStackedLayout ? 30 : 32) : 34),
      btn.y + btn.h / 2,
      gateType,
      bColor,
      time
    );

    // Label
    ctx.fillStyle = isHov ? '#1f1f1f' : '#37342f';
    const labelFontSize = isCompactViewport ? (isHov ? 12 : 11) : isHov ? 13 : 12;
    ctx.font = `bold ${labelFontSize}px Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      btn.label,
      btn.x + btn.w / 2 + (isCompactViewport ? (isStackedLayout ? 6 : 10) : 14),
      btn.y + btn.h / 2
    );

    // Hover scan effect
    if (isHov) {
      const scanY = btn.y + ((time * 40) % btn.h);
      ctx.fillStyle = rgbStr(br, bg, bb, 0.12);
      ctx.fillRect(btn.x, scanY, btn.w, 2);
    }
  }

  // ─ Data bus traces from core down to each button ─
  for (let bi = 0; bi < buttons.length; bi++) {
    const btn = buttons[bi];
    const bx = btn.x + btn.w / 2;
    const by = btn.y;
    const coreBottomY = centerY + 40;
    const midY = Math.round((coreBottomY + by) / 2) + (bi % 2 ? -8 : 8);

    const traceA = 0.08 + Math.sin(time * 1.5 + bi * 1.2) * 0.04;
    ctx.fillStyle = rgbStr(214, 194, 148, Math.max(0, traceA));

    const x1 = Math.round(w / 2 + (bi - 1.5) * 6);
    ctx.fillRect(x1, coreBottomY, 1, midY - coreBottomY);
    const fromX = Math.min(x1, bx);
    const toX = Math.max(x1, bx);
    ctx.fillRect(fromX, midY, toX - fromX + 1, 1);
    ctx.fillRect(bx, midY, 1, by - midY);

    // Animated pulse dot travelling along the L-shaped trace
    const seg1 = midY - coreBottomY;
    const seg2 = Math.abs(bx - x1);
    const seg3 = by - midY;
    const total = seg1 + seg2 + seg3;
    if (total > 0) {
      const period = 2.2 + bi * 0.3;
      const t = ((time + bi * 0.6) % period) / period;
      const pos = t * total;
      let ppx, ppy;
      if (pos < seg1) {
        ppx = x1;
        ppy = coreBottomY + pos;
      } else if (pos < seg1 + seg2) {
        ppx = x1 + (bx > x1 ? 1 : -1) * (pos - seg1);
        ppy = midY;
      } else {
        ppx = bx;
        ppy = midY + (pos - seg1 - seg2);
      }
      ctx.fillStyle = rgbStr(214, 194, 148, 0.8);
      ctx.fillRect(Math.round(ppx) - 1, Math.round(ppy) - 1, 3, 3);
      ctx.fillStyle = rgbStr(214, 194, 148, 0.24);
      ctx.fillRect(Math.round(ppx) - 3, Math.round(ppy) - 3, 7, 7);
    }
  }

  // ─ Back button — prominent, clickable-looking ─
  {
    const bx = 8;
    const by = 8;
    const bw = isCompactViewport ? 122 : 170;
    const bh = isCompactViewport ? 34 : 42;
    // Button background
    const backGradient = ctx.createLinearGradient(bx, by, bx, by + bh);
    backGradient.addColorStop(0, '#f4efe7');
    backGradient.addColorStop(1, '#d5cec5');
    ctx.fillStyle = backGradient;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.76)';
    ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
    ctx.fillRect(bx + 1, by + 1, 1, bh - 2);
    ctx.fillStyle = 'rgba(64,64,64,0.92)';
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

  // ─ Corner decorations ─
  drawGateSymbol(ctx, 50, h - 40, 'and', accent, time);
  drawGateSymbol(ctx, w - 50, h - 40, 'or', accent, time);
}

/**
 * Hit-test for nano view. Returns button id string or null.
 */
export function nanoHitTest(mx, my, w, h, towerDefenseOnly = false, options = {}) {
  const buttons = getNanoButtons(w, h, towerDefenseOnly, options);
  for (const btn of buttons) {
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      return btn.id;
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
