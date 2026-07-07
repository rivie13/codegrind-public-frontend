import { createRng, drawPixelRect, hexToRgb, rgbStr } from './pixelUtils';

export function spawnPulses(edges, time) {
  return edges
    .filter((_, i) => Math.sin(time * 0.7 + i * 1.3) > 0.6)
    .map((edge, i) => {
      const t = (time * 0.5 + i * 0.4) % 1;
      return {
        x: edge.from.centerX + (edge.to.centerX - edge.from.centerX) * t,
        y: edge.from.centerY + (edge.to.centerY - edge.from.centerY) * t,
        color: edge.color,
      };
    });
}

export function drawBackground(ctx, w, h, time) {
  ctx.fillStyle = '#07080a';
  ctx.fillRect(0, 0, w, h);

  const gridSize = 48;
  const pixSize = 2;
  for (let gy = 0; gy < h; gy += gridSize) {
    for (let gx = 0; gx < w; gx += gridSize) {
      const alpha = 0.04 + Math.sin(time * 0.5 + gx * 0.01 + gy * 0.005) * 0.015;
      ctx.fillStyle = rgbStr(0, 255, 255, Math.max(0, alpha));
      for (let px = gx; px < gx + gridSize && px < w; px += pixSize * 3) {
        ctx.fillRect(px, gy, pixSize, pixSize);
      }
      for (let py = gy; py < gy + gridSize && py < h; py += pixSize * 3) {
        ctx.fillRect(gx, py, pixSize, pixSize);
      }
    }
  }

  const noiseRng = createRng(Math.floor(time * 2));
  const noiseCount = Math.floor((w * h) / 12000);
  for (let i = 0; i < noiseCount; i++) {
    const nx = Math.floor(noiseRng() * w);
    const ny = Math.floor(noiseRng() * h);
    ctx.fillStyle = rgbStr(0, 255, 255, noiseRng() * 0.06);
    ctx.fillRect(nx, ny, 2, 2);
  }
}

export function drawTierHeader(ctx, tier, time) {
  const [r, g, b] = hexToRgb(tier.color);
  ctx.fillStyle = rgbStr(r, g, b, 0.85);
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(tier.label, tier.x + 4, tier.y + 2);

  const lineY = tier.y + 18;
  const rng = createRng(tier.y);
  for (let px = tier.x; px < tier.x + tier.width; px += 3) {
    const jitter = Math.round(rng() * 2 - 1);
    const a = 0.15 + Math.sin(time * 2 + px * 0.05) * 0.05;
    ctx.fillStyle = rgbStr(r, g, b, a);
    ctx.fillRect(px, lineY + jitter, 2, 2);
  }
  ctx.fillStyle = rgbStr(r, g, b, 0.6);
  ctx.fillRect(tier.x, lineY - 1, 4, 4);
  ctx.fillRect(tier.x + tier.width - 4, lineY - 1, 4, 4);
}

export function drawTitle(ctx, totalProblems, clusterCount, time, titleText) {
  for (let py = 28; py < 60; py += 2) {
    const a = 0.5 + Math.sin(time * 2 + py * 0.1) * 0.15;
    const isGreen = py > 44;
    ctx.fillStyle = isGreen ? rgbStr(0, 255, 140, a) : rgbStr(0, 255, 255, a);
    ctx.fillRect(24, py, 3, 2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(titleText || 'CLUSTER GRID', 34, 30);

  ctx.fillStyle = 'rgba(160,160,170,0.7)';
  ctx.font = '11px monospace';
  ctx.fillText(`${totalProblems} problems  //  ${clusterCount} clusters  //  3 tiers`, 34, 58);
}

export function drawClusterTooltip(ctx, node, mx, my, isAuth, trialClusterId) {
  const c = node.cluster;
  const [r, g, b] = hexToRgb(c.accent);
  const tw = 220;
  const th = 72;
  let tx = mx + 16;
  let ty = my - th - 8;
  if (tx + tw > ctx.canvas.width / (window.devicePixelRatio || 1)) tx = mx - tw - 16;
  if (ty < 0) ty = my + 16;

  ctx.fillStyle = 'rgba(8, 10, 14, 0.92)';
  ctx.fillRect(tx, ty, tw, th);
  drawPixelRect(ctx, tx, ty, tw, th, rgbStr(r, g, b, 0.5), 2);

  ctx.fillStyle = rgbStr(r, g, b, 0.95);
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(c.title, tx + 8, ty + 8);

  ctx.fillStyle = 'rgba(180,180,190,0.8)';
  ctx.font = '10px monospace';
  const desc = c.description.length > 36 ? c.description.slice(0, 36) + '...' : c.description;
  ctx.fillText(desc, tx + 8, ty + 24);

  ctx.fillStyle = 'rgba(120,120,130,0.7)';
  ctx.font = '10px monospace';
  ctx.fillText(`${c.slugs.length} problems  |  ${c.difficulty}`, tx + 8, ty + 40);

  const isTrial = c.id === trialClusterId;
  if (!isAuth && !isTrial) {
    ctx.fillStyle = 'rgba(255,100,100,0.7)';
    ctx.fillText('Sign in to access', tx + 8, ty + 54);
  } else if (!isAuth && isTrial) {
    ctx.fillStyle = rgbStr(0, 255, 140, 0.7);
    ctx.fillText('Free trial -> click to explore', tx + 8, ty + 54);
  } else {
    ctx.fillStyle = rgbStr(r, g, b, 0.6);
    ctx.fillText('Click to explore ->', tx + 8, ty + 54);
  }
}
