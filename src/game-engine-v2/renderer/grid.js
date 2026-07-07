import { COLORS } from '../constants.js';

function getMapTheme(renderer) {
  return renderer.settings?.mapTheme || null;
}

function getGridStrokeColor(renderer) {
  return getMapTheme(renderer)?.gridColor || COLORS.GRID_LINE;
}

function getPathFillColor(renderer) {
  return getMapTheme(renderer)?.pathColor || COLORS.PATH_FILL;
}

function getPathInnerColor(renderer) {
  return getMapTheme(renderer)?.pathInnerColor || 'rgba(0, 255, 136, 0.25)';
}

function getMarkerColors(renderer) {
  const theme = getMapTheme(renderer);
  return {
    start: theme?.laneBorderColor || COLORS.NEON_GREEN,
    end: theme?.accentLineColor || COLORS.DANGER,
  };
}

function drawMinesweeperTileChrome(ctx, x, y, cellSize, options = {}) {
  const inset = options.revealed ? 1 : Math.max(1, cellSize * 0.04);
  const tileX = x + inset;
  const tileY = y + inset;
  const tileW = cellSize - inset * 2;
  const tileH = cellSize - inset * 2;
  const frameColor = options.frameColor || '#7B7B7B';
  const tileColor = options.tileColor || '#c6c2b8';
  const surfaceColor = options.surfaceColor || '#e8e8e8';
  const routeAccentColor = options.routeAccentColor || '#2554c7';
  const highlightColor = options.highlightColor || withAlpha('#FFFFFF', 0.92);
  const shadowColor = options.shadowColor || withAlpha(frameColor, 0.85);
  const innerColor = options.innerColor || withAlpha('#d7d3c9', 0.88);

  ctx.fillStyle = options.revealed ? surfaceColor : tileColor;
  ctx.fillRect(tileX, tileY, tileW, tileH);

  if (options.revealed) {
    ctx.strokeStyle = withAlpha(frameColor, 0.5);
    ctx.strokeRect(tileX, tileY, tileW, tileH);
    ctx.fillStyle = withAlpha(routeAccentColor, 0.08);
    ctx.fillRect(tileX + 2, tileY + 2, tileW - 4, tileH - 4);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(tileX, tileY + tileH);
  ctx.lineTo(tileX, tileY);
  ctx.lineTo(tileX + tileW, tileY);
  ctx.strokeStyle = highlightColor;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tileX + tileW, tileY);
  ctx.lineTo(tileX + tileW, tileY + tileH);
  ctx.lineTo(tileX, tileY + tileH);
  ctx.strokeStyle = shadowColor;
  ctx.stroke();

  const innerInset = Math.max(1, cellSize * 0.08);
  ctx.fillStyle = innerColor;
  ctx.fillRect(
    tileX + innerInset,
    tileY + innerInset,
    tileW - innerInset * 2,
    tileH - innerInset * 2
  );
}

function parseColorToRgb(color) {
  if (!color || typeof color !== 'string') return null;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split('')
            .map((part) => `${part}${part}`)
            .join('')
        : hex;
    const int = Number.parseInt(expanded, 16);
    if (Number.isNaN(int)) return null;
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    };
  }

  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;

  const [r = '255', g = '255', b = '255'] = match[1].split(',').map((part) => part.trim());
  return {
    r: Number.parseFloat(r),
    g: Number.parseFloat(g),
    b: Number.parseFloat(b),
  };
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixRgb(base, overlay, ratio) {
  const weight = Math.max(0, Math.min(1, ratio));
  return {
    r: clampChannel(base.r + (overlay.r - base.r) * weight),
    g: clampChannel(base.g + (overlay.g - base.g) * weight),
    b: clampChannel(base.b + (overlay.b - base.b) * weight),
  };
}

