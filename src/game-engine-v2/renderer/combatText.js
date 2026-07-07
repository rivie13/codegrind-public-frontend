export function drawCombatText(renderer, combatText = []) {
  if (!combatText || combatText.length === 0) return;
  if (!renderer.settings.combatText) return;

  const packId = renderer.settings.damageTextPack?.id || 'default';
  const now = Date.now();
  const maxItems =
    renderer.performanceTier === 'ultra' ? 8 : renderer.performanceTier === 'heavy' ? 18 : 32;
  const recent = combatText.slice(-maxItems);

  renderer.ctx.save();
  renderer.ctx.textAlign = 'center';
  renderer.ctx.textBaseline = 'middle';

  recent.forEach((item) => {
    const age = now - item.createdAt;
    const duration = item.duration || 700;
    if (age < 0 || age > duration) return;

    const t = Math.min(1, age / duration);
    const rise = renderer.cellSize * (0.4 + t * 0.9);
    const driftX = (item.driftX || 0) * t;
    const x = item.x + driftX;
    const y = item.y - rise;
    const alpha = 1 - t;
    const isStatus = item.type === 'status';
    const baseSize = renderer.cellSize * (isStatus ? 0.32 : 0.26);
    const text = item.text || '';
    if (!text) return;

    switch (packId) {
      case 'neon-pop':
        drawNeonPopText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
        break;
      case 'critical-flash':
        drawCriticalFlashText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
        break;
      case 'digital-glitch':
        drawDigitalGlitchText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
        break;
      case 'retro-arcade':
        drawRetroArcadeText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
        break;
      case 'void-rune':
        drawVoidRuneText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
        break;
      default:
        drawDefaultCombatText(renderer, item, text, x, y, t, alpha, isStatus, baseSize);
    }
  });

  renderer.ctx.restore();
  renderer.ctx.globalAlpha = 1;
}

function drawDefaultCombatText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  const fontSize = Math.max(10, baseSize * (item.scale || 1));
  const color = item.color || (isStatus ? '#00f7ff' : '#ff4dd2');
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.font = `bold ${fontSize}px "Share Tech Mono", "Orbitron", monospace`;
  renderer.ctx.fillStyle = color;
  renderer.ctx.shadowColor = color;
  renderer.ctx.shadowBlur = renderer.performanceTier === 'ultra' ? 0 : isStatus ? 14 : 10;
  renderer.ctx.lineWidth = 2;
  renderer.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  renderer.ctx.strokeText(text, x, y);
  renderer.ctx.fillText(text, x, y);
}

function drawNeonPopText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  // Large at start, shrinks to normal size — high contrast neon flash
  const scaleMultiplier = 1.7 - t * 0.7;
  const fontSize = Math.max(10, baseSize * (item.scale || 1) * scaleMultiplier);
  const color = item.color || (isStatus ? '#22D3EE' : '#F0ABFC');
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.font = `bold ${fontSize}px "Share Tech Mono", "Orbitron", monospace`;
  renderer.ctx.fillStyle = color;
  renderer.ctx.shadowColor = color;
  renderer.ctx.shadowBlur = 20;
  renderer.ctx.lineWidth = 3;
  renderer.ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  renderer.ctx.strokeText(text, x, y);
  renderer.ctx.fillText(text, x, y);
}

function drawCriticalFlashText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  // Burst scale at impact, then settle — orange-red heat
  const burst = t < 0.18 ? 1 + (0.18 - t) * 5 : 1;
  const fontSize = Math.max(10, baseSize * (item.scale || 1) * burst);
  const flashT = t < 0.18 ? 1 - t / 0.18 : 0;
  const r = 255;
  const g = Math.round(80 + 75 * (1 - t));
  const color = isStatus ? '#22D3EE' : `rgb(${r},${g},30)`;
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.shadowColor = '#FF6B00';
  renderer.ctx.shadowBlur = flashT > 0 ? 26 * flashT : 8;
  renderer.ctx.font = `bold ${fontSize}px "Share Tech Mono", "Orbitron", monospace`;
  renderer.ctx.fillStyle = color;
  renderer.ctx.lineWidth = 3;
  renderer.ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  renderer.ctx.strokeText(text, x, y);
  renderer.ctx.fillText(text, x, y);
}

function drawDigitalGlitchText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  const fontSize = Math.max(10, baseSize * (item.scale || 1));
  const color = item.color || '#00F7FF';
  const glitch = Math.sin(t * 18 + item.x * 0.5) * 3;
  renderer.ctx.font = `bold ${fontSize}px "Share Tech Mono", "Orbitron", monospace`;
  renderer.ctx.lineWidth = 2;
  // Red channel
  renderer.ctx.globalAlpha = alpha * 0.55;
  renderer.ctx.fillStyle = '#FF006E';
  renderer.ctx.fillText(text, x + glitch, y);
  // Cyan channel
  renderer.ctx.globalAlpha = alpha * 0.55;
  renderer.ctx.fillStyle = '#00F7FF';
  renderer.ctx.fillText(text, x - glitch * 0.5, y + 1);
  // Main
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.fillStyle = color;
  renderer.ctx.shadowColor = color;
  renderer.ctx.shadowBlur = 10;
  renderer.ctx.fillText(text, x, y);
}

function drawRetroArcadeText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  const fontSize = Math.max(12, baseSize * (item.scale || 1) * 1.15);
  const color = isStatus ? '#22C55E' : '#FCD34D';
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  renderer.ctx.shadowColor = 'transparent';
  renderer.ctx.shadowBlur = 0;
  renderer.ctx.lineWidth = Math.max(3, fontSize * 0.2);
  renderer.ctx.strokeStyle = '#000000';
  renderer.ctx.strokeText(text, x, y);
  renderer.ctx.fillStyle = color;
  renderer.ctx.fillText(text, x, y);
  // White inner shine
  renderer.ctx.font = `bold ${Math.round(fontSize * 0.72)}px "Courier New", monospace`;
  renderer.ctx.fillStyle = `rgba(255,255,255,${alpha * 0.55})`;
  renderer.ctx.fillText(text, x, y - fontSize * 0.09);
}

function drawVoidRuneText(renderer, item, text, x, y, t, alpha, isStatus, baseSize) {
  const fontSize = Math.max(10, baseSize * (item.scale || 1));
  const color = isStatus ? '#C4B5FD' : '#A78BFA';
  const displayText = `◈${text}`;
  renderer.ctx.globalAlpha = alpha;
  renderer.ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
  renderer.ctx.fillStyle = color;
  renderer.ctx.shadowColor = '#7C3AED';
  renderer.ctx.shadowBlur = 18;
  renderer.ctx.lineWidth = 2;
  renderer.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  renderer.ctx.strokeText(displayText, x, y);
  renderer.ctx.fillText(displayText, x, y);
}
