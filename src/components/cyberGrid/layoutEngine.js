/**
 * layoutEngine.js — Compute the spatial layout for cluster nodes on the cyberspace grid.
 *
 * Layout STRATEGY is selected by collection ID so that different collections
 * generate completely distinct structural footprints — different trace routing,
 * spacing, orientation, and overall shape.
 *
 *   codegrind-core      → "motherboard" (staggered tiers with bus-bar routing)
 *   codegrind-blind-75  → "hex"        (tight honeycomb — compact board)
 *   codegrind-150       → "diamond"    (diagonal grid — rotated die layout)
 *   codegrind-250       → "serpentine" (long winding board trace)
 *   fallback        → "grid"       (classic rows × cols)
 */

import { CLUSTER_DIFFICULTY } from '../../data/interviewTopicClusters';

/* ── Tier visual config ──────────────────────────────────────── */
export const TIER_CONFIG = {
  [CLUSTER_DIFFICULTY.BEGINNER]: {
    label: 'BEGINNER',
    color: '#00FF8C',
    tierIndex: 0,
  },
  [CLUSTER_DIFFICULTY.INTERMEDIATE]: {
    label: 'INTERMEDIATE',
    color: '#FFCC00',
    tierIndex: 1,
  },
  [CLUSTER_DIFFICULTY.ADVANCED]: {
    label: 'ADVANCED',
    color: '#FF4D4D',
    tierIndex: 2,
  },
};

/* ── Node size constants ─────────────────────────────────────── */
export const NODE_SIZE = 80; // chip body size
export const NODE_PAD = 32; // gap between chips
export const TIER_GAP = 70; // vertical space between tier groups
export const HEADER_H = 100; // space at top for title
export const TIER_LABEL_H = 36; // tier label row height
export const VOLTAGE_BAR_H = 10; // progress bar height
export const VOLTAGE_BAR_PAD = 6; // above/below bar

/* ── Strategy picker ─────────────────────────────────────────── */
const STRATEGY_MAP = {
  'codegrind-core': 'motherboard',
  'codegrind-blind-75': 'hex',
  'codegrind-150': 'diamond',
  'codegrind-250': 'serpentine',
};

function pickStrategy(collectionId) {
  return STRATEGY_MAP[collectionId] || 'grid';
}

/* ── Tier helpers common to all strategies ────────────────────── */
const TIER_ORDER = [
  CLUSTER_DIFFICULTY.BEGINNER,
  CLUSTER_DIFFICULTY.INTERMEDIATE,
  CLUSTER_DIFFICULTY.ADVANCED,
];

function groupByTier(clusters) {
  const grouped = {
    [CLUSTER_DIFFICULTY.BEGINNER]: [],
    [CLUSTER_DIFFICULTY.INTERMEDIATE]: [],
    [CLUSTER_DIFFICULTY.ADVANCED]: [],
  };
  for (const c of clusters) grouped[c.difficulty]?.push(c);
  return grouped;
}

function makeNode(cluster, x, y, diff, cfg) {
  return {
    cluster,
    x,
    y,
    w: NODE_SIZE,
    h: NODE_SIZE,
    centerX: x + NODE_SIZE / 2,
    centerY: y + NODE_SIZE / 2,
    tier: diff,
    tierColor: cfg.color,
  };
}

function addTierHeader(tiers, cfg, cursorY, x, width) {
  tiers.push({
    label: cfg.label,
    color: cfg.color,
    y: cursorY,
    x,
    width,
  });
}