function rgbToCss(rgb, alpha = 1) {
  if (!rgb) {
    return `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
  }

  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  if (normalizedAlpha >= 1) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalizedAlpha})`;
}

function getMinesweeperTilePalette(theme, shadeSeed = 0.5) {
  const baseBackground = parseColorToRgb(theme?.mapBackground) || { r: 192, g: 192, b: 192 };
  const accent = parseColorToRgb(
    theme?.laneBorderColor || theme?.accentLineColor || theme?.gridColor
  ) || { r: 37, g: 84, b: 199 };
  const gridLine = parseColorToRgb(theme?.gridColor) || mixRgb(baseBackground, accent, 0.2);
  const paperWhite = { r: 255, g: 255, b: 255 };
  const deepShadow = { r: 78, g: 84, b: 92 };

  const raisedBase = mixRgb(baseBackground, paperWhite, 0.58 + shadeSeed * 0.12);
  const tileColor = mixRgb(raisedBase, gridLine, 0.08);
  const innerColor = mixRgb(tileColor, paperWhite, 0.12 + shadeSeed * 0.08);
  const revealedSurface = mixRgb(baseBackground, paperWhite, 0.78);
  const frameColor = mixRgb(baseBackground, deepShadow, 0.44);
  const highlightColor = rgbToCss(mixRgb(tileColor, paperWhite, 0.42), 0.96);
  const shadowColor = rgbToCss(mixRgb(frameColor, deepShadow, 0.22), 0.88);

  return {
    frameColor: rgbToCss(frameColor),
    tileColor: rgbToCss(tileColor),
    innerColor: rgbToCss(innerColor, 0.92),
    surfaceColor: rgbToCss(revealedSurface, 0.96),
    routeAccentColor: rgbToCss(accent),
    highlightColor,
    shadowColor,
  };
}

function getPathCenterPoints(renderer) {
  return renderer.pathNodes.map(([row, col]) => ({
    x: (col + 0.5) * renderer.cellSize,
    y: (row + 0.5) * renderer.cellSize,
  }));
}

function getPathStrokeStyle(renderer, ctx, points, mode, phase) {
  if (!Array.isArray(points) || points.length < 2) return COLORS.NEON_GREEN;

  const start = points[0];
  const end = points[points.length - 1];
  const drift = (Math.sin(phase * 1.15) + 1) * 0.5;

  const theme = getMapTheme(renderer);
  const pathColor = theme?.pathColor || COLORS.NEON_GREEN;
  const pathInner = theme?.pathInnerColor || '#86EFAC';
  const laneBorder = theme?.laneBorderColor || '#A7F3D0';

  if (mode === 'plasma-ribbon') {
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, laneBorder);
    gradient.addColorStop(Math.max(0.2, Math.min(0.8, drift)), '#A78BFA');
    gradient.addColorStop(1, pathInner);
    return gradient;
  }

  if (mode === 'neon-vein') {
    const mid = points[Math.floor(points.length / 2)] || start;
    const gradient = ctx.createRadialGradient(mid.x, mid.y, 8, mid.x, mid.y, 300);
    gradient.addColorStop(0, laneBorder);
    gradient.addColorStop(0.45, pathInner);
    gradient.addColorStop(1, pathColor);
    return gradient;
  }

  if (mode === 'amber-flow') {
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, '#F59E0B');
    gradient.addColorStop(Math.max(0.25, Math.min(0.75, drift)), '#FDE047');
    gradient.addColorStop(1, pathColor);
    return gradient;
  }

  if (mode === 'desktop-blueprint') {
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, laneBorder);
    gradient.addColorStop(Math.max(0.28, Math.min(0.72, drift)), pathInner);
    gradient.addColorStop(1, pathColor);
    return gradient;
  }

  if (mode === 'minesweeper-trace') {
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, laneBorder);
    gradient.addColorStop(Math.max(0.3, Math.min(0.7, drift)), '#7ea2ff');
    gradient.addColorStop(1, laneBorder);
    return gradient;
  }

  if (mode === 'homepage-default') {
    return theme?.laneBorderColor || 'rgba(74, 222, 128, 0.72)';
  }

  return laneBorder;
}

