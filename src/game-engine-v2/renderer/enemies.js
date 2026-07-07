import { drawCenteredSpriteIcon, getThemeSprite } from './themeSprites.js';

export function drawEnemies(renderer, enemies) {
  enemies.forEach((enemy) => drawEnemy(renderer, enemy, renderer.performanceTier));
}

function drawRetroEnemyBadge(renderer, size, accentColor) {
  const halfSize = size * 0.48;
  const { ctx } = renderer;

  ctx.fillStyle = '#d4d0c8';
  ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);

  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(-halfSize + 2, -halfSize + 2, halfSize * 2 - 4, 2);
  ctx.fillRect(-halfSize + 2, -halfSize + 2, 2, halfSize * 2 - 4);

  ctx.fillStyle = 'rgba(66, 72, 82, 0.34)';
  ctx.fillRect(halfSize - 4, -halfSize + 2, 2, halfSize * 2 - 4);
  ctx.fillRect(-halfSize + 2, halfSize - 4, halfSize * 2 - 4, 2);

  ctx.globalAlpha = 0.26;
  ctx.fillStyle = accentColor || '#8a6f4f';
  ctx.fillRect(-halfSize + 3, halfSize - 8, halfSize * 2 - 6, 4);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#5d636e';
  ctx.lineWidth = 2;
  ctx.strokeRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
}

function drawRetroEnemySpriteBody(renderer, enemy, size, colors) {
  const spriteSrc = getThemeSprite(renderer.settings?.enemyPack?.enemySprites, enemy.type);
  if (!spriteSrc) return false;

  drawRetroEnemyBadge(renderer, size, colors.highlight);

  const spriteDrawn = drawCenteredSpriteIcon(renderer, spriteSrc, 0, 0, size * 0.72, {
    shadowColor: colors.highlight,
    shadowBlur: 3,
  });

  if (!spriteDrawn) {
    renderer.ctx.fillStyle = '#1f2430';
    renderer.ctx.fillRect(-size * 0.14, -size * 0.14, size * 0.28, size * 0.28);
  }

  return true;
}

function getEnemyMotionState(renderer, enemy, performanceTier) {
  const hpRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;
  const pulseBase = 1 + Math.sin(renderer.glowPhase * 2 + (enemy.spawnTime || 0) * 0.001) * 0.04;
  const hitScale = enemy.isHit ? 1.16 : 1;
  const hijackScale = enemy.hijackedTowerId ? 1 + Math.sin(renderer.glowPhase * 3) * 0.08 : 1;
  const scale = pulseBase * hitScale * hijackScale;

  const lowHealth = hpRatio <= 0.25;
  const jitterMagnitude = lowHealth && performanceTier === 'normal' ? enemy.size * 0.04 : 0;
  const jitterX = jitterMagnitude
    ? Math.sin(renderer.glowPhase * 28 + enemy.id.length * 0.9) * jitterMagnitude
    : 0;
  const jitterY = jitterMagnitude
    ? Math.cos(renderer.glowPhase * 23 + enemy.id.length * 0.7) * jitterMagnitude
    : 0;

  return {
    scale,
    hpRatio,
    heading: Number.isFinite(enemy.headingAngle) ? enemy.headingAngle : 0,
    jitterX,
    jitterY,
    lowHealth,
  };
}

function drawBaseShapeAtOrigin(renderer, type, size) {
  switch (getEnemyShape(type)) {
    case 'square':
      renderer.ctx.rect(-size / 2, -size / 2, size, size);
      break;
    case 'rectangle':
      renderer.ctx.rect(-size / 2, -size / 3, size, size * 0.66);
      break;
    case 'blob':
      drawBlob(renderer, 0, 0, size);
      break;
    case 'circle':
    default:
      renderer.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      break;
  }
}

