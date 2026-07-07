/**
 * microLayoutEngine.js — Compute world-space layout for problem nodes INSIDE a chip.
 *
 * Problem nodes are positioned in world coordinates inside the chip's body area.
 * As the camera zooms in, the chip interior is naturally revealed with problems
 * arranged in a serpentine circuit-board path — no mode-switch, no crossfade.
 */

/* ── World-space sizing ────────────────────────────────────── */
export const PROBLEM_NODE_WS = 8; // world-space problem node size
export const PROBLEM_GAP_WS = 2; // gap between problem nodes
export const CELL_WS = PROBLEM_NODE_WS + PROBLEM_GAP_WS; // = 10

const BODY_INSET = 8; // chip body offset from chip edge (matches pixelUtils pinLen+2)
const INTERIOR_PAD = 4; // padding inside chip body for problem grid

/**
 * Compute world-space layout for problems inside a single cluster chip.
 *
 * @param {object}   cluster      – cluster data ({ id, slugs, accent, ... })
 * @param {number}   chipX        – world X of the chip top-left
 * @param {number}   chipY        – world Y of the chip top-left
 * @param {number}   chipSize     – chip size in world units (NODE_SIZE, typically 80)
 * @param {object[]} problemMetas – [{ slug, title, difficulty }] enrichment (optional)
 * @returns {{ nodes, edges, cols }}
 */
export function computeChipInteriorLayout(cluster, chipX, chipY, chipSize, problemMetas = []) {
  const metaMap = {};
  for (const m of problemMetas) metaMap[m.slug || m.titleSlug] = m;

  const bodyStart = BODY_INSET + INTERIOR_PAD;
  const interiorSize = chipSize - 2 * bodyStart;

  const cols = Math.max(2, Math.min(6, Math.floor((interiorSize + PROBLEM_GAP_WS) / CELL_WS)));
  const gridW = cols * CELL_WS - PROBLEM_GAP_WS;

  const slugs = cluster.slugs;
  const totalRows = Math.ceil(slugs.length / cols);
  const gridH = totalRows * CELL_WS - PROBLEM_GAP_WS;

  const offsetX = chipX + bodyStart + (interiorSize - gridW) / 2;
  const offsetY = chipY + bodyStart + (interiorSize - gridH) / 2;

  const nodes = [];
  const edges = [];

  for (let i = 0; i < slugs.length; i++) {
    const row = Math.floor(i / cols);
    const colIdx = i % cols;
    // Serpentine: even rows L→R, odd rows R→L
    const actualCol = row % 2 === 0 ? colIdx : cols - 1 - colIdx;

    const nx = offsetX + actualCol * CELL_WS;
    const ny = offsetY + row * CELL_WS;

    const meta = metaMap[slugs[i]] || {};

    nodes.push({
      slug: slugs[i],
      index: i,
      title: meta.title || slugToTitle(slugs[i]),
      difficulty: meta.difficulty || null,
      x: nx,
      y: ny,
      w: PROBLEM_NODE_WS,
      h: PROBLEM_NODE_WS,
      centerX: nx + PROBLEM_NODE_WS / 2,
      centerY: ny + PROBLEM_NODE_WS / 2,
    });
  }

  // Sequential edges following serpentine order
  for (let i = 1; i < nodes.length; i++) {
    edges.push({ from: nodes[i - 1], to: nodes[i], color: cluster.accent });
  }

  return { nodes, edges, cols };
}

/* ── Slug → display title ────────────────────────────────────── */
function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