function addCrossEdges(nodes, edges) {
  const groups = TIER_ORDER.map((d) => nodes.filter((n) => n.tier === d));
  for (let t = 0; t < groups.length - 1; t++) {
    const from = groups[t];
    const to = groups[t + 1];
    if (from.length && to.length) {
      edges.push({ from: from[from.length - 1], to: to[0], color: '#00FFFF', tier: 'cross' });
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Strategy: grid (classic rows × cols — the original default)
   ═══════════════════════════════════════════════════════════════ */
function layoutGrid(clusters, canvasWidth) {
  const grouped = groupByTier(clusters);
  const usableW = canvasWidth - 40;
  const cellW = NODE_SIZE + NODE_PAD;
  const cols = Math.max(2, Math.min(6, Math.floor(usableW / cellW)));
  const gridW = cols * cellW;
  const offsetX = Math.round((canvasWidth - gridW) / 2) + NODE_PAD / 2;

  const nodes = [];
  const edges = [];
  const tiers = [];
  let cursorY = HEADER_H;

  for (const diff of TIER_ORDER) {
    const group = grouped[diff];
    if (!group.length) continue;
    const cfg = TIER_CONFIG[diff];
    addTierHeader(tiers, cfg, cursorY, offsetX, gridW);
    cursorY += TIER_LABEL_H;
    tiers[tiers.length - 1].barY = cursorY;
    cursorY += VOLTAGE_BAR_H + VOLTAGE_BAR_PAD;

    const tierNodes = [];
    for (let i = 0; i < group.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const nx = offsetX + col * cellW;
      const ny = cursorY + row * (NODE_SIZE + NODE_PAD);
      const node = makeNode(group[i], nx, ny, diff, cfg);
      nodes.push(node);
      tierNodes.push(node);
    }
    for (let i = 1; i < tierNodes.length; i++) {
      edges.push({ from: tierNodes[i - 1], to: tierNodes[i], color: cfg.color, tier: diff });
    }
    cursorY += Math.ceil(group.length / cols) * (NODE_SIZE + NODE_PAD) + TIER_GAP;
  }
  addCrossEdges(nodes, edges);
  return { nodes, edges, tiers, totalHeight: cursorY + 40, cols };
}

/* ═══════════════════════════════════════════════════════════════
   Strategy: motherboard (staggered tiers, bus-bar routing, extra traces)
   CodeGrind Core — wide layout with offset clusters and vertical bus bars.
   ═══════════════════════════════════════════════════════════════ */
function layoutMotherboard(clusters, canvasWidth) {
  const grouped = groupByTier(clusters);
  const cellW = NODE_SIZE + NODE_PAD;
  const usableW = canvasWidth - 60;
  const maxCols = Math.max(2, Math.min(7, Math.floor(usableW / cellW)));

  const nodes = [];
  const edges = [];
  const tiers = [];
  let cursorY = HEADER_H;

  for (let ti = 0; ti < TIER_ORDER.length; ti++) {
    const diff = TIER_ORDER[ti];
    const group = grouped[diff];
    if (!group.length) continue;
    const cfg = TIER_CONFIG[diff];

    // Each tier gets its own column count and stagger offset
    const tierCols = Math.max(2, Math.min(maxCols, Math.ceil(Math.sqrt(group.length * 1.5))));
    const gridW = tierCols * cellW;
    // Alternate tiers: slight horizontal shift for "staggered motherboard" look
    const shift = ti % 2 === 0 ? 0 : Math.round(cellW * 0.5);
    const offsetX = Math.round((canvasWidth - gridW) / 2) + NODE_PAD / 2 + shift;

    addTierHeader(tiers, cfg, cursorY, offsetX - shift, gridW + Math.abs(shift));
    cursorY += TIER_LABEL_H;
    tiers[tiers.length - 1].barY = cursorY;
    cursorY += VOLTAGE_BAR_H + VOLTAGE_BAR_PAD;

    const tierNodes = [];
    for (let i = 0; i < group.length; i++) {
      const col = i % tierCols;
      const row = Math.floor(i / tierCols);
      // Stagger odd rows by half a cell
      const rowShift = row % 2 === 1 ? Math.round(cellW * 0.4) : 0;
      const nx = offsetX + col * cellW + rowShift;
      const ny = cursorY + row * (NODE_SIZE + NODE_PAD + 10); // extra vertical space
      const node = makeNode(group[i], nx, ny, diff, cfg);
      nodes.push(node);
      tierNodes.push(node);
    }

    // Bus-bar routing: connect to a central vertical "bus", then fan-out
    // For visual variety, connect pairs of adjacent nodes + one bus-trace
    for (let i = 1; i < tierNodes.length; i++) {
      edges.push({ from: tierNodes[i - 1], to: tierNodes[i], color: cfg.color, tier: diff });
    }
    // Add a long vertical bus-bar edge from first to last in tier
    if (tierNodes.length > 2) {
      edges.push({
        from: tierNodes[0],
        to: tierNodes[tierNodes.length - 1],
        color: cfg.color,
        tier: diff,
        isBus: true,
      });
    }

    const rows = Math.ceil(group.length / tierCols);
    cursorY += rows * (NODE_SIZE + NODE_PAD + 10) + TIER_GAP + 20;
  }
  addCrossEdges(nodes, edges);
  return { nodes, edges, tiers, totalHeight: cursorY + 40, cols: maxCols };
}

/* ═══════════════════════════════════════════════════════════════
   Strategy: hex (honeycomb — Blind 75's compact board)
   Odd rows are offset by half a cell width for hexagonal packing.
   ═══════════════════════════════════════════════════════════════ */
function layoutHex(clusters, canvasWidth) {
  const grouped = groupByTier(clusters);
  const cellW = NODE_SIZE + NODE_PAD;
  const halfCell = Math.round(cellW / 2);
  const rowH = Math.round((NODE_SIZE + NODE_PAD) * 0.85); // tighter vertical
  const usableW = canvasWidth - 60;
  const cols = Math.max(2, Math.min(5, Math.floor(usableW / cellW)));
  const gridW = cols * cellW + halfCell; // account for offset rows
  const offsetX = Math.round((canvasWidth - gridW) / 2) + NODE_PAD / 2;

  const nodes = [];
  const edges = [];
  const tiers = [];
  let cursorY = HEADER_H;

  for (const diff of TIER_ORDER) {
    const group = grouped[diff];
    if (!group.length) continue;
    const cfg = TIER_CONFIG[diff];
    addTierHeader(tiers, cfg, cursorY, offsetX, gridW);
    cursorY += TIER_LABEL_H;
    tiers[tiers.length - 1].barY = cursorY;
    cursorY += VOLTAGE_BAR_H + VOLTAGE_BAR_PAD;

    const tierNodes = [];
    for (let i = 0; i < group.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const hexOffset = row % 2 === 1 ? halfCell : 0;
      const nx = offsetX + col * cellW + hexOffset;
      const ny = cursorY + row * rowH;
      const node = makeNode(group[i], nx, ny, diff, cfg);
      nodes.push(node);
      tierNodes.push(node);
    }

    // Hex-neighbours: connect each node to next, plus diagonal neighbours
    for (let i = 0; i < tierNodes.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Right neighbour
      if (col < cols - 1 && i + 1 < tierNodes.length) {
        edges.push({ from: tierNodes[i], to: tierNodes[i + 1], color: cfg.color, tier: diff });
      }
      // Below-right neighbour (for hex feel)
      const nextRowIdx = (row + 1) * cols + col;
      if (nextRowIdx < tierNodes.length) {
        edges.push({ from: tierNodes[i], to: tierNodes[nextRowIdx], color: cfg.color, tier: diff });
      }
    }

    const rows = Math.ceil(group.length / cols);
    cursorY += rows * rowH + TIER_GAP;
  }
  addCrossEdges(nodes, edges);
  return { nodes, edges, tiers, totalHeight: cursorY + 40, cols };
}

/* ═══════════════════════════════════════════════════════════════
  Strategy: diamond (diagonal grid — CodeGrind 150's rotated die)
  Nodes placed on a 45° rotated grid within each tier.
  ═══════════════════════════════════════════════════════════════ */
function layoutDiamond(clusters, canvasWidth) {
  const grouped = groupByTier(clusters);
  const cellD = NODE_SIZE + NODE_PAD + 16; // diagonal spacing
  const halfD = Math.round(cellD * 0.5);

  const nodes = [];
  const edges = [];
  const tiers = [];
  let cursorY = HEADER_H;

  for (const diff of TIER_ORDER) {
    const group = grouped[diff];
    if (!group.length) continue;
    const cfg = TIER_CONFIG[diff];

    // Diamond arrangement: place on diagonal lines
    const diagCols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(group.length))));
    const width = (diagCols + 1) * cellD;
    const offsetX = Math.round((canvasWidth - width) / 2);

    addTierHeader(tiers, cfg, cursorY, offsetX, width);
    cursorY += TIER_LABEL_H;
    tiers[tiers.length - 1].barY = cursorY;
    cursorY += VOLTAGE_BAR_H + VOLTAGE_BAR_PAD;

    const tierNodes = [];
    let maxY = cursorY;
    for (let i = 0; i < group.length; i++) {
      // Diagonal index: fill along NW→SE diagonals
      const diag = Math.floor((-1 + Math.sqrt(1 + 8 * i)) / 2);
      const posInDiag = i - (diag * (diag + 1)) / 2;
      const nx = offsetX + halfD + posInDiag * cellD + (diag % 2 === 1 ? halfD / 2 : 0);
      const ny = cursorY + diag * halfD;
      const node = makeNode(group[i], nx, ny, diff, cfg);
      nodes.push(node);
      tierNodes.push(node);
      if (ny + NODE_SIZE > maxY) maxY = ny + NODE_SIZE;
    }

    // Connect in sequence order
    for (let i = 1; i < tierNodes.length; i++) {
      edges.push({ from: tierNodes[i - 1], to: tierNodes[i], color: cfg.color, tier: diff });
    }
    // Diagonal cross-links: connect nodes on same diagonal
    for (let i = 0; i < tierNodes.length; i++) {
      const diag = Math.floor((-1 + Math.sqrt(1 + 8 * i)) / 2);
      const nextDiagStart = ((diag + 1) * (diag + 2)) / 2;
      if (nextDiagStart < tierNodes.length) {
        edges.push({
          from: tierNodes[i],
          to: tierNodes[Math.min(nextDiagStart, tierNodes.length - 1)],
          color: cfg.color,
          tier: diff,
        });
      }
    }

    cursorY = maxY + TIER_GAP + NODE_PAD;
  }
  addCrossEdges(nodes, edges);
  return { nodes, edges, tiers, totalHeight: cursorY + 40, cols: 4 };
}