function drawBasicEnemyBody(renderer, size, colors, useHeavyEffects) {
  const coreRadius = size * 0.28;

  // Core
  renderer.ctx.beginPath();
  renderer.ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
  if (useHeavyEffects) {
    const coreGradient = renderer.ctx.createRadialGradient(
      0,
      0,
      coreRadius * 0.1,
      0,
      0,
      coreRadius
    );
    coreGradient.addColorStop(0, '#a8f4ff');
    coreGradient.addColorStop(1, colors.highlight);
    renderer.ctx.fillStyle = coreGradient;
  } else {
    renderer.ctx.fillStyle = colors.highlight;
  }
  renderer.ctx.fill();

  // Outer shell
  renderer.ctx.beginPath();
  renderer.ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
  if (useHeavyEffects) {
    const shellGradient = renderer.ctx.createRadialGradient(0, 0, coreRadius, 0, 0, size * 0.45);
    shellGradient.addColorStop(0, colors.highlight);
    shellGradient.addColorStop(1, colors.body);
    renderer.ctx.fillStyle = shellGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.globalAlpha = 0.9;
  renderer.ctx.fill();
  renderer.ctx.globalAlpha = 1;

  // Firewall ring segments
  const segments = 9;
  const ringRadius = size * 0.62;
  for (let i = 0; i < segments; i++) {
    const segmentPhase = renderer.glowPhase * 0.9 + i * 0.72;
    const start = segmentPhase;
    const end = start + 0.34;
    renderer.ctx.beginPath();
    renderer.ctx.strokeStyle = i % 2 === 0 ? '#40d9ff' : colors.highlight;
    renderer.ctx.lineWidth = Math.max(1, size * 0.08);
    renderer.ctx.arc(0, 0, ringRadius, start, end);
    renderer.ctx.stroke();
  }
}

function drawEdgeEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  const trailLength = size * 1.15;

  // Glitch afterimage streaks
  if (performanceTier !== 'low') {
    const streakCount = performanceTier === 'ultra' ? 5 : 3;
    for (let i = 0; i < streakCount; i++) {
      const offset = (i + 1) * size * 0.16;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(-size * 0.18 - offset, -size * 0.18 + i * 2);
      renderer.ctx.lineTo(-trailLength - offset, -size * 0.28 + i * 3);
      renderer.ctx.lineTo(-trailLength + size * 0.2 - offset, -size * 0.06 + i * 3);
      renderer.ctx.closePath();
      renderer.ctx.globalAlpha = performanceTier === 'ultra' ? 0.28 - i * 0.04 : 0.22 - i * 0.05;
      renderer.ctx.fillStyle = i % 2 === 0 ? '#ff2ad6' : '#ff6a8a';
      renderer.ctx.fill();
    }
    renderer.ctx.globalAlpha = 1;
  }

  // Razor packet body (diamond)
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(size * 0.55, 0);
  renderer.ctx.lineTo(0, size * 0.25);
  renderer.ctx.lineTo(-size * 0.45, 0);
  renderer.ctx.lineTo(0, -size * 0.25);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const packetGradient = renderer.ctx.createLinearGradient(-size * 0.5, 0, size * 0.6, 0);
    packetGradient.addColorStop(0, '#8d114f');
    packetGradient.addColorStop(0.52, colors.body);
    packetGradient.addColorStop(1, '#ff95b7');
    renderer.ctx.fillStyle = packetGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.fill();

  renderer.ctx.beginPath();
  renderer.ctx.moveTo(size * 0.28, 0);
  renderer.ctx.lineTo(-size * 0.08, size * 0.1);
  renderer.ctx.lineTo(-size * 0.22, 0);
  renderer.ctx.lineTo(-size * 0.08, -size * 0.1);
  renderer.ctx.closePath();
  renderer.ctx.fillStyle = '#ffd4f2';
  renderer.ctx.globalAlpha = 0.85;
  renderer.ctx.fill();
  renderer.ctx.globalAlpha = 1;
}

