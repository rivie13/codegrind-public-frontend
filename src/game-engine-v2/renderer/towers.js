import { TOWER_TYPES } from '../constants.js';
import { drawCenteredSpriteIcon, getThemeSprite, normalizeThemeSpriteKey } from './themeSprites.js';

// ============================================================
// INSIDE LIGHTNING HELPERS (Tower Pack cosmetic effect)
// ============================================================

function hashNoise(seed) {
  const v = Math.sin(seed * 997.13) * 43758.5453123;
  return v - Math.floor(v);
}

function drawRetroTowerBase(renderer, x, y, size, accentColor, isSelected) {
  const { ctx } = renderer;

  ctx.fillStyle = '#d4d0c8';
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(x + 2, y + 2, size - 4, 2);
  ctx.fillRect(x + 2, y + 2, 2, size - 4);

  ctx.fillStyle = 'rgba(70, 74, 80, 0.32)';
  ctx.fillRect(x + size - 4, y + 2, 2, size - 4);
  ctx.fillRect(x + 2, y + size - 4, size - 4, 2);

  ctx.globalAlpha = 0.26;
  ctx.fillStyle = accentColor || '#7b6f5b';
  ctx.fillRect(x + 4, y + size - 8, size - 8, 4);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = isSelected ? '#0a2c9a' : '#5d636e';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.strokeRect(x, y, size, size);
}

function pointOnSquarePerimeter(cx, cy, halfSize, t) {
  const n = ((t % 1) + 1) % 1;
  const d = n * halfSize * 8;
  if (d < halfSize * 2) return { x: cx - halfSize + d, y: cy - halfSize };
  if (d < halfSize * 4) return { x: cx + halfSize, y: cy - halfSize + (d - halfSize * 2) };
  if (d < halfSize * 6) return { x: cx + halfSize - (d - halfSize * 4), y: cy + halfSize };
  return { x: cx - halfSize, y: cy + halfSize - (d - halfSize * 6) };
}

function drawLightningBolt(ctx, sx, sy, ex, ey, jitter, color, glow) {
  const segs = 7;
  const dx = (ex - sx) / segs;
  const dy = (ey - sy) / segs;

  ctx.save();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 1; i < segs; i++) {
    const off = (hashNoise(i * 13.7 + jitter) - 0.5) * 16;
    ctx.lineTo(sx + dx * i + off, sy + dy * i);
  }
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 1; i < segs; i++) {
    const off = (hashNoise(i * 17.3 + jitter * 2.1) - 0.5) * 12;
    ctx.lineTo(sx + dx * i + off, sy + dy * i);
  }
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
}

function drawInsideLightning(ctx, cx, cy, size, phase, mode, color, glow) {
  const half = size * 0.34;
  const t = phase * 0.28;

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - half, cy - half, half * 2, half * 2);
  ctx.clip();

  if (mode === 'cross-pulse') {
    const a = pointOnSquarePerimeter(cx, cy, half, t);
    const b = pointOnSquarePerimeter(cx, cy, half, t + 0.5);
    const c = pointOnSquarePerimeter(cx, cy, half, t + 0.25);
    const d = pointOnSquarePerimeter(cx, cy, half, t + 0.75);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, phase * 2.2, color, glow);
    drawLightningBolt(ctx, c.x, c.y, d.x, d.y, phase * 1.9, color, glow);
  } else if (mode === 'orbit-spark') {
    const a = pointOnSquarePerimeter(cx, cy, half, t);
    const b = pointOnSquarePerimeter(cx, cy, half, t + 0.18);
    const c = pointOnSquarePerimeter(cx, cy, half, t + 0.36);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, phase * 2.6, color, glow);
    drawLightningBolt(ctx, b.x, b.y, c.x, c.y, phase * 2.1, color, glow);
  } else if (mode === 'edge-sweep') {
    // Lightning from a moving edge point to center
    const a = pointOnSquarePerimeter(cx, cy, half, t);
    drawLightningBolt(ctx, a.x, a.y, cx, cy, phase * 2.4, color, glow);
    const b = pointOnSquarePerimeter(cx, cy, half, t + 0.5);
    drawLightningBolt(ctx, b.x, b.y, cx, cy, phase * 1.7, color, glow);
  } else {
    // Default: single bolt across tower
    const a = pointOnSquarePerimeter(cx, cy, half, t);
    const b = pointOnSquarePerimeter(cx, cy, half, t + 0.5);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, phase * 2.4, color, glow);
  }

  ctx.restore();
}

