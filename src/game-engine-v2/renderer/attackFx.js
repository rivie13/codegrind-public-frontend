// ============================================================
// TD ATTACK FX — enemy/impact-centered overlays
// ============================================================

import { getThemeSprite, normalizeThemeSpriteKey } from './themeSprites.js';

function fxHash(seed) {
  const v = Math.sin(seed * 997.13) * 43758.5453123;
  return v - Math.floor(v);
}

function getTargetPoint(projectile, enemyMap) {
  const enemy = projectile?.targetId ? enemyMap.get(projectile.targetId) : null;
  const tx = enemy?.x ?? projectile?.targetX;
  const ty = enemy?.y ?? projectile?.targetY;
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return null;
  return { x: tx, y: ty };
}

function getTowerTypeStyle(towerType) {
  if (towerType === 'Function') {
    return { spread: 1.25, width: 1.25, jitter: 0.28, dash: [] };
  }
  if (towerType === 'ForLoop') {
    return { spread: 0.95, width: 1.1, jitter: 0.42, dash: [4, 3] };
  }
  if (towerType === 'Variable') {
    return { spread: 0.8, width: 1, jitter: 0.18, dash: [2, 3] };
  }
  return { spread: 1, width: 1, jitter: 0.24, dash: [] };
}

function drawImpactGlow(ctx, x, y, radius, primary, secondary, alpha = 0.5) {
  const core = ctx.createRadialGradient(x, y, 0, x, y, radius);
  core.addColorStop(0, `${secondary}EE`);
  core.addColorStop(0.45, `${primary}88`);
  core.addColorStop(1, `${primary}00`);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawImpactPulse(ctx, x, y, radius, color, alpha = 0.32, lineWidth = 1.6) {
  ctx.globalAlpha = alpha * 0.45;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function getAttackFxBudget(renderer, projectileCount) {
  const ultraFxLoad = renderer.performanceTier === 'ultra' || projectileCount > 18;
  if (ultraFxLoad) {
    return {
      maxFxProjectiles: Math.min(4, projectileCount),
      maxEchoes: 20,
      nearImpactThreshold: 0.96,
      dataStreamPackets: 1,
      continuousImpactGlow: false,
      echoBucketScale: 1,
    };
  }

  const heavyFxLoad = renderer.performanceTier === 'heavy' || projectileCount > 10;
  if (heavyFxLoad) {
    return {
      maxFxProjectiles: Math.min(6, projectileCount),
      maxEchoes: 40,
      nearImpactThreshold: 0.9,
      dataStreamPackets: 2,
      continuousImpactGlow: false,
      echoBucketScale: 2,
    };
  }

  return {
    maxFxProjectiles: Math.min(8, projectileCount),
    maxEchoes: 80,
    nearImpactThreshold: 0.78,
    dataStreamPackets: 3,
    continuousImpactGlow: true,
    echoBucketScale: 3,
  };
}

/**
 * Draw attack FX on enemy targets.
 * @param {Renderer} renderer
 * @param {Array} towers - active towers
 * @param {Array} projectiles - active projectile objects
 * @param {Array} enemies - active enemy objects
 */
export function drawTowerAttackFx(renderer, towers, projectiles = [], enemies = []) {
  const fxId = renderer.settings?.tdAttackFxMode;
  if (!fxId || fxId === 'none') return;

  const ctx = renderer.ctx;
  const cs = renderer.cellSize;
  const phase = renderer.glowPhase || 0;
  const now = Date.now();
  const fxPrimaryColor = renderer.settings?.towerPack?.projectileColor || '#60A5FA';
  const fxSecondaryColor = renderer.settings?.enemyPack?.enemyHighlightColor || '#E2E8F0';
  const projectileCount = Array.isArray(projectiles) ? projectiles.length : 0;
  const fxBudget = getAttackFxBudget(renderer, projectileCount);
  const maxFxProjectiles = fxBudget.maxFxProjectiles;
  const enemyMap =
    maxFxProjectiles > 0 ? new Map((enemies || []).map((enemy) => [enemy.id, enemy])) : new Map();

  // Persist short-lived impact echoes so FX remain visible longer than a single frame.
  if (!Array.isArray(renderer._attackFxEchoes)) {
    renderer._attackFxEchoes = [];
  }
  if (!(renderer._attackFxEchoBuckets instanceof Map)) {
    renderer._attackFxEchoBuckets = new Map();
  }
  const echoes = renderer._attackFxEchoes.filter((echo) => echo.expiresAt > now);
  renderer._attackFxEchoes = echoes;
  const activeProjectileIds = new Set();

  if (maxFxProjectiles === 0 && echoes.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < maxFxProjectiles; i += 1) {
    const projectile = projectiles[i];
    if (!projectile) continue;

    if (projectile.id) {
      activeProjectileIds.add(projectile.id);
    }

    const target = getTargetPoint(projectile, enemyMap);
    if (!target) continue;

    const sx = Number.isFinite(projectile?.x) ? projectile.x : target.x;
    const sy = Number.isFinite(projectile?.y) ? projectile.y : target.y;
    const dx = target.x - sx;
    const dy = target.y - sy;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const nx = dx / dist;
    const ny = dy / dist;
    const towerStyle = getTowerTypeStyle(projectile?.towerType);
    const projectileHasSprite = Boolean(
      getThemeSprite(
        renderer.settings?.towerPack?.projectileSprites,
        normalizeThemeSpriteKey(projectile?.towerType)
      )
    );
    const useMinimalImpactFx = fxId === 'data-stream' && projectileHasSprite;
    const seed = phase * 1.1 + i * 0.73;
    const progress = Number.isFinite(projectile?.progress) ? projectile.progress : 0;
    const nearImpact = progress >= fxBudget.nearImpactThreshold;

    if ((fxBudget.continuousImpactGlow || nearImpact) && !(useMinimalImpactFx && !nearImpact)) {
      const impactR = cs * 0.18 * towerStyle.spread;
      if (useMinimalImpactFx) {
        drawImpactPulse(
          ctx,
          target.x,
          target.y,
          impactR * 1.55,
          fxPrimaryColor,
          nearImpact ? 0.26 : 0.18,
          1.4 * towerStyle.width
        );
      } else {
        drawImpactGlow(
          ctx,
          target.x,
          target.y,
          impactR * 2.2,
          fxPrimaryColor,
          fxSecondaryColor,
          nearImpact ? 0.28 : 0.18
        );
      }
    }

    if (nearImpact && projectile.id && !useMinimalImpactFx) {
      const echoBucket = Math.floor(progress * fxBudget.echoBucketScale);
      const lastEchoBucket = renderer._attackFxEchoBuckets.get(projectile.id) ?? -1;
      if (echoBucket > lastEchoBucket) {
        renderer._attackFxEchoBuckets.set(projectile.id, echoBucket);
        renderer._attackFxEchoes.push({
          x: target.x,
          y: target.y,
          mode: fxId,
          spread: towerStyle.spread,
          width: towerStyle.width,
          createdAt: now,
          expiresAt: now + 420,
        });
      }
    }

    if (fxId === 'pulse-rings') {
      const pulse = Math.sin(seed * 2.2) * 0.5 + 0.5;
      const radius = cs * (0.24 + 0.42 * pulse) * towerStyle.spread;
      ctx.strokeStyle = fxPrimaryColor;
      ctx.globalAlpha = 0.75 * (1 - pulse);
      ctx.lineWidth = 2.6 * towerStyle.width;
      ctx.setLineDash(towerStyle.dash);
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.5 * (1 - pulse);
      ctx.strokeStyle = fxSecondaryColor;
      ctx.lineWidth = 1.4 * towerStyle.width;
      ctx.beginPath();
      ctx.arc(target.x, target.y, radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (fxId === 'ember-sparks') {
      for (let s = 0; s < 6; s += 1) {
        const ang = seed * 1.8 + s * 1.57;
        const spread = cs * 0.3 * towerStyle.spread;
        const px = target.x + Math.cos(ang) * spread;
        const py = target.y + Math.sin(ang) * spread;
        ctx.globalAlpha = 0.5 + fxHash(seed + s) * 0.28;
        ctx.fillStyle = s % 2 === 0 ? fxPrimaryColor : fxSecondaryColor;
        ctx.beginPath();
        ctx.arc(px, py, 2.9 * towerStyle.width, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (fxId === 'ion-scan') {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = fxPrimaryColor;
      ctx.lineWidth = 2.9 * towerStyle.width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      const sweepR = cs * (0.28 + (Math.sin(seed * 1.6) * 0.5 + 0.5) * 0.26);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = fxSecondaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, sweepR, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fxId === 'marker-burst') {
      const baseR = cs * 0.32 * towerStyle.spread;
      const spin = seed * 2;
      ctx.strokeStyle = fxPrimaryColor;
      ctx.globalAlpha = 0.68;
      ctx.lineWidth = 2.2 * towerStyle.width;
      for (let r = 0; r < 4; r += 1) {
        const ang = spin + r * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(
          target.x + Math.cos(ang) * baseR * 0.55,
          target.y + Math.sin(ang) * baseR * 0.55
        );
        ctx.lineTo(target.x + Math.cos(ang) * baseR, target.y + Math.sin(ang) * baseR);
        ctx.stroke();
      }
    } else if (fxId === 'data-stream') {
      const packets = projectileHasSprite ? 0 : fxBudget.dataStreamPackets;
      for (let p = 0; p < packets; p += 1) {
        const t = (phase * 0.9 + i * 0.17 + p * 0.27) % 1;
        const px = sx + dx * t;
        const py = sy + dy * t;
        ctx.globalAlpha = 0.5 + (1 - Math.abs(0.5 - t) * 1.8) * 0.28;
        ctx.fillStyle = fxPrimaryColor;
        ctx.fillRect(px - 2, py - 2, 5.4 * towerStyle.width, 4.1);
      }
    } else if (fxId === 'void-tendrils') {
      const tendrils = projectile?.towerType === 'ForLoop' ? 3 : 2;
      for (let t = 0; t < tendrils; t += 1) {
        ctx.strokeStyle = fxPrimaryColor;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.4 * towerStyle.width;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        const segments = 5;
        for (let s = 1; s <= segments; s += 1) {
          const q = s / segments;
          const jitter = (fxHash(seed + t * 1.1 + s * 0.7) - 0.5) * cs * towerStyle.jitter;
          const ox = -ny * jitter;
          const oy = nx * jitter;
          ctx.lineTo(sx + dx * q + ox, sy + dy * q + oy);
        }
        ctx.stroke();
      }
    }
  }

  for (const projectileId of renderer._attackFxEchoBuckets.keys()) {
    if (!activeProjectileIds.has(projectileId)) {
      renderer._attackFxEchoBuckets.delete(projectileId);
    }
  }

  // Keep memory bounded.
  if (renderer._attackFxEchoes.length > fxBudget.maxEchoes) {
    renderer._attackFxEchoes = renderer._attackFxEchoes.slice(-fxBudget.maxEchoes);
  }

  // Draw fading echoes after active frame effects.
  for (let i = 0; i < renderer._attackFxEchoes.length; i += 1) {
    const echo = renderer._attackFxEchoes[i];
    const life = (echo.expiresAt - now) / (echo.expiresAt - echo.createdAt);
    if (life <= 0) continue;

    const spread = echo.spread || 1;
    const width = echo.width || 1;
    const baseR = cs * 0.22 * spread;
    drawImpactGlow(
      ctx,
      echo.x,
      echo.y,
      baseR * 1.85,
      fxPrimaryColor,
      fxSecondaryColor,
      0.22 * life
    );

    if (echo.mode === 'pulse-rings' || echo.mode === 'ion-scan') {
      ctx.globalAlpha = 0.42 * life;
      ctx.strokeStyle = fxSecondaryColor;
      ctx.lineWidth = 1.6 * width;
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, baseR * (1.2 + (1 - life) * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    } else if (echo.mode === 'marker-burst') {
      ctx.globalAlpha = 0.35 * life;
      ctx.strokeStyle = fxPrimaryColor;
      ctx.lineWidth = 1.5 * width;
      for (let r = 0; r < 4; r += 1) {
        const ang = phase * 0.9 + r * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(echo.x + Math.cos(ang) * baseR * 0.55, echo.y + Math.sin(ang) * baseR * 0.55);
        ctx.lineTo(echo.x + Math.cos(ang) * baseR * 0.95, echo.y + Math.sin(ang) * baseR * 0.95);
        ctx.stroke();
      }
    } else if (echo.mode === 'ember-sparks' || echo.mode === 'data-stream') {
      ctx.globalAlpha = 0.4 * life;
      ctx.fillStyle = fxPrimaryColor;
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, 2.4 * width, 0, Math.PI * 2);
      ctx.fill();
    } else if (echo.mode === 'void-tendrils') {
      ctx.globalAlpha = 0.28 * life;
      ctx.strokeStyle = fxPrimaryColor;
      ctx.lineWidth = 1.3 * width;
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, baseR * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}
