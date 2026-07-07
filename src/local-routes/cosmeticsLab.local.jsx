/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Select,
  SimpleGrid,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { drawEnemy } from '../game-engine-v2/renderer/enemies.js';
import { drawTower } from '../game-engine-v2/renderer/towers.js';
import GameCanvasV2 from '../components/towerDefense/ui/board/GameCanvasV2';
import ProfileHeader from '../components/profileDashboard/ProfileHeader';
import {
  COSMETIC_PREVIEW_SNIPPET,
  EDITOR_BACKGROUND_PACKS,
  EDITOR_EFFECT_PACKS,
  EDITOR_THEME_PACKS,
  OPEN_SOURCE_FONT_PACKS,
  TD_BACKGROUND_PACKS,
  TD_MAP_PACKS,
  TOWER_PACKS,
  ENEMY_PACKS,
  TD_DAMAGE_TEXT_PACKS,
  TD_DEATH_FX_PACKS,
  PROFILE_BACKGROUND_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  PROFILE_BADGE_PACKS,
} from '../data/cosmetics/quickCosmeticPacks';
import {
  buildMonacoOptionsFromFont,
  ensureMonacoTheme,
  getMonacoThemeName,
} from '../utils/monaco/cosmeticThemeTools';
import { applyCustomTokenProviders } from '../utils/monaco/towerTokenProviders';

const Canvas = chakra('canvas');

const FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;500;600;700&family=Courier+Prime:wght@400;700&family=Fira+Code:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&family=Inconsolata:wght@400;700&family=JetBrains+Mono:wght@400;500;700&family=Roboto+Mono:wght@400;500;700&family=Source+Code+Pro:wght@400;600;700&family=Space+Mono:wght@400;700&family=Ubuntu+Mono:wght@400;700&family=Victor+Mono:wght@400;500;700&display=swap';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 520;

const LIGHTNING_INTERNAL_MODES = [
  { id: 'edge-sweep', name: 'Edge Sweep' },
  { id: 'cross-pulse', name: 'Cross Pulse' },
  { id: 'orbit-spark', name: 'Orbit Spark' },
];

const LIGHTNING_LINK_MODES = [
  { id: 'off', name: 'Off' },
  { id: 'soft-link', name: 'Soft Link' },
];

const PATH_GRADIENT_MODES = [
  { id: 'amber-flow', name: 'Amber Flow' },
  { id: 'plasma-ribbon', name: 'Plasma Ribbon' },
  { id: 'neon-vein', name: 'Neon Vein' },
  { id: 'flat', name: 'Flat Path' },
];

const TD_ATTACK_FX_MODES = [
  { id: 'pulse-rings', name: 'Pulse Rings' },
  { id: 'ember-sparks', name: 'Ember Sparks' },
  { id: 'ion-scan', name: 'Ion Scan' },
  { id: 'marker-burst', name: 'Marker Burst' },
  { id: 'data-stream', name: 'Data Stream' },
  { id: 'void-tendrils', name: 'Void Tendrils' },
  { id: 'none', name: 'None' },
];

const TD_PATH_NODES = [
  { col: 0, row: 5 },
  { col: 3, row: 5 },
  { col: 3, row: 8 },
  { col: 8, row: 8 },
  { col: 8, row: 3 },
  { col: 6, row: 3 },
  { col: 6, row: 2 },
  { col: 12, row: 2 },
  { col: 12, row: 9 },
  { col: 14, row: 9 },
  { col: 14, row: 4 },
  { col: 16, row: 4 },
  { col: 16, row: 8 },
  { col: 17, row: 8 },
  { col: 17, row: 5 },
  { col: 19, row: 5 },
];

const TD_PREVIEW_TOWER_POSITIONS = [
  { type: 'Function', row: 4, col: 5 },
  { type: 'ForLoop', row: 7, col: 10 },
  { type: 'Variable', row: 3, col: 15 },
  { type: 'Function', row: 8, col: 6 },
];

const isLocalHost = () => {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

const getPackById = (packs, id) => packs.find((pack) => pack.id === id) || packs[0];

const expandPathNodes = (waypoints) => {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return [];

  const expanded = [[waypoints[0].row, waypoints[0].col]];
  for (let i = 1; i < waypoints.length; i += 1) {
    const prev = waypoints[i - 1];
    const next = waypoints[i];

    if (prev.row === next.row) {
      const step = next.col > prev.col ? 1 : -1;
      for (let col = prev.col + step; col !== next.col + step; col += step) {
        expanded.push([prev.row, col]);
      }
    } else if (prev.col === next.col) {
      const step = next.row > prev.row ? 1 : -1;
      for (let row = prev.row + step; row !== next.row + step; row += step) {
        expanded.push([row, prev.col]);
      }
    }
  }

  return expanded;
};

const hashNoise = (seed) => {
  const x = Math.sin(seed * 997.13) * 43758.5453123;
  return x - Math.floor(x);
};

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((ch) => ch + ch)
        .join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) return { r: 255, g: 255, b: 255 };
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const mixHexColor = (a, b, t) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const blend = Math.max(0, Math.min(1, t));
  const r = Math.round(ca.r + (cb.r - ca.r) * blend);
  const g = Math.round(ca.g + (cb.g - ca.g) * blend);
  const bb = Math.round(ca.b + (cb.b - ca.b) * blend);
  return `rgb(${r}, ${g}, ${bb})`;
};

const getPaletteBlend = (palette, phase) => {
  if (!Array.isArray(palette) || palette.length === 0) return '#ffffff';
  if (palette.length === 1) return palette[0];
  const wrapped = ((phase % 1) + 1) % 1;
  const scaled = wrapped * palette.length;
  const i = Math.floor(scaled) % palette.length;
  const j = (i + 1) % palette.length;
  const t = scaled - Math.floor(scaled);
  return mixHexColor(palette[i], palette[j], t);
};

const drawLightningBolt = (ctx, startX, startY, endX, endY, jitter, color, glow) => {
  const segments = 7;
  const dx = (endX - startX) / segments;
  const dy = (endY - startY) / segments;

  ctx.save();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < segments; i += 1) {
    const offset = (hashNoise(i * 13.7 + jitter) - 0.5) * 16;
    ctx.lineTo(startX + dx * i + offset, startY + dy * i);
  }
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < segments; i += 1) {
    const offset = (hashNoise(i * 17.3 + jitter * 2.1) - 0.5) * 12;
    ctx.lineTo(startX + dx * i + offset, startY + dy * i);
  }
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
};

