import { getRendererSpriteImage } from './themeSprites.js';
import { ENEMY_SPRITE_MAP } from '../constants.js';

// Spritesheet constants for 16x16 retro frames (ported from CyberCrawler)
const ENEMY_SHEET_SRC = '/assets/Enemies.png';
const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;
const BLOCK_WIDTH = 64; // 4 columns * 16px
const BLOCK_HEIGHT = 80; // 5 rows * 16px
const FRAME_COLS = 4;
const WALK_FRAME_MS = 120;

// Offscreen scratchpad to dynamically dye transparent 1-bit sprites
let dyeCanvas = null;
let dyeCtx = null;

function getDyeCanvas(width, height) {
  if (typeof document === 'undefined') return null;
  if (!dyeCanvas) {
    dyeCanvas = document.createElement('canvas');
    dyeCtx = dyeCanvas.getContext('2d', { willReadFrequently: true });
  }
  dyeCanvas.width = width;
  dyeCanvas.height = height;
  dyeCtx.clearRect(0, 0, width, height);
  return { canvas: dyeCanvas, ctx: dyeCtx };
}

function hexToRgb(hex) {
  const normalized = String(hex || '#ff5555').replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Iterates through the 16x16 frame, applies bounding-envelope slicing to make the
 * surrounding black pixels transparent, and dyes foreground lines to match the highlights.
 */
function dyeMonochromeFrame(data, w, h, dyeColorRGB) {
  const leftBound = new Array(h).fill(w);
  const rightBound = new Array(h).fill(-1);
  const topBound = new Array(w).fill(h);
  const bottomBound = new Array(w).fill(-1);

  // 1. Scan local frame to find white outline boundaries
  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      const pixelIdx = (ly * w + lx) * 4;

      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];
      const a = data[pixelIdx + 3];

      if (a > 0 && r > 180 && g > 180 && b > 180) {
        if (lx < leftBound[ly]) leftBound[ly] = lx;
        if (lx > rightBound[ly]) rightBound[ly] = lx;
        if (ly < topBound[lx]) topBound[lx] = ly;
        if (ly > bottomBound[lx]) bottomBound[lx] = ly;
      }
    }
  }

  // 2. Apply orthographic envelope masking and color detailing
  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      const pixelIdx = (ly * w + lx) * 4;

      const isInsideHorizontal = lx >= leftBound[ly] && lx <= rightBound[ly];
      const isInsideVertical = ly >= topBound[lx] && ly <= bottomBound[lx];

      if (isInsideHorizontal && isInsideVertical) {
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        if (r > 180 && g > 180 && b > 180) {
          // Outline detail is dyed to the enemy's highlight color
          data[pixelIdx] = dyeColorRGB.r;
          data[pixelIdx + 1] = dyeColorRGB.g;
          data[pixelIdx + 2] = dyeColorRGB.b;
          data[pixelIdx + 3] = 255;
        } else {
          // Solid black body features stay intact and fully opaque
          data[pixelIdx] = 0;
          data[pixelIdx + 1] = 0;
          data[pixelIdx + 2] = 0;
          data[pixelIdx + 3] = 255;
        }
      } else {
        // Unused outer background space is cropped to transparent
        data[pixelIdx + 3] = 0;
      }
    }
  }
}

function getNormalizedEnemyKey(enemyType) {
  return String(enemyType || '')
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function getDirectionFromAngle(angleRad) {
  if (!Number.isFinite(angleRad)) return 'down';
  let angle = angleRad;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;

  const deg = (angle * 180) / Math.PI;
  if (deg > -45 && deg <= 45) return 'right';
  if (deg > 45 && deg <= 135) return 'down';
  if (deg > -135 && deg <= -45) return 'up';
  return 'left';
}

function getEnemySheetFrameRect(enemyType, angleRad, spawnTime) {
  const key = getNormalizedEnemyKey(enemyType);
  const block = ENEMY_SPRITE_MAP[key];
  if (!block) return null;

  let frameRow = 1;
  const dir = getDirectionFromAngle(angleRad);
  if (dir === 'down') frameRow = 1;
  else if (dir === 'right') frameRow = 2;
  else if (dir === 'up') frameRow = 3;
  else if (dir === 'left') frameRow = 4;

  const elapsed = Date.now() - (spawnTime || Date.now());
  const frameCol = Math.floor(elapsed / WALK_FRAME_MS) % FRAME_COLS;

  return {
    srcX: block.col * BLOCK_WIDTH + frameCol * FRAME_WIDTH,
    srcY: block.row * BLOCK_HEIGHT + frameRow * FRAME_HEIGHT,
    srcW: FRAME_WIDTH,
    srcH: FRAME_HEIGHT,
  };
}

function drawDyedEnemySheetFrame(renderer, enemy, size, colorHex) {
  const image = getRendererSpriteImage(renderer, ENEMY_SHEET_SRC);
  if (!image) return false;

  const frameRect = getEnemySheetFrameRect(enemy.type, enemy.headingAngle, enemy.spawnTime);
  if (!frameRect) return false;

  const dye = getDyeCanvas(FRAME_WIDTH, FRAME_HEIGHT);
  if (!dye) return false;

  dye.ctx.drawImage(
    image,
    frameRect.srcX,
    frameRect.srcY,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    FRAME_WIDTH,
    FRAME_HEIGHT
  );

  const imgData = dye.ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  dyeMonochromeFrame(imgData.data, FRAME_WIDTH, FRAME_HEIGHT, hexToRgb(colorHex));
  dye.ctx.putImageData(imgData, 0, 0);

  const { ctx } = renderer;
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dye.canvas, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, -size / 2, -size / 2, size, size);
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.restore();
  return true;
}

