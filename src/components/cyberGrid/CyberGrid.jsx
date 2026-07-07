/**
 * CyberGrid.jsx -- Unified canvas cluster map with three crisp rendering levels.
 *
 * Level 1 (MACRO):
 *   Scrollable grid of cluster chips – each drawn with per-cluster chip variants.
 *   Layout strategy is unique per collection (motherboard / hex / diamond / serpentine).
 *
 * Level 2 (MICRO):
 *   Full-canvas PCB board for a single cluster – problems as IC components.
 *   Delegated to microRenderer.js.
 *
 * Level 3 (NANO):
 *   Single problem focus with difficulty badge, title, and action buttons
 *   (Tower Defense / Code Editor), styled as logic gates.
 *   Delegated to nanoRenderer.js.
 *
 * Transitions between levels use a "fake-zoom" cinematic animation:
 *   scale-up → flash → swap → fade-in.
 *
 * Props:
 *   clusters              - array of cluster objects (current collection)
 *   collectionId          - id string for layout strategy selection
 *   progress              - Map<clusterId, { solved, total }>
 *   isAuthenticated       - boolean
 *   title                 - collection display name (e.g. "CODEGRIND CORE")
 *   initialFocusClusterId - cluster to zoom into on mount (deep link)
 *   problemMetas          - [{ slug, title, difficulty }] for focused cluster
 *   problemModeStatusBySlug - { [slug]: { workspace, td } } for focused cluster
 *   solvedSlugs           - Set<string> of solved problem slugs
 *   freeProblemsRemaining - number (guest trial)
 *   hasReachedWall        - boolean (guest trial)
 *   onFocusChange         - (clusterId | null) => void
 *   onProblemClick        - (slug, index, mode) => void
 *   onTrialWallHit        - () => void
 */

import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createRng,
  drawDataStream,
  drawGlitchBit,
  drawPixelRect,
  drawScanlines,
  drawVoltageBar,
  hexToRgb,
  rgbStr,
} from './pixelUtils';
import { getVariantIndex, drawVariantChip } from './chipVariants';
import { computeLayout, NODE_SIZE, TIER_CONFIG, VOLTAGE_BAR_H } from './layoutEngine';

import { renderMicroView, microHitTest } from './microRenderer';
import { renderNanoView, nanoHitTest } from './nanoRenderer';
import { drawProfileCard } from './profileCardRenderer';
import { TRIAL_CLUSTER_ID } from '../../data/clusterCollections';
import { GUEST_FREE_PROBLEM_LIMIT } from '../../hooks/guest/useGuestProgress';
import { getUnlockedOrderedSlugs } from '../../utils/progression/orderedUnlocks';

const HOME_DEMO_SLUG = 'hello-world';

const slugToTitle = (slug) => {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
};

const withTrialHomeDemoNode = (cluster) => {
  if (!cluster || cluster.id !== TRIAL_CLUSTER_ID) return cluster;
  if (Array.isArray(cluster.slugs) && cluster.slugs.includes(HOME_DEMO_SLUG)) return cluster;
  return {
    ...cluster,
    slugs: [HOME_DEMO_SLUG, ...(Array.isArray(cluster.slugs) ? cluster.slugs : [])],
  };
};

/* ── Scroll / transition constants ───────────────────────────── */
const SCROLL_LERP = 0.12;
const TRANSITION_MS = 1050; // total transition time
const ZOOM_PHASE_END = 0.4; // end of physical-zoom phase
const BLUR_PHASE_END = 0.72; // end of full-blur (obscured) phase
const MAX_ZOOM_SCALE = 4; // peak zoom magnification
const RETRO_TRACE_RGB = [214, 194, 148];
const RETRO_HEADER_BLUE = '#173d84';
const RETRO_HEADER_BLUE_END = '#335fae';
const RETRO_HEADER_TEXT = '#f7f7f7';
const RETRO_WINDOW = '#d6d1c8';
const RETRO_WINDOW_FACE = '#ece9d8';
const RETRO_WINDOW_TEXT = '#1f1f1f';
const RETRO_WINDOW_MUTED = '#5b5953';
const RETRO_WINDOW_BORDER = '#2b2926';
const RETRO_STATIC_BLUE = '#335fae';
const RETRO_STATIC_DARK = '#5f6758';

/* ── Difficulty colour map (problem nodes) ──────────────────── */
/* ═══════════════════════════════════════════════════════════════
   Drawing Helpers -- Macro (cluster grid world)
   ═══════════════════════════════════════════════════════════════ */