function drawPathLine(renderer, ctx, phase = renderer.glowPhase || 0) {
  const points = getPathCenterPoints(renderer);
  if (points.length < 2) return;

  const mode = renderer.settings.pathGradientMode || 'flat';
  const strokeStyle = getPathStrokeStyle(renderer, ctx, points, mode, phase);

  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;

  if (renderer.settings.glowEffects && renderer.performanceTier === 'normal') {
    if (mode === 'homepage-default') {
      ctx.shadowColor = '#4ADE80';
    } else if (mode === 'minesweeper-trace') {
      ctx.shadowColor = '#2554c7';
    } else if (mode === 'desktop-blueprint') {
      ctx.shadowColor = '#0B2BA8';
    } else {
      ctx.shadowColor = mode === 'flat' ? COLORS.NEON_GREEN : '#A7F3D0';
    }
    ctx.shadowBlur = 10;
  }

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function drawGrid(renderer) {
  if (!renderer.settings.showGrid) return;
  if (renderer.performanceTier === 'ultra') return;

  renderer.ctx.strokeStyle = getGridStrokeColor(renderer);
  renderer.ctx.lineWidth = renderer.performanceTier === 'heavy' ? 0.5 : 1;

  // Vertical lines
  for (let col = 0; col <= renderer.gridCols; col++) {
    const x = col * renderer.cellSize;
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(x, 0);
    renderer.ctx.lineTo(x, renderer.logicalHeight);
    renderer.ctx.stroke();
  }

  // Horizontal lines
  for (let row = 0; row <= renderer.gridRows; row++) {
    const y = row * renderer.cellSize;
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(0, y);
    renderer.ctx.lineTo(renderer.logicalWidth, y);
    renderer.ctx.stroke();
  }
}

export function drawPath(renderer) {
  if (renderer.pathNodes.length < 2) return;

  const cellSize = renderer.cellSize;
  const theme = getMapTheme(renderer);
  const isMinesweeperTheme = theme?.gridEffectStyle === 'minesweeper-field';

  // Draw path cells with glow
  renderer.pathNodes.forEach(([row, col]) => {
    const x = col * cellSize;
    const y = row * cellSize;

    // Cell fill
    renderer.ctx.fillStyle = getPathFillColor(renderer);
    renderer.ctx.fillRect(x, y, cellSize, cellSize);

    if (isMinesweeperTheme) {
      const palette = getMinesweeperTilePalette(theme);
      drawMinesweeperTileChrome(renderer.ctx, x, y, cellSize, {
        revealed: true,
        ...palette,
        surfaceColor: getPathInnerColor(renderer),
        routeAccentColor: theme?.laneBorderColor || palette.routeAccentColor,
      });
    } else if (renderer.settings.glowEffects && renderer.performanceTier === 'normal') {
      // Glow effect
      const glowIntensity = 0.2 + Math.sin(renderer.glowPhase) * 0.1;
      const themeInner = getPathInnerColor(renderer);
      if (themeInner.startsWith('rgba(')) {
        const alpha = Math.max(0.05, Math.min(0.45, glowIntensity));
        renderer.ctx.fillStyle = themeInner.replace(/,\s*([0-9]*\.?[0-9]+)\)$/, `, ${alpha})`);
      } else {
        renderer.ctx.fillStyle = themeInner;
      }
      renderer.ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    }
  });

  // Draw path line through centers
  drawPathLine(renderer, renderer.ctx);

  // Draw start and end markers
  if (renderer.pathNodes.length >= 2) {
    const [startRow, startCol] = renderer.pathNodes[0];
    const [endRow, endCol] = renderer.pathNodes[renderer.pathNodes.length - 1];

    // Start marker (green arrow)
    const markerColors = getMarkerColors(renderer);
    drawMarker(renderer, startCol, startRow, markerColors.start, 'START');

    // End marker (red target)
    drawMarker(renderer, endCol, endRow, markerColors.end, 'BASE');
  }
}

export function drawBackgroundCache(renderer) {
  if (!renderer.backgroundCanvas || !renderer.backgroundCtx) return;

  if (renderer.backgroundDirty) {
    const ctx = renderer.backgroundCtx;
    const theme = getMapTheme(renderer);
    ctx.clearRect(0, 0, renderer.backgroundCanvas.width, renderer.backgroundCanvas.height);

    if (theme?.mapBackground) {
      ctx.fillStyle = theme.mapBackground;
      ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
    }

    if (theme?.mapVignetteColor) {
      const vignette = ctx.createRadialGradient(
        renderer.logicalWidth * 0.5,
        renderer.logicalHeight * 0.5,
        Math.min(renderer.logicalWidth, renderer.logicalHeight) * 0.2,
        renderer.logicalWidth * 0.5,
        renderer.logicalHeight * 0.5,
        Math.max(renderer.logicalWidth, renderer.logicalHeight) * 0.72
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, theme.mapVignetteColor);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
    }

    // Grid (lightweight)
    if (renderer.settings.showGrid && renderer.performanceTier !== 'ultra') {
      ctx.strokeStyle = getGridStrokeColor(renderer);
      ctx.lineWidth = renderer.performanceTier === 'heavy' ? 0.5 : 1;
      for (let col = 0; col <= renderer.gridCols; col++) {
        const x = col * renderer.cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, renderer.logicalHeight);
        ctx.stroke();
      }
      for (let row = 0; row <= renderer.gridRows; row++) {
        const y = row * renderer.cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(renderer.logicalWidth, y);
        ctx.stroke();
      }
    }

    drawStaticGridEffect(renderer, ctx, theme);

    // Path cells (no glow)
    if (renderer.pathNodes.length >= 2) {
      const isMinesweeperTheme = theme?.gridEffectStyle === 'minesweeper-field';
      renderer.pathNodes.forEach(([row, col]) => {
        const x = col * renderer.cellSize;
        const y = row * renderer.cellSize;
        ctx.fillStyle = getPathFillColor(renderer);
        ctx.fillRect(x, y, renderer.cellSize, renderer.cellSize);

        if (isMinesweeperTheme) {
          const palette = getMinesweeperTilePalette(theme);
          drawMinesweeperTileChrome(ctx, x, y, renderer.cellSize, {
            revealed: true,
            ...palette,
            surfaceColor: getPathInnerColor(renderer),
            routeAccentColor: theme?.laneBorderColor || palette.routeAccentColor,
          });
        } else if (renderer.settings.glowEffects) {
          ctx.fillStyle = getPathInnerColor(renderer);
          ctx.fillRect(x + 2, y + 2, renderer.cellSize - 4, renderer.cellSize - 4);
        }
      });

      drawPathLine(renderer, ctx, 0);

      const [startRow, startCol] = renderer.pathNodes[0];
      const [endRow, endCol] = renderer.pathNodes[renderer.pathNodes.length - 1];
      const markerColors = getMarkerColors(renderer);
      drawMarkerStatic(renderer, startCol, startRow, markerColors.start, 'START');
      drawMarkerStatic(renderer, endCol, endRow, markerColors.end, 'BASE');
    }

    renderer.backgroundDirty = false;
  }

  renderer.ctx.drawImage(renderer.backgroundCanvas, 0, 0);
}