/* ═══════════════════════════════════════════════════════════════
  Strategy: serpentine (CodeGrind 250 — winding trace like a PCB)
  Two columns that zigzag back and forth.
  ═══════════════════════════════════════════════════════════════ */
function layoutSerpentine(clusters, canvasWidth) {
  const grouped = groupByTier(clusters);
  const laneWidth = NODE_SIZE + NODE_PAD * 2;
  const serpCols = 3;
  const gridW = serpCols * laneWidth;
  const offsetX = Math.round((canvasWidth - gridW) / 2);

  const nodes = [];
  const edges = [];
  const tiers = [];
  let cursorY = HEADER_H;

  for (const diff of TIER_ORDER) {
    const group = grouped[diff];
    if (!group.length) continue;
    const cfg = TIER_CONFIG[diff];
    addTierHeader(tiers, cfg, cursorY, offsetX, gridW);
    cursorY += TIER_LABEL_H;
    tiers[tiers.length - 1].barY = cursorY;
    cursorY += VOLTAGE_BAR_H + VOLTAGE_BAR_PAD;

    const tierNodes = [];
    for (let i = 0; i < group.length; i++) {
      const row = Math.floor(i / serpCols);
      const colInRow = i % serpCols;
      // Serpentine: even rows L→R, odd rows R→L
      const actualCol = row % 2 === 0 ? colInRow : serpCols - 1 - colInRow;
      const nx = offsetX + actualCol * laneWidth + (laneWidth - NODE_SIZE) / 2;
      const ny = cursorY + row * (NODE_SIZE + NODE_PAD + 8);
      const node = makeNode(group[i], nx, ny, diff, cfg);
      nodes.push(node);
      tierNodes.push(node);
    }

    // Sequential edges following the serpentine path
    for (let i = 1; i < tierNodes.length; i++) {
      edges.push({ from: tierNodes[i - 1], to: tierNodes[i], color: cfg.color, tier: diff });
    }

    const rows = Math.ceil(group.length / serpCols);
    cursorY += rows * (NODE_SIZE + NODE_PAD + 8) + TIER_GAP;
  }
  addCrossEdges(nodes, edges);
  return { nodes, edges, tiers, totalHeight: cursorY + 40, cols: serpCols };
}

/* ═══════════════════════════════════════════════════════════════
   Public entry point
   ═══════════════════════════════════════════════════════════════ */

/**
 * Compute layout given canvas width, the cluster list, and an optional
 * collectionId that selects a layout strategy.
 *
 * Returns { nodes, edges, tiers, totalHeight, cols }.
 */
export function computeLayout(clusters, canvasWidth, collectionId = '') {
  const strategy = pickStrategy(collectionId);
  switch (strategy) {
    case 'motherboard':
      return layoutMotherboard(clusters, canvasWidth);
    case 'hex':
      return layoutHex(clusters, canvasWidth);
    case 'diamond':
      return layoutDiamond(clusters, canvasWidth);
    case 'serpentine':
      return layoutSerpentine(clusters, canvasWidth);
    default:
      return layoutGrid(clusters, canvasWidth);
  }
}