function drawHijackerEnemyBody(renderer, size, colors, useHeavyEffects, hijackedTowerId) {
  // Injector head
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(size * 0.5, 0);
  renderer.ctx.lineTo(-size * 0.15, size * 0.2);
  renderer.ctx.lineTo(-size * 0.2, 0);
  renderer.ctx.lineTo(-size * 0.15, -size * 0.2);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const headGradient = renderer.ctx.createLinearGradient(-size * 0.3, 0, size * 0.5, 0);
    headGradient.addColorStop(0, '#60103d');
    headGradient.addColorStop(0.65, colors.body);
    headGradient.addColorStop(1, '#ffbfd0');
    renderer.ctx.fillStyle = headGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.fill();

  // Malware tail (animated data tether look)
  renderer.ctx.strokeStyle = hijackedTowerId ? '#cc5dff' : '#7c4dff';
  renderer.ctx.lineWidth = Math.max(1, size * 0.1);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(-size * 0.15, 0);
  renderer.ctx.quadraticCurveTo(-size * 0.46, -size * 0.25, -size * 0.72, 0);
  renderer.ctx.quadraticCurveTo(-size * 0.96, size * 0.25, -size * 1.2, 0);
  renderer.ctx.stroke();

  if (hijackedTowerId) {
    renderer.ctx.beginPath();
    renderer.ctx.strokeStyle = '#f4b9ff';
    renderer.ctx.lineWidth = Math.max(1, size * 0.06);
    renderer.ctx.moveTo(-size * 0.18, -size * 0.06);
    renderer.ctx.lineTo(-size * 1.15, -size * 0.06);
    renderer.ctx.stroke();
  }

  // Core eye
  renderer.ctx.beginPath();
  renderer.ctx.arc(size * 0.04, 0, size * 0.12, 0, Math.PI * 2);
  renderer.ctx.fillStyle = '#ffe5f2';
  renderer.ctx.fill();
}

function drawComplexEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  const plateCount = performanceTier === 'low' ? 4 : performanceTier === 'ultra' ? 8 : 6;
  const ringRadius = size * 0.44;

  // Armored plate ring that subtly shifts over time.
  for (let i = 0; i < plateCount; i++) {
    const angle = renderer.glowPhase * 0.35 + (Math.PI * 2 * i) / plateCount;
    const wobble = Math.sin(renderer.glowPhase * 2 + i * 1.7) * size * 0.03;
    const px = Math.cos(angle) * (ringRadius + wobble);
    const py = Math.sin(angle) * (ringRadius + wobble);

    renderer.ctx.save();
    renderer.ctx.translate(px, py);
    renderer.ctx.rotate(angle + Math.PI / 4);
    renderer.ctx.beginPath();
    renderer.ctx.rect(-size * 0.14, -size * 0.12, size * 0.28, size * 0.24);
    if (useHeavyEffects) {
      const plateGradient = renderer.ctx.createLinearGradient(-size * 0.14, 0, size * 0.14, 0);
      plateGradient.addColorStop(0, '#213c65');
      plateGradient.addColorStop(1, colors.highlight);
      renderer.ctx.fillStyle = plateGradient;
    } else {
      renderer.ctx.fillStyle = '#4f75a8';
    }
    renderer.ctx.fill();
    renderer.ctx.restore();
  }

  // Compiler core node.
  renderer.ctx.save();
  renderer.ctx.rotate(-renderer.glowPhase * 0.5);
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, -size * 0.26);
  renderer.ctx.lineTo(size * 0.22, -size * 0.06);
  renderer.ctx.lineTo(size * 0.12, size * 0.24);
  renderer.ctx.lineTo(-size * 0.14, size * 0.2);
  renderer.ctx.lineTo(-size * 0.24, -size * 0.04);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const coreGradient = renderer.ctx.createLinearGradient(-size * 0.2, 0, size * 0.22, 0);
    coreGradient.addColorStop(0, '#264a7a');
    coreGradient.addColorStop(1, '#9ec5ff');
    renderer.ctx.fillStyle = coreGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.fill();
  renderer.ctx.restore();
}

function drawTimeLimitEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  // Deadline scanline trail.
  if (performanceTier !== 'low') {
    const lines = performanceTier === 'ultra' ? 6 : performanceTier === 'normal' ? 4 : 3;
    for (let i = 0; i < lines; i++) {
      const y = (-lines / 2 + i) * size * 0.12;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(-size * 1.1, y);
      renderer.ctx.lineTo(-size * 0.18, y);
      renderer.ctx.strokeStyle = i % 2 === 0 ? '#63d8ff' : '#7fdcff';
      renderer.ctx.globalAlpha = 0.28 - i * 0.04;
      renderer.ctx.lineWidth = Math.max(1, size * 0.06);
      renderer.ctx.stroke();
    }
    renderer.ctx.globalAlpha = 1;
  }

  // Interceptor spear body.
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(size * 0.56, 0);
  renderer.ctx.lineTo(-size * 0.2, size * 0.16);
  renderer.ctx.lineTo(-size * 0.46, 0);
  renderer.ctx.lineTo(-size * 0.2, -size * 0.16);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const spearGradient = renderer.ctx.createLinearGradient(-size * 0.46, 0, size * 0.56, 0);
    spearGradient.addColorStop(0, '#1c3f54');
    spearGradient.addColorStop(0.5, '#6de9ff');
    spearGradient.addColorStop(1, '#d8f7ff');
    renderer.ctx.fillStyle = spearGradient;
  } else {
    renderer.ctx.fillStyle = colors.highlight;
  }
  renderer.ctx.fill();

  // Dual thrusters.
  const thrusterPulse = 0.82 + Math.sin(renderer.glowPhase * 7) * 0.18;
  renderer.ctx.beginPath();
  renderer.ctx.arc(-size * 0.05, -size * 0.09, size * 0.08 * thrusterPulse, 0, Math.PI * 2);
  renderer.ctx.arc(-size * 0.05, size * 0.09, size * 0.08 * thrusterPulse, 0, Math.PI * 2);
  renderer.ctx.fillStyle = '#ff9b38';
  renderer.ctx.fill();
}

function drawBufferEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  const pulse = 1 + Math.sin(renderer.glowPhase * 2.4) * 0.08;

  // Core broker orb.
  renderer.ctx.beginPath();
  renderer.ctx.arc(0, 0, size * 0.24 * pulse, 0, Math.PI * 2);
  if (useHeavyEffects) {
    const coreGradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.28);
    coreGradient.addColorStop(0, '#d8fff0');
    coreGradient.addColorStop(1, '#67d9a3');
    renderer.ctx.fillStyle = coreGradient;
  } else {
    renderer.ctx.fillStyle = colors.highlight;
  }
  renderer.ctx.fill();

  // Rotating buff glyph ring.
  const glyphCount = performanceTier === 'low' ? 6 : performanceTier === 'ultra' ? 14 : 10;
  const ringRadius = size * 0.58;
  renderer.ctx.save();
  renderer.ctx.rotate(renderer.glowPhase * 0.9);
  for (let i = 0; i < glyphCount; i++) {
    const angle = (Math.PI * 2 * i) / glyphCount;
    const x = Math.cos(angle) * ringRadius;
    const y = Math.sin(angle) * ringRadius;

    renderer.ctx.save();
    renderer.ctx.translate(x, y);
    renderer.ctx.rotate(angle);
    renderer.ctx.beginPath();
    renderer.ctx.rect(-size * 0.06, -size * 0.03, size * 0.12, size * 0.06);
    renderer.ctx.fillStyle = i % 2 === 0 ? '#8bffd1' : '#5de8b3';
    renderer.ctx.globalAlpha = 0.8;
    renderer.ctx.fill();
    renderer.ctx.restore();
  }
  renderer.ctx.globalAlpha = 1;
  renderer.ctx.restore();
}

function drawPathShaperEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  const pulse = 1 + Math.sin(renderer.glowPhase * 3.1) * 0.07;

  // Route rewriter wedge body.
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(size * 0.56, 0);
  renderer.ctx.lineTo(-size * 0.05, size * 0.24);
  renderer.ctx.lineTo(-size * 0.42, size * 0.15);
  renderer.ctx.lineTo(-size * 0.42, -size * 0.15);
  renderer.ctx.lineTo(-size * 0.05, -size * 0.24);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const wedgeGradient = renderer.ctx.createLinearGradient(-size * 0.42, 0, size * 0.56, 0);
    wedgeGradient.addColorStop(0, '#2b4a61');
    wedgeGradient.addColorStop(0.5, colors.body);
    wedgeGradient.addColorStop(1, '#d5f1ff');
    renderer.ctx.fillStyle = wedgeGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.fill();

  // Forward fracture pulse arcs.
  if (performanceTier !== 'low') {
    renderer.ctx.beginPath();
    renderer.ctx.arc(size * 0.2, 0, size * 0.34 * pulse, -0.6, 0.6);
    renderer.ctx.strokeStyle = '#9ee6ff';
    renderer.ctx.globalAlpha = 0.7;
    renderer.ctx.lineWidth = Math.max(1, size * 0.08);
    renderer.ctx.stroke();

    renderer.ctx.beginPath();
    renderer.ctx.arc(size * 0.24, 0, size * 0.47 * pulse, -0.5, 0.5);
    renderer.ctx.globalAlpha = 0.45;
    renderer.ctx.lineWidth = Math.max(1, size * 0.06);
    renderer.ctx.stroke();

    if (performanceTier === 'ultra') {
      renderer.ctx.beginPath();
      renderer.ctx.arc(size * 0.28, 0, size * 0.6 * pulse, -0.45, 0.45);
      renderer.ctx.globalAlpha = 0.32;
      renderer.ctx.lineWidth = Math.max(1, size * 0.05);
      renderer.ctx.stroke();
    }

    renderer.ctx.globalAlpha = 1;
  }
}

function drawSpaceComplexEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier) {
  // Heavy ICE fortress crystal core.
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(0, -size * 0.48);
  renderer.ctx.lineTo(size * 0.24, -size * 0.18);
  renderer.ctx.lineTo(size * 0.21, size * 0.35);
  renderer.ctx.lineTo(0, size * 0.5);
  renderer.ctx.lineTo(-size * 0.21, size * 0.35);
  renderer.ctx.lineTo(-size * 0.24, -size * 0.18);
  renderer.ctx.closePath();
  if (useHeavyEffects) {
    const coreGradient = renderer.ctx.createLinearGradient(-size * 0.24, 0, size * 0.24, 0);
    coreGradient.addColorStop(0, '#1f2b5d');
    coreGradient.addColorStop(0.5, '#416ee0');
    coreGradient.addColorStop(1, '#b8d4ff');
    renderer.ctx.fillStyle = coreGradient;
  } else {
    renderer.ctx.fillStyle = colors.body;
  }
  renderer.ctx.fill();

  // Orbiting shard satellites.
  const shardCount = performanceTier === 'low' ? 3 : performanceTier === 'ultra' ? 7 : 5;
  const orbitRadius = size * 0.76;
  for (let i = 0; i < shardCount; i++) {
    const angle = renderer.glowPhase * 0.55 + (Math.PI * 2 * i) / shardCount;
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;

    renderer.ctx.save();
    renderer.ctx.translate(x, y);
    renderer.ctx.rotate(angle + renderer.glowPhase);
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(0, -size * 0.12);
    renderer.ctx.lineTo(size * 0.08, 0);
    renderer.ctx.lineTo(0, size * 0.12);
    renderer.ctx.lineTo(-size * 0.08, 0);
    renderer.ctx.closePath();
    renderer.ctx.fillStyle = '#a7beff';
    renderer.ctx.globalAlpha = 0.78;
    renderer.ctx.fill();
    renderer.ctx.restore();
  }
  renderer.ctx.globalAlpha = 1;
}