const pointOnSquarePerimeter = (centerX, centerY, halfSize, t) => {
  const normalized = ((t % 1) + 1) % 1;
  const perimeter = halfSize * 8;
  const d = normalized * perimeter;

  if (d < halfSize * 2) {
    return { x: centerX - halfSize + d, y: centerY - halfSize };
  }
  if (d < halfSize * 4) {
    return { x: centerX + halfSize, y: centerY - halfSize + (d - halfSize * 2) };
  }
  if (d < halfSize * 6) {
    return { x: centerX + halfSize - (d - halfSize * 4), y: centerY + halfSize };
  }
  return { x: centerX - halfSize, y: centerY + halfSize - (d - halfSize * 6) };
};

const drawTowerInternalLightning = (
  ctx,
  centerX,
  centerY,
  towerSize,
  elapsed,
  mode,
  color,
  glow
) => {
  const half = towerSize * 0.34;
  const speed = 0.28;
  const t = elapsed * speed;

  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - half, centerY - half, half * 2, half * 2);
  ctx.clip();

  if (mode === 'cross-pulse') {
    const a = pointOnSquarePerimeter(centerX, centerY, half, t);
    const b = pointOnSquarePerimeter(centerX, centerY, half, t + 0.5);
    const c = pointOnSquarePerimeter(centerX, centerY, half, t + 0.25);
    const d = pointOnSquarePerimeter(centerX, centerY, half, t + 0.75);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, elapsed * 2.2, color, glow);
    drawLightningBolt(ctx, c.x, c.y, d.x, d.y, elapsed * 1.9, color, glow);
  } else if (mode === 'orbit-spark') {
    const a = pointOnSquarePerimeter(centerX, centerY, half, t);
    const b = pointOnSquarePerimeter(centerX, centerY, half, t + 0.18);
    const c = pointOnSquarePerimeter(centerX, centerY, half, t + 0.36);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, elapsed * 2.6, color, glow);
    drawLightningBolt(ctx, b.x, b.y, c.x, c.y, elapsed * 2.1, color, glow);
  } else {
    const a = pointOnSquarePerimeter(centerX, centerY, half, t);
    const b = pointOnSquarePerimeter(centerX, centerY, half, t + 0.5);
    drawLightningBolt(ctx, a.x, a.y, b.x, b.y, elapsed * 2.4, color, glow);
  }

  ctx.restore();
};

const getPathPoints = (cellSize) =>
  TD_PATH_NODES.map((node) => ({
    x: (node.col + 0.5) * cellSize,
    y: (node.row + 0.5) * cellSize,
  }));

const drawPathCells = (ctx, nodes, cellSize, tdMapPack) => {
  if (!Array.isArray(nodes) || nodes.length < 2) return;

  const inset = cellSize * 0.12;
  const tileSize = cellSize - inset * 2;

  ctx.save();
  ctx.fillStyle = tdMapPack.pathColor;
  ctx.globalAlpha = 0.42;

  nodes.forEach((node) => {
    const x = node.col * cellSize + inset;
    const y = node.row * cellSize + inset;
    ctx.fillRect(x, y, tileSize, tileSize);
  });

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const minCol = Math.min(a.col, b.col);
    const maxCol = Math.max(a.col, b.col);
    const minRow = Math.min(a.row, b.row);
    const maxRow = Math.max(a.row, b.row);

    if (a.row === b.row) {
      const y = a.row * cellSize + inset;
      const x = minCol * cellSize + inset;
      const w = (maxCol - minCol + 1) * cellSize - inset * 2;
      ctx.fillRect(x, y, w, tileSize);
    } else if (a.col === b.col) {
      const x = a.col * cellSize + inset;
      const y = minRow * cellSize + inset;
      const h = (maxRow - minRow + 1) * cellSize - inset * 2;
      ctx.fillRect(x, y, tileSize, h);
    }
  }

  ctx.strokeStyle = tdMapPack.laneBorderColor;
  ctx.globalAlpha = 0.46;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const ax = (a.col + 0.5) * cellSize;
    const ay = (a.row + 0.5) * cellSize;
    const bx = (b.col + 0.5) * cellSize;
    const by = (b.row + 0.5) * cellSize;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.restore();
};

const getPathPointAtProgress = (points, progress) => {
  if (!Array.isArray(points) || points.length < 2) return { x: 0, y: 0 };

  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len });
    totalLength += len;
  }

  const wrapped = ((progress % 1) + 1) % 1;
  let dist = wrapped * totalLength;
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (dist <= seg.len || i === segments.length - 1) {
      const t = seg.len <= 0 ? 0 : dist / seg.len;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
      };
    }
    dist -= seg.len;
  }

  return points[points.length - 1];
};