function drawMarkerStatic(renderer, col, row, color, label) {
  const ctx = renderer.backgroundCtx;
  const x = (col + 0.5) * renderer.cellSize;
  const y = (row + 0.5) * renderer.cellSize;
  const size = renderer.cellSize * 0.3;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color + '40';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `bold ${renderer.cellSize * 0.2}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y - size - 10);
}

export function drawMarker(renderer, col, row, color, label) {
  const x = (col + 0.5) * renderer.cellSize;
  const y = (row + 0.5) * renderer.cellSize;
  const size = renderer.cellSize * 0.3;

  // Pulsing circle
  const pulse = 1 + Math.sin(renderer.glowPhase * 2) * 0.1;

  renderer.ctx.beginPath();
  renderer.ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
  renderer.ctx.fillStyle = color + '40';
  renderer.ctx.fill();
  renderer.ctx.strokeStyle = color;
  renderer.ctx.lineWidth = 2;
  renderer.ctx.stroke();

  // Label
  renderer.ctx.font = `bold ${renderer.cellSize * 0.2}px monospace`;
  renderer.ctx.fillStyle = color;
  renderer.ctx.textAlign = 'center';
  renderer.ctx.textBaseline = 'middle';
  renderer.ctx.fillText(label, x, y - size - 10);
}

// ============================================================
// MAP PACK ANIMATED OVERLAY
// Called every frame from Renderer.render() after background
// ============================================================

function getPointAtPathProgress(points, progress) {
  if (!points || points.length < 2) return null;
  const segments = [];
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len });
    totalLen += len;
  }
  let dist = ((progress % 1) + 1) % 1;
  dist *= totalLen;
  for (const seg of segments) {
    if (dist <= seg.len) {
      const t = dist / Math.max(seg.len, 0.001);
      return { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
    }
    dist -= seg.len;
  }
  return points[points.length - 1];
}

function withAlpha(color, alpha) {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  if (!color || typeof color !== 'string') return `rgba(255, 255, 255, ${normalizedAlpha})`;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split('')
            .map((part) => `${part}${part}`)
            .join('')
        : hex;
    const int = Number.parseInt(expanded, 16);
    if (Number.isNaN(int)) return `rgba(255, 255, 255, ${normalizedAlpha})`;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }

  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return color;

  const [r = '255', g = '255', b = '255'] = match[1].split(',').map((part) => part.trim());
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
}

function forEachNonPathCell(renderer, callback) {
  for (let row = 0; row < renderer.gridRows; row += 1) {
    for (let col = 0; col < renderer.gridCols; col += 1) {
      if (renderer.pathSet?.has(`${row},${col}`)) continue;
      const x = col * renderer.cellSize;
      const y = row * renderer.cellSize;
      callback({ row, col, x, y });
    }
  }
}

function drawStaticGridEffect(renderer, ctx, theme) {
  if (theme?.gridEffectStyle !== 'minesweeper-field') return;

  const colors = theme.gridEffectColors || ['#7b7b7b', '#ffffff', '#2554c7'];
  const primary = colors[0] || '#7b7b7b';
  const tertiary = colors[2] || primary;
  const cellSize = renderer.cellSize;

  forEachNonPathCell(renderer, ({ row, col, x, y }) => {
    const shadeSeed = (Math.sin(row * 0.46 + col * 0.38) + 1) * 0.5;
    const palette = getMinesweeperTilePalette(theme, shadeSeed);
    drawMinesweeperTileChrome(ctx, x, y, cellSize, {
      revealed: false,
      ...palette,
      frameColor: primary,
    });

    if ((row + col) % 7 === 0) {
      const dotSize = Math.max(2, cellSize * 0.08);
      ctx.fillStyle = withAlpha(tertiary, 0.22);
      ctx.fillRect(x + cellSize * 0.42, y + cellSize * 0.42, dotSize, dotSize);
    }
  });
}

function drawGridCosmeticOverlay(renderer, theme, phase) {
  const style = theme?.gridEffectStyle;
  if (!style || style === 'none') return;

  const ctx = renderer.ctx;
  const colors = theme.gridEffectColors || theme.overlayColors || ['#E2E8F0'];
  const primary = colors[0] || '#E2E8F0';
  const secondary = colors[1] || primary;
  const tertiary = colors[2] || secondary;
  const cellSize = renderer.cellSize;

  ctx.save();

  if (style === 'minesweeper-field') {
    ctx.restore();
    return;
  }

  if (style === 'pulse-nodes') {
    ctx.lineWidth = 1;
    for (let row = 0; row <= renderer.gridRows; row += 1) {
      for (let col = 0; col <= renderer.gridCols; col += 1) {
        const pulse = (Math.sin(phase * 2.4 + row * 0.72 + col * 0.91) + 1) * 0.5;
        if (pulse < 0.18) continue;
        const x = col * cellSize;
        const y = row * cellSize;
        const radius = 1 + pulse * (cellSize * 0.11);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(primary, 0.08 + pulse * 0.2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius + 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(secondary, 0.12 + pulse * 0.28);
        ctx.stroke();
      }
    }
  }

  if (style === 'drift-columns') {
    const bandCount = 3;
    for (let bandIndex = 0; bandIndex < bandCount; bandIndex += 1) {
      const travel = (((phase * 0.11 + bandIndex / bandCount) % 1) + 1) % 1;
      const x = travel * renderer.logicalWidth;
      const width = cellSize * (0.32 + bandIndex * 0.08);
      const gradient = ctx.createLinearGradient(x - width, 0, x + width, 0);
      gradient.addColorStop(0, withAlpha(primary, 0));
      gradient.addColorStop(0.5, withAlpha(primary, 0.16 - bandIndex * 0.03));
      gradient.addColorStop(1, withAlpha(primary, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(x - width, 0, width * 2, renderer.logicalHeight);
    }

    ctx.lineWidth = 1.25;
    for (let row = 0; row <= renderer.gridRows; row += 1) {
      const y = row * cellSize;
      const shimmer = (Math.sin(phase * 1.8 + row * 0.65) + 1) * 0.5;
      if (shimmer < 0.35) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(renderer.logicalWidth, y);
      ctx.strokeStyle = withAlpha(secondary, 0.05 + shimmer * 0.12);
      ctx.stroke();
    }
  }

  if (style === 'cell-sparkle') {
    ctx.lineWidth = 1;
    forEachNonPathCell(renderer, ({ row, col, x, y }) => {
      const shimmer = (Math.sin(phase * 2.2 + row * 1.13 + col * 0.79) + 1) * 0.5;
      if (shimmer < 0.72) return;

      const inset = cellSize * 0.22;
      ctx.strokeStyle = withAlpha(primary, 0.15 + shimmer * 0.24);
      ctx.strokeRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);

      const corner = cellSize * 0.16;
      ctx.strokeStyle = withAlpha(tertiary, 0.12 + shimmer * 0.22);
      ctx.beginPath();
      ctx.moveTo(x + inset, y + inset + corner);
      ctx.lineTo(x + inset, y + inset);
      ctx.lineTo(x + inset + corner, y + inset);
      ctx.moveTo(x + cellSize - inset - corner, y + cellSize - inset);
      ctx.lineTo(x + cellSize - inset, y + cellSize - inset);
      ctx.lineTo(x + cellSize - inset, y + cellSize - inset - corner);
      ctx.stroke();
    });
  }

  if (style === 'minesweeper-field') {
    forEachNonPathCell(renderer, ({ row, col, x, y }) => {
      const pulse = (Math.sin(phase * 1.1 + row * 0.46 + col * 0.38) + 1) * 0.5;
      drawMinesweeperTileChrome(ctx, x, y, cellSize, {
        revealed: false,
        frameColor: primary,
        tileColor: pulse > 0.7 ? '#cfcbbf' : '#c6c2b8',
      });

      if ((row + col) % 7 === 0) {
        const dotSize = Math.max(2, cellSize * 0.08);
        ctx.fillStyle = withAlpha(tertiary, 0.22);
        ctx.fillRect(x + cellSize * 0.42, y + cellSize * 0.42, dotSize, dotSize);
      }
    });
  }

  if (style === 'desktop-windows') {
    const activeBand = Math.floor((((((phase * 0.18) / (Math.PI * 2)) % 1) + 1) % 1) * 6);

    forEachNonPathCell(renderer, ({ row, col, x, y }) => {
      const pulse = (Math.sin(phase * 1.4 + row * 0.92 + col * 0.67) + 1) * 0.5;
      const inset = cellSize * 0.12;
      const frameX = x + inset;
      const frameY = y + inset;
      const frameW = cellSize - inset * 2;
      const frameH = cellSize - inset * 2;
      const titleH = Math.max(4, cellSize * 0.18);
      const isActiveWindow = (row + col + activeBand) % 6 === 0;

      ctx.fillStyle = withAlpha('#EEE9E0', 0.72 + pulse * 0.08);
      ctx.fillRect(frameX, frameY, frameW, frameH);

      ctx.strokeStyle = withAlpha(primary, 0.3 + pulse * 0.08);
      ctx.strokeRect(frameX, frameY, frameW, frameH);

      ctx.beginPath();
      ctx.moveTo(frameX, frameY + frameH);
      ctx.lineTo(frameX, frameY);
      ctx.lineTo(frameX + frameW, frameY);
      ctx.strokeStyle = withAlpha('#FFFFFF', 0.6 + pulse * 0.12);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(frameX + frameW, frameY);
      ctx.lineTo(frameX + frameW, frameY + frameH);
      ctx.lineTo(frameX, frameY + frameH);
      ctx.strokeStyle = withAlpha(primary, 0.24 + pulse * 0.08);
      ctx.stroke();

      ctx.fillStyle = withAlpha(
        isActiveWindow ? secondary : primary,
        isActiveWindow ? 0.58 + pulse * 0.1 : 0.22 + pulse * 0.08
      );
      ctx.fillRect(frameX + 1, frameY + 1, frameW - 2, titleH);

      const buttonRadius = Math.max(1.2, cellSize * 0.036);
      const buttonY = frameY + titleH * 0.5 + 0.5;
      const buttonStartX = frameX + buttonRadius * 2.2;
      ['#ffffff', '#d0d5dd', '#8a8f98'].forEach((buttonColor, index) => {
        ctx.beginPath();
        ctx.arc(buttonStartX + index * buttonRadius * 2.6, buttonY, buttonRadius, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(buttonColor, 0.86);
        ctx.fill();
      });

      const contentX = frameX + cellSize * 0.12;
      const contentY = frameY + titleH + cellSize * 0.12;
      const lineGap = cellSize * 0.12;
      const lineHeight = Math.max(1.25, cellSize * 0.04);
      const lineWidths = [0.64, 0.48, 0.34];

      lineWidths.forEach((widthRatio, index) => {
        ctx.fillStyle = withAlpha(index === 0 ? primary : secondary, 0.18 + pulse * 0.06);
        ctx.fillRect(contentX, contentY + index * lineGap, frameW * widthRatio, lineHeight);
      });

      if (isActiveWindow) {
        const cursorW = Math.max(2, cellSize * 0.06);
        const cursorH = Math.max(4, cellSize * 0.14);
        ctx.fillStyle = withAlpha(secondary, 0.44 + pulse * 0.08);
        ctx.fillRect(
          frameX + frameW - cursorW - cellSize * 0.1,
          frameY + frameH - cursorH - cellSize * 0.1,
          cursorW,
          cursorH
        );
      }
    });
  }

  if (style === 'wave-interference') {
    // Plasma-field effect: two overlapping sine waves create complex colour interference
    // Each non-path cell gets a brightness value from the sum of both waves.
    const freqA = 0.48;
    const freqB = 0.31;
    const speedA = phase * 1.6;
    const speedB = phase * 1.1;

    forEachNonPathCell(renderer, ({ row, col, x, y }) => {
      const nx = col / renderer.gridCols;
      const ny = row / renderer.gridRows;

      const waveA = (Math.sin(nx * Math.PI * 6 * freqA + speedA) + 1) * 0.5;
      const waveB = (Math.sin(ny * Math.PI * 5 * freqB + speedB + nx * Math.PI * 3) + 1) * 0.5;
      const waveC = (Math.sin((nx + ny) * Math.PI * 4 + speedA * 0.7) + 1) * 0.5;

      const combined = (waveA + waveB + waveC) / 3;
      if (combined < 0.36) return;

      const alpha = (combined - 0.36) * 0.32;
      // Blend primary -> secondary based on which wave dominates
      const colorT = (waveA - waveB + 1) * 0.5;
      const fillColor = colorT > 0.5 ? primary : secondary;

      ctx.fillStyle = withAlpha(fillColor, alpha);
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    });

    // Bright peak nodes where all three waves constructively interfere
    ctx.lineWidth = 1;
    for (let row = 0; row <= renderer.gridRows; row += 1) {
      for (let col = 0; col <= renderer.gridCols; col += 1) {
        const nx = col / renderer.gridCols;
        const ny = row / renderer.gridRows;
        const wA = (Math.sin(nx * Math.PI * 6 * freqA + speedA) + 1) * 0.5;
        const wB = (Math.sin(ny * Math.PI * 5 * freqB + speedB + nx * Math.PI * 3) + 1) * 0.5;
        const wC = (Math.sin((nx + ny) * Math.PI * 4 + speedA * 0.7) + 1) * 0.5;
        const peak = (wA + wB + wC) / 3;
        if (peak < 0.78) continue;
        ctx.beginPath();
        ctx.arc(col * cellSize, row * cellSize, 1.4 + peak * (cellSize * 0.06), 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(tertiary, 0.1 + peak * 0.22);
        ctx.fill();
      }
    }
  }

  if (style === 'phase-ripples') {
    // Three radial wave sources — rings expand and fade, waves interfere between origins
    const anchors = [
      { x: renderer.logicalWidth * 0.22, y: renderer.logicalHeight * 0.28 },
      { x: renderer.logicalWidth * 0.74, y: renderer.logicalHeight * 0.36 },
      { x: renderer.logicalWidth * 0.52, y: renderer.logicalHeight * 0.76 },
    ];

    anchors.forEach((anchor, index) => {
      const t = (((phase * 0.22 + index * 0.27) % 1) + 1) % 1;
      for (let ring = 0; ring < 5; ring += 1) {
        const progress = (t + ring * 0.2) % 1;
        const radius = cellSize * (0.6 + progress * 7.5);
        const alpha = Math.pow(1 - progress, 1.8) * (0.22 - ring * 0.02);
        if (alpha <= 0.015) continue;

        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);
        ctx.lineWidth = 0.8 + (1 - progress) * 1.4;
        ctx.strokeStyle = withAlpha(ring % 2 === 0 ? primary : secondary, alpha);
        ctx.stroke();
      }
    });

    // Interference: each non-path cell samples the combined wave amplitude from all 3 sources
    forEachNonPathCell(renderer, ({ row, col, x, y }) => {
      const cx = (col + 0.5) * cellSize;
      const cy = (row + 0.5) * cellSize;

      let amplitude = 0;
      anchors.forEach((anchor, index) => {
        const dist = Math.sqrt((cx - anchor.x) ** 2 + (cy - anchor.y) ** 2);
        const wave = Math.sin(dist * 0.085 - phase * 3.2 + index * 2.09);
        amplitude += wave;
      });
      amplitude /= anchors.length; // -1..1

      if (amplitude < 0.62) return;

      const t = (amplitude - 0.62) / 0.38; // 0..1 in bright zone
      const inset = cellSize * 0.3;
      ctx.fillStyle = withAlpha(tertiary, t * 0.2);
      ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);
    });
  }

  if (style === 'node-network') {
    // Sparse graph: deterministic nodes at ~1/3 of intersections, edges that pulse
    // independently, and small packets that travel along lit edges.
    const nodes = [];
    for (let row = 0; row <= renderer.gridRows; row += 1) {
      for (let col = 0; col <= renderer.gridCols; col += 1) {
        // Stable pseudo-random seeding — only keep ~35% of intersections as nodes
        const seed = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
        if (seed - Math.floor(seed) > 0.35) continue;
        nodes.push({ x: col * cellSize, y: row * cellSize, row, col });
      }
    }

    // Draw edges between nearby nodes (within 2.5 cells)
    const maxDist = cellSize * 2.5;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) continue;

        // Each edge has its own slow phase derived from the two node positions
        const edgeSeed = (nodes[i].row + nodes[j].col * 7 + nodes[j].row * 3) * 0.43;
        const edgePulse = (Math.sin(phase * 1.4 + edgeSeed) + 1) * 0.5;
        if (edgePulse < 0.28) continue;

        const alpha = 0.04 + edgePulse * 0.14;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = withAlpha(primary, alpha);
        ctx.stroke();

        // Packet dot travelling along this edge
        const tPacket = (((phase * 0.24 + edgeSeed * 0.6) % 1) + 1) % 1;
        const px = nodes[i].x + (nodes[j].x - nodes[i].x) * tPacket;
        const py = nodes[i].y + (nodes[j].y - nodes[i].y) * tPacket;
        const packetAlpha = edgePulse * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + cellSize * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(secondary, packetAlpha);
        ctx.fill();
      }
    }

    // Pulse the node dots themselves
    nodes.forEach((node) => {
      const nodeSeed = node.row * 17.3 + node.col * 5.9;
      const nodePulse = (Math.sin(phase * 2.1 + nodeSeed) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.2 + nodePulse * (cellSize * 0.06), 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(tertiary, 0.1 + nodePulse * 0.22);
      ctx.fill();
    });
  }

  ctx.restore();
}

export function drawMapPackOverlay(renderer) {
  const theme = getMapTheme(renderer);
  const hasPathOverlay =
    theme?.overlayStyle && theme.overlayStyle !== 'none' && renderer.pathNodes?.length >= 2;
  const hasGridOverlay = theme?.gridEffectStyle && theme.gridEffectStyle !== 'none';
  if (!hasPathOverlay && !hasGridOverlay) return;

  const ctx = renderer.ctx;
  const phase = renderer.glowPhase || 0;
  const cellSize = renderer.cellSize;
  const colors = theme.overlayColors || ['rgba(255,255,255,0.3)'];

  if (hasGridOverlay) {
    drawGridCosmeticOverlay(renderer, theme, phase);
  }

  if (!hasPathOverlay) return;

  const points = getPathCenterPoints(renderer);

  ctx.save();

  // Clip to path cells only
  ctx.beginPath();
  renderer.pathNodes.forEach(([row, col]) => {
    ctx.rect(col * cellSize, row * cellSize, cellSize, cellSize);
  });
  ctx.clip();

  if (theme.overlayStyle === 'flow-sweep') {
    // Two offset gradient bands that sweep from path start to end
    const start = points[0];
    const end = points[points.length - 1];
    const sweep1 = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
    const sweep2 = (sweep1 + 0.5) % 1;

    const g1 = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    g1.addColorStop(Math.max(0, sweep1 - 0.14), 'rgba(0,0,0,0)');
    g1.addColorStop(sweep1, withAlpha(colors[0], 0.4));
    g1.addColorStop(Math.min(1, sweep1 + 0.14), 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);

    const g2 = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    g2.addColorStop(Math.max(0, sweep2 - 0.1), 'rgba(0,0,0,0)');
    g2.addColorStop(sweep2, withAlpha(colors[1] || colors[0], 0.27));
    g2.addColorStop(Math.min(1, sweep2 + 0.1), 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
  }

  if (theme.overlayStyle === 'pulse-shimmer') {
    // Periodic shimmer tiles — each path cell brightens in a rolling wave
    const wave = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
    renderer.pathNodes.forEach(([row, col], idx) => {
      const cellPhase = (wave + idx * 0.05) % 1;
      const shimmer = Math.pow(Math.sin(cellPhase * Math.PI), 2);
      const x = col * cellSize;
      const y = row * cellSize;
      const g = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, withAlpha(colors[0], shimmer * 0.28));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cellSize, cellSize);
    });
  }

  if (theme.overlayStyle === 'scan-beam') {
    // A bright radial beam that travels along the path
    const scanProg = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
    const scanPt = getPointAtPathProgress(points, scanProg);
    if (scanPt) {
      const beamRadius = cellSize * 2.2;
      const g = ctx.createRadialGradient(scanPt.x, scanPt.y, 0, scanPt.x, scanPt.y, beamRadius);
      g.addColorStop(0, withAlpha(colors[0], 0.73));
      g.addColorStop(0.35, withAlpha(colors[1] || colors[0], 0.33));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
    }
    // Secondary trailing beam at half phase
    const trailPt = getPointAtPathProgress(points, (scanProg + 0.5) % 1);
    if (trailPt) {
      const trailRadius = cellSize * 1.4;
      const g2 = ctx.createRadialGradient(
        trailPt.x,
        trailPt.y,
        0,
        trailPt.x,
        trailPt.y,
        trailRadius
      );
      g2.addColorStop(0, withAlpha(colors[2] || colors[0], 0.4));
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
    }
  }

  if (theme.overlayStyle === 'vortex-glow') {
    // Breathing radial glow at the path midpoint that expands/contracts
    const mid = points[Math.floor(points.length / 2)] || points[0];
    const breathe = Math.sin(phase * 0.7);
    const outer = cellSize * (3.8 + breathe * 0.8);
    const inner = cellSize * 0.4;
    const g = ctx.createRadialGradient(mid.x, mid.y, inner, mid.x, mid.y, outer);
    g.addColorStop(0, withAlpha(colors[0] || '#ffffff', 0.44));
    g.addColorStop(0.4 + breathe * 0.08, withAlpha(colors[1] || colors[0], 0.22));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);

    // Also run a secondary sweep to add life
    const sweep = ((((phase * 0.6) / (Math.PI * 2)) % 1) + 1) % 1;
    const scanPt = getPointAtPathProgress(points, sweep);
    if (scanPt) {
      const sg = ctx.createRadialGradient(
        scanPt.x,
        scanPt.y,
        0,
        scanPt.x,
        scanPt.y,
        cellSize * 1.6
      );
      sg.addColorStop(0, withAlpha(colors[2] || colors[0], 0.33));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, renderer.logicalWidth, renderer.logicalHeight);
    }
  }

  ctx.restore();
}
