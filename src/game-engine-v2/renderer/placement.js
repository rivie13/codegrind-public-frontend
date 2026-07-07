import { COLORS, DEPLOYABLE_TYPES, getTowerByType } from '../constants.js';

function isPlacementCellValid(renderer, row, col) {
  const isOnPath = renderer.pathSet.has(`${row},${col}`);
  const isOccupied = renderer.isCellOccupied(row, col);

  if (renderer.placementModeKind === 'tower') {
    return !isOnPath && !isOccupied;
  }

  const deployableProps =
    DEPLOYABLE_TYPES[renderer.placementItemType?.toUpperCase().replace(/\s+/g, '_')];

  if (!deployableProps) return false;

  if (deployableProps.placementType === 'path') {
    return isOnPath && !isOccupied;
  }

  return !isOccupied;
}

function drawPlacementHints(renderer) {
  if (!renderer.placementItemType || !renderer.settings?.showPlacementHints) return;

  const pulse = 0.45 + ((Math.sin(renderer.glowPhase * 2.2) + 1) / 2) * 0.55;
  const inset = Math.max(3, renderer.cellSize * 0.14);
  const innerSize = Math.max(6, renderer.cellSize - inset * 2);

  renderer.ctx.save();

  for (let row = 0; row < renderer.gridRows; row += 1) {
    for (let col = 0; col < renderer.gridCols; col += 1) {
      if (!isPlacementCellValid(renderer, row, col)) continue;

      const x = col * renderer.cellSize;
      const y = row * renderer.cellSize;
      const innerX = x + inset;
      const innerY = y + inset;

      renderer.ctx.fillStyle = `rgba(0, 255, 136, ${0.08 + pulse * 0.18})`;
      renderer.ctx.fillRect(innerX, innerY, innerSize, innerSize);

      renderer.ctx.strokeStyle = `rgba(125, 255, 220, ${0.26 + pulse * 0.34})`;
      renderer.ctx.lineWidth = 1.5;
      renderer.ctx.strokeRect(innerX, innerY, innerSize, innerSize);

      const centerX = x + renderer.cellSize / 2;
      const centerY = y + renderer.cellSize / 2;
      const markerRadius = Math.max(2, renderer.cellSize * 0.08 + pulse * 1.2);

      renderer.ctx.beginPath();
      renderer.ctx.arc(centerX, centerY, markerRadius, 0, Math.PI * 2);
      renderer.ctx.fillStyle = `rgba(180, 255, 235, ${0.34 + pulse * 0.28})`;
      renderer.ctx.fill();
    }
  }

  renderer.ctx.restore();
}

export function drawPlacementPreview(renderer) {
  if (!renderer.placementItemType) return;

  drawPlacementHints(renderer);

  if (!renderer.hoveredCell) return;

  const { row, col } = renderer.hoveredCell;
  const x = col * renderer.cellSize;
  const y = row * renderer.cellSize;

  const isValid = isPlacementCellValid(renderer, row, col);

  // Draw preview cell
  renderer.ctx.fillStyle = isValid ? COLORS.GRID_CELL_VALID : COLORS.GRID_CELL_INVALID;
  renderer.ctx.fillRect(x, y, renderer.cellSize, renderer.cellSize);

  // Draw tower preview if valid
  if (isValid) {
    if (renderer.placementModeKind === 'tower') {
      const towerProps = getTowerByType(renderer.placementItemType);
      if (towerProps) {
        // Preview tower
        renderer.ctx.globalAlpha = 0.6;
        renderer.drawTower({
          position: { row, col },
          type: towerProps.type,
          color: towerProps.color,
          upgradeLevel: 0,
          id: 'preview',
        });
        renderer.ctx.globalAlpha = 1;

        // Preview range
        const cx = (col + 0.5) * renderer.cellSize;
        const cy = (row + 0.5) * renderer.cellSize;
        const range = towerProps.range * renderer.cellSize;

        renderer.ctx.beginPath();
        renderer.ctx.arc(cx, cy, range, 0, Math.PI * 2);
        renderer.ctx.fillStyle = towerProps.color + '20';
        renderer.ctx.fill();
        renderer.ctx.strokeStyle = towerProps.color + '80';
        renderer.ctx.lineWidth = 1;
        renderer.ctx.setLineDash([5, 5]);
        renderer.ctx.stroke();
        renderer.ctx.setLineDash([]);
      }
    } else {
      const deployableProps =
        DEPLOYABLE_TYPES[renderer.placementItemType.toUpperCase().replace(/\s+/g, '_')];
      if (deployableProps) {
        renderer.drawDeployable(
          {
            position: { row, col },
            color: deployableProps.color,
            glowColor: deployableProps.glowColor,
            icon: deployableProps.icon,
            radius: deployableProps.radius,
          },
          { preview: true }
        );
      }
    }
  }
}
