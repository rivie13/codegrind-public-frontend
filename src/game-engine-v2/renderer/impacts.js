export function drawImpacts(renderer, impacts = []) {
  if (!impacts.length) return;
  if (!renderer.settings.hitEffects) return;
  if (renderer.performanceTier === 'ultra') return;

  const now = Date.now();
  const ttl = 180;
  const visibleImpacts = impacts.length > 14 ? impacts.slice(-14) : impacts;
  const heavyLoad = visibleImpacts.length > 8 || renderer.performanceTier !== 'normal';

  renderer.ctx.save();
  renderer.ctx.globalCompositeOperation = heavyLoad ? 'source-over' : 'lighter';

  visibleImpacts.forEach((impact) => {
    const age = now - impact.createdAt;
    const t = Math.min(1, age / ttl);
    const scale = impact.scale || 1;
    const size = renderer.cellSize * 0.28 * (1 + t * (heavyLoad ? 0.95 : 1.3)) * scale;
    const alpha = 1 - t;
    const style = getImpactStyle(impact.towerType, impact.effect);

    renderer.ctx.globalAlpha = alpha;
    renderer.ctx.strokeStyle = impact.color;
    renderer.ctx.lineWidth =
      Math.max(1, renderer.cellSize * 0.03) * (impact.effect === 'field' ? 1.2 : 1);
    renderer.ctx.setLineDash(heavyLoad ? [] : style.lineDash || []);

    // Base ring
    renderer.ctx.beginPath();
    renderer.ctx.arc(impact.x, impact.y, size, 0, Math.PI * 2);
    renderer.ctx.stroke();

    if (!heavyLoad && style.ringCount && style.ringCount > 1) {
      for (let i = 1; i < style.ringCount; i++) {
        renderer.ctx.beginPath();
        renderer.ctx.arc(impact.x, impact.y, size * (0.6 + i * 0.2), 0, Math.PI * 2);
        renderer.ctx.stroke();
      }
    }

    renderer.ctx.globalAlpha = alpha * (heavyLoad ? 0.28 : impact.effect === 'splash' ? 0.45 : 0.6);
    renderer.ctx.fillStyle = impact.color + '66';
    renderer.ctx.beginPath();
    renderer.ctx.arc(impact.x, impact.y, size * 0.55, 0, Math.PI * 2);
    renderer.ctx.fill();

    if (!heavyLoad) {
      drawImpactGlyph(renderer, impact.x, impact.y, size * 0.6, impact.color, impact.towerType);
    }
  });

  renderer.ctx.restore();
  renderer.ctx.globalAlpha = 1;
}

