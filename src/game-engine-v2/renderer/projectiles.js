import { drawCenteredSpriteIcon, getThemeSprite, normalizeThemeSpriteKey } from './themeSprites.js';

export function drawProjectiles(renderer, projectiles, enemies = []) {
  if (projectiles.length === 0) return;

  const reducedChromeLoad = projectiles.length > 4 || renderer.performanceTier !== 'normal';
  const heavyLoad = projectiles.length > 6 || renderer.performanceTier !== 'normal';

  renderer.ctx.save();
  renderer.ctx.globalCompositeOperation = heavyLoad ? 'source-over' : 'lighter';

  const enemyMap = new Map(enemies.map((e) => [e.id, e]));

  projectiles.forEach((projectile) => {
    const target = projectile.targetId ? enemyMap.get(projectile.targetId) : null;
    drawProjectile(renderer, projectile, { reducedChromeLoad, heavyLoad, target });
  });

  renderer.ctx.restore();
}

export function drawProjectile(renderer, projectile, options = {}) {
  const { reducedChromeLoad = false, heavyLoad = false, target = null } = options;
  const {
    x,
    y,
    color,
    towerType,
    startX,
    startY,
    targetX,
    targetY,
    progress,
    trail,
    curveDirection,
    curveSeed,
    effect,
    isSecondaryTarget,
  } = projectile;
  const baseSize = Math.max(6, renderer.cellSize * 0.16);
  const pulse = 1 + Math.sin(renderer.glowPhase + (progress || 0) * Math.PI * 2) * 0.12;
  const size =
    baseSize *
    (heavyLoad ? 0.85 : reducedChromeLoad ? 0.92 : 1) *
    pulse *
    (isSecondaryTarget ? 0.7 : 1);
  const _packProjColor = !isSecondaryTarget && renderer.settings?.towerPack?.projectileColor;
  const renderColor = isSecondaryTarget ? '#ffffff' : _packProjColor || color;

  const tx = target?.x ?? targetX;
  const ty = target?.y ?? targetY;
  const angle =
    tx != null && ty != null && startX != null && startY != null
      ? Math.atan2(ty - startY, tx - startX)
      : 0;

  const type = towerType || 'ForLoop';
  const isBallistic = type === 'BurstTurret' || type === 'BlastTurret';
  const projectileSpriteSrc = getThemeSprite(
    renderer.settings?.towerPack?.projectileSprites,
    normalizeThemeSpriteKey(type)
  );
  const useIconProjectile = Boolean(projectileSpriteSrc && type !== 'WhileLoop');
  const simplifyProjectileFx = reducedChromeLoad || isSecondaryTarget;

  const drawRetroProjectileBadge = () => {
    const badgeSize = Math.max(12, renderer.cellSize * (simplifyProjectileFx ? 0.26 : 0.31));

    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'source-over';

    const spriteDrawn = drawCenteredSpriteIcon(renderer, projectileSpriteSrc, x, y, badgeSize, {
      alpha: isSecondaryTarget ? 0.88 : 1,
    });

    renderer.ctx.restore();

    if (!spriteDrawn) {
      renderer.ctx.save();
      renderer.ctx.fillStyle = renderColor;
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, Math.max(6, badgeSize * 0.22), 0, Math.PI * 2);
      renderer.ctx.fill();
      renderer.ctx.restore();
    }
  };

  if (useIconProjectile) {
    drawRetroProjectileBadge();
    renderer.ctx.shadowBlur = 0;
    renderer.ctx.globalAlpha = 1;
    return;
  }

  // Optional trail (curved + fading)
  if (
    renderer.settings.projectileTrails &&
    !reducedChromeLoad &&
    type !== 'WhileLoop' &&
    !isBallistic
  ) {
    renderer.ctx.save();
    renderer.ctx.strokeStyle = renderColor;
    renderer.ctx.lineWidth = Math.max(1, size * 0.38);
    renderer.ctx.lineCap = 'round';
    if (isSecondaryTarget) {
      renderer.ctx.setLineDash([4, 4]);
    }

    let points = [];
    if (Array.isArray(trail) && trail.length > 1) {
      points = trail.slice();
    } else if (startX != null && startY != null && tx != null && ty != null) {
      const dx = tx - startX;
      const dy = ty - startY;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const baseCurve = Math.min(140, Math.max(28, distance * 0.35));
      const curveMagnitude = baseCurve * (curveDirection ?? 1) * (curveSeed ?? 1);
      const controlX = (startX + tx) / 2 + normalX * curveMagnitude;
      const controlY = (startY + ty) / 2 + normalY * curveMagnitude;

      const samples = heavyLoad ? 6 : reducedChromeLoad ? 7 : 10;
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const oneMinusT = 1 - t;
        const px = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * tx;
        const py = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * ty;
        points.push({ x: px, y: py });
      }
    }

    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const fade = i / points.length;
        const alpha = (heavyLoad ? 0.25 : 0.5) * fade;
        renderer.ctx.globalAlpha = isSecondaryTarget ? alpha * 0.7 : alpha;
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(points[i - 1].x, points[i - 1].y);
        renderer.ctx.lineTo(points[i].x, points[i].y);
        renderer.ctx.stroke();
      }
    } else {
      const trailLength = size * (heavyLoad ? 5 : 7);
      renderer.ctx.globalAlpha = heavyLoad ? 0.35 : 0.55;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - Math.cos(angle) * trailLength, y - Math.sin(angle) * trailLength);
      renderer.ctx.lineTo(x, y);
      renderer.ctx.stroke();
    }

    renderer.ctx.restore();
  }

  // Glow effect
  if (renderer.settings.glowEffects && !reducedChromeLoad && !isBallistic) {
    renderer.ctx.shadowColor = renderColor;
    renderer.ctx.shadowBlur = size * (heavyLoad ? 2.2 : reducedChromeLoad ? 2.7 : 3.4);
  }

  // Secondary target highlight (special shots)
  if (isSecondaryTarget && !reducedChromeLoad) {
    renderer.ctx.save();
    renderer.ctx.strokeStyle = type === 'ForLoop' ? '#00f5ff' : '#ffffff';
    renderer.ctx.lineWidth = Math.max(1, size * 0.22);
    renderer.ctx.setLineDash(type === 'ForLoop' ? [3, 2] : [2, 3]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 1.15, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Tower-specific projectile visuals
  if (isSecondaryTarget) {
    renderer.ctx.globalAlpha = 0.8;
  }
  if (!projectileSpriteSrc || type === 'WhileLoop') {
    switch (type) {
      case 'ForLoop':
        drawForLoopProjectile(renderer, x, y, size, renderColor);
        break;
      case 'WhileLoop':
        drawWhileLoopProjectile(renderer, startX, startY, tx, ty, size, renderColor);
        break;
      case 'IfCondition':
        drawIfConditionProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Variable':
        drawVariableProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Function':
        drawFunctionProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Array':
        drawArrayProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Object':
        drawObjectProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Return':
        drawReturnProjectile(renderer, x, y, size, renderColor, angle);
        break;
      case 'TryCatch':
        drawTryCatchProjectile(renderer, x, y, size, renderColor);
        break;
      case 'Switch':
        drawSwitchProjectile(renderer, x, y, size, renderColor, angle, progress);
        break;
      case 'BurstTurret':
        drawBulletProjectile(renderer, x, y, size, renderColor, angle, { tracer: true });
        break;
      case 'BlastTurret':
        drawBulletProjectile(renderer, x, y, size, renderColor, angle, {
          tracer: false,
          coreScale: 1.15,
        });
        break;
      default:
        drawDefaultProjectile(renderer, x, y, size, renderColor);
        break;
    }
  }

  if (projectileSpriteSrc) {
    drawRetroProjectileBadge();
  }

  // Per-tower signature animation overlay so each tower class reads differently in motion.
  if (!reducedChromeLoad) {
    drawTowerTypeProjectileSignature(renderer, type, x, y, size, renderColor, progress || 0);
    drawUpgradeProjectileOverlay(
      renderer,
      type,
      x,
      y,
      size,
      effect,
      progress || 0,
      isSecondaryTarget
    );
  }

  if (isSecondaryTarget) {
    renderer.ctx.globalAlpha = 1;
  }

  renderer.ctx.shadowBlur = 0;
}

function drawUpgradeProjectileOverlay(
  renderer,
  type,
  x,
  y,
  size,
  effect,
  progress,
  isSecondaryTarget = false
) {
  if (!effect) return;

  const phase = renderer.glowPhase + progress * Math.PI * 2;

  if (type === 'Return' && effect.hasExecute) {
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.6;
    renderer.ctx.strokeStyle = '#ffd166';
    renderer.ctx.lineWidth = Math.max(1, size * 0.14);
    renderer.ctx.setLineDash([size * 0.35, size * 0.2]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 1.35, phase, phase + Math.PI * 1.6);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  if (effect.hasAuraBoost) {
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.5;
    renderer.ctx.strokeStyle = '#c084fc';
    renderer.ctx.lineWidth = Math.max(1, size * 0.16);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, size * 1.1 + Math.sin(phase * 2.5) * size * 0.07, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  if (type === 'WhileLoop' && effect.hasBeamPierce) {
    if (isSecondaryTarget) {
      // Chain link node — glowing teal ring at the junction between beams
      renderer.ctx.save();
      renderer.ctx.globalAlpha = 0.7 + Math.sin(phase * 5) * 0.2;
      renderer.ctx.strokeStyle = '#00FFCC';
      renderer.ctx.lineWidth = Math.max(1.5, size * 0.18);
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.globalAlpha = 0.4;
      renderer.ctx.fillStyle = '#00FFCC';
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.28, 0, Math.PI * 2);
      renderer.ctx.fill();
      renderer.ctx.restore();
    } else {
      // Primary: bright teal leading diamond — the beam's cutting edge
      renderer.ctx.save();
      renderer.ctx.globalAlpha = 0.75 + Math.sin(phase * 4) * 0.15;
      renderer.ctx.strokeStyle = '#ffffff';
      renderer.ctx.fillStyle = '#00FFCC';
      renderer.ctx.lineWidth = Math.max(1, size * 0.1);
      const d = size * 0.55;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x, y - d);
      renderer.ctx.lineTo(x + d * 0.5, y);
      renderer.ctx.lineTo(x, y + d);
      renderer.ctx.lineTo(x - d * 0.5, y);
      renderer.ctx.closePath();
      renderer.ctx.fill();
      renderer.ctx.stroke();
      renderer.ctx.restore();
    }
  }

  if (type === 'WhileLoop' && effect.hasArcDischarge) {
    if (isSecondaryTarget) {
      // Chain arc node — brighter pulsing ring with an extra outer ring to show energy transfer
      renderer.ctx.save();
      const pulse2 = 0.65 + Math.sin(phase * 6) * 0.25;
      renderer.ctx.globalAlpha = pulse2;
      renderer.ctx.strokeStyle = '#00FFCC';
      renderer.ctx.lineWidth = Math.max(1.5, size * 0.17);
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.58, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.globalAlpha = pulse2 * 0.45;
      renderer.ctx.lineWidth = Math.max(1, size * 0.1);
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.globalAlpha = 0.35;
      renderer.ctx.fillStyle = '#00FFCC';
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.28, 0, Math.PI * 2);
      renderer.ctx.fill();
      renderer.ctx.restore();
    } else {
      // Primary: electric crackle sparks — the arc is charging
      renderer.ctx.save();
      const sparks = 4;
      for (let s = 0; s < sparks; s++) {
        const sparkAngle = phase * 5.5 + (s * Math.PI * 2) / sparks;
        const r0 = size * 0.7;
        const r1 = size * 1.5;
        const midAngle = sparkAngle + 0.3;
        renderer.ctx.globalAlpha = 0.65 - s * 0.1;
        renderer.ctx.strokeStyle = s % 2 === 0 ? '#00FFCC' : '#ffffff';
        renderer.ctx.lineWidth = Math.max(1, size * 0.09);
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(x + Math.cos(sparkAngle) * r0, y + Math.sin(sparkAngle) * r0);
        renderer.ctx.lineTo(
          x + Math.cos(midAngle) * ((r0 + r1) * 0.55),
          y + Math.sin(midAngle) * ((r0 + r1) * 0.55)
        );
        renderer.ctx.lineTo(
          x + Math.cos(sparkAngle + 0.06) * r1,
          y + Math.sin(sparkAngle + 0.06) * r1
        );
        renderer.ctx.stroke();
      }
      renderer.ctx.restore();
    }
  }
}