export function drawEnemies(renderer, enemies) {
  enemies.forEach((enemy) => drawEnemy(renderer, enemy, renderer.performanceTier));
}

export function drawEnemy(renderer, enemy, performanceTier = 'normal') {
  const {
    x,
    y,
    type,
    health,
    maxHealth,
    size,
    isSlowed,
    isFrozen,
    isBoss,
    defeatTime,
    hijackedTowerId,
  } = enemy;

  const colors = getEnemyColors(type);
  const useHeavyEffects = performanceTier !== 'low';
  const isUltra = performanceTier === 'ultra';

  // If defeated, only render the death effect (no frozen body)
  if (!enemy.isActive && defeatTime) {
    const deathElapsed = Date.now() - defeatTime;
    const t = Math.min(1, deathElapsed / 400);
    const alpha = 1 - t;

    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = alpha;

    const ringSize = size * (1 + t * 1.8);
    renderer.ctx.strokeStyle = '#ff3366CC';
    renderer.ctx.lineWidth = Math.max(1, size * 0.12);
    renderer.ctx.strokeRect(-ringSize / 2 + x, -ringSize / 2 + y, ringSize, ringSize);

    renderer.ctx.restore();
    return;
  }

  // Status effect/damage coloring overrides the dye
  let dyeColor = colors.highlight;
  if (enemy.isFrozen) {
    dyeColor = '#00FFFF';
  } else if (enemy.isSlowed) {
    dyeColor = '#00CCFF';
  } else if (enemy.isHit) {
    dyeColor = '#FFFFFF';
  }

  // Aura pulse for buffer enemies (preserved from previous renderer)
  if (type === 'buffer' && performanceTier !== 'low') {
    const pulse = 1 + Math.sin(renderer.glowPhase * 2) * 0.08;
    const radius = size * 1.8 * pulse;
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.35;
    renderer.ctx.strokeStyle = colors.highlight;
    renderer.ctx.lineWidth = Math.max(1, size * 0.12);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, radius, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.globalAlpha = 0.18;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, radius * 1.35, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Hijack pulse indicator (enemy latched onto a tower)
  if (hijackedTowerId && performanceTier !== 'low') {
    const pulse = 1 + Math.sin(renderer.glowPhase * 3.2) * 0.12;
    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = 0.6;
    renderer.ctx.strokeStyle = '#ff2d95';
    renderer.ctx.lineWidth = Math.max(1, size * 0.14);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 0.9 * pulse, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.globalAlpha = 0.35;
    renderer.ctx.strokeStyle = '#ffd1e8';
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 1.2 * pulse, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Frozen tint
  if (isFrozen) {
    renderer.ctx.globalAlpha = 0.7;
  }

  // Ultra-tier wake trail to clearly differentiate from normal.
  if (isUltra && type !== 'buffer' && Number.isFinite(enemy.headingAngle)) {
    const dirX = Math.cos(enemy.headingAngle || 0);
    const dirY = Math.sin(enemy.headingAngle || 0);
    for (let i = 1; i <= 3; i++) {
      const trailOffset = size * 0.35 * i;
      renderer.ctx.beginPath();
      renderer.ctx.arc(
        x - dirX * trailOffset,
        y - dirY * trailOffset,
        Math.max(1, size * (0.34 - i * 0.07)),
        0,
        Math.PI * 2
      );
      renderer.ctx.fillStyle = i % 2 === 0 ? `${colors.highlight}40` : `${colors.body}33`;
      renderer.ctx.fill();
    }
  }

  // Draw glow shadow (optional setting)
  if (renderer.settings.glowEffects) {
    renderer.ctx.save();
    renderer.ctx.shadowColor = dyeColor;
    renderer.ctx.shadowBlur = performanceTier === 'low' ? size / 3 : size / 2;
  }

  renderer.ctx.save();
  renderer.ctx.translate(x, y);

  // Sprite pixels ARE the enemy — no wrapper badge or geometric shape.
  // 2.5x base scale matches CyberCrawler sizing.
  const drewSprite = drawDyedEnemySheetFrame(renderer, enemy, size * 2.5, dyeColor);
  if (!drewSprite) {
    // Square grid outline fallback instead of round fallback circles
    renderer.ctx.strokeStyle = dyeColor;
    renderer.ctx.lineWidth = 1;
    renderer.ctx.strokeRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
  }

  renderer.ctx.restore();
  if (renderer.settings.glowEffects) {
    renderer.ctx.restore();
  }

  if (isUltra) {
    // Chromatic halo for clearer ultra identity.
    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = 0.5;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 0.68, 0, Math.PI * 2);
    renderer.ctx.strokeStyle = '#9ee6ff';
    renderer.ctx.lineWidth = Math.max(1, size * 0.07);
    renderer.ctx.stroke();

    renderer.ctx.globalAlpha = 0.35;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 0.82, 0, Math.PI * 2);
    renderer.ctx.strokeStyle = '#ff8cf5';
    renderer.ctx.lineWidth = Math.max(1, size * 0.05);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Boss indicator (drawn as block frame bounds)
  if (isBoss) {
    renderer.ctx.strokeStyle = '#FFFF00';
    renderer.ctx.lineWidth = 2.5;
    const bossRingSize = size * 1.44;
    renderer.ctx.strokeRect(x - bossRingSize / 2, y - bossRingSize / 2, bossRingSize, bossRingSize);
  }

  renderer.ctx.shadowBlur = 0;
  renderer.ctx.globalAlpha = 1;

  // Health bar (skip under ultra load)
  if (performanceTier !== 'low' && useHeavyEffects) {
    drawHealthBar(renderer, x, y + size * 1.25 + 5, size * 2.2, health / maxHealth);
  }

  // Status effect indicators
  if (isSlowed && !isFrozen && performanceTier !== 'low') {
    drawStatusIndicator(renderer, x, y - size * 1.25 - 8, '↓', '#00CCFF');
  }
  if (isFrozen && performanceTier !== 'low') {
    drawStatusIndicator(renderer, x, y - size * 1.25 - 8, '❄', '#00FFFF');
  }
}

export function getEnemyColors(type) {
  const colorMap = {
    basic: { body: '#ff0000', highlight: '#ff5555', glow: 'rgba(255, 0, 0, 0.6)' },
    edge: { body: '#ffaa00', highlight: '#ffcc00', glow: 'rgba(255, 170, 0, 0.6)' },
    complex: { body: '#0066ff', highlight: '#5599ff', glow: 'rgba(0, 102, 255, 0.6)' },
    timeLimit: { body: '#00ffcc', highlight: '#55ffdd', glow: 'rgba(0, 255, 204, 0.6)' },
    spaceComplex: { body: '#9900ff', highlight: '#cc55ff', glow: 'rgba(153, 0, 255, 0.6)' },
    hijacker: { body: '#ff5f7a', highlight: '#ff9bb0', glow: 'rgba(255, 95, 122, 0.6)' },
    buffer: { body: '#22cc66', highlight: '#66ff99', glow: 'rgba(34, 204, 102, 0.6)' },
    pathShaper: { body: '#ff9933', highlight: '#ffd18a', glow: 'rgba(255, 153, 51, 0.6)' },
  };

  return colorMap[type] || colorMap.basic;
}

export function getEnemyShape(type) {
  const shapeMap = {
    basic: 'circle',
    edge: 'square',
    complex: 'rectangle',
    timeLimit: 'circle',
    spaceComplex: 'blob',
    hijacker: 'rectangle',
    buffer: 'blob',
    pathShaper: 'square',
  };

  return shapeMap[type] || 'circle';
}

export function drawBlob(renderer, x, y, size) {
  const points = 6;
  const angleStep = (Math.PI * 2) / points;

  renderer.ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = i * angleStep + renderer.glowPhase * 0.5;
    const wobble = 1 + Math.sin(angle * 2 + renderer.glowPhase) * 0.1;
    const r = (size / 2) * wobble;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;

    if (i === 0) {
      renderer.ctx.moveTo(px, py);
    } else {
      renderer.ctx.lineTo(px, py);
    }
  }
  renderer.ctx.closePath();
}

export function drawHealthBar(renderer, x, y, width, percent) {
  const height = 4;
  const barX = x - width / 2;

  // Background
  renderer.ctx.fillStyle = '#333333';
  renderer.ctx.fillRect(barX, y, width, height);

  // Health fill
  const healthColor = percent > 0.6 ? '#00FF00' : percent > 0.3 ? '#FFCC00' : '#FF3333';
  renderer.ctx.fillStyle = healthColor;
  renderer.ctx.fillRect(barX, y, width * percent, height);

  // Border
  renderer.ctx.strokeStyle = '#666666';
  renderer.ctx.lineWidth = 1;
  renderer.ctx.strokeRect(barX, y, width, height);
}

export function drawStatusIndicator(renderer, x, y, symbol, color) {
  renderer.ctx.font = 'bold 12px sans-serif';
  renderer.ctx.fillStyle = color;
  renderer.ctx.textAlign = 'center';
  renderer.ctx.textBaseline = 'middle';
  renderer.ctx.fillText(symbol, x, y);
}