const drawPathGradient = (ctx, mode, pathPoints, elapsed, tdMapPack, baseWidth) => {
  if (!Array.isArray(pathPoints) || pathPoints.length < 2) return;

  const path = new Path2D();
  path.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i += 1) {
    path.lineTo(pathPoints[i].x, pathPoints[i].y);
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = baseWidth;
  ctx.strokeStyle = tdMapPack.pathColor;
  ctx.globalAlpha = 0.88;
  ctx.stroke(path);

  if (mode === 'flat') {
    ctx.restore();
    return;
  }

  let gradient;
  if (mode === 'plasma-ribbon') {
    const shift = (Math.sin(elapsed * 0.9) + 1) * 0.5;
    gradient = ctx.createLinearGradient(pathPoints[0].x, pathPoints[0].y, pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
    gradient.addColorStop(0, tdMapPack.pathInnerColor);
    gradient.addColorStop(Math.max(0.2, Math.min(0.8, shift)), 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, tdMapPack.pathColor);
  } else if (mode === 'neon-vein') {
    const pulse = (Math.sin(elapsed * 2.1) + 1) * 0.5;
    const mid = pathPoints[Math.floor(pathPoints.length / 2)];
    gradient = ctx.createRadialGradient(mid.x, mid.y, baseWidth * 0.25, mid.x, mid.y, baseWidth * 5);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.16 + pulse * 0.2})`);
    gradient.addColorStop(0.35, tdMapPack.pathInnerColor);
    gradient.addColorStop(1, tdMapPack.pathColor);
  } else {
    const start = pathPoints[0];
    const end = pathPoints[pathPoints.length - 1];
    gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, tdMapPack.pathColor);
    gradient.addColorStop(0.5, 'rgba(255, 240, 180, 0.2)');
    gradient.addColorStop(1, tdMapPack.pathInnerColor);
  }

  ctx.globalAlpha = 0.95;
  ctx.lineWidth = baseWidth * 0.62;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = gradient;
  ctx.stroke(path);
  ctx.restore();
};

const drawCamoOverlay = (ctx, centerX, centerY, size, palette, elapsed, towerIndex) => {
  if (!Array.isArray(palette) || palette.length < 2) return;

  const phase = elapsed * 0.06 + towerIndex * 0.18;
  const c0 = getPaletteBlend(palette, phase);
  const c1 = getPaletteBlend(palette, phase + 0.21);
  const c2 = getPaletteBlend(palette, phase + 0.47);

  ctx.save();
  ctx.beginPath();
  ctx.rect(centerX - size / 2, centerY - size / 2, size, size);
  ctx.clip();

  const baseGrad = ctx.createLinearGradient(
    centerX - size * 0.5,
    centerY - size * 0.5,
    centerX + size * 0.5,
    centerY + size * 0.5
  );
  baseGrad.addColorStop(0, c0);
  baseGrad.addColorStop(0.5, c1);
  baseGrad.addColorStop(1, c2);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = baseGrad;
  ctx.fillRect(centerX - size / 2, centerY - size / 2, size, size);

  for (let i = 0; i < 7; i += 1) {
    const color = getPaletteBlend(palette, phase + i * 0.13);
    const drift = elapsed * 0.4 + towerIndex * 0.8;
    const radius = size * (0.1 + hashNoise(towerIndex * 17 + i * 0.5) * 0.2);
    const x = centerX + Math.sin(drift + i * 0.7) * size * 0.18 + (hashNoise(towerIndex * 11 + i) - 0.5) * size * 0.22;
    const y = centerY + Math.cos(drift * 0.8 + i * 0.9) * size * 0.16 + (hashNoise(towerIndex * 7 + i * 2.1) - 0.5) * size * 0.2;
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      radius,
      radius * (0.65 + hashNoise(towerIndex * 3 + i * 3.3) * 0.5),
      hashNoise(towerIndex * 13 + i) * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
};

const drawSimpleProjectile = (ctx, startX, startY, targetX, targetY, progress, color) => {
  const x = startX + (targetX - startX) * progress;
  const y = startY + (targetY - startY) * progress;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawAttackFx = (ctx, fxId, towers, elapsed, color) => {
  ctx.save();

  if (fxId === 'pulse-rings') {
    towers.forEach((tower, index) => {
      const phase = (elapsed * 0.9 + index * 0.22) % 1;
      const radius = 8 + phase * 26;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.22 * (1 - phase);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (fxId === 'ember-sparks') {
    towers.forEach((tower, index) => {
      for (let i = 0; i < 3; i += 1) {
        const noise = hashNoise(elapsed * 1.2 + index * 3 + i * 1.9);
        const angle = (elapsed * 1.8 + i * 2.1 + index) % (Math.PI * 2);
        const radius = 10 + noise * 24;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.24;
        ctx.beginPath();
        ctx.arc(tower.x + Math.cos(angle) * radius, tower.y + Math.sin(angle) * radius, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  } else if (fxId === 'ion-scan') {
    const sweep = (elapsed * 80) % 420;
    ctx.fillStyle = `${color}22`;
    ctx.fillRect(60, 48 + sweep * 0.35, 1080, 14);
  } else if (fxId === 'marker-burst') {
    towers.forEach((tower, index) => {
      const spin = elapsed * 1.7 + index;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tower.x + Math.cos(spin) * 10, tower.y + Math.sin(spin) * 10);
      ctx.lineTo(tower.x + Math.cos(spin) * 24, tower.y + Math.sin(spin) * 24);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tower.x + Math.cos(spin + Math.PI) * 10, tower.y + Math.sin(spin + Math.PI) * 10);
      ctx.lineTo(tower.x + Math.cos(spin + Math.PI) * 24, tower.y + Math.sin(spin + Math.PI) * 24);
      ctx.stroke();
    });
  }

  ctx.restore();
};

const ColorChip = ({ label, color }) => (
  <HStack spacing={2} minW="180px">
    <Box
      w="16px"
      h="16px"
      borderRadius="sm"
      bg={color}
      border="1px solid rgba(226, 232, 240, 0.45)"
      boxShadow={`0 0 10px ${color}66`}
    />
    <Text fontSize="xs" color="#94A3B8" fontFamily="monospace">
      {label}
    </Text>
  </HStack>
);

function CosmeticsLabPage() {
  const monacoInstance = useMonaco();
  const useRealGameCanvas = true;
  const [themeId, setThemeId] = useState(EDITOR_THEME_PACKS[0].id);
  const [fontId, setFontId] = useState(OPEN_SOURCE_FONT_PACKS[0].id);
  const [backgroundId, setBackgroundId] = useState(EDITOR_BACKGROUND_PACKS[0].id);
  const [effectId, setEffectId] = useState(EDITOR_EFFECT_PACKS[0].id);
  const [tdMapPackId, setTdMapPackId] = useState(TD_MAP_PACKS[0].id);
  const [tdBackgroundPackId, setTdBackgroundPackId] = useState(TD_BACKGROUND_PACKS[0].id);
  const [towerPackId, setTowerPackId] = useState('lightning-core');
  const [enemyPackId, setEnemyPackId] = useState('default');
  const [lightningInternalMode, setLightningInternalMode] = useState('edge-sweep');
  const [lightningLinkMode, setLightningLinkMode] = useState('off');
  const [pathGradientMode, setPathGradientMode] = useState('amber-flow');
  const [tdAttackFxMode, setTdAttackFxMode] = useState('none');
  const [damageTextPackId, setDamageTextPackId] = useState('default');
  const [deathFxPackId, setDeathFxPackId] = useState('default');
  const [profileBackgroundPackId, setProfileBackgroundPackId] = useState(
    PROFILE_BACKGROUND_PACKS[0].id
  );
  const [profileCardPackId, setProfileCardPackId] = useState(PROFILE_CALLING_CARD_PACKS[0].id);
  const [profileBadgePackId, setProfileBadgePackId] = useState(PROFILE_BADGE_PACKS[0].id);
  const [mountedAt, setMountedAt] = useState(() => Date.now());
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const gameCanvasRef = useRef(null);
  const previewDifficultyRef = useRef(0);

  const themePack = useMemo(() => getPackById(EDITOR_THEME_PACKS, themeId), [themeId]);
  const fontPack = useMemo(() => getPackById(OPEN_SOURCE_FONT_PACKS, fontId), [fontId]);
  const backgroundPack = useMemo(
    () => getPackById(EDITOR_BACKGROUND_PACKS, backgroundId),
    [backgroundId]
  );
  const effectPack = useMemo(() => getPackById(EDITOR_EFFECT_PACKS, effectId), [effectId]);
  const tdMapPack = useMemo(() => getPackById(TD_MAP_PACKS, tdMapPackId), [tdMapPackId]);
  const tdBackgroundPack = useMemo(
    () => getPackById(TD_BACKGROUND_PACKS, tdBackgroundPackId),
    [tdBackgroundPackId]
  );
  const towerPack = useMemo(() => getPackById(TOWER_PACKS, towerPackId), [towerPackId]);
  const enemyPack = useMemo(
    () => (enemyPackId === 'default' ? null : getPackById(ENEMY_PACKS, enemyPackId)),
    [enemyPackId]
  );
  const damageTextPack = useMemo(
    () => (damageTextPackId === 'default' ? null : getPackById(TD_DAMAGE_TEXT_PACKS, damageTextPackId)),
    [damageTextPackId]
  );
  const deathFxPack = useMemo(
    () => (deathFxPackId === 'default' ? null : getPackById(TD_DEATH_FX_PACKS, deathFxPackId)),
    [deathFxPackId]
  );
  const profileBackgroundPack = useMemo(
    () => getPackById(PROFILE_BACKGROUND_PACKS, profileBackgroundPackId),
    [profileBackgroundPackId]
  );
  const profileCallingCardPack = useMemo(
    () => getPackById(PROFILE_CALLING_CARD_PACKS, profileCardPackId),
    [profileCardPackId]
  );
  const profileBadgePack = useMemo(
    () => getPackById(PROFILE_BADGE_PACKS, profileBadgePackId),
    [profileBadgePackId]
  );
  const profilePreviewUserData = useMemo(
    () => ({
      id: 1,
      username: 'rivie13',
      email: 'rivie13@codegrind.local',
      hasPassword: true,
      bio: "Riv's bio",
      avatarUrl: '',
      createdAt: '2025-07-07T00:00:00.000Z',
      membershipTier: 'FREE',
      subscriptionStatus: null,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCancelAt: null,
      discordProfile: { linked: false, level: 1 },
      progress: {
        level: 5,
        roleName: 'Script Kiddie',
        xpIntoLevel: 589,
        xpToNextLevel: 618,
      },
      equippedCosmetics: {},
    }),
    []
  );
  const enemyBodyColor = enemyPack?.enemyBodyColor || '#6B7280';
  const enemyHighlightColor = enemyPack?.enemyHighlightColor || '#9CA3AF';
  const tdBoardTheme = useMemo(
    () => ({
      ...tdBackgroundPack,
      ...tdMapPack,
    }),
    [tdBackgroundPack, tdMapPack]
  );
  const densePathNodes = useMemo(() => expandPathNodes(TD_PATH_NODES), []);
  const tdGeneratedMap = useMemo(() => {
    const rows = 10;
    const cols = 20;
    const map = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    densePathNodes.forEach(([row, col]) => {
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        map[row][col] = 1;
      }
    });
    return {
      rows,
      cols,
      map,
      pathNodes: densePathNodes,
    };
  }, [densePathNodes]);
  const editorThemeOverrides = useMemo(
    () => ({
      editorColors: {
        background: '#00000000',
        lineHighlight: '#ffffff10',
      },
      monacoColors: {
        'editorGutter.background': '#00000000',
      },
    }),
    []
  );

  useEffect(() => {
    if (!monacoInstance || !themePack) return;
    ensureMonacoTheme(monacoInstance, themePack, editorThemeOverrides);
    monacoInstance.editor.setTheme(getMonacoThemeName(themePack.id));
  }, [editorThemeOverrides, monacoInstance, themePack]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_STYLESHEET_URL;
    link.setAttribute('data-cg-cosmetic-fonts', 'true');
    document.head.appendChild(link);

    return () => {
      const existing = document.querySelector('link[data-cg-cosmetic-fonts="true"]');
      if (existing?.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, []);

  useEffect(() => {
    if (useRealGameCanvas) return undefined;

    const render = (timestamp) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) {
        rafRef.current = window.requestAnimationFrame(render);
        return;
      }

      const elapsed = (timestamp - mountedAt) * 0.001;
      const width = canvas.width;
      const height = canvas.height;
      const cellSize = 52;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tdBackgroundPack.mapBackground;
      ctx.fillRect(0, 0, width, height);

      const stageWidth = width;
      const stageHeight = height;

      const vignette = ctx.createRadialGradient(
        stageWidth / 2,
        stageHeight / 2,
        Math.min(stageWidth, stageHeight) * 0.15,
        stageWidth / 2,
        stageHeight / 2,
        Math.max(stageWidth, stageHeight) * 0.6
      );
      vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
      vignette.addColorStop(1, tdBackgroundPack.mapVignetteColor);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, stageWidth, stageHeight);

      ctx.strokeStyle = tdBackgroundPack.gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x <= stageWidth; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, stageHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= stageHeight; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(stageWidth, y);
        ctx.stroke();
      }

      const pathPoints = getPathPoints(cellSize);
      drawPathCells(ctx, TD_PATH_NODES, cellSize, tdMapPack);
      drawPathGradient(ctx, pathGradientMode, pathPoints, elapsed, tdMapPack, cellSize * 0.78);

      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = tdMapPack.laneBorderColor;
      ctx.globalAlpha = 0.58;
      ctx.lineWidth = 2;
      for (let i = 0; i < pathPoints.length - 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(pathPoints[i].x, pathPoints[i].y);
        ctx.lineTo(pathPoints[i + 1].x, pathPoints[i + 1].y);
        ctx.stroke();
      }
      ctx.restore();

      const pathStart = pathPoints[0];
      const pathEnd = pathPoints[pathPoints.length - 1];
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.24)';
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pathStart.x, pathStart.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.strokeStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(pathEnd.x, pathEnd.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`TD PACK: ${towerPack.name.toUpperCase()}`, 20, 24);
      ctx.fillText(`MAP PACK: ${tdMapPack.name.toUpperCase()}`, 20, 42);
      ctx.fillText(`BACKGROUND PACK: ${tdBackgroundPack.name.toUpperCase()}`, 20, 60);
      ctx.fillText(`LIGHTNING FX: ${LIGHTNING_INTERNAL_MODES.find((m) => m.id === lightningInternalMode)?.name?.toUpperCase() || 'EDGE SWEEP'}`, 20, 78);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Map Pack changes the lane and routed path. Background Pack changes the grid, atmosphere, and board FX.', 20, 96);

      const renderer = {
        ctx,
        cellSize,
        glowPhase: elapsed * 2,
        settings: {
          glowEffects: true,
          projectileTrails: false,
        },
        selectedTowerId: null,
        lastState: { currentTime: Date.now() },
        performanceTier: 'normal',
        towerAuraMap: new Map(),
      };

      const towerSamples = towerPack.id === 'lightning-core'
        ? [{ id: 't1', type: 'Function', row: 4, col: 9, specialUpgradeLevel: 2 }]
        : [
            { id: 't1', type: 'Function', row: 2, col: 3, specialUpgradeLevel: 1 },
            { id: 't2', type: 'ForLoop', row: 5, col: 8, specialUpgradeLevel: 0 },
            { id: 't3', type: 'Variable', row: 2, col: 13, specialUpgradeLevel: 2 },
          ];

      const towerCenters = towerSamples.map((sample) => ({
        x: (sample.col + 0.5) * cellSize,
        y: (sample.row + 0.5) * cellSize,
      }));

      if (tdAttackFxMode !== 'none') {
        drawAttackFx(ctx, tdAttackFxMode, towerCenters, elapsed, enemyHighlightColor);
      }

      towerSamples.forEach((sample, index) => {
        drawTower(renderer, {
          id: sample.id,
          type: sample.type,
          position: { row: sample.row, col: sample.col },
          color: towerPack.towerColor,
          upgradeLevel: index + 1,
          specialUpgradeLevel: sample.specialUpgradeLevel,
          isDisabled: false,
          lastAttackTime: Date.now() - 250,
          attackSpeed: 2 + index,
        });

        const centerX = (sample.col + 0.5) * cellSize;
        const centerY = (sample.row + 0.5) * cellSize;
        const towerSize = cellSize * 0.8;

        if (towerPack.id === 'camo-ops' && Array.isArray(towerPack.camoPalette)) {
          drawCamoOverlay(ctx, centerX, centerY, towerSize, towerPack.camoPalette, elapsed, index);
        }

        if (towerPack.id === 'lightning-core' && towerPack.hasLightningAnimation) {
          drawTowerInternalLightning(
            ctx,
            centerX,
            centerY,
            towerSize,
            elapsed + index * 0.17,
            lightningInternalMode,
            towerPack.lightningColor || '#FDE047',
            towerPack.lightningGlow || '#FEF08A'
          );
        }
      });

      const enemyProgress = (elapsed * 0.11) % 1;
      const enemyPosition = getPathPointAtProgress(pathPoints, enemyProgress);
      drawEnemy(renderer, {
        id: 'lab-enemy',
        type: 'basic',
        x: enemyPosition.x,
        y: enemyPosition.y,
        size: 28,
        color: enemyBodyColor,
        health: 80,
        maxHealth: 100,
        spawnTime: Date.now() - 3000,
        headingAngle: 0,
      });

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = enemyHighlightColor;
      ctx.beginPath();
      ctx.arc(enemyPosition.x, enemyPosition.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const projectileOrigins = [
        { x: 2.8 * cellSize, y: 1.8 * cellSize, type: 'Function' },
        { x: 5.8 * cellSize, y: 3.8 * cellSize, type: 'ForLoop' },
        { x: 8.8 * cellSize, y: 1.8 * cellSize, type: 'Variable' },
      ];

      projectileOrigins.forEach((origin, index) => {
        const progress = (elapsed * 0.8 + index * 0.2) % 1;
        drawSimpleProjectile(
          ctx,
          origin.x,
          origin.y,
          enemyPosition.x,
          enemyPosition.y,
          progress,
          towerPack.projectileColor
        );
      });

      if (
        towerPack.id === 'lightning-core' &&
        towerPack.hasLightningAnimation &&
        lightningLinkMode === 'soft-link'
      ) {
        const origin = towerCenters[0];
        drawLightningBolt(
          ctx,
          origin.x,
          origin.y,
          enemyPosition.x,
          enemyPosition.y,
          elapsed * 1.4,
          towerPack.lightningColor || '#FDE047',
          towerPack.lightningGlow || '#FEF08A'
        );
      }

      rafRef.current = window.requestAnimationFrame(render);
    };

    rafRef.current = window.requestAnimationFrame(render);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    lightningInternalMode,
    lightningLinkMode,
    mountedAt,
    enemyBodyColor,
    enemyHighlightColor,
    pathGradientMode,
    tdAttackFxMode,
    tdBackgroundPack,
    tdMapPack,
    towerPack,
    useRealGameCanvas,
  ]);

  useEffect(() => {
    if (!useRealGameCanvas) return undefined;

    const previewDifficulties = ['normal', 'hard', 'nightmare'];

    const placePreviewTowers = () => {
      if (!gameCanvasRef.current) return;
      TD_PREVIEW_TOWER_POSITIONS.forEach((tower) => {
        gameCanvasRef.current.placeTower?.(tower.type, tower.row, tower.col);
      });
    };

    const setPreviewLevel = () => {
      const engine = gameCanvasRef.current?._gameLogicRef?.current;
      engine?.setPlayerLevel?.(18);
    };

    const bootPreviewRun = () => {
      if (!gameCanvasRef.current) return;
      gameCanvasRef.current.resetGame?.();
      setPreviewLevel();
      placePreviewTowers();
      previewDifficultyRef.current = 0;
      gameCanvasRef.current.startWave?.(previewDifficulties[previewDifficultyRef.current]);
    };

    const tickPreview = () => {
      if (!gameCanvasRef.current) return;
      setPreviewLevel();

      const status = gameCanvasRef.current.gameStatus;
      if (status === 'level-complete' || status === 'game-over') {
        bootPreviewRun();
        return;
      }

      if (status === 'ready' || status === 'wave-complete' || status === 'prehack') {
        previewDifficultyRef.current = (previewDifficultyRef.current + 1) % previewDifficulties.length;
        gameCanvasRef.current.startWave?.(previewDifficulties[previewDifficultyRef.current]);
      }
    };

    const initTimer = window.setTimeout(bootPreviewRun, 260);
    const interval = window.setInterval(tickPreview, 1200);

    return () => {
      window.clearTimeout(initTimer);
      window.clearInterval(interval);
    };
  }, [mountedAt, tdGeneratedMap, useRealGameCanvas]);

  const monacoOptions = useMemo(() => {
    const base = buildMonacoOptionsFromFont(fontPack);
    return {
      ...base,
      cursorSmoothCaretAnimation: effectPack.cursorGlow,
      renderLineHighlightOnlyWhenFocus: !effectPack.linePulse,
    };
  }, [effectPack.cursorGlow, effectPack.linePulse, fontPack]);

  if (!isLocalHost() || !import.meta.env.DEV) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="#02040a" color="#e2e8f0" p={6}>
        <Text>This local preview page is only available on localhost in development mode.</Text>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="#02040a" color="#E2E8F0" p={{ base: 4, md: 6 }}>
      <style>
        {`
          @keyframes cosmetic-gradient-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes cosmetic-rain-shift {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 0, 40px 120px; }
          }
          @keyframes cosmetic-scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes cosmetic-circuit-flow {
            0% { background-position: 0% 0%, 0 0, 0 0; }
            100% { background-position: 100% 100%, 50px 50px, 50px 50px; }
          }
          @keyframes cosmetic-wave-drift {
            0%, 100% { background-position: 0 0; }
            50% { background-position: 0 100px; }
          }
          @keyframes cosmetic-ember-rise {
            0% { background-position: 50% 100%; }
            50% { background-position: 50% 50%; }
            100% { background-position: 50% 0%; }
          }
          @keyframes cosmetic-frost-shimmer {
            0%, 100% { opacity: 0.7; filter: blur(0px); }
            50% { opacity: 0.95; filter: blur(1px); }
          }
          @keyframes cosmetic-plasma-pulse {
            0%, 100% { background-size: 100% 100%, 100% 100%, 100% 100%; }
            50% { background-size: 120% 120%, 120% 120%, 100% 100%; }
          }
          @keyframes cosmetic-data-flow {
            0% { background-position: 0 0, 0 0, 0 0; }
            100% { background-position: 0 1000px, 0 1000px, 0 0; }
          }
          @keyframes cosmetic-vortex-spin {
            0% { background-position: 0deg; filter: hue-rotate(0deg); }
            100% { background-position: 360deg; filter: hue-rotate(360deg); }
          }
          @keyframes cosmetic-matrix-fall {
            from { background-position: 0 0, 0 0; }
            to { background-position: 0 13px, 0 0; }
          }
          @keyframes cosmetic-scan-beam {
            0% { background-position: 0 -100%; }
            100% { background-position: 0 200%; }
          }
          @keyframes cosmetic-star-drift {
            0% { background-position: 0% 0%; }
            100% { background-position: 2% 3%; }
          }
          @keyframes cosmetic-plasma-orbit {
            0%, 100% { background-position: 0% 50%, 100% 50%, 50% 0%, 0 0; }
            25% { background-position: 100% 50%, 0% 50%, 50% 100%, 0 0; }
            50% { background-position: 50% 0%, 50% 100%, 0% 50%, 0 0; }
            75% { background-position: 50% 100%, 50% 0%, 100% 50%, 0 0; }
          }
        `}
      </style>

      <VStack align="stretch" spacing={5} maxW="1240px" mx="auto">
        <Box border="1px solid rgba(56, 189, 248, 0.4)" bg="rgba(8, 18, 30, 0.6)" p={4}>
          <Text fontWeight="bold" letterSpacing="0.05em" color="#7DD3FC">
            LOCAL COSMETICS LAB
          </Text>
          <Text mt={2} fontSize="sm" color="#9FB4CC">
            Test open-source font packs, Monaco themes/backgrounds/effects, and Tower Defense pack
            visuals before store wiring.
          </Text>
          <Text mt={1} fontSize="xs" color="#7C8CA6">
            Route: /local/cosmetics-lab
          </Text>
        </Box>

        <Box border="1px solid rgba(56, 189, 248, 0.3)" bg="rgba(5, 10, 18, 0.65)" p={3}>
          <Text fontSize="xs" color="#7DD3FC" fontFamily="monospace" mb={3}>
            EDITOR SETTINGS
          </Text>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3}>
            <HStack>
              <Text minW="120px">Font Colors</Text>
              <Select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
                {EDITOR_THEME_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack>
              <Text minW="120px">Font Pack</Text>
              <Select value={fontId} onChange={(event) => setFontId(event.target.value)}>
                {OPEN_SOURCE_FONT_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack>
              <Text minW="120px">Background</Text>
              <Select value={backgroundId} onChange={(event) => setBackgroundId(event.target.value)}>
                {EDITOR_BACKGROUND_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack>
              <Text minW="120px">Effects</Text>
              <Select value={effectId} onChange={(event) => setEffectId(event.target.value)}>
                {EDITOR_EFFECT_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </Select>
            </HStack>
          </SimpleGrid>
          <Box mt={3} fontSize="sm" color="#94A3B8" border="1px solid rgba(148, 163, 184, 0.3)" p={3}>
            <Text>{themePack.description}</Text>
            <Text mt={2}>{fontPack.description}</Text>
            <Text mt={2}>{backgroundPack.description}</Text>
            <Text mt={2}>{effectPack.description}</Text>
          </Box>
        </Box>

        <Box border="1px solid rgba(56, 189, 248, 0.3)" bg="rgba(5, 10, 18, 0.8)" p={2}>
          <Box
            position="relative"
            h="420px"
            bg={backgroundPack.background}
            backgroundSize={backgroundPack.backgroundSize || '100% 100%'}
            animation={backgroundPack.animation || 'none'}
            overflow="hidden"
          >
            {effectPack.scanline && (
              <Box
                position="absolute"
                inset={0}
                pointerEvents="none"
                opacity={effectPack.scanlineOpacity || 0.1}
                bg="repeating-linear-gradient(180deg, rgba(148,163,184,0.12) 0px, rgba(148,163,184,0.12) 1px, transparent 1px, transparent 4px)"
                _after={{
                  content: '""',
                  position: 'absolute',
                  top: '-100%',
                  left: 0,
                  right: 0,
                  height: '40%',
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(125, 211, 252, 0.2) 55%, transparent 100%)',
                  animation: 'cosmetic-scanline 4s linear infinite',
                }}
              />
            )}

            <Box
              position="absolute"
              inset={0}
              sx={{
                '.monaco-editor, .monaco-editor .margin, .monaco-editor-background, .monaco-editor .inputarea.ime-input': {
                  background: 'transparent !important',
                },
                '.monaco-editor .cursor': effectPack.cursorGlow
                  ? {
                      boxShadow: `0 0 8px ${effectPack.cursorGlowColor || '#67E8F9'}`,
                    }
                  : undefined,
                '.monaco-editor .view-overlays .current-line': effectPack.linePulse
                  ? {
                      backgroundColor: `${effectPack.linePulseColor || 'rgba(56,189,248,0.2)'} !important`,
                    }
                  : undefined,
              }}
            >
              {effectPack.overlayGlow && (
                <Box
                  position="absolute"
                  inset={0}
                  pointerEvents="none"
                  bg={`radial-gradient(circle at 50% 0%, ${effectPack.overlayGlowColor || 'rgba(56, 189, 248, 0.2)'}, transparent 52%)`}
                  zIndex={1}
                />
              )}

              {effectPack.chromaticShift && (
                <Box
                  position="absolute"
                  inset={0}
                  pointerEvents="none"
                  zIndex={2}
                  bg="linear-gradient(90deg, rgba(236,72,153,0.07), transparent 35%, transparent 65%, rgba(34,211,238,0.07))"
                  mixBlendMode="screen"
                />
              )}

              <Editor
                height="100%"
                defaultLanguage="python"
                value={COSMETIC_PREVIEW_SNIPPET}
                options={monacoOptions}
                onMount={(editor, monaco) => {
                  ensureMonacoTheme(monaco, themePack, editorThemeOverrides);
                  monaco.editor.setTheme(getMonacoThemeName(themePack.id));
                  applyCustomTokenProviders(monaco, editor, 'python');
                  editor.focus();
                }}
                theme={getMonacoThemeName(themePack.id)}
              />
            </Box>
          </Box>
        </Box>

        <Box border="1px solid rgba(34, 197, 94, 0.35)" bg="rgba(5, 15, 10, 0.45)" p={2}>
          <Box border="1px solid rgba(148, 163, 184, 0.3)" p={3} mb={3}>
            <Text fontSize="xs" color="#86EFAC" fontFamily="monospace" mb={3}>
              TD SETTINGS
            </Text>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3}>
              <HStack>
                <Text minW="120px">TD Map Pack</Text>
                <Select value={tdMapPackId} onChange={(event) => setTdMapPackId(event.target.value)}>
                  {TD_MAP_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Background Pack</Text>
                <Select
                  value={tdBackgroundPackId}
                  onChange={(event) => setTdBackgroundPackId(event.target.value)}
                >
                  {TD_BACKGROUND_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Tower Pack</Text>
                <Select value={towerPackId} onChange={(event) => setTowerPackId(event.target.value)}>
                  {TOWER_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Enemy Scheme</Text>
                <Select value={enemyPackId} onChange={(event) => setEnemyPackId(event.target.value)}>
                  {ENEMY_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Path Gradient</Text>
                <Select value={pathGradientMode} onChange={(event) => setPathGradientMode(event.target.value)}>
                  {PATH_GRADIENT_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">TD Attack FX</Text>
                <Select value={tdAttackFxMode} onChange={(event) => setTdAttackFxMode(event.target.value)}>
                  {TD_ATTACK_FX_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Damage Text</Text>
                <Select value={damageTextPackId} onChange={(event) => setDamageTextPackId(event.target.value)}>
                  {TD_DAMAGE_TEXT_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}{pack.free ? ' (Free)' : ` — ${pack.priceDataPackets} DP`}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text minW="120px">Death FX</Text>
                <Select value={deathFxPackId} onChange={(event) => setDeathFxPackId(event.target.value)}>
                  {TD_DEATH_FX_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}{pack.free ? ' (Free)' : ` — ${pack.priceDataPackets} DP`}
                    </option>
                  ))}
                </Select>
              </HStack>
              {towerPack.id === 'lightning-core' && (
                <>
                  <HStack>
                    <Text minW="120px">Inside Lightning</Text>
                    <Select
                      value={lightningInternalMode}
                      onChange={(event) => setLightningInternalMode(event.target.value)}
                    >
                      {LIGHTNING_INTERNAL_MODES.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.name}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  <HStack>
                    <Text minW="120px">Tower Link Beam</Text>
                    <Select
                      value={lightningLinkMode}
                      onChange={(event) => setLightningLinkMode(event.target.value)}
                    >
                      {LIGHTNING_LINK_MODES.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          {mode.name}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                </>
              )}
            </SimpleGrid>

            <Box mt={3} fontSize="sm" color="#94A3B8" border="1px solid rgba(148, 163, 184, 0.3)" p={3}>
              <Text>{tdMapPack.description}</Text>
              <Text mt={2}>{tdBackgroundPack.description}</Text>
              <Text mt={2}>{towerPack.description}</Text>
              <Text mt={2}>
                Damage Text: {TD_DAMAGE_TEXT_PACKS.find((p) => p.id === damageTextPackId)?.description}
              </Text>
              <Text mt={2}>
                Death FX: {TD_DEATH_FX_PACKS.find((p) => p.id === deathFxPackId)?.description}
              </Text>
            </Box>

            <Box mt={3} border="1px solid rgba(148, 163, 184, 0.3)" p={3}>
              <Text fontFamily="monospace" fontSize="xs" color="#7DD3FC" mb={2}>
                WHAT SHOULD CHANGE
              </Text>
              <Text fontSize="xs" color="#AFC4DA">
                TD Map Pack changes lane/path styling. Background Pack changes the board backdrop, grid,
                and sellable grid cosmetics. Path Gradient changes lane animation. TD Attack FX changes
                ambient combat effects. Lightning selectors control in-tower arcs and optional tower-to-enemy
                beam links. Damage Text changes floating hit numbers. Death FX changes enemy kill explosions.
              </Text>
            </Box>

            <SimpleGrid
              mt={3}
              columns={{ base: 1, md: 2 }}
              spacing={2}
              border="1px solid rgba(148, 163, 184, 0.3)"
              p={3}
            >
              <ColorChip label="Tower" color={towerPack.towerColor} />
              <ColorChip label="Tower Border" color={towerPack.towerBorderColor} />
              <ColorChip label="Enemy Body" color={enemyBodyColor} />
              <ColorChip label="Enemy Highlight" color={enemyHighlightColor} />
              <ColorChip label="Projectile" color={towerPack.projectileColor} />
              <ColorChip label="Background Grid" color={tdBackgroundPack.gridColor} />
              <ColorChip label="Map Path" color={tdMapPack.pathColor} />
              <ColorChip label="Path Inner" color={tdMapPack.pathInnerColor} />
            </SimpleGrid>
          </Box>

          {useRealGameCanvas ? (
            <Box h={{ base: '520px', lg: '620px' }}>
              <GameCanvasV2
                ref={gameCanvasRef}
                generatedMap={tdGeneratedMap}
                cellSize={48}
                difficulty="medium"
                initialCredits={700}
                initialLives={40}
                totalWaves={10}
                availableTowerTypes={['Function', 'ForLoop', 'Variable']}
                disableDynamicResolution
                pathGradientMode={pathGradientMode}
                tdMapTheme={tdBoardTheme}
                lightningInternalMode={lightningInternalMode}
                lightningColor={towerPack?.lightningColor || '#FDE047'}
                lightningGlow={towerPack?.lightningGlow || '#FEF08A'}
                towerPack={towerPack}
                enemyPack={enemyPack}
                tdAttackFxMode={tdAttackFxMode}
                damageTextPack={damageTextPack}
                deathFxPack={deathFxPack}
              />
            </Box>
          ) : (
            <Canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              display="block"
              w="100%"
              sx={{ height: 'auto', imageRendering: 'auto' }}
            />
          )}
        </Box>

        <Box border="1px solid rgba(125, 211, 252, 0.36)" bg="rgba(5, 10, 20, 0.56)" p={3}>
          <Text fontSize="xs" color="#7DD3FC" fontFamily="monospace" mb={3}>
            PROFILE COSMETICS
          </Text>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={3}>
            <HStack>
              <Text minW="120px">Background</Text>
              <Select
                value={profileBackgroundPackId}
                onChange={(event) => setProfileBackgroundPackId(event.target.value)}
              >
                {PROFILE_BACKGROUND_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.rarity})
                  </option>
                ))}
              </Select>
            </HStack>

            <HStack>
              <Text minW="120px">Calling Card</Text>
              <Select value={profileCardPackId} onChange={(event) => setProfileCardPackId(event.target.value)}>
                {PROFILE_CALLING_CARD_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.rarity})
                  </option>
                ))}
              </Select>
            </HStack>

            <HStack>
              <Text minW="120px">Badge</Text>
              <Select value={profileBadgePackId} onChange={(event) => setProfileBadgePackId(event.target.value)}>
                {PROFILE_BADGE_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.rarity})
                  </option>
                ))}
              </Select>
            </HStack>
          </SimpleGrid>

          <Box mt={3} fontSize="sm" color="#94A3B8" border="1px solid rgba(148, 163, 184, 0.3)" p={3}>
            <Text>{profileBackgroundPack.description}</Text>
            <Text mt={2}>{profileCallingCardPack.description}</Text>
            <Text mt={2}>{profileBadgePack.description}</Text>
          </Box>

          <Box mt={3}>
            <ProfileHeader
              userData={profilePreviewUserData}
              onEditProfile={() => {}}
              onManageBilling={null}
              billingLoading={false}
              billingError={null}
              avatarLoading={false}
              avatarError={null}
              isPublicView={false}
              shareUrl="https://codegrind.local/profile/1"
              cosmeticPreview={{
                backgroundId: profileBackgroundPack.id,
                callingCardId: profileCallingCardPack.id,
                badgeId: profileBadgePack.id,
              }}
            />
          </Box>

          <SimpleGrid
            mt={3}
            columns={{ base: 1, md: 2 }}
            spacing={2}
            border="1px solid rgba(148, 163, 184, 0.3)"
            p={3}
          >
            <ColorChip label="Calling Card Accent" color={profileCallingCardPack.accentColor} />
            <ColorChip label="Profile Badge Border" color={profileBadgePack.badgeBorder} />
          </SimpleGrid>
        </Box>

        <HStack spacing={3}>
          <Button size="sm" onClick={() => setMountedAt(Date.now())} colorScheme="cyan" variant="outline">
            Restart TD Preview Animation
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

export default [
  {
    path: '/local/cosmetics-lab',
    element: <CosmeticsLabPage />,
  },
];