function drawTowerTypeProjectileSignature(renderer, type, x, y, size, color, progress) {
  const phase = renderer.glowPhase + progress * Math.PI * 2;

  if (type === 'Function') {
    // 3 orbiting sparks
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.45;
    renderer.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i += 1) {
      const ang = phase * 2.2 + i * ((Math.PI * 2) / 3);
      const r = size * 0.9;
      renderer.ctx.beginPath();
      renderer.ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, size * 0.16, 0, Math.PI * 2);
      renderer.ctx.fill();
    }
    renderer.ctx.restore();
    return;
  }

  if (type === 'ForLoop') {
    // Rotating loop ring
    renderer.ctx.save();
    renderer.ctx.translate(x, y);
    renderer.ctx.rotate(phase * 1.8);
    renderer.ctx.globalAlpha = 0.3;
    renderer.ctx.strokeStyle = color;
    renderer.ctx.lineWidth = Math.max(1, size * 0.16);
    renderer.ctx.setLineDash([size * 0.4, size * 0.25]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(0, 0, size * 1.1, 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.restore();
    return;
  }

  if (type === 'Variable') {
    // Bracket-like packet frame
    renderer.ctx.save();
    renderer.ctx.globalAlpha = 0.35;
    renderer.ctx.strokeStyle = color;
    renderer.ctx.lineWidth = Math.max(1, size * 0.14);
    const w = size * 1.3;
    const h = size * 0.9;

    renderer.ctx.beginPath();
    renderer.ctx.moveTo(x - w, y - h);
    renderer.ctx.lineTo(x - w * 0.7, y - h);
    renderer.ctx.moveTo(x - w, y - h);
    renderer.ctx.lineTo(x - w, y + h);
    renderer.ctx.moveTo(x - w, y + h);
    renderer.ctx.lineTo(x - w * 0.7, y + h);

    renderer.ctx.moveTo(x + w, y - h);
    renderer.ctx.lineTo(x + w * 0.7, y - h);
    renderer.ctx.moveTo(x + w, y - h);
    renderer.ctx.lineTo(x + w, y + h);
    renderer.ctx.moveTo(x + w, y + h);
    renderer.ctx.lineTo(x + w * 0.7, y + h);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }
}

export function drawBulletProjectile(renderer, x, y, size, color, angle = 0, options = {}) {
  const { tracer = true, coreScale = 1 } = options;
  const length = size * 1.4 * coreScale;
  const width = Math.max(1.5, size * 0.35 * coreScale);

  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.rotate(angle);

  if (tracer) {
    renderer.ctx.globalAlpha = 0.55;
    renderer.ctx.strokeStyle = color;
    renderer.ctx.lineWidth = Math.max(1, width * 0.9);
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(-length * 1.1, 0);
    renderer.ctx.lineTo(-length * 0.15, 0);
    renderer.ctx.stroke();
  }

  renderer.ctx.globalAlpha = 1;
  drawRoundedRect(renderer, -length * 0.4, -width * 0.5, length, width, width * 0.5, color);
  drawRoundedRect(
    renderer,
    -length * 0.1,
    -width * 0.35,
    length * 0.35,
    width * 0.7,
    width * 0.35,
    '#ffffff'
  );

  renderer.ctx.restore();
}

export function drawDefaultProjectile(renderer, x, y, size, color) {
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, size, 0, Math.PI * 2);
  renderer.ctx.fillStyle = color;
  renderer.ctx.fill();

  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  renderer.ctx.fillStyle = '#FFFFFF';
  renderer.ctx.fill();
}