function spawnPulses(edges, time) {
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

function drawBackground(ctx, w, h, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#718268');
  gradient.addColorStop(1, '#4f6149');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, w, 18);

  const gridSize = 48;
  const pixSize = 2;
  for (let gy = 0; gy < h; gy += gridSize) {
    for (let gx = 0; gx < w; gx += gridSize) {
      const alpha = 0.04 + Math.sin(time * 0.5 + gx * 0.01 + gy * 0.005) * 0.015;
      ctx.fillStyle = rgbStr(
        RETRO_TRACE_RGB[0],
        RETRO_TRACE_RGB[1],
        RETRO_TRACE_RGB[2],
        Math.max(0, alpha)
      );
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
    const dustAlpha = noiseRng() * 0.05;
    ctx.fillStyle =
      noiseRng() > 0.55 ? rgbStr(255, 255, 255, dustAlpha) : rgbStr(164, 122, 48, dustAlpha);
    ctx.fillRect(nx, ny, 2, 2);
  }
}

function drawTierHeader(ctx, tier, time) {
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

function drawTitle(ctx, w, totalProblems, clusterCount, time, titleText) {
  for (let py = 28; py < 60; py += 2) {
    const a = 0.5 + Math.sin(time * 2 + py * 0.1) * 0.15;
    const isAmber = py > 44;
    ctx.fillStyle = isAmber ? rgbStr(181, 132, 39, a) : rgbStr(43, 80, 142, a);
    ctx.fillRect(24, py, 3, 2);
  }
  ctx.fillStyle = RETRO_WINDOW_TEXT;
  ctx.font = 'bold 20px Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(titleText || 'CLUSTER GRID', 34, 30);

  ctx.fillStyle = RETRO_WINDOW_MUTED;
  ctx.font = '11px Tahoma, sans-serif';
  ctx.fillText(`${totalProblems} problems  //  ${clusterCount} clusters  //  3 tiers`, 34, 58);
}

function drawClusterTooltip(ctx, node, mx, my, isAuth, trialClusterId) {
  const c = node.cluster;
  const tw = 220;
  const th = 72;
  let tx = mx + 16;
  let ty = my - th - 8;
  if (tx + tw > ctx.canvas.width / (window.devicePixelRatio || 1)) tx = mx - tw - 16;
  if (ty < 0) ty = my + 16;

  ctx.fillStyle = RETRO_WINDOW;
  ctx.fillRect(tx, ty, tw, th);
  drawPixelRect(ctx, tx, ty, tw, th, RETRO_WINDOW_BORDER, 2);
  const titleBar = ctx.createLinearGradient(tx, ty, tx + tw, ty);
  titleBar.addColorStop(0, RETRO_HEADER_BLUE);
  titleBar.addColorStop(1, RETRO_HEADER_BLUE_END);
  ctx.fillStyle = titleBar;
  ctx.fillRect(tx + 2, ty + 2, tw - 4, 16);

  ctx.fillStyle = RETRO_HEADER_TEXT;
  ctx.font = 'bold 11px Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(c.title, tx + 8, ty + 5);

  ctx.fillStyle = RETRO_WINDOW_TEXT;
  ctx.font = '10px Tahoma, sans-serif';
  const desc = c.description.length > 36 ? c.description.slice(0, 36) + '...' : c.description;
  ctx.fillText(desc, tx + 8, ty + 27);

  ctx.fillStyle = RETRO_WINDOW_MUTED;
  ctx.font = '10px Tahoma, sans-serif';
  ctx.fillText(`${c.slugs.length} problems  |  ${c.difficulty}`, tx + 8, ty + 43);

  const isTrial = c.id === trialClusterId;
  if (!isAuth && !isTrial) {
    ctx.fillStyle = '#874134';
    ctx.fillText('Sign in to access', tx + 8, ty + 57);
  } else if (!isAuth && isTrial) {
    ctx.fillStyle = '#2f6d34';
    ctx.fillText('Free trial -> click to explore', tx + 8, ty + 57);
  } else {
    ctx.fillStyle = '#254f84';
    ctx.fillText('Click to explore ->', tx + 8, ty + 57);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Transition: Radial cyber-static takeover overlay
   ═══════════════════════════════════════════════════════════════ */
function drawCyberStaticTransition(ctx, w, h, intensity, time, centerX, centerY) {
  if (intensity <= 0) return;
  const cx = centerX ?? w / 2;
  const cy = centerY ?? h / 2;

  // Maximum radius = distance from center to farthest corner
  const maxR = Math.sqrt(Math.max(cx, w - cx) ** 2 + Math.max(cy, h - cy) ** 2);
  // Ease-in for aggressive early coverage
  const coverage = Math.min(1, intensity * 1.15);
  const radius = coverage * maxR;

  /* ── Layer 1: Clipped radial region ───────────────────────── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
  ctx.clip();

  // Warm desktop-static base
  ctx.fillStyle = rgbStr(212, 208, 198, Math.min(0.88, intensity * 0.9));
  ctx.fillRect(0, 0, w, h);

  // TV static – rapid random pixels (seed changes every frame)
  const staticRng = createRng(Math.floor(time * 30));
  const pixelCount = Math.floor(intensity * 600);
  for (let i = 0; i < pixelCount; i++) {
    const px = Math.floor(staticRng() * w);
    const py = Math.floor(staticRng() * h);
    const isAmber = staticRng() > 0.6;
    if (isAmber) {
      ctx.fillStyle = rgbStr(
        214,
        Math.floor(176 + staticRng() * 36),
        Math.floor(126 + staticRng() * 44),
        0.1 + staticRng() * 0.22
      );
    } else {
      const channel = staticRng() > 0.5 ? RETRO_STATIC_BLUE : RETRO_STATIC_DARK;
      const [sr, sg, sb] = hexToRgb(channel);
      ctx.fillStyle = rgbStr(sr, sg, sb, 0.04 + staticRng() * 0.12);
    }
    ctx.fillRect(px, py, staticRng() > 0.8 ? 3 : 2, 2);
  }

  // Horizontal scan-corruption lines
  const scanRng = createRng(Math.floor(time * 8) + 777);
  const scanCount = Math.floor(intensity * 14);
  for (let i = 0; i < scanCount; i++) {
    const sy = Math.floor(scanRng() * h);
    const sh = 1 + Math.floor(scanRng() * 3);
    const xShift = Math.floor((scanRng() - 0.5) * 24);
    ctx.fillStyle =
      scanRng() > 0.5
        ? rgbStr(51, 95, 174, 0.08 + scanRng() * 0.18)
        : rgbStr(245, 241, 231, 0.04 + scanRng() * 0.12);
    ctx.fillRect(xShift, sy, w, sh);
  }

  // Digital data-fragment blocks
  if (intensity > 0.25) {
    const dataRng = createRng(Math.floor(time * 5) + 333);
    const fragCount = Math.floor(intensity * 28);
    for (let i = 0; i < fragCount; i++) {
      const fx = Math.floor(dataRng() * w);
      const fy = Math.floor(dataRng() * h);
      const fw = 6 + Math.floor(dataRng() * 44);
      ctx.fillStyle =
        dataRng() > 0.45
          ? rgbStr(214, Math.floor(178 + dataRng() * 32), 126, 0.06 + dataRng() * 0.14)
          : rgbStr(51, 95, 174, 0.05 + dataRng() * 0.11);
      ctx.fillRect(fx, fy, fw, 2);
    }
  }

  // Vertical interference bars
  if (intensity > 0.45) {
    const barRng = createRng(Math.floor(time * 4) + 555);
    const barCount = Math.floor((intensity - 0.3) * 10);
    for (let i = 0; i < barCount; i++) {
      const bx = Math.floor(barRng() * w);
      const bw = 1 + Math.floor(barRng() * 4);
      ctx.fillStyle = rgbStr(245, 241, 231, 0.02 + barRng() * 0.04);
      ctx.fillRect(bx, 0, bw, h);
    }
  }

  ctx.restore(); // end clip

  /* ── Layer 2: Pixelated fringe ring at the expansion edge ── */
  const fringeW = 25 + intensity * 55;
  const innerR = Math.max(0, radius - fringeW);
  const outerR = radius + fringeW * 0.25;
  const fringeRng = createRng(Math.floor(time * 20) + 111);
  const fringeCount = Math.floor(intensity * 350);
  for (let i = 0; i < fringeCount; i++) {
    const angle = fringeRng() * Math.PI * 2;
    const dist = innerR + fringeRng() * (outerR - innerR);
    const fx = cx + Math.cos(angle) * dist;
    const fy = cy + Math.sin(angle) * dist;
    if (fx < 0 || fx >= w || fy < 0 || fy >= h) continue;
    const isAmber = fringeRng() > 0.45;
    ctx.fillStyle = isAmber
      ? rgbStr(214, Math.floor(176 + fringeRng() * 28), 122, 0.06 + fringeRng() * 0.18)
      : rgbStr(51, 95, 174, 0.03 + fringeRng() * 0.1);
    ctx.fillRect(Math.floor(fx), Math.floor(fy), 2, 2);
  }

  const ringGradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  ringGradient.addColorStop(0, rgbStr(245, 241, 231, 0));
  ringGradient.addColorStop(0.68, rgbStr(51, 95, 174, Math.min(0.08, intensity * 0.08)));
  ringGradient.addColorStop(1, rgbStr(214, 194, 148, Math.min(0.16, intensity * 0.16)));
  ctx.fillStyle = ringGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

/* ═══════════════════════════════════════════════════════════════
   Parent overlays — "you are inside this element" frames
   ═══════════════════════════════════════════════════════════════ */

/**  Level 2 overlay: ghosted CPU-chip shell — minimal corner brackets. */
function drawGhostedChipFrame(ctx, w, h, accent, time) {
  const pad = 44;
  const fx = pad;
  const fy = pad;
  const fw = w - pad * 2;
  const fh = h - pad * 2;
  const frameAlpha = 0.14 + Math.sin(time * 1.2) * 0.03;

  ctx.fillStyle = rgbStr(245, 241, 231, frameAlpha * 0.75);
  ctx.fillRect(fx, fy, fw, 2);
  ctx.fillRect(fx, fy, 2, fh);

  ctx.fillStyle = rgbStr(79, 84, 73, frameAlpha * 0.7);
  ctx.fillRect(fx, fy + fh - 2, fw, 2);
  ctx.fillRect(fx + fw - 2, fy, 2, fh);

  ctx.fillStyle = rgbStr(51, 95, 174, frameAlpha * 0.32);
  ctx.fillRect(fx + 8, fy + 8, fw - 16, 14);

  ctx.fillStyle = rgbStr(214, 194, 148, frameAlpha * 0.3);
  for (let dx = fx + 18; dx < fx + fw - 18; dx += 18) {
    ctx.fillRect(dx, fy + 28, 2, 1);
    ctx.fillRect(dx, fy + fh - 29, 2, 1);
  }
  for (let dy = fy + 26; dy < fy + fh - 26; dy += 18) {
    ctx.fillRect(fx + 20, dy, 1, 2);
    ctx.fillRect(fx + fw - 21, dy, 1, 2);
  }
}

/**  Level 3 overlay: ghosted PCB traces behind the nano view. */
function drawGhostedPcbLayer(ctx, w, h, accent, time) {
  const alpha = 0.08;

  const gridSize = 26;
  ctx.fillStyle = rgbStr(245, 241, 231, alpha * 0.65);
  for (let gy = 0; gy < h; gy += gridSize) ctx.fillRect(0, gy, w, 1);
  for (let gx = 0; gx < w; gx += gridSize) ctx.fillRect(gx, 0, 1, h);

  const rng = createRng(7777);
  for (let i = 0; i < 16; i++) {
    const tx = Math.floor(rng() * w);
    const ty = Math.floor(rng() * h);
    const len = 46 + Math.floor(rng() * 120);
    const horiz = rng() > 0.5;
    const ta = alpha * 1.1 + Math.sin(time * 1.4 + i * 1.7) * 0.02;
    ctx.fillStyle =
      i % 3 === 0
        ? rgbStr(51, 95, 174, Math.max(0, ta * 0.85))
        : rgbStr(214, 194, 148, Math.max(0, ta));
    if (horiz) ctx.fillRect(tx, ty, len, 1);
    else ctx.fillRect(tx, ty, 1, len);
  }

  for (let i = 0; i < 14; i++) {
    const vx = Math.floor(rng() * w);
    const vy = Math.floor(rng() * h);
    const va = alpha * 1.35 + Math.sin(time * 2.3 + i) * 0.02;
    ctx.fillStyle =
      i % 2 === 0
        ? rgbStr(214, 194, 148, Math.max(0, va))
        : rgbStr(51, 95, 174, Math.max(0, va * 0.85));
    ctx.fillRect(vx - 1, vy - 1, 3, 3);
    ctx.fillStyle = rgbStr(245, 241, 231, Math.max(0, va * 1.2));
    ctx.fillRect(vx, vy, 1, 1);
  }

  const edgeA = 0.06 + Math.sin(time * 1.1) * 0.02;
  ctx.fillStyle = rgbStr(245, 241, 231, edgeA * 0.7);
  ctx.fillRect(16, 16, w - 32, 1);
  ctx.fillRect(16, h - 17, w - 32, 1);
  ctx.fillRect(16, 16, 1, h - 32);
  ctx.fillRect(w - 17, 16, 1, h - 32);

  ctx.fillStyle = rgbStr(51, 95, 174, edgeA * 0.55);
  ctx.fillRect(24, 24, w - 48, 1);
  ctx.fillRect(24, h - 25, w - 48, 1);
}

/* ═══════════════════════════════════════════════════════════════
   CyberGrid -- Three-Level Canvas with Fake-Zoom Transitions
   ═══════════════════════════════════════════════════════════════ */
export default function CyberGrid({
  clusters,
  collectionId = '',
  progress = new Map(),
  isAuthenticated,
  isMobileDevice = false,
  user = null,
  title,
  initialFocusClusterId = null,
  problemMetas = [],
  problemModeStatusBySlug = {},
  solvedSlugs = new Set(),
  freeProblemsRemaining = 0,
  hasReachedWall = false,
  hideMacroOverlay = false,
  onFocusChange,
  onProblemClick,
  onTrialWallHit,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const startTimeRef = useRef(Date.now());
  const touchStartYRef = useRef(null);

  const [canvasWidth, setCanvasWidth] = useState(960);
  const [canvasHeight, setCanvasHeight] = useState(700);
  const [hovered, setHovered] = useState(null);

  /* ── View mode: 'macro' | 'micro' | 'nano' ────────────────── */
  const viewModeRef = useRef(initialFocusClusterId ? 'micro' : 'macro');
  const [viewMode, setViewMode] = useState(viewModeRef.current);

  /* ── Transition state (mutated in frame loop, not React state) */
  const transitionRef = useRef(null);
  // { startTime, from: 'macro'|'micro', to: 'micro'|'nano', data: any }

  /* ── Scroll offset for macro view (mutated in frame loop) ──── */
  const scrollRef = useRef(0);
  const scrollTargetRef = useRef(0);

  /* ── Focused cluster / problem ─────────────────────────────── */
  const [focusedClusterId, setFocusedClusterId] = useState(initialFocusClusterId || null);
  const isBeginner = focusedClusterId === TRIAL_CLUSTER_ID;
  const focusedProblemRef = useRef(null); // { slug, title, difficulty, index }

  /* ── Macro layout ──────────────────────────────────────────── */
  const macroLayout = useMemo(
    () => computeLayout(clusters, canvasWidth, collectionId),
    [clusters, canvasWidth, collectionId]
  );
  const macroLayoutRef = useRef(macroLayout);
  macroLayoutRef.current = macroLayout;

  const totalProblems = useMemo(() => clusters.reduce((s, c) => s + c.slugs.length, 0), [clusters]);

  const tierProgress = useMemo(() => {
    const tp = {};
    for (const node of macroLayout.nodes) {
      const diff = node.tier;
      if (!tp[diff]) tp[diff] = { solved: 0, total: 0 };
      const p = progress.get(node.cluster.id);
      tp[diff].total += node.cluster.slugs.length;
      if (p) tp[diff].solved += p.solved;
    }
    return tp;
  }, [macroLayout, progress]);

  /* ── Focused cluster object ──────────────────────────────────── */
  const focusedCluster = useMemo(
    () => clusters.find((c) => c.id === focusedClusterId),
    [clusters, focusedClusterId]
  );
  const focusedClusterRef = useRef(focusedCluster);
  focusedClusterRef.current = withTrialHomeDemoNode(focusedCluster);

  /* ── Resize observer ───────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0) setCanvasWidth(Math.round(width));
        if (height > 0) setCanvasHeight(Math.round(height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Deep-link: instant zoom on mount ──────────────────────── */
  useEffect(() => {
    if (!initialFocusClusterId) return;
    setFocusedClusterId(initialFocusClusterId);
    viewModeRef.current = 'micro';
    setViewMode('micro');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sync when initial focus prop changes (browser back) ──── */
  const prevInitialRef = useRef(initialFocusClusterId);
  useEffect(() => {
    if (initialFocusClusterId === prevInitialRef.current) return;
    prevInitialRef.current = initialFocusClusterId;
    if (initialFocusClusterId) {
      setFocusedClusterId(initialFocusClusterId);
      viewModeRef.current = 'micro';
      setViewMode('micro');
      focusedProblemRef.current = null;
    } else {
      goBack();
    }
  }, [initialFocusClusterId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Reset if focused cluster leaves the collection ────────── */
  useEffect(() => {
    if (focusedClusterId && !clusters.find((c) => c.id === focusedClusterId)) {
      viewModeRef.current = 'macro';
      setViewMode('macro');
      focusedProblemRef.current = null;
      setFocusedClusterId(null);
      onFocusChange?.(null);
    }
  }, [clusters, focusedClusterId, onFocusChange]);

  /* ── Keep nano payload in sync with async-loaded problem metadata ── */
  useEffect(() => {
    const focusedProblem = focusedProblemRef.current;
    if (!focusedProblem?.slug || !Array.isArray(problemMetas) || problemMetas.length === 0) return;

    const matchedMeta = problemMetas.find(
      (meta) => (meta.slug || meta.titleSlug) === focusedProblem.slug
    );
    if (!matchedMeta) return;

    const merged = {
      ...focusedProblem,
      title: matchedMeta.title || focusedProblem.title || slugToTitle(focusedProblem.slug),
      difficulty: matchedMeta.difficulty || focusedProblem.difficulty || null,
      referenceName: matchedMeta.referenceName || focusedProblem.referenceName || null,
      referenceSlug: matchedMeta.referenceSlug || focusedProblem.referenceSlug || null,
    };

    const unchanged =
      merged.title === focusedProblem.title &&
      merged.difficulty === focusedProblem.difficulty &&
      merged.referenceName === focusedProblem.referenceName &&
      merged.referenceSlug === focusedProblem.referenceSlug;

    if (!unchanged) {
      focusedProblemRef.current = merged;
    }
  }, [problemMetas]);

  /* ── Navigate: macro → micro (transition) ──────────────────── */
  const goToMicro = useCallback(
    (clusterNode, clusterId) => {
      setFocusedClusterId(clusterId);
      onFocusChange?.(clusterId);
      focusedProblemRef.current = null;
      transitionRef.current = {
        startTime: Date.now(),
        from: 'macro',
        to: 'micro',
        data: {
          screenCX: clusterNode.centerX,
          screenCY: clusterNode.centerY - scrollRef.current,
        },
      };
    },
    [onFocusChange]
  );

  /* ── Navigate: micro → nano (transition) ───────────────────── */
  const goToNano = useCallback((problem, screenCX, screenCY) => {
    focusedProblemRef.current = problem;
    transitionRef.current = {
      startTime: Date.now(),
      from: 'micro',
      to: 'nano',
      data: { problem, screenCX, screenCY },
    };
  }, []);

  /* ── Navigate back one level ───────────────────────────────── */
  const goBack = useCallback(() => {
    const mode = viewModeRef.current;
    if (mode === 'nano') {
      focusedProblemRef.current = null;
      transitionRef.current = {
        startTime: Date.now(),
        from: 'nano',
        to: 'micro',
        data: { screenCX: canvasWidth / 2, screenCY: canvasHeight / 2 },
      };
    } else if (mode === 'micro') {
      transitionRef.current = {
        startTime: Date.now(),
        from: 'micro',
        to: 'macro',
        data: { screenCX: canvasWidth / 2, screenCY: canvasHeight / 2 },
      };
      onFocusChange?.(null);
    }
  }, [onFocusChange, canvasWidth, canvasHeight]);

  /* ── Hit testing (dispatches based on viewMode) ────────────── */
  const hitTest = useCallback(
    (mx, my) => {
      // During transitions, disable hit testing
      if (transitionRef.current) return null;

      const mode = viewModeRef.current;

      if (mode === 'nano') {
        const tdOnly = focusedClusterRef.current?.towerDefenseOnly || false;
        const btnId = nanoHitTest(mx, my, canvasWidth, canvasHeight, tdOnly, {
          compactMode: isMobileDevice,
        });
        if (btnId) return { type: 'nano-btn', btn: btnId };
        return { type: 'back-nano' };
      }

      if (mode === 'micro' && focusedClusterRef.current) {
        // Back button area (top-left, matches drawn button: 6,4 → 176,50)
        if (mx < 185 && my < 54) return { type: 'back-micro' };
        const hit = microHitTest(
          mx,
          my,
          focusedClusterRef.current,
          problemMetas,
          canvasWidth,
          canvasHeight,
          { compactMode: isMobileDevice }
        );
        if (hit) return { type: 'problem', node: hit };
        return null;
      }

      // Macro: check cluster chips (screen-space with scroll offset)
      const scrollY = scrollRef.current;
      for (const node of macroLayoutRef.current.nodes) {
        const sx = node.x;
        const sy = node.y - scrollY;
        if (mx >= sx && mx <= sx + node.w && my >= sy && my <= sy + node.h) {
          return { type: 'cluster', node };
        }
      }
      return null;
    },
    [canvasWidth, canvasHeight, problemMetas, isMobileDevice]
  );

  /* ── Mouse handlers ────────────────────────────────────────── */
  const handleMouseMove = useCallback(
    (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      const mx = (e.clientX - rect.left) * (canvasRef.current.width / dpr / rect.width);
      const my = (e.clientY - rect.top) * (canvasRef.current.height / dpr / rect.height);
      mouseRef.current = { x: mx, y: my };
      setHovered(hitTest(mx, my));
    },
    [hitTest]
  );

  const handleClick = useCallback(
    (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      const mx = (e.clientX - rect.left) * (canvasRef.current.width / dpr / rect.width);
      const my = (e.clientY - rect.top) * (canvasRef.current.height / dpr / rect.height);
      const hit = hitTest(mx, my);
      if (!hit) return;

      if (hit.type === 'nano-btn') {
        const prob = focusedProblemRef.current;
        if (prob) onProblemClick?.(prob.slug, prob.index, hit.btn);
        return;
      }
      if (hit.type === 'back-micro' || hit.type === 'back-nano') {
        goBack();
        return;
      }

      // Micro: click a problem → go to nano
      if (viewModeRef.current === 'micro' && hit.type === 'problem') {
        const node = hit.node;
        const fc = focusedClusterRef.current;
        const matchedMeta = problemMetas.find(
          (meta) => (meta.slug || meta.titleSlug) === node.slug
        );

        // Guests not in beginner track can't click anything
        if (!isAuthenticated && !isBeginner) return;

        const unlockedSlugs = new Set(getUnlockedOrderedSlugs(fc?.slugs || [], solvedSlugs));
        if (!unlockedSlugs.has(node.slug)) return;

        // Guest free-problem cap (only in trial cluster)
        if (!isAuthenticated && node.index >= GUEST_FREE_PROBLEM_LIMIT) {
          onTrialWallHit?.();
          return;
        }

        // Guest wall check
        if (!isAuthenticated && hasReachedWall && !solvedSlugs.has(node.slug)) {
          onTrialWallHit?.();
          return;
        }

        goToNano(
          {
            ...node,
            title: matchedMeta?.title || node.title || slugToTitle(node.slug),
            difficulty: matchedMeta?.difficulty || node.difficulty || null,
            referenceName: matchedMeta?.referenceName || node.referenceName || null,
            referenceSlug: matchedMeta?.referenceSlug || node.referenceSlug || null,
          },
          mx,
          my
        );
        return;
      }

      // Macro: click a cluster → go to micro (only if not locked)
      if (viewModeRef.current === 'macro' && hit.type === 'cluster') {
        const clickedCluster = hit.node.cluster;
        const mLayout = macroLayoutRef.current;
        const clickedIdx = mLayout.nodes.indexOf(hit.node);
        let unlocked = false;
        if (clickedIdx === 0) {
          unlocked = true;
        } else if (clickedIdx > 0) {
          const prevNode = mLayout.nodes[clickedIdx - 1];
          const prevP = progress.get(prevNode.cluster.id);
          unlocked = prevP && prevP.solved >= prevP.total && prevP.total > 0;
        }
        // Guest override: only trial cluster
        if (!isAuthenticated && clickedCluster.id !== TRIAL_CLUSTER_ID) {
          unlocked = false;
        }
        // Completed clusters can always be re-entered
        const p = progress.get(clickedCluster.id);
        if (p && p.solved >= p.total && p.total > 0) unlocked = true;
        if (unlocked) {
          goToMicro(hit.node, clickedCluster.id);
        }
        return;
      }
    },
    [
      hitTest,
      isAuthenticated,
      isBeginner,
      problemMetas,
      solvedSlugs,
      hasReachedWall,
      goToMicro,
      goToNano,
      goBack,
      onProblemClick,
      onTrialWallHit,
      progress,
    ]
  );

  /* ── Mouse wheel (macro scroll) ────────────────────────────── */
  const handleWheel = useCallback(
    (e) => {
      if (viewModeRef.current !== 'macro') return;
      e.preventDefault();
      const maxScroll = Math.max(0, macroLayoutRef.current.totalHeight - canvasHeight + 40);
      scrollTargetRef.current = Math.max(
        0,
        Math.min(maxScroll, scrollTargetRef.current + e.deltaY * 0.8)
      );
    },
    [canvasHeight]
  );

  const handleTouchStart = useCallback((e) => {
    if (viewModeRef.current !== 'macro') return;
    if (!e.touches || e.touches.length !== 1) return;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (viewModeRef.current !== 'macro') return;
      if (!e.touches || e.touches.length !== 1) return;
      if (!Number.isFinite(touchStartYRef.current)) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      if (Math.abs(deltaY) < 1) return;

      const maxScroll = Math.max(0, macroLayoutRef.current.totalHeight - canvasHeight + 40);
      scrollTargetRef.current = Math.max(0, Math.min(maxScroll, scrollTargetRef.current + deltaY));
      touchStartYRef.current = currentY;
      e.preventDefault();
    },
    [canvasHeight]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartYRef.current = null;
  }, []);

  /* ── Escape key → go back one level ────────────────────────── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && viewModeRef.current !== 'macro') {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goBack]);

  /* ── Wheel listener (passive: false for preventDefault) ────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel]);

  /* ═══════════════════════════════════════════════════════════════
     Main render loop
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.imageSmoothingEnabled = false;

    let running = true;

    function frame() {
      if (!running) return;

      const now = Date.now();
      const time = (now - startTimeRef.current) / 1000;
      const w = canvasWidth;
      const h = canvasHeight;
      const hideMacroHud = hideMacroOverlay;

      /* ── Process transition (three-phase: zoom → blur → reveal) ── */
      const tr = transitionRef.current;
      let transProgress = -1;
      if (tr) {
        transProgress = Math.min(1, (now - tr.startTime) / TRANSITION_MS);
        if (transProgress >= 1) {
          if (viewModeRef.current !== tr.to) {
            viewModeRef.current = tr.to;
            setViewMode(tr.to);
            if (tr.to === 'macro') {
              setFocusedClusterId(null);
              focusedProblemRef.current = null;
            }
          }
          transitionRef.current = null;
          transProgress = -1;
        }
      }

      /* ── Determine renderMode, zoom, blur based on phase ───── */
      const isForward =
        tr &&
        ((tr.from === 'macro' && tr.to === 'micro') || (tr.from === 'micro' && tr.to === 'nano'));
      let renderMode = viewModeRef.current;
      let zoomScale = 1;
      let zoomCX = w / 2,
        zoomCY = h / 2;
      let blurAlpha = 0;

      if (tr && transProgress >= 0) {
        const sCX = tr.data.screenCX ?? w / 2;
        const sCY = tr.data.screenCY ?? h / 2;

        if (isForward) {
          if (transProgress < ZOOM_PHASE_END) {
            // Phase A: zoom into old view
            renderMode = tr.from;
            const zp = transProgress / ZOOM_PHASE_END;
            zoomScale = 1 + zp * (MAX_ZOOM_SCALE - 1);
            zoomCX = sCX;
            zoomCY = sCY;
            blurAlpha = zp * 0.85;
          } else if (transProgress < BLUR_PHASE_END) {
            // Phase B: full blur – swap mode
            if (viewModeRef.current !== tr.to) {
              viewModeRef.current = tr.to;
              setViewMode(tr.to);
              if (tr.to === 'macro') {
                setFocusedClusterId(null);
                focusedProblemRef.current = null;
              }
            }
            renderMode = null;
            blurAlpha = 1;
          } else {
            // Phase C: reveal new view
            renderMode = tr.to;
            const rp = (transProgress - BLUR_PHASE_END) / (1 - BLUR_PHASE_END);
            blurAlpha = 1 - rp;
          }
        } else {
          // Backward: blur → swap → reveal (no zoom)
          if (transProgress < ZOOM_PHASE_END) {
            renderMode = tr.from;
            blurAlpha = transProgress / ZOOM_PHASE_END;
          } else if (transProgress < BLUR_PHASE_END) {
            if (viewModeRef.current !== tr.to) {
              viewModeRef.current = tr.to;
              setViewMode(tr.to);
              if (tr.to === 'macro') {
                setFocusedClusterId(null);
                focusedProblemRef.current = null;
              }
            }
            renderMode = null;
            blurAlpha = 1;
          } else {
            renderMode = tr.to;
            const rp = (transProgress - BLUR_PHASE_END) / (1 - BLUR_PHASE_END);
            blurAlpha = 1 - rp;
          }
        }
      }

      /* ── Lerp macro scroll ─────────────────────────────────── */
      scrollRef.current += (scrollTargetRef.current - scrollRef.current) * SCROLL_LERP;

      /* ── Clear & DPR scale ─────────────────────────────────── */
      ctx.save();
      ctx.scale(dpr, dpr);

      /* ── Zoom transform for forward transitions ────────────── */
      if (zoomScale !== 1) {
        ctx.save();
        ctx.translate(zoomCX, zoomCY);
        ctx.scale(zoomScale, zoomScale);
        ctx.translate(-zoomCX, -zoomCY);
      }

      /* ── Dark fill when renderMode is null (full-blur phase) ─ */
      if (renderMode === null) {
        ctx.fillStyle = '#07080a';
        ctx.fillRect(0, 0, w, h);
      }

      /* ══════════════════════════════════════════════════════════
         MACRO RENDER
         ══════════════════════════════════════════════════════════ */
      if (renderMode === 'macro') {
        drawBackground(ctx, w, h, time);

        ctx.save();
        ctx.translate(0, -scrollRef.current);

        const mLayout = macroLayoutRef.current;

        if (!hideMacroHud) {
          // Tier headers + voltage bars
          for (const tier of mLayout.tiers) {
            drawTierHeader(ctx, tier, time);
            const tp =
              tierProgress[
                Object.keys(TIER_CONFIG).find((k) => TIER_CONFIG[k].label === tier.label)
              ];
            const prog = tp ? (tp.total > 0 ? tp.solved / tp.total : 0) : 0;
            drawVoltageBar(
              ctx,
              tier.x,
              tier.barY,
              tier.width,
              VOLTAGE_BAR_H,
              prog,
              tier.color,
              time
            );
          }
        }

        // Edges (data streams)
        const edgeRng = createRng(42);
        for (const edge of mLayout.edges) {
          drawDataStream(
            ctx,
            edge.from.centerX,
            edge.from.centerY,
            edge.to.centerX,
            edge.to.centerY,
            edge.color,
            time,
            edgeRng,
            0.6
          );
        }

        // Travelling pulses
        for (const pulse of spawnPulses(mLayout.edges, time)) {
          drawGlitchBit(ctx, pulse.x, pulse.y, 8, pulse.color, time);
        }

        // Cluster chips — sequential unlock for ALL users
        for (let ci = 0; ci < mLayout.nodes.length; ci++) {
          const node = mLayout.nodes[ci];
          const c = node.cluster;
          const p = progress.get(c.id);
          let chipState;

          if (p && p.solved >= p.total && p.total > 0) {
            // Fully completed cluster
            chipState = 'complete';
          } else if (ci === 0) {
            // First cluster always active
            chipState = 'active';
          } else {
            // Previous cluster must be fully completed
            const prevNode = mLayout.nodes[ci - 1];
            const prevP = progress.get(prevNode.cluster.id);
            chipState =
              prevP && prevP.solved >= prevP.total && prevP.total > 0 ? 'active' : 'locked';
          }
          // Guest override: only trial cluster can be active
          if (!isAuthenticated && c.id !== TRIAL_CLUSTER_ID && chipState !== 'complete') {
            chipState = 'locked';
          }

          // Hover glow (only if not locked)
          const isHov = hovered?.type === 'cluster' && hovered.node === node;
          if (isHov && chipState !== 'locked') {
            const [hr, hg, hb] = hexToRgb(c.accent);
            ctx.fillStyle = rgbStr(hr, hg, hb, 0.06 + Math.sin(time * 4) * 0.02);
            ctx.fillRect(node.x - 8, node.y - 8, NODE_SIZE + 16, NODE_SIZE + 16);
          }

          const variant = getVariantIndex(c);
          drawVariantChip(
            ctx,
            node.x,
            node.y,
            NODE_SIZE,
            c.accent,
            chipState,
            time,
            c.shortTitle,
            variant,
            {}
          );

          // Problem count label
          ctx.fillStyle =
            chipState === 'locked' ? 'rgba(84, 82, 78, 0.55)' : 'rgba(34, 34, 34, 0.72)';
          ctx.font = '9px Tahoma, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${c.slugs.length}p`, node.centerX, node.y + NODE_SIZE + 12);
        }

        ctx.restore(); // scroll translate

        /* ── Macro HUD ─────────────────────────────────────────── */
        if (!hideMacroHud) {
          // Title backdrop
          ctx.fillStyle = RETRO_WINDOW;
          ctx.fillRect(0, 0, w, 90);
          const headerGradient = ctx.createLinearGradient(0, 0, w, 0);
          headerGradient.addColorStop(0, RETRO_HEADER_BLUE);
          headerGradient.addColorStop(1, RETRO_HEADER_BLUE_END);
          ctx.fillStyle = headerGradient;
          ctx.fillRect(0, 0, w, 20);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(0, 20, w, 1);
          drawTitle(ctx, w, totalProblems, clusters.length, time, title);

          if (!isAuthenticated) {
            const bannerY = 80;
            ctx.fillStyle = RETRO_WINDOW_FACE;
            ctx.fillRect(34, bannerY, 300, 20);
            drawPixelRect(ctx, 34, bannerY, 300, 20, '#6a645a', 1);
            ctx.fillStyle = '#254f84';
            ctx.font = '10px Tahoma, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('SIGN IN TO TRACK PROGRESS & SOLVE', 42, bannerY + 10);
          }

          // Cluster tooltip
          if (hovered?.type === 'cluster') {
            drawClusterTooltip(
              ctx,
              hovered.node,
              mouseRef.current.x,
              mouseRef.current.y,
              isAuthenticated,
              TRIAL_CLUSTER_ID
            );
          }

          // Player profile HUD (guest + authenticated)
          drawProfileCard(ctx, w, h, user, time, {
            isGuest: !isAuthenticated,
            guestLabel: 'Guest',
            guestCta: 'Sign up to save cluster progress',
          });
        }
      }

      /* ══════════════════════════════════════════════════════════
         MICRO RENDER (Level 2: PCB interior)
         ══════════════════════════════════════════════════════════ */
      if (renderMode === 'micro' && focusedClusterRef.current) {
        const fc = focusedClusterRef.current;
        const hovSlug = hovered?.type === 'problem' ? hovered.node.slug : null;
        renderMicroView(ctx, w, h, fc, problemMetas, solvedSlugs, hovSlug, time, isAuthenticated, {
          freeProblemLimit: GUEST_FREE_PROBLEM_LIMIT,
          freeProblemsRemaining,
          hasReachedWall,
          isTrial: isBeginner,
          compactMode: isMobileDevice,
        });
        // Ghosted chip-shell parent overlay (drawn ON TOP so it's visible)
        drawGhostedChipFrame(ctx, w, h, fc.accent, time);

        // Player profile HUD (guest + authenticated)
        if (!isMobileDevice) {
          drawProfileCard(ctx, w, h, user, time, {
            isGuest: !isAuthenticated,
            guestLabel: 'Guest',
            guestCta: 'Sign up to save cluster progress',
          });
        }
      }

      /* ══════════════════════════════════════════════════════════
         NANO RENDER (Level 3: Problem focus)
         ══════════════════════════════════════════════════════════ */
      if (renderMode === 'nano' && focusedProblemRef.current && focusedClusterRef.current) {
        const accent = focusedClusterRef.current.accent;
        const tdOnly = focusedClusterRef.current.towerDefenseOnly || false;
        const prob = focusedProblemRef.current;
        const solved = solvedSlugs.has(prob.slug);
        const hovBtn = hovered?.type === 'nano-btn' ? hovered.btn : null;
        const modeStatus = problemModeStatusBySlug[prob.slug] || null;
        renderNanoView(ctx, w, h, prob, solved, hovBtn, time, accent, tdOnly, modeStatus, {
          compactMode: isMobileDevice,
        });
        // Ghosted PCB parent overlay (drawn ON TOP so it's visible)
        drawGhostedPcbLayer(ctx, w, h, accent, time);

        // Player profile HUD (guest + authenticated)
        if (!isMobileDevice) {
          drawProfileCard(ctx, w, h, user, time, {
            isGuest: !isAuthenticated,
            guestLabel: 'Guest',
            guestCta: 'Sign up to save cluster progress',
          });
        }
      }

      /* ── Undo zoom transform ────────────────────────────────── */
      if (zoomScale !== 1) ctx.restore();

      /* ══════════════════════════════════════════════════════════
         CYBER-STATIC TRANSITION OVERLAY
         ══════════════════════════════════════════════════════════ */
      if (blurAlpha > 0) {
        drawCyberStaticTransition(ctx, w, h, blurAlpha, time, zoomCX, zoomCY);
      }

      /* ── Scanlines (always) ────────────────────────────────── */
      drawScanlines(ctx, 0, 0, w, h, 3, 0.04);

      ctx.restore(); // dpr scale
      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [
    canvasWidth,
    canvasHeight,
    clusters,
    totalProblems,
    isAuthenticated,
    user,
    progress,
    hovered,
    tierProgress,
    title,
    focusedClusterId,
    solvedSlugs,
    isBeginner,
    freeProblemsRemaining,
    hasReachedWall,
    hideMacroOverlay,
    problemMetas,
    problemModeStatusBySlug,
    viewMode,
    collectionId,
    isMobileDevice,
  ]);

  /* ── Cursor style ──────────────────────────────────────────── */
  const cursorStyle = useMemo(() => {
    if (!hovered) return 'default';
    const mode = viewModeRef.current;
    if (hovered.type === 'back-micro' || hovered.type === 'back-nano') return 'pointer';
    if (hovered.type === 'nano-btn') return 'pointer';
    if (hovered.type === 'cluster') {
      // pointer only for clusters that would actually be clickable (not locked)
      const cId = hovered.node.cluster.id;
      const mLayout = macroLayoutRef.current;
      const idx = mLayout.nodes.indexOf(hovered.node);
      let unlocked = idx === 0;
      if (idx > 0) {
        const prevP = progress.get(mLayout.nodes[idx - 1].cluster.id);
        unlocked = prevP && prevP.solved >= prevP.total && prevP.total > 0;
      }
      const p = progress.get(cId);
      if (p && p.solved >= p.total && p.total > 0) unlocked = true;
      if (!isAuthenticated && cId !== TRIAL_CLUSTER_ID) unlocked = false;
      return unlocked ? 'pointer' : 'default';
    }
    if (hovered.type === 'problem' && mode === 'micro') {
      const fc = focusedClusterRef.current;
      if (!fc) return 'default';
      const unlockedSlugs = new Set(getUnlockedOrderedSlugs(fc.slugs || [], solvedSlugs));
      const hoveredSlug = hovered.node?.slug;
      const hoveredIndex = hovered.node?.index;

      if (!hoveredSlug || !unlockedSlugs.has(hoveredSlug)) return 'default';
      if (
        !isAuthenticated &&
        hoveredIndex >= GUEST_FREE_PROBLEM_LIMIT &&
        !solvedSlugs.has(hoveredSlug)
      ) {
        return 'default';
      }
      if (!isAuthenticated && hasReachedWall && !solvedSlugs.has(hoveredSlug)) {
        return 'default';
      }
      return 'pointer';
    }
    return 'default';
  }, [hovered, isAuthenticated, progress, solvedSlugs, hasReachedWall]);

  /* ── JSX ───────────────────────────────────────────────────── */
  return (
    <Box ref={containerRef} w="100%" h="100%" position="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          mouseRef.current = { x: -1000, y: -1000 };
          setHovered(null);
        }}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: cursorStyle,
          imageRendering: 'pixelated',
        }}
      />
    </Box>
  );
}