export function drawDamageFields(renderer, damageFields = []) {
  if (!damageFields.length) return;

  const now = renderer.lastState?.currentTime || Date.now();
  renderer.ctx.save();
  renderer.ctx.globalCompositeOperation = 'lighter';

  for (const field of damageFields) {
    if (!field || now >= field.endTime) continue;

    const remainingRatio = Math.max(0.2, Math.min(1, (field.endTime - now) / 3000));
    const pulse = 1 + Math.sin(renderer.glowPhase * 2.6 + field.radius * 0.01) * 0.08;
    const radius = field.radius * pulse;
    const color = field.color || '#ffdd00';

    renderer.ctx.globalAlpha = 0.14 * remainingRatio + 0.08;
    renderer.ctx.fillStyle = `${color}33`;
    renderer.ctx.beginPath();
    renderer.ctx.arc(field.x, field.y, radius, 0, Math.PI * 2);
    renderer.ctx.fill();

    renderer.ctx.globalAlpha = 0.45;
    renderer.ctx.strokeStyle = color;
    renderer.ctx.lineWidth = Math.max(1, renderer.cellSize * 0.05);
    renderer.ctx.setLineDash([8, 6]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(field.x, field.y, radius, 0, Math.PI * 2);
    renderer.ctx.stroke();

    renderer.ctx.globalAlpha = 0.2;
    renderer.ctx.setLineDash([3, 5]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(field.x, field.y, radius * 0.65, 0, Math.PI * 2);
    renderer.ctx.stroke();
  }

  renderer.ctx.restore();
  renderer.ctx.globalAlpha = 1;
}

export function getImpactStyle(towerType, effect) {
  if (effect === 'logic-field') {
    return { lineDash: [2, 3], ringCount: 3 };
  }
  if (effect === 'logic-exec') {
    return { lineDash: [9, 4], ringCount: 2 };
  }
  if (effect === 'overflow-burst') {
    return { lineDash: [5, 2], ringCount: 3 };
  }
  if (effect === 'ice-burst') {
    return { lineDash: [1, 4], ringCount: 2 };
  }
  if (effect === 'while-loop-shock') {
    return { lineDash: [4, 2], ringCount: 2 };
  }
  if (effect === 'deployable-burst') {
    return { lineDash: [4, 1], ringCount: 3 };
  }
  if (effect === 'field') {
    return { lineDash: [6, 4], ringCount: 2 };
  }
  if (effect === 'splash') {
    return { lineDash: [3, 3], ringCount: 3 };
  }
  switch (towerType) {
    case 'ForLoop':
      return { lineDash: [4, 2], ringCount: 2 };
    case 'WhileLoop':
      return { lineDash: [8, 3], ringCount: 1 };
    case 'IfCondition':
      return { lineDash: [2, 2], ringCount: 1 };
    case 'Variable':
      return { lineDash: [5, 5], ringCount: 1 };
    case 'Function':
      return { lineDash: [], ringCount: 2 };
    case 'Array':
      return { lineDash: [1, 3], ringCount: 1 };
    case 'Object':
      return { lineDash: [], ringCount: 1 };
    case 'Return':
      return { lineDash: [6, 2], ringCount: 1 };
    case 'TryCatch':
      return { lineDash: [2, 4], ringCount: 1 };
    case 'Switch':
      return { lineDash: [4, 3], ringCount: 2 };
    default:
      return { lineDash: [], ringCount: 1 };
  }
}

export function drawImpactGlyph(renderer, x, y, size, color, towerType) {
  renderer.ctx.save();
  renderer.ctx.strokeStyle = color;
  renderer.ctx.fillStyle = color;
  renderer.ctx.lineWidth = Math.max(1, size * 0.12);

  switch (towerType) {
    case 'ForLoop': {
      const r = size * 0.5;
      renderer.ctx.beginPath();
      renderer.ctx.arc(x - r * 0.45, y, r, -Math.PI / 2, Math.PI / 2);
      renderer.ctx.arc(x + r * 0.45, y, r, Math.PI / 2, -Math.PI / 2);
      renderer.ctx.stroke();
      break;
    }
    case 'WhileLoop': {
      // Parallel beam lines — laser pierce / arc discharge impact
      renderer.ctx.lineWidth = Math.max(1, size * 0.1);
      const offset = size * 0.22;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.6, y - offset);
      renderer.ctx.lineTo(x + size * 0.6, y - offset);
      renderer.ctx.stroke();
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.6, y + offset);
      renderer.ctx.lineTo(x + size * 0.6, y + offset);
      renderer.ctx.stroke();
      // Center bright pulse dot
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.14, 0, Math.PI * 2);
      renderer.ctx.fill();
      break;
    }
    case 'IfCondition': {
      renderer.ctx.save();
      renderer.ctx.translate(x, y);
      renderer.ctx.rotate(Math.PI / 4);
      renderer.ctx.strokeRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
      renderer.ctx.restore();
      break;
    }
    case 'Variable': {
      const w = size * 1.1;
      const h = size * 0.6;
      const r = h / 2;
      const left = x - w / 2;
      const top = y - h / 2;
      const right = x + w / 2;
      const bottom = y + h / 2;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(left + r, top);
      renderer.ctx.lineTo(right - r, top);
      renderer.ctx.quadraticCurveTo(right, top, right, top + r);
      renderer.ctx.lineTo(right, bottom - r);
      renderer.ctx.quadraticCurveTo(right, bottom, right - r, bottom);
      renderer.ctx.lineTo(left + r, bottom);
      renderer.ctx.quadraticCurveTo(left, bottom, left, bottom - r);
      renderer.ctx.lineTo(left, top + r);
      renderer.ctx.quadraticCurveTo(left, top, left + r, top);
      renderer.ctx.closePath();
      renderer.ctx.stroke();
      break;
    }
    case 'Function': {
      const r = size * 0.6;
      renderer.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ((Math.PI * 2) / 6) * i + Math.PI / 6;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) renderer.ctx.moveTo(x + px, y + py);
        else renderer.ctx.lineTo(x + px, y + py);
      }
      renderer.ctx.closePath();
      renderer.ctx.stroke();
      break;
    }
    case 'Array': {
      for (let i = -1; i <= 1; i++) {
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + i * size * 0.35, y, size * 0.12, 0, Math.PI * 2);
        renderer.ctx.fill();
      }
      break;
    }
    case 'Object': {
      const s = size * 0.8;
      renderer.ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      renderer.ctx.strokeRect(x - (s * 0.6) / 2, y - (s * 0.6) / 2, s * 0.6, s * 0.6);
      break;
    }
    case 'Return': {
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.4, y);
      renderer.ctx.lineTo(x + size * 0.4, y);
      renderer.ctx.lineTo(x + size * 0.15, y - size * 0.2);
      renderer.ctx.moveTo(x + size * 0.4, y);
      renderer.ctx.lineTo(x + size * 0.15, y + size * 0.2);
      renderer.ctx.stroke();
      break;
    }
    case 'TryCatch': {
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
      renderer.ctx.stroke();
      break;
    }
    case 'Switch': {
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.4, y);
      renderer.ctx.lineTo(x + size * 0.2, y - size * 0.25);
      renderer.ctx.moveTo(x - size * 0.4, y);
      renderer.ctx.lineTo(x + size * 0.2, y + size * 0.25);
      renderer.ctx.stroke();
      break;
    }
    case 'Data Mine': {
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.2, y - size * 0.2);
      renderer.ctx.lineTo(x + size * 0.2, y + size * 0.2);
      renderer.ctx.moveTo(x + size * 0.2, y - size * 0.2);
      renderer.ctx.lineTo(x - size * 0.2, y + size * 0.2);
      renderer.ctx.stroke();
      break;
    }
    case 'ICE Trap': {
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x, y - size * 0.5);
      renderer.ctx.lineTo(x, y + size * 0.5);
      renderer.ctx.moveTo(x - size * 0.45, y);
      renderer.ctx.lineTo(x + size * 0.45, y);
      renderer.ctx.moveTo(x - size * 0.34, y - size * 0.34);
      renderer.ctx.lineTo(x + size * 0.34, y + size * 0.34);
      renderer.ctx.moveTo(x + size * 0.34, y - size * 0.34);
      renderer.ctx.lineTo(x - size * 0.34, y + size * 0.34);
      renderer.ctx.stroke();
      break;
    }
    case 'Buffer Overflow': {
      renderer.ctx.beginPath();
      renderer.ctx.strokeRect(x - size * 0.45, y - size * 0.3, size * 0.9, size * 0.6);
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.55, y + size * 0.36);
      renderer.ctx.lineTo(x + size * 0.55, y - size * 0.36);
      renderer.ctx.stroke();
      break;
    }
    case 'Logic Bomb': {
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(x - size * 0.22, y - size * 0.12);
      renderer.ctx.lineTo(x, y + size * 0.28);
      renderer.ctx.lineTo(x + size * 0.22, y - size * 0.12);
      renderer.ctx.stroke();
      break;
    }
    default:
      break;
  }

  renderer.ctx.restore();
}