export function drawForLoopProjectile(renderer, x, y, size, color) {
  // Helix arcs
  const r = size * 0.9;
  renderer.ctx.strokeStyle = color;
  renderer.ctx.lineWidth = Math.max(1, size * 0.18);
  renderer.ctx.beginPath();
  renderer.ctx.arc(x - r * 0.4, y, r, -Math.PI / 2, Math.PI / 2);
  renderer.ctx.arc(x + r * 0.4, y, r, Math.PI / 2, -Math.PI / 2);
  renderer.ctx.stroke();

  // Orbit dots
  renderer.ctx.fillStyle = 'rgba(255,255,255,0.9)';
  renderer.ctx.beginPath();
  renderer.ctx.arc(x - r * 0.4, y - r * 0.35, size * 0.18, 0, Math.PI * 2);
  renderer.ctx.arc(x + r * 0.4, y + r * 0.35, size * 0.18, 0, Math.PI * 2);
  renderer.ctx.fill();
}

export function drawWhileLoopProjectile(renderer, startX, startY, endX, endY, size, color) {
  if (startX == null || startY == null || endX == null || endY == null) return;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const coreWidth = Math.max(2, size * 0.35);
  const glowWidth = coreWidth * 2.8;

  renderer.ctx.save();
  renderer.ctx.translate(startX, startY);
  renderer.ctx.rotate(angle);

  const gradient = renderer.ctx.createLinearGradient(0, 0, length, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0.25)');
  gradient.addColorStop(0.15, color);
  gradient.addColorStop(0.85, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0.2)');

  // Outer glow
  renderer.ctx.globalAlpha = 0.35;
  renderer.ctx.strokeStyle = color;
  renderer.ctx.lineWidth = glowWidth;
  renderer.ctx.lineCap = 'round';
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, 0);
  renderer.ctx.lineTo(length, 0);
  renderer.ctx.stroke();

  // Core beam
  renderer.ctx.globalAlpha = 0.9;
  renderer.ctx.strokeStyle = gradient;
  renderer.ctx.lineWidth = coreWidth;
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, 0);
  renderer.ctx.lineTo(length, 0);
  renderer.ctx.stroke();

  // Bright center pulse
  const pulse = 0.7 + Math.sin(renderer.glowPhase * 4) * 0.2;
  renderer.ctx.globalAlpha = pulse;
  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  renderer.ctx.lineWidth = coreWidth * 0.45;
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, 0);
  renderer.ctx.lineTo(length, 0);
  renderer.ctx.stroke();

  renderer.ctx.restore();
}

