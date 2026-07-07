export function getNodeEdgeDistance(node, width, height) {
  const [row, col] = node;
  return Math.min(row, col, height - 1 - row, width - 1 - col);
}

export function countPathTurns(pathNodes) {
  if (!Array.isArray(pathNodes) || pathNodes.length < 3) {
    return 0;
  }

  let turns = 0;
  let previousDirection = null;

  for (let index = 1; index < pathNodes.length; index++) {
    const [previousRow, previousCol] = pathNodes[index - 1];
    const [currentRow, currentCol] = pathNodes[index];
    const direction = `${Math.sign(currentRow - previousRow)},${Math.sign(currentCol - previousCol)}`;

    if (previousDirection && direction !== previousDirection) {
      turns += 1;
    }

    previousDirection = direction;
  }

  return turns;
}

export function analyzePathQuality({
  pathNodes,
  width,
  height,
  map = null,
  targetBuildableRatio = 0.5,
}) {
  const totalCells = width * height;
  const safePathNodes = Array.isArray(pathNodes) ? pathNodes : [];
  const pathLength = safePathNodes.length;
  const uniqueRows = new Set(safePathNodes.map(([row]) => row)).size;
  const uniqueCols = new Set(safePathNodes.map(([, col]) => col)).size;
  const turnCount = countPathTurns(safePathNodes);

  let edgeNodeCount = 0;
  let interiorNodeCount = 0;
  for (const node of safePathNodes) {
    const edgeDistance = getNodeEdgeDistance(node, width, height);
    if (edgeDistance <= 1) {
      edgeNodeCount += 1;
    }
    if (edgeDistance >= 2) {
      interiorNodeCount += 1;
    }
  }

  let buildableCount = Math.max(0, totalCells - pathLength);
  if (Array.isArray(map)) {
    buildableCount = map.reduce((total, row) => total + row.filter((cell) => cell === 0).length, 0);
  }

  const buildableRatio = totalCells > 0 ? buildableCount / totalCells : 0;
  const edgePathRatio = pathLength > 0 ? edgeNodeCount / pathLength : 1;
  const interiorNodeRatio = pathLength > 0 ? interiorNodeCount / pathLength : 0;
  const rowCoverage = height > 0 ? uniqueRows / height : 0;
  const colCoverage = width > 0 ? uniqueCols / width : 0;
  const pathCoverage = totalCells > 0 ? pathLength / totalCells : 0;
  const buildableDelta = Math.abs(buildableRatio - targetBuildableRatio);

  const score =
    turnCount * 5 +
    interiorNodeRatio * 100 +
    Math.min(rowCoverage, colCoverage) * 40 +
    Math.max(0, 1 - buildableDelta * 3) * 30 -
    edgePathRatio * 65;

  return {
    buildableRatio,
    colCoverage,
    edgeNodeCount,
    edgePathRatio,
    interiorNodeRatio,
    pathCoverage,
    pathLength,
    rowCoverage,
    score,
    turnCount,
    uniqueCols,
    uniqueRows,
  };
}
