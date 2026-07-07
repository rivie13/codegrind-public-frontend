export function setHoveredCell(renderer, mouseX, mouseY) {
  const col = Math.floor(mouseX / renderer.cellSize);
  const row = Math.floor(mouseY / renderer.cellSize);

  if (col >= 0 && col < renderer.gridCols && row >= 0 && row < renderer.gridRows) {
    renderer.hoveredCell = { row, col };
  } else {
    renderer.hoveredCell = null;
  }
}

export function getCellAtPosition(renderer, mouseX, mouseY) {
  const col = Math.floor(mouseX / renderer.cellSize);
  const row = Math.floor(mouseY / renderer.cellSize);

  if (col >= 0 && col < renderer.gridCols && row >= 0 && row < renderer.gridRows) {
    return { row, col };
  }
  return null;
}

export function getTowerAtCell(renderer, towers, cell) {
  return towers.find(t =>
    t.position.row === cell.row && t.position.col === cell.col
  ) || null;
}

export function isCellOccupied(renderer, row, col) {
  if (renderer.occupiedCells && renderer.occupiedCells.size > 0) {
    return renderer.occupiedCells.has(`${row},${col}`);
  }
  const towers = renderer.lastState?.towers || [];
  const deployables = renderer.lastState?.deployables || [];
  const towerOccupied = towers.some(t => t.position.row === row && t.position.col === col);
  const deployableOccupied = deployables.some(d => d.position.row === row && d.position.col === col);
  return towerOccupied || deployableOccupied;
}

export function setPlacementMode(renderer, enabled, itemType = null, kind = 'tower') {
  renderer.placementMode = enabled;
  renderer.placementItemType = itemType;
  renderer.placementModeKind = kind;
  if (!enabled) {
    renderer.hoveredCell = null;
  }
}

export function setPlacementPreview(renderer, itemType, mouseX, mouseY, kind = 'tower') {
  renderer.placementMode = true;
  renderer.placementItemType = itemType;
  renderer.placementModeKind = kind;
  setHoveredCell(renderer, mouseX, mouseY);
}

export function clearPlacementPreview(renderer) {
  // Keep placement mode but clear the hover
  renderer.hoveredCell = null;
}

export function setSelectedTower(renderer, towerId) {
  renderer.selectedTowerId = towerId;
  if (towerId) {
    renderer.placementMode = false;
    renderer.placementItemType = null;
    renderer.placementModeKind = 'tower';
    renderer.hoveredCell = null;
  }
}

export function clearHover(renderer) {
  renderer.hoveredCell = null;
}