export function drawIfConditionProjectile(renderer, x, y, size, color) {
  const s = size * 2.4;
  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.rotate(Math.PI / 4);
  renderer.ctx.fillStyle = color;
  renderer.ctx.fillRect(-s / 2, -s / 2, s, s);
  renderer.ctx.restore();

  // Split decision glyph
  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  renderer.ctx.lineWidth = Math.max(1, size * 0.12);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(x, y - s * 0.3);
  renderer.ctx.lineTo(x, y + s * 0.3);
  renderer.ctx.moveTo(x, y + s * 0.05);
  renderer.ctx.lineTo(x - s * 0.25, y + s * 0.25);
  renderer.ctx.moveTo(x, y + s * 0.05);
  renderer.ctx.lineTo(x + s * 0.25, y + s * 0.25);
  renderer.ctx.stroke();
}

export function drawVariableProjectile(renderer, x, y, size, color) {
  const w = size * 2.4;
  const h = size * 1.2;
  drawRoundedRect(renderer, x - w / 2, y - h / 2, w, h, h / 2, color);

  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  renderer.ctx.lineWidth = Math.max(1, size * 0.12);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(x - w * 0.25, y);
  renderer.ctx.lineTo(x + w * 0.25, y);
  renderer.ctx.stroke();
}

export function drawFunctionProjectile(renderer, x, y, size, color) {
  const r = size * 1.1;
  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = ((Math.PI * 2) / 6) * i + Math.PI / 6;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) renderer.ctx.moveTo(px, py);
    else renderer.ctx.lineTo(px, py);
  }
  renderer.ctx.closePath();
  renderer.ctx.fillStyle = color;
  renderer.ctx.fill();
  renderer.ctx.restore();

  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  renderer.ctx.lineWidth = Math.max(1, size * 0.12);
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  renderer.ctx.stroke();
}

