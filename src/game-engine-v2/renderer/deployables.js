export function drawDeployables(renderer, deployables) {
  deployables.forEach(deployable => drawDeployable(renderer, deployable));
}

export function drawDeployable(renderer, deployable, options = {}) {
  const { preview = false } = options;
  const { position, color, glowColor, icon, radius, isTriggered, activeUntil } = deployable;
  const x = position.col * renderer.cellSize;
  const y = position.row * renderer.cellSize;
  const size = renderer.cellSize * 0.7;
  const offset = (renderer.cellSize - size) / 2;
  const baseColor = color || '#ffffff';
  const auraColor = glowColor || baseColor;

  const now = Date.now();
  const isActive = Boolean(isTriggered) && (!activeUntil || now <= activeUntil);
  const pulse = 1 + Math.sin(renderer.glowPhase * 2) * 0.08;

  renderer.ctx.save();

  if (renderer.settings.glowEffects) {
    renderer.ctx.shadowColor = auraColor;
    renderer.ctx.shadowBlur = preview ? 10 : 14;
  }

  renderer.ctx.fillStyle = baseColor;
  renderer.ctx.globalAlpha = preview ? 0.45 : 0.75;
  renderer.ctx.beginPath();
  renderer.ctx.arc(x + renderer.cellSize / 2, y + renderer.cellSize / 2, (size / 2) * pulse, 0, Math.PI * 2);
  renderer.ctx.fill();

  renderer.ctx.strokeStyle = preview ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.8)';
  renderer.ctx.lineWidth = isActive ? 2.5 : 2;
  renderer.ctx.stroke();

  renderer.ctx.shadowBlur = 0;
  renderer.ctx.globalAlpha = 1;

  if (icon) {
    renderer.ctx.font = `bold ${renderer.cellSize * 0.35}px sans-serif`;
    renderer.ctx.fillStyle = '#0a0a1a';
    renderer.ctx.textAlign = 'center';
    renderer.ctx.textBaseline = 'middle';
    renderer.ctx.fillText(icon, x + renderer.cellSize / 2, y + renderer.cellSize / 2 + 1);
  }

  if (!preview && radius) {
    const cx = x + renderer.cellSize / 2;
    const cy = y + renderer.cellSize / 2;
    const range = radius * renderer.cellSize;
    const ringAlpha = isActive ? 0.25 : 0.18;

    renderer.ctx.save();
    renderer.ctx.globalCompositeOperation = 'lighter';
    renderer.ctx.globalAlpha = ringAlpha;
    renderer.ctx.strokeStyle = auraColor;
    renderer.ctx.lineWidth = isActive ? 2.5 : 2;
    renderer.ctx.setLineDash(isActive ? [6, 6] : [10, 8]);
    renderer.ctx.beginPath();
    renderer.ctx.arc(cx, cy, range * (isActive ? pulse : 1), 0, Math.PI * 2);
    renderer.ctx.stroke();
    renderer.ctx.setLineDash([]);
    renderer.ctx.restore();
  }

  renderer.ctx.restore();
}