function drawThemedEnemyBody(renderer, enemy, size, colors, useHeavyEffects, performanceTier) {
  if (enemy.type === 'basic') {
    drawBasicEnemyBody(renderer, size, colors, useHeavyEffects);
    return true;
  }

  if (enemy.type === 'edge') {
    drawEdgeEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  if (enemy.type === 'hijacker') {
    drawHijackerEnemyBody(renderer, size, colors, useHeavyEffects, enemy.hijackedTowerId);
    return true;
  }

  if (enemy.type === 'complex') {
    drawComplexEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  if (enemy.type === 'timeLimit') {
    drawTimeLimitEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  if (enemy.type === 'buffer') {
    drawBufferEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  if (enemy.type === 'pathShaper') {
    drawPathShaperEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  if (enemy.type === 'spaceComplex') {
    drawSpaceComplexEnemyBody(renderer, size, colors, useHeavyEffects, performanceTier);
    return true;
  }

  return false;
}

export function drawEnemy(renderer, enemy, performanceTier = 'normal') {
  const {
    x,
    y,
    type,
    health,
    maxHealth,
    size,
    color,
    isSlowed,
    isFrozen,
    isBoss,
    defeatTime,
    hijackedTowerId,
  } = enemy;

  // Get color scheme — allow enemy pack to override colors (separate from tower pack)
  const _defaultColors = getEnemyColors(type);
  const _ePack = renderer.settings?.enemyPack;
  const colors = _ePack?.enemyBodyColor
    ? {
        ..._defaultColors,
        body: _ePack.enemyBodyColor,
        highlight: _ePack.enemyHighlightColor || _ePack.enemyBodyColor,
      }
    : _defaultColors;

  const useHeavyEffects = performanceTier !== 'low';
  const isUltra = performanceTier === 'ultra';
  const motion = getEnemyMotionState(renderer, enemy, performanceTier);

  // If defeated, only render the death effect (no frozen body)
  if (!enemy.isActive && defeatTime) {
    const deathElapsed = Date.now() - defeatTime;
    const t = Math.min(1, deathElapsed / 400);
    const alpha = 1 - t;

    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = alpha;

    // Shock ring
    const ringSize = size * (1 + t * 1.8);
    renderer.ctx.strokeStyle = color + 'CC';
    renderer.ctx.lineWidth = Math.max(1, size * 0.12);
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, ringSize, 0, Math.PI * 2);
    renderer.ctx.stroke();

    // Glitch shards
    const shards = performanceTier === 'ultra' ? 4 : 8;
    for (let i = 0; i < shards; i++) {
      const angle = ((Math.PI * 2) / shards) * i + renderer.glowPhase;
      const len = size * (0.6 + t * 1.3);
      renderer.ctx.strokeStyle = i % 2 === 0 ? '#00ccff' : '#ff00de';
      renderer.ctx.lineWidth = Math.max(1, size * 0.1);
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x + Math.cos(angle) * size * 0.3, y + Math.sin(angle) * size * 0.3);
      renderer.ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      renderer.ctx.stroke();
    }

    renderer.ctx.restore();
    return;
  }

  // Draw glow
  if (renderer.settings.glowEffects) {
    renderer.ctx.shadowColor = colors.glow;
    renderer.ctx.shadowBlur = isUltra
      ? size * 0.9
      : performanceTier === 'normal'
        ? size / 2
        : size / 3;
  }

  // Aura pulse for buffer enemies
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

  // Draw enemy body in local space so we can rotate by heading and add jitter.
  const scaledSize = size * motion.scale;

  // Ultra-tier wake trail to clearly differentiate from normal.
  if (isUltra && type !== 'buffer') {
    const dirX = Math.cos(motion.heading || 0);
    const dirY = Math.sin(motion.heading || 0);
    for (let i = 1; i <= 3; i++) {
      const trailOffset = scaledSize * 0.35 * i;
      renderer.ctx.beginPath();
      renderer.ctx.arc(
        x - dirX * trailOffset,
        y - dirY * trailOffset,
        Math.max(1, scaledSize * (0.34 - i * 0.07)),
        0,
        Math.PI * 2
      );
      renderer.ctx.fillStyle = i % 2 === 0 ? `${colors.highlight}40` : `${colors.body}33`;
      renderer.ctx.fill();
    }
  }

  renderer.ctx.save();
  renderer.ctx.translate(x + motion.jitterX, y + motion.jitterY);
  if (type === 'basic' || type === 'edge' || type === 'hijacker' || type === 'timeLimit') {
    renderer.ctx.rotate(motion.heading);
  }

  const usedRetroSpriteBody = drawRetroEnemySpriteBody(renderer, enemy, scaledSize, colors);

  const usedThemedBody =
    usedRetroSpriteBody ||
    drawThemedEnemyBody(renderer, enemy, scaledSize, colors, useHeavyEffects, performanceTier);

  if (!usedThemedBody) {
    renderer.ctx.beginPath();
    drawBaseShapeAtOrigin(renderer, type, scaledSize);

    // Fill with gradient (skip under heavy load)
    if (useHeavyEffects) {
      const gradient = renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, scaledSize / 2);
      gradient.addColorStop(0, colors.highlight);
      gradient.addColorStop(1, colors.body);
      renderer.ctx.fillStyle = gradient;
    } else {
      renderer.ctx.fillStyle = colors.body;
    }
    renderer.ctx.fill();
  }

  // Outline
  if (!usedRetroSpriteBody) {
    renderer.ctx.beginPath();
    drawBaseShapeAtOrigin(renderer, type, scaledSize);
    renderer.ctx.strokeStyle = colors.body;
    renderer.ctx.lineWidth = 2;
    renderer.ctx.stroke();
  }

  if (motion.lowHealth && performanceTier !== 'low') {
    renderer.ctx.beginPath();
    renderer.ctx.arc(0, 0, scaledSize * 0.62, 0, Math.PI * 2);
    renderer.ctx.strokeStyle = '#ff6a7a';
    renderer.ctx.globalAlpha = 0.55;
    renderer.ctx.lineWidth = Math.max(1, scaledSize * 0.08);
    renderer.ctx.stroke();
    renderer.ctx.globalAlpha = 1;
  }

  renderer.ctx.restore();

  if (isUltra) {
    // Chromatic halo for clearer ultra identity.
    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = 0.5;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, scaledSize * 0.68, 0, Math.PI * 2);
    renderer.ctx.strokeStyle = '#9ee6ff';
    renderer.ctx.lineWidth = Math.max(1, scaledSize * 0.07);
    renderer.ctx.stroke();

    renderer.ctx.globalAlpha = 0.35;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, scaledSize * 0.82, 0, Math.PI * 2);
    renderer.ctx.strokeStyle = '#ff8cf5';
    renderer.ctx.lineWidth = Math.max(1, scaledSize * 0.05);
    renderer.ctx.stroke();
    renderer.ctx.restore();
  }

  // Boss indicator
  if (isBoss) {
    renderer.ctx.strokeStyle = '#FFFF00';
    renderer.ctx.lineWidth = 3;
    renderer.ctx.beginPath();
    renderer.ctx.arc(x, y, scaledSize * 0.62, 0, Math.PI * 2);
    renderer.ctx.stroke();
  }

  renderer.ctx.shadowBlur = 0;
  renderer.ctx.globalAlpha = 1;

  // Health bar (skip under ultra load)
  if (performanceTier !== 'low') {
    drawHealthBar(renderer, x, y + scaledSize / 2 + 5, scaledSize * 1.2, health / maxHealth);
  }

  // Status effect indicators
  if (isSlowed && !isFrozen && performanceTier !== 'low') {
    drawStatusIndicator(renderer, x, y - scaledSize / 2 - 8, '↓', '#00CCFF');
  }
  if (isFrozen && performanceTier !== 'low') {
    drawStatusIndicator(renderer, x, y - scaledSize / 2 - 8, '❄', '#00FFFF');
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