export function drawArrayProjectile(renderer, x, y, size, color) {
  const r = size * 0.9;
  renderer.ctx.fillStyle = color;
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  renderer.ctx.fill();

  renderer.ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 3; i++) {
    const a = renderer.glowPhase + ((Math.PI * 2) / 3) * i;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.22, 0, Math.PI * 2);
    renderer.ctx.fill();
  }
}

export function drawObjectProjectile(renderer, x, y, size, color) {
  const s = size * 1.4;
  renderer.ctx.strokeStyle = color;
  renderer.ctx.lineWidth = Math.max(1, size * 0.15);
  renderer.ctx.strokeRect(x - s / 2, y - s / 2, s, s);
  renderer.ctx.strokeRect(x - (s * 0.7) / 2, y - (s * 0.7) / 2, s * 0.7, s * 0.7);

  renderer.ctx.fillStyle = 'rgba(255,255,255,0.85)';
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
  renderer.ctx.fill();
}

export function drawReturnProjectile(renderer, x, y, size, color, angle) {
  const length = size * 3.2;
  const head = size * 1.1;
  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.rotate(angle);
  renderer.ctx.strokeStyle = color;
  renderer.ctx.lineWidth = Math.max(2, size * 0.3);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(-length / 2, 0);
  renderer.ctx.lineTo(length / 2, 0);
  renderer.ctx.stroke();

  renderer.ctx.fillStyle = color;
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(length / 2, 0);
  renderer.ctx.lineTo(length / 2 - head, -head * 0.6);
  renderer.ctx.lineTo(length / 2 - head, head * 0.6);
  renderer.ctx.closePath();
  renderer.ctx.fill();
  renderer.ctx.restore();
}