// ============================================================
// UNIQUE TOWER PACK VISUAL EFFECTS
// ============================================================

function drawFireFlames(ctx, cx, cy, size, phase) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - size / 2, cy - size / 2, size, size);
  ctx.clip();
  // 5 animated flame tongues
  for (let _i = 0; _i < 5; _i++) {
    const _seed = _i * 3.71 + phase;
    const _xOff = (hashNoise(_i * 7.3) - 0.5) * size * 0.7;
    const _baseY = cy + size * 0.38;
    const _height = size * (0.55 + hashNoise(_seed * 0.9) * 0.35);
    const _wobble = Math.sin(phase * 2.3 + _i * 1.2) * size * 0.1;
    const _w = size * (0.09 + hashNoise(_i * 5.1) * 0.07);
    const _alpha = 0.55 + Math.sin(phase * 2.8 + _i) * 0.2;
    // outer flame (orange)
    ctx.globalAlpha = _alpha * 0.7;
    ctx.fillStyle = _i % 2 === 0 ? '#F97316' : '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(cx + _xOff - _w, _baseY);
    ctx.quadraticCurveTo(
      cx + _xOff + _wobble - _w * 0.5,
      _baseY - _height * 0.6,
      cx + _xOff,
      _baseY - _height
    );
    ctx.quadraticCurveTo(
      cx + _xOff + _wobble + _w * 0.5,
      _baseY - _height * 0.6,
      cx + _xOff + _w,
      _baseY
    );
    ctx.fill();
    // inner core (bright yellow-white)
    ctx.globalAlpha = _alpha * 0.55;
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.moveTo(cx + _xOff - _w * 0.4, _baseY);
    ctx.quadraticCurveTo(
      cx + _xOff + _wobble * 0.5,
      _baseY - _height * 0.45,
      cx + _xOff,
      _baseY - _height * 0.65
    );
    ctx.quadraticCurveTo(
      cx + _xOff + _wobble * 0.5 + _w * 0.4,
      _baseY - _height * 0.45,
      cx + _xOff + _w * 0.4,
      _baseY
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCircuitTraces(ctx, x, y, size, offset, phase) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + offset, y + offset, size, size);
  ctx.clip();
  // 3 animated circuit paths
  const _nodes = [
    [0.1, 0.2, 0.5, 0.2, 0.5, 0.55, 0.85, 0.55],
    [0.15, 0.7, 0.45, 0.7, 0.45, 0.38, 0.8, 0.38],
    [0.25, 0.5, 0.6, 0.5, 0.6, 0.8, 0.9, 0.8],
  ];
  _nodes.forEach((_pts, _i) => {
    const _pulse = (phase * 0.7 + _i * 0.33) % 1;
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(x + offset + _pts[0] * size, y + offset + _pts[1] * size);
    for (let _j = 2; _j < _pts.length; _j += 2) {
      ctx.lineTo(x + offset + _pts[_j] * size, y + offset + _pts[_j + 1] * size);
    }
    ctx.stroke();
    // moving signal dot
    const _segCount = _pts.length / 2 - 1;
    const _segIdx = Math.floor(_pulse * _segCount);
    const _segT = _pulse * _segCount - _segIdx;
    const _si = _segIdx * 2;
    if (_si + 3 < _pts.length) {
      const _sx = x + offset + (_pts[_si] + (_pts[_si + 2] - _pts[_si]) * _segT) * size;
      const _sy = y + offset + (_pts[_si + 1] + (_pts[_si + 3] - _pts[_si + 1]) * _segT) * size;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(_sx, _sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawIceCrystals(ctx, cx, cy, size, phase) {
  ctx.save();
  // 4 corner ice shards
  const _corners = [
    [cx - size * 0.4, cy - size * 0.4],
    [cx + size * 0.4, cy - size * 0.4],
    [cx + size * 0.4, cy + size * 0.4],
    [cx - size * 0.4, cy + size * 0.4],
  ];
  _corners.forEach(([_bx, _by], _i) => {
    const _ang = Math.atan2(_by - cy, _bx - cx);
    const _len = size * (0.22 + Math.sin(phase * 1.5 + _i * 0.9) * 0.08);
    const _alpha = 0.55 + Math.sin(phase * 2.1 + _i) * 0.2;
    ctx.globalAlpha = _alpha;
    // Main spike
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(_bx, _by);
    ctx.lineTo(_bx + Math.cos(_ang) * _len, _by + Math.sin(_ang) * _len);
    ctx.stroke();
    // Side branches
    ctx.lineWidth = 1;
    ctx.globalAlpha = _alpha * 0.6;
    [-0.5, 0.5].forEach((_side) => {
      ctx.beginPath();
      ctx.moveTo(_bx + Math.cos(_ang) * _len * 0.5, _by + Math.sin(_ang) * _len * 0.5);
      ctx.lineTo(
        _bx + Math.cos(_ang) * _len * 0.5 + Math.cos(_ang + _side) * _len * 0.3,
        _by + Math.sin(_ang) * _len * 0.5 + Math.sin(_ang + _side) * _len * 0.3
      );
      ctx.stroke();
    });
    // Tip glow dot
    ctx.globalAlpha = _alpha * 0.8;
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(_bx + Math.cos(_ang) * _len, _by + Math.sin(_ang) * _len, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // Frost center glow
  const _grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.32);
  _grd.addColorStop(0, 'rgba(186,230,253,0.28)');
  _grd.addColorStop(1, 'rgba(186,230,253,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = _grd;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpectralPhase(ctx, x, y, size, offset, phase) {
  ctx.save();
  // Draw 2 ghost afterimages offset by phase
  const _offsets = [
    { dx: Math.sin(phase * 1.3) * size * 0.12, dy: -size * 0.06, alpha: 0.22 },
    { dx: Math.sin(phase * 0.9 + 2.1) * size * 0.1, dy: size * 0.05, alpha: 0.16 },
  ];
  _offsets.forEach(({ dx, dy, alpha }) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#67E8F9';
    ctx.fillRect(x + offset + dx, y + offset + dy, size, size);
    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + offset + dx, y + offset + dy, size, size);
  });
  // Shimmer scan line
  const _scanY = y + offset + ((phase * 0.6) % 1) * size;
  ctx.globalAlpha = 0.3;
  const _scanGrd = ctx.createLinearGradient(x + offset, _scanY, x + offset + size, _scanY + 3);
  _scanGrd.addColorStop(0, 'rgba(103,232,249,0)');
  _scanGrd.addColorStop(0.5, 'rgba(103,232,249,0.8)');
  _scanGrd.addColorStop(1, 'rgba(103,232,249,0)');
  ctx.fillStyle = _scanGrd;
  ctx.fillRect(x + offset, _scanY, size, 3);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMatrixRain(ctx, x, y, size, offset, phase, towerId) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + offset, y + offset, size, size);
  ctx.clip();
  // 4 columns of falling characters
  const _cols = 4;
  const _colW = size / _cols;
  const _chars = '01';
  for (let _c = 0; _c < _cols; _c++) {
    const _seed = (towerId ? towerId.charCodeAt(0) || 0 : 0) * 0.1 + _c * 2.3;
    const _speed = 0.4 + hashNoise(_seed) * 0.4;
    const _yOff = (phase * _speed * size + hashNoise(_seed * 7.1) * size) % size;
    const _cx2 = x + offset + _c * _colW + _colW * 0.3;
    // 3 chars per column
    for (let _r = 0; _r < 3; _r++) {
      const _charIdx = Math.floor(hashNoise(_seed + _r + phase * 3) * _chars.length);
      const _charY = y + offset + ((_yOff + _r * (_colW * 1.1)) % size);
      const _alpha = 0.7 - _r * 0.2;
      ctx.globalAlpha = _alpha;
      ctx.fillStyle = _r === 0 ? '#DCFCE7' : '#4ADE80';
      ctx.font = `bold ${Math.floor(_colW * 0.7)}px monospace`;
      ctx.fillText(_chars[_charIdx], _cx2, _charY);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPlasmaArcs(ctx, cx, cy, size, phase) {
  ctx.save();
  const _half = size * 0.5;
  // 3 arcing plasma bolts between corners
  const _arcPairs = [
    [
      [cx - _half, cy - _half],
      [cx + _half, cy - _half],
    ],
    [
      [cx + _half, cy - _half],
      [cx + _half, cy + _half],
    ],
    [
      [cx + _half, cy + _half],
      [cx - _half, cy + _half],
    ],
  ];
  _arcPairs.forEach(([[_x1, _y1], [_x2, _y2]], _i) => {
    const _active = Math.sin(phase * 2.5 + _i * 1.2) > 0.1;
    if (!_active) return;
    const _jitter = phase * 3.1 + _i * 7.7;
    // glow pass
    ctx.strokeStyle = '#F0ABFC';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(_x1, _y1);
    ctx.lineTo(_x2, _y2);
    ctx.stroke();
    // core bolt
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    const _segs = 6;
    ctx.beginPath();
    ctx.moveTo(_x1, _y1);
    for (let _s = 1; _s < _segs; _s++) {
      const _t = _s / _segs;
      const _off = (hashNoise(_jitter + _s * 13.1) - 0.5) * 10;
      ctx.lineTo(_x1 + (_x2 - _x1) * _t + _off, _y1 + (_y2 - _y1) * _t + _off);
    }
    ctx.lineTo(_x2, _y2);
    ctx.stroke();
    // endpoint glow
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#F0ABFC';
    ctx.beginPath();
    ctx.arc(_x1, _y1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(_x2, _y2, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawTowers(renderer, towers) {
  renderer.towerAuraMap = computeAuraInfluence(renderer, towers);
  towers.forEach((tower) => drawTower(renderer, tower));
}

export function getTowerConfig(renderer, tower) {
  const key = tower.type?.toUpperCase()?.replace(/\s+/g, '_');
  return TOWER_TYPES[key] || Object.values(TOWER_TYPES).find((t) => t.type === tower.type) || null;
}

export function getActiveSpecialEffects(renderer, tower) {
  const config = getTowerConfig(renderer, tower);
  const passiveEffects = config?.passiveEffects || config?.baseEffects || [];
  const specialEffects = config?.specialEffects || [];
  const specialLevel = tower.specialUpgradeLevel || 0;
  return [...passiveEffects, ...specialEffects.slice(0, specialLevel)];
}

export function getSpecialEffectColor(effects) {
  if (!effects || effects.length === 0) return '#b277ff';
  if (effects.some((effect) => effect?.aura)) return '#a78bfa';
  if (effects.some((effect) => effect?.multiTarget || Number.isFinite(effect?.extraTargets)))
    return '#00e5ff';
  if (effects.some((effect) => effect?.execute)) return '#ff4d6d';
  if (effects.some((effect) => effect?.splash)) return '#ffb703';
  if (effects.some((effect) => effect?.slow)) return '#6ee7ff';
  if (effects.some((effect) => effect?.field)) return '#ff9f1c';
  if (effects.some((effect) => effect?.delayedDamage)) return '#ff6bd6';
  if (effects.some((effect) => effect?.typeDamageBonus)) return '#7dff6b';
  if (effects.some((effect) => Number.isFinite(effect?.rangeBonus) && effect.rangeBonus > 0))
    return '#ffd166';
  if (
    effects.some(
      (effect) => Number.isFinite(effect?.damageMultiplier) && effect.damageMultiplier > 0
    )
  )
    return '#ffffff';
  return '#b277ff';
}

export function getSpecialEffectTag(effects) {
  if (!effects || effects.length === 0) return null;
  if (effects.some((effect) => effect?.aura)) return 'AURA';
  if (effects.some((effect) => effect?.multiTarget || Number.isFinite(effect?.extraTargets)))
    return 'MULTI';
  if (effects.some((effect) => effect?.execute)) return 'EXEC';
  if (effects.some((effect) => effect?.splash)) return 'SPLASH';
  if (effects.some((effect) => effect?.slow)) return 'SLOW';
  if (effects.some((effect) => effect?.field)) return 'FIELD';
  if (effects.some((effect) => effect?.delayedDamage)) return 'DOT';
  if (effects.some((effect) => effect?.typeDamageBonus)) return 'TYPE';
  if (effects.some((effect) => Number.isFinite(effect?.rangeBonus) && effect.rangeBonus > 0))
    return 'RANGE';
  if (
    effects.some(
      (effect) => Number.isFinite(effect?.damageMultiplier) && effect.damageMultiplier > 0
    )
  )
    return 'DMG';
  return 'SPEC';
}

export function computeAuraInfluence(renderer, towers) {
  const auraMap = new Map();
  if (!Array.isArray(towers) || towers.length === 0) return auraMap;

  const sources = towers.filter((t) => t.type === 'Variable' && (t.specialUpgradeLevel || 0) >= 2);
  if (!sources.length) return auraMap;

  sources.forEach((source) => {
    const config = getTowerConfig(renderer, source);
    const auraEffect = config?.specialEffects?.find((effect) => effect?.aura)?.aura;
    if (!auraEffect) return;

    const radius = auraEffect.radius || 0;
    if (radius <= 0) return;

    towers.forEach((target) => {
      if (target.id === source.id) return;
      const dr = target.position.row - source.position.row;
      const dc = target.position.col - source.position.col;
      const distance = Math.sqrt(dr * dr + dc * dc);
      if (distance > radius) return;

      const prev = auraMap.get(target.id) || {
        damageMultiplier: 0,
        speedMultiplier: 0,
        sources: 0,
      };
      auraMap.set(target.id, {
        damageMultiplier: Math.max(prev.damageMultiplier, auraEffect.damageMultiplier || 0),
        speedMultiplier: Math.max(prev.speedMultiplier, auraEffect.speedMultiplier || 0),
        sources: prev.sources + 1,
      });
    });
  });

  return auraMap;
}

export function drawTower(renderer, tower) {
  const { position, type, upgradeLevel, color: _towerColor, isDisabled, disabledByEnemyId } = tower;
  const _pack = renderer.settings?.towerPack;
  const towerSpriteSrc = getThemeSprite(_pack?.towerSprites, normalizeThemeSpriteKey(type));

  // Get color from tower pack's per-tower-type colors, or fall back to single towerColor, then default tower color
  let color = _towerColor;
  if (_pack?.towerColors) {
    // Normalize tower type key (e.g., "ForLoop" -> "FOR_LOOP")
    const typeKey = type?.toUpperCase?.()?.replace(/\s+/g, '_') || 'DEFAULT';
    color = _pack.towerColors[typeKey] || _pack.towerColor || _towerColor;
  } else if (_pack?.towerColor) {
    // Fallback for old tower packs with single towerColor
    color = _pack.towerColor;
  }

  const _packBorder = _pack?.towerBorderColor || null;
  const x = position.col * renderer.cellSize;
  const y = position.row * renderer.cellSize;
  const size = renderer.cellSize * 0.8;
  const offset = (renderer.cellSize - size) / 2;
  const isSelected = tower.id === renderer.selectedTowerId;
  const specialLevel = tower.specialUpgradeLevel || 0;
  const activeSpecialEffects = getActiveSpecialEffects(renderer, tower);
  const specialColor = getSpecialEffectColor(activeSpecialEffects);
  const specialTag = getSpecialEffectTag(activeSpecialEffects);
  const auraEffect = activeSpecialEffects.find((effect) => effect?.aura)?.aura;
  const auraInfluence = renderer.towerAuraMap?.get(tower.id);

  // Aura for Variable towers (special upgrade)
  if (auraEffect) {
    const auraRadius = auraEffect.radius * renderer.cellSize;
    const centerX = (position.col + 0.5) * renderer.cellSize;
    const centerY = (position.row + 0.5) * renderer.cellSize;

    renderer.ctx.save();
    renderer.ctx.beginPath();
    renderer.ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
    renderer.ctx.fillStyle = `${specialColor}22`;
    renderer.ctx.fill();
    renderer.ctx.strokeStyle = `${specialColor}AA`;
    renderer.ctx.lineWidth = 2;
    renderer.ctx.setLineDash([6, 6]);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Tower body with glow
  if (renderer.settings.glowEffects) {
    renderer.ctx.shadowColor = color;
    renderer.ctx.shadowBlur = isSelected ? 20 : 10;
  }

  if (isDisabled) {
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.55;
  }

  if (towerSpriteSrc) {
    drawRetroTowerBase(renderer, x + offset, y + offset, size, color, isSelected);
  } else {
    // Background
    renderer.ctx.fillStyle = color;
    renderer.ctx.fillRect(x + offset, y + offset, size, size);

    // Border — use pack border color when not selected
    renderer.ctx.strokeStyle = isSelected ? '#FFFFFF' : _packBorder || 'rgba(255,255,255,0.5)';
    renderer.ctx.lineWidth = isSelected ? 3 : 2;
    renderer.ctx.strokeRect(x + offset, y + offset, size, size);
  }

  // Camo overlay for camo-ops pack
  if (_pack?.camoPalette && !isDisabled) {
    const _cx = x + renderer.cellSize / 2;
    const _cy = y + renderer.cellSize / 2;
    renderer.ctx.save();
    renderer.ctx.beginPath();
    renderer.ctx.rect(x + offset, y + offset, size, size);
    renderer.ctx.clip();
    renderer.ctx.globalAlpha = 0.38;
    const _palette = _pack.camoPalette;
    const _ti = tower.id ? tower.id.charCodeAt(0) || 0 : 0;
    for (let _i = 0; _i < 5; _i++) {
      const _drift = renderer.glowPhase * 0.3 + _ti * 0.22 + _i * 1.2;
      const _r = size * (0.08 + hashNoise(_ti * 17 + _i * 0.5) * 0.18);
      const _bx =
        _cx +
        Math.sin(_drift + _i * 0.7) * size * 0.22 +
        (hashNoise(_ti * 11 + _i) - 0.5) * size * 0.25;
      const _by =
        _cy +
        Math.cos(_drift * 0.8 + _i * 0.9) * size * 0.22 +
        (hashNoise(_ti * 7 + _i * 2.1) - 0.5) * size * 0.22;
      renderer.ctx.beginPath();
      renderer.ctx.arc(_bx, _by, _r, 0, Math.PI * 2);
      renderer.ctx.fillStyle = _palette[_i % _palette.length];
      renderer.ctx.fill();
    }
    renderer.ctx.restore();
  }

  // Unique tower pack effects
  if (!isDisabled && _pack?.towerEffect) {
    const _cx2 = x + renderer.cellSize / 2;
    const _cy2 = y + renderer.cellSize / 2;
    const _phase = renderer.glowPhase || 0;
    if (_pack.towerEffect === 'fire-flames') {
      drawFireFlames(renderer.ctx, _cx2, _cy2, size, _phase);
    } else if (_pack.towerEffect === 'circuit-traces') {
      drawCircuitTraces(renderer.ctx, x, y, size, offset, _phase);
    } else if (_pack.towerEffect === 'ice-crystals') {
      drawIceCrystals(renderer.ctx, _cx2, _cy2, size, _phase);
    } else if (_pack.towerEffect === 'spectral-phase') {
      drawSpectralPhase(renderer.ctx, x, y, size, offset, _phase);
    } else if (_pack.towerEffect === 'matrix-rain') {
      drawMatrixRain(renderer.ctx, x, y, size, offset, _phase, tower.id);
    } else if (_pack.towerEffect === 'plasma-arcs') {
      drawPlasmaArcs(renderer.ctx, _cx2, _cy2, size, _phase);
    }
  }

  renderer.ctx.shadowBlur = 0;

  const towerIconRendered = towerSpriteSrc
    ? drawCenteredSpriteIcon(
        renderer,
        towerSpriteSrc,
        x + renderer.cellSize / 2,
        y + renderer.cellSize / 2,
        size * 0.62,
        {
          alpha: isDisabled ? 0.82 : 1,
          shadowColor: isSelected ? '#ffffff' : color,
          shadowBlur: isSelected ? 4 : 2,
        }
      )
    : false;

  if (isDisabled) {
    const centerX = x + renderer.cellSize / 2;
    const centerY = y + renderer.cellSize / 2;
    const pulse = 1 + Math.sin(renderer.glowPhase * 3) * 0.12;
    const ringColor = disabledByEnemyId ? '#ff2d95' : '#ff9f1c';

    renderer.ctx.save();
    renderer.ctx.globalAlpha = 1;
    renderer.ctx.shadowColor = `${ringColor}CC`;
    renderer.ctx.shadowBlur = 14;
    renderer.ctx.strokeStyle = ringColor;
    renderer.ctx.lineWidth = 2.5;
    renderer.ctx.beginPath();
    renderer.ctx.arc(centerX, centerY, size * 0.6 * pulse, 0, Math.PI * 2);
    renderer.ctx.stroke();

    renderer.ctx.globalAlpha = 0.45;
    renderer.ctx.setLineDash([5, 4]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(centerX, centerY, size * 0.9 * pulse, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();

    renderer.ctx.save();
    renderer.ctx.beginPath();
    renderer.ctx.rect(x + offset, y + offset, size, size);
    renderer.ctx.clip();
    renderer.ctx.globalAlpha = 0.25;
    renderer.ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    renderer.ctx.lineWidth = 1;
    for (let i = -size; i <= size; i += 6) {
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x + offset + i, y + offset);
      renderer.ctx.lineTo(x + offset + i + size, y + offset + size);
      renderer.ctx.stroke();
    }
    renderer.ctx.restore();
  }

  if (isDisabled) {
    renderer.ctx.restore();
  }

  // Inside lightning (cosmetic tower pack effect — only when pack has hasLightningAnimation)
  const lightningMode = renderer.settings?.lightningInternalMode;
  if (
    !isDisabled &&
    _pack?.hasLightningAnimation &&
    lightningMode &&
    lightningMode !== 'flat' &&
    lightningMode !== 'none'
  ) {
    const lightningCx = x + renderer.cellSize / 2;
    const lightningCy = y + renderer.cellSize / 2;
    drawInsideLightning(
      renderer.ctx,
      lightningCx,
      lightningCy,
      size,
      renderer.glowPhase || 0,
      lightningMode,
      renderer.settings?.lightningColor || '#FDE047',
      renderer.settings?.lightningGlow || '#FEF08A'
    );
  }

  // Special upgrade ring
  if (specialLevel > 0) {
    renderer.ctx.save();
    renderer.ctx.strokeStyle = `${specialColor}CC`;
    renderer.ctx.lineWidth = 2;
    renderer.ctx.strokeRect(x + offset - 2, y + offset - 2, size + 4, size + 4);
    renderer.ctx.restore();
  }

  // Variable aura influence on tower
  if (auraInfluence && (auraInfluence.damageMultiplier > 0 || auraInfluence.speedMultiplier > 0)) {
    renderer.ctx.save();
    renderer.ctx.strokeStyle = '#a78bfa';
    renderer.ctx.lineWidth = 1.5;
    renderer.ctx.setLineDash([3, 3]);
    renderer.ctx.strokeRect(x + offset - 5, y + offset - 5, size + 10, size + 10);
    renderer.ctx.restore();
  }

  // Tower type letter
  if (!towerIconRendered) {
    if (towerSpriteSrc) {
      const centerX = x + renderer.cellSize / 2;
      const centerY = y + renderer.cellSize / 2;
      const dotSize = Math.max(2, size * 0.08);
      const dotGap = dotSize * 1.8;
      const startX = centerX - dotGap;

      renderer.ctx.save();
      renderer.ctx.fillStyle = 'rgba(31, 33, 40, 0.38)';
      for (let index = 0; index < 3; index += 1) {
        renderer.ctx.fillRect(startX + index * dotGap, centerY - dotSize / 2, dotSize, dotSize);
      }
      renderer.ctx.restore();
    } else {
      renderer.ctx.font = `bold ${renderer.cellSize * 0.4}px monospace`;
      renderer.ctx.fillStyle = '#FFFFFF';
      renderer.ctx.textAlign = 'center';
      renderer.ctx.textBaseline = 'middle';
      renderer.ctx.fillText(type.charAt(0), x + renderer.cellSize / 2, y + renderer.cellSize / 2);
    }
  }

  // Cooldown overlay
  if (!isDisabled && Number.isFinite(tower.lastAttackTime) && Number.isFinite(tower.attackSpeed)) {
    const now = renderer.lastState?.currentTime || Date.now();
    const cooldownMs = 1000 / Math.max(0.05, tower.attackSpeed);
    const elapsed = now - tower.lastAttackTime;
    const remaining = cooldownMs - elapsed;
    if (remaining > 0 && remaining < cooldownMs * 1.5) {
      const progress = Math.max(0, Math.min(1, remaining / cooldownMs));
      const centerX = x + renderer.cellSize / 2;
      const centerY = y + renderer.cellSize / 2;
      const radius = size * 0.45;

      renderer.ctx.save();
      renderer.ctx.beginPath();
      renderer.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      renderer.ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      renderer.ctx.lineWidth = 5;
      renderer.ctx.stroke();

      renderer.ctx.beginPath();
      renderer.ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      );
      const hasAuraBoost = auraInfluence && auraInfluence.speedMultiplier > 0;
      renderer.ctx.strokeStyle = hasAuraBoost ? '#c084fc' : `${color}CC`;
      renderer.ctx.lineWidth = 5;
      renderer.ctx.lineCap = 'round';
      renderer.ctx.stroke();
      renderer.ctx.restore();
    }
  }

  if (isDisabled) {
    renderer.ctx.save();
    renderer.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    renderer.ctx.lineWidth = 2;
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(x + offset + 4, y + offset + 4);
    renderer.ctx.lineTo(x + offset + size - 4, y + offset + size - 4);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Special effect tag
  if (specialLevel > 0 && specialTag) {
    const tagPaddingX = renderer.cellSize * 0.08;
    const tagHeight = renderer.cellSize * 0.18;
    const tagFontSize = renderer.cellSize * 0.14;
    const tagText = specialTag;
    renderer.ctx.save();
    renderer.ctx.font = `bold ${tagFontSize}px monospace`;
    const textWidth = renderer.ctx.measureText(tagText).width;
    const tagWidth = textWidth + tagPaddingX * 2;
    const tagX = x + (renderer.cellSize - tagWidth) / 2;
    const tagY = y + offset + 4;

    renderer.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    renderer.ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
    renderer.ctx.strokeStyle = `${specialColor}AA`;
    renderer.ctx.lineWidth = 1;
    renderer.ctx.strokeRect(tagX, tagY, tagWidth, tagHeight);

    renderer.ctx.fillStyle = specialColor;
    renderer.ctx.textAlign = 'center';
    renderer.ctx.textBaseline = 'middle';
    renderer.ctx.fillText(tagText, tagX + tagWidth / 2, tagY + tagHeight / 2 + 0.5);
    renderer.ctx.restore();
  }

  // Upgrade level indicator
  if (upgradeLevel > 0) {
    const levelX = x + renderer.cellSize - offset - 5;
    const levelY = y + renderer.cellSize - offset - 5;
    const levelSize = renderer.cellSize * 0.2;

    renderer.ctx.beginPath();
    renderer.ctx.arc(levelX, levelY, levelSize, 0, Math.PI * 2);
    renderer.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    renderer.ctx.fill();

    renderer.ctx.font = `bold ${levelSize}px monospace`;
    renderer.ctx.fillStyle = '#FFFFFF';
    renderer.ctx.fillText(String(upgradeLevel + 1), levelX, levelY);
  }

  // Special upgrade level indicator (separate from core upgrades)
  if (specialLevel > 0) {
    const specialX = x + offset + 6;
    const specialY = y + offset + 6;
    const specialSize = renderer.cellSize * 0.18;

    renderer.ctx.save();
    renderer.ctx.beginPath();
    renderer.ctx.arc(specialX, specialY, specialSize, 0, Math.PI * 2);
    renderer.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    renderer.ctx.fill();
    renderer.ctx.strokeStyle = `${specialColor}CC`;
    renderer.ctx.lineWidth = 1.5;
    renderer.ctx.stroke();

    renderer.ctx.font = `bold ${specialSize}px monospace`;
    renderer.ctx.fillStyle = specialColor;
    renderer.ctx.textAlign = 'center';
    renderer.ctx.textBaseline = 'middle';
    renderer.ctx.fillText(String(specialLevel), specialX, specialY + 0.5);
    renderer.ctx.restore();
  }
}

export function drawSelectedTowerRange(renderer, towers) {
  const tower = towers.find((t) => t.id === renderer.selectedTowerId);
  if (!tower) return;

  const x = (tower.position.col + 0.5) * renderer.cellSize;
  const y = (tower.position.row + 0.5) * renderer.cellSize;
  const range = tower.range * renderer.cellSize;

  // Range circle
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, range, 0, Math.PI * 2);
  renderer.ctx.fillStyle = tower.color + '20';
  renderer.ctx.fill();
  renderer.ctx.strokeStyle = tower.color;
  renderer.ctx.lineWidth = 2;
  renderer.ctx.stroke();
}