export function drawTryCatchProjectile(renderer, x, y, size, color) {
  const r = size * 1.4;
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, r, 0, Math.PI * 2);
  renderer.ctx.fillStyle = color;
  renderer.ctx.fill();

  // Inner ring
  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  renderer.ctx.lineWidth = Math.max(1, size * 0.12);
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  renderer.ctx.stroke();

  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, r * 0.85, -Math.PI / 3, Math.PI / 3);
  renderer.ctx.stroke();
}

export function drawSwitchProjectile(renderer, x, y, size, color, angle, _progress = 0) {
  const w = size * 2.8;
  const h = size * 1.7;
  drawRoundedRect(renderer, x - w / 2, y - h / 2, w, h, size * 0.25, color);

  // Multi-branch chevrons
  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.rotate(angle);
  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  renderer.ctx.lineWidth = Math.max(1, size * 0.15);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(-size * 0.6, 0);
  renderer.ctx.lineTo(size * 0.6, -size * 0.4);
  renderer.ctx.moveTo(-size * 0.2, 0);
  renderer.ctx.lineTo(size * 0.6, size * 0.4);
  renderer.ctx.stroke();
  renderer.ctx.restore();

  renderer.ctx.save();
  renderer.ctx.translate(x, y);
  renderer.ctx.rotate(angle);
  renderer.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  renderer.ctx.lineWidth = Math.max(2, size * 0.25);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, 0);
  renderer.ctx.lineTo(size * 1.2, -size * 0.6);
  renderer.ctx.moveTo(0, 0);
  renderer.ctx.lineTo(size * 1.2, size * 0.6);
  renderer.ctx.stroke();
  renderer.ctx.restore();
}

export function drawRoundedRect(renderer, x, y, w, h, r, fillColor) {
  const radius = Math.min(r, w / 2, h / 2);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(x + radius, y);
  renderer.ctx.lineTo(x + w - radius, y);
  renderer.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  renderer.ctx.lineTo(x + w, y + h - radius);
  renderer.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  renderer.ctx.lineTo(x + radius, y + h);
  renderer.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  renderer.ctx.lineTo(x, y + radius);
  renderer.ctx.quadraticCurveTo(x, y, x + radius, y);
  renderer.ctx.closePath();
  renderer.ctx.fillStyle = fillColor;
  renderer.ctx.fill();
}
