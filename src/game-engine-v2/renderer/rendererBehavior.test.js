import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drawCombatText } from './combatText';
import { drawDeployable, drawDeployables } from './deployables';
import {
  drawBlob,
  drawEnemies,
  drawEnemy,
  drawHealthBar,
  drawStatusIndicator,
  getEnemyColors,
  getEnemyShape,
} from './enemies';
import { drawBackgroundCache, drawGrid, drawMapPackOverlay, drawMarker, drawPath } from './grid';
import {
  clearHover,
  clearPlacementPreview,
  getCellAtPosition,
  getTowerAtCell,
  isCellOccupied,
  setHoveredCell,
  setPlacementMode,
  setPlacementPreview,
  setSelectedTower,
} from './interaction';
import { drawImpactGlyph, drawImpacts, getImpactStyle } from './impacts';
import { createExplosion, drawParticles } from './particles';
import { drawPlacementPreview } from './placement';
import {
  drawArrayProjectile,
  drawBulletProjectile,
  drawDefaultProjectile,
  drawForLoopProjectile,
  drawFunctionProjectile,
  drawIfConditionProjectile,
  drawObjectProjectile,
  drawProjectile,
  drawProjectiles,
  drawReturnProjectile,
  drawRoundedRect,
  drawSwitchProjectile,
  drawTryCatchProjectile,
  drawVariableProjectile,
  drawWhileLoopProjectile,
} from './projectiles';
import { drawTowerAttackFx } from './attackFx';
import {
  computeAuraInfluence,
  drawSelectedTowerRange,
  drawTower,
  drawTowers,
  getActiveSpecialEffects,
  getSpecialEffectColor,
  getSpecialEffectTag,
  getTowerConfig,
} from './towers';
import { getEmbeddedShellCosmetics } from '../../pages/games/towerDefenseV2/embeddedShellThemes.js';
import { getPerformanceTierForState, Renderer } from '../Renderer.js';

const createGradient = () => ({
  addColorStop: vi.fn(),
});

const createCtx = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  setLineDash: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  quadraticCurveTo: vi.fn(),
  createLinearGradient: vi.fn(() => createGradient()),
  createRadialGradient: vi.fn(() => createGradient()),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 24 })),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  setTransform: vi.fn(),
});

const createRenderer = () => {
  const ctx = createCtx();
  const backgroundCtx = createCtx();
  return {
    ctx,
    backgroundCtx,
    backgroundCanvas: { width: 320, height: 240 },
    backgroundDirty: true,
    settings: {
      showGrid: true,
      glowEffects: true,
      hitEffects: true,
      combatText: true,
      particleEffects: true,
      explosionEffects: true,
      projectileTrails: true,
    },
    performanceTier: 'normal',
    gridCols: 6,
    gridRows: 6,
    logicalWidth: 240,
    logicalHeight: 240,
    cellSize: 40,
    glowPhase: 0.6,
    pathNodes: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    towerAuraMap: new Map(),
    selectedTowerId: null,
    pathSet: new Set(['0,1', '0,2', '1,2']),
    occupiedCells: new Set(),
    hoveredCell: null,
    placementMode: false,
    placementItemType: null,
    placementModeKind: 'tower',
    drawTower: vi.fn(),
    drawDeployable: vi.fn(),
    isCellOccupied: vi.fn(() => false),
    lastState: {
      currentTime: 20_000,
      towers: [],
      deployables: [],
    },
    particles: [],
    spriteImageCache: new Map(),
  };
};

describe('renderer behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles tower metadata, aura influence and tower drawing states', () => {
    const renderer = createRenderer();

    const variableTower = {
      id: 'aura-source',
      type: 'Variable',
      position: { row: 1, col: 1 },
      color: '#a78bfa',
      upgradeLevel: 1,
      specialUpgradeLevel: 2,
      range: 2,
      lastAttackTime: 19_800,
      attackSpeed: 1.6,
    };
    const targetTower = {
      id: 'target-1',
      type: 'ForLoop',
      position: { row: 2, col: 2 },
      color: '#00e5ff',
      upgradeLevel: 0,
      specialUpgradeLevel: 1,
      range: 3,
      lastAttackTime: 19_700,
      attackSpeed: 2,
      isDisabled: true,
      disabledByEnemyId: 'enemy-9',
    };

    expect(getTowerConfig(renderer, { type: 'ForLoop' })).toBeTruthy();
    expect(getActiveSpecialEffects(renderer, targetTower)).toBeInstanceOf(Array);
    expect(getSpecialEffectColor([{ execute: { threshold: 0.2, chance: 0.5 } }])).toBe('#ff4d6d');
    expect(getSpecialEffectTag([{ multiTarget: { extraTargets: 1 } }])).toBe('MULTI');

    const auraMap = computeAuraInfluence(renderer, [variableTower, targetTower]);
    expect(auraMap).toBeInstanceOf(Map);

    renderer.selectedTowerId = 'target-1';
    renderer.towerAuraMap = auraMap;
    drawTower(renderer, targetTower);
    drawSelectedTowerRange(renderer, [targetTower]);
    drawTowers(renderer, [variableTower, targetTower]);

    expect(renderer.ctx.fillRect).toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).toHaveBeenCalled();
    expect(renderer.ctx.fillText).toHaveBeenCalled();
    expect(renderer.ctx.arc).toHaveBeenCalled();
    expect(renderer.towerAuraMap).toBeInstanceOf(Map);
  });

  it('renders projectile layers, tower-specific projectile shapes, and fallback helpers', () => {
    const renderer = createRenderer();
    const enemies = [{ id: 'e1', x: 140, y: 90 }];

    drawProjectiles(
      renderer,
      [
        {
          x: 60,
          y: 60,
          startX: 20,
          startY: 20,
          targetX: 140,
          targetY: 90,
          targetId: 'e1',
          color: '#00f5ff',
          towerType: 'ForLoop',
          progress: 0.4,
          trail: [
            { x: 20, y: 20 },
            { x: 60, y: 60 },
          ],
          isSecondaryTarget: true,
        },
        {
          x: 85,
          y: 70,
          startX: 30,
          startY: 30,
          targetX: 150,
          targetY: 100,
          color: '#ff00de',
          towerType: 'Switch',
          progress: 0.6,
        },
      ],
      enemies
    );

    const ultraProjectiles = Array.from({ length: 31 }, (_, i) => ({
      x: i + 10,
      y: i + 20,
      startX: 0,
      startY: 0,
      targetX: 100,
      targetY: 100,
      color: '#fff',
      towerType: 'BurstTurret',
      progress: 0.3,
    }));
    drawProjectiles(renderer, ultraProjectiles, []);

    drawProjectile(renderer, {
      x: 70,
      y: 70,
      startX: 10,
      startY: 10,
      targetX: 120,
      targetY: 120,
      color: '#ffad00',
      towerType: 'WhileLoop',
      progress: 0.5,
    });

    drawBulletProjectile(renderer, 40, 40, 8, '#fff', Math.PI / 4, { tracer: true });
    drawDefaultProjectile(renderer, 40, 40, 8, '#fff');
    drawForLoopProjectile(renderer, 40, 40, 8, '#0ff');
    drawWhileLoopProjectile(renderer, 10, 10, 70, 70, 7, '#0ff');
    drawIfConditionProjectile(renderer, 40, 40, 8, '#ff0');
    drawVariableProjectile(renderer, 40, 40, 8, '#0f0');
    drawFunctionProjectile(renderer, 40, 40, 8, '#f0f');
    drawArrayProjectile(renderer, 40, 40, 8, '#0ff');
    drawObjectProjectile(renderer, 40, 40, 8, '#00f');
    drawReturnProjectile(renderer, 40, 40, 8, '#f44', 0.2);
    drawTryCatchProjectile(renderer, 40, 40, 8, '#4ff');
    drawSwitchProjectile(renderer, 40, 40, 8, '#ff4', 0.1, 0.7);
    drawRoundedRect(renderer, 10, 10, 30, 16, 4, '#222');

    expect(renderer.ctx.save).toHaveBeenCalled();
    expect(renderer.ctx.restore).toHaveBeenCalled();
    expect(renderer.ctx.stroke).toHaveBeenCalled();
    expect(renderer.ctx.fill).toHaveBeenCalled();
  });

  it('budgets attack fx and only creates persistent echoes near impact', () => {
    const renderer = createRenderer();
    renderer.settings.tdAttackFxMode = 'data-stream';
    renderer.performanceTier = 'heavy';

    const enemies = [{ id: 'enemy-1', x: 180, y: 120 }];
    const midFlightProjectiles = Array.from({ length: 20 }, (_, index) => ({
      id: `p-mid-${index}`,
      x: 50 + index,
      y: 60,
      startX: 20,
      startY: 40,
      targetX: 180,
      targetY: 120,
      targetId: 'enemy-1',
      progress: 0.45,
      towerType: 'ForLoop',
    }));

    drawTowerAttackFx(renderer, [], midFlightProjectiles, enemies);

    expect(renderer._attackFxEchoes).toHaveLength(0);
    expect(renderer.ctx.fillRect).toHaveBeenCalledTimes(4);

    renderer.ctx.fillRect.mockClear();

    drawTowerAttackFx(
      renderer,
      [],
      [
        {
          id: 'p-hit',
          x: 160,
          y: 110,
          startX: 20,
          startY: 40,
          targetX: 180,
          targetY: 120,
          targetId: 'enemy-1',
          progress: 0.95,
          towerType: 'ForLoop',
        },
      ],
      enemies
    );

    expect(renderer._attackFxEchoes.length).toBeGreaterThan(0);
    expect(renderer._attackFxEchoBuckets.get('p-hit')).toBeGreaterThanOrEqual(0);
  });

  it('draws retro desktop sprite icons for towers, enemies, and projectiles when the pack provides them', () => {
    const renderer = createRenderer();
    const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
    const towerSprite = retroCosmetics.towerPack.towerSprites.FOR_LOOP;
    const enemySprite = retroCosmetics.enemyPack.enemySprites.basic;
    const projectileSprite = retroCosmetics.towerPack.projectileSprites.FOR_LOOP;
    const preloadedImage = { complete: true, naturalWidth: 16, naturalHeight: 16 };

    renderer.settings.towerPack = retroCosmetics.towerPack;
    renderer.settings.enemyPack = retroCosmetics.enemyPack;
    renderer.spriteImageCache = new Map([
      [towerSprite, { image: preloadedImage, status: 'loaded' }],
      [enemySprite, { image: preloadedImage, status: 'loaded' }],
      [projectileSprite, { image: preloadedImage, status: 'loaded' }],
    ]);
    renderer.ctx.drawImage.mockClear();

    drawTower(renderer, {
      id: 'tower-retro',
      type: 'ForLoop',
      position: { row: 1, col: 1 },
      color: '#6fb9ff',
      upgradeLevel: 0,
      specialUpgradeLevel: 0,
      range: 2,
    });

    drawEnemy(renderer, {
      id: 'enemy-retro',
      isActive: true,
      x: 100,
      y: 100,
      type: 'basic',
      health: 50,
      maxHealth: 100,
      size: 18,
      color: '#ff0000',
    });

    drawProjectile(renderer, {
      x: 120,
      y: 120,
      startX: 20,
      startY: 20,
      targetX: 180,
      targetY: 160,
      color: '#f0d47c',
      towerType: 'ForLoop',
      progress: 0.5,
    });

    expect(renderer.ctx.drawImage).toHaveBeenCalledTimes(3);
  });

  it('simplifies retro projectile chrome earlier once projectile count rises', () => {
    const renderer = createRenderer();
    const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
    const projectileSprite = retroCosmetics.towerPack.projectileSprites.FOR_LOOP;
    const preloadedImage = { complete: true, naturalWidth: 16, naturalHeight: 16 };

    renderer.settings.towerPack = retroCosmetics.towerPack;
    renderer.spriteImageCache = new Map([
      [projectileSprite, { image: preloadedImage, status: 'loaded' }],
    ]);

    const makeProjectile = (id) => ({
      id,
      x: 80,
      y: 80,
      startX: 20,
      startY: 20,
      targetX: 140,
      targetY: 90,
      color: '#00f5ff',
      towerType: 'ForLoop',
      progress: 0.4,
      trail: [
        { x: 20, y: 20 },
        { x: 80, y: 80 },
      ],
    });

    drawProjectiles(renderer, [makeProjectile('low-1'), makeProjectile('low-2')], []);
    expect(renderer.ctx.drawImage).toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).not.toHaveBeenCalled();

    renderer.ctx.drawImage.mockClear();
    renderer.ctx.strokeRect.mockClear();

    drawProjectiles(
      renderer,
      Array.from({ length: 7 }, (_, index) => makeProjectile(`high-${index}`)),
      []
    );

    expect(renderer.ctx.drawImage).toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).not.toHaveBeenCalled();
  });

  it('renders sprite-backed projectiles as icon-only without extra chrome', () => {
    const renderer = createRenderer();
    const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
    const projectileSprite = retroCosmetics.towerPack.projectileSprites.FOR_LOOP;
    const preloadedImage = { complete: true, naturalWidth: 16, naturalHeight: 16 };

    renderer.settings.towerPack = retroCosmetics.towerPack;
    renderer.spriteImageCache = new Map([
      [projectileSprite, { image: preloadedImage, status: 'loaded' }],
    ]);

    drawProjectile(renderer, {
      id: 'sprite-proj',
      x: 120,
      y: 120,
      startX: 20,
      startY: 20,
      targetX: 180,
      targetY: 160,
      color: '#f0d47c',
      towerType: 'ForLoop',
      progress: 0.5,
    });

    expect(renderer.ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(renderer.ctx.strokeRect).not.toHaveBeenCalled();
    expect(renderer.ctx.arc).not.toHaveBeenCalled();
  });

  it('skips data-stream packet rectangles for sprite-backed projectiles', () => {
    const renderer = createRenderer();
    const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
    renderer.settings.tdAttackFxMode = 'data-stream';
    renderer.settings.towerPack = retroCosmetics.towerPack;

    drawTowerAttackFx(
      renderer,
      [],
      [
        {
          id: 'sprite-proj',
          x: 80,
          y: 90,
          startX: 20,
          startY: 40,
          targetX: 180,
          targetY: 120,
          targetId: 'enemy-1',
          progress: 0.4,
          towerType: 'ForLoop',
        },
      ],
      [{ id: 'enemy-1', x: 180, y: 120 }]
    );

    expect(renderer.ctx.fillRect).not.toHaveBeenCalled();
    expect(renderer.ctx.createRadialGradient).not.toHaveBeenCalled();
    expect(renderer._attackFxEchoes).toEqual([]);
  });

  it('escalates renderer performance tier when combat effects spike beyond raw entity count', () => {
    expect(
      getPerformanceTierForState(
        {
          enemies: Array.from({ length: 8 }, () => ({})),
          projectiles: Array.from({ length: 6 }, () => ({})),
          impacts: Array.from({ length: 10 }, () => ({})),
          combatText: Array.from({ length: 12 }, () => ({})),
          damageFields: Array.from({ length: 2 }, () => ({})),
        },
        12
      )
    ).toBe('heavy');

    expect(
      getPerformanceTierForState(
        {
          enemies: Array.from({ length: 8 }, () => ({})),
          projectiles: Array.from({ length: 6 }, () => ({})),
        },
        0
      )
    ).toBe('normal');
  });

  it('warms retro sprite packs before first draw when tower and enemy packs are applied', () => {
    const originalImage = globalThis.Image;
    class ImageStub {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
        this.decoding = 'auto';
      }

      decode() {
        return Promise.resolve();
      }

      set src(value) {
        this._src = value;
      }

      get src() {
        return this._src;
      }
    }

    globalThis.Image = ImageStub;

    try {
      const ctx = createCtx();
      const canvas = {
        getContext: vi.fn(() => ctx),
        style: {},
      };
      const renderer = new Renderer(canvas);
      const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
      const expectedSources = new Set([
        ...Object.values(retroCosmetics.towerPack.towerSprites),
        ...Object.values(retroCosmetics.towerPack.projectileSprites),
        ...Object.values(retroCosmetics.enemyPack.enemySprites),
      ]);

      renderer.updateSettings({
        towerPack: retroCosmetics.towerPack,
        enemyPack: retroCosmetics.enemyPack,
      });

      expect(renderer.spriteImageCache.size).toBe(expectedSources.size);
      expectedSources.forEach((spriteSrc) => {
        expect(renderer.spriteImageCache.has(spriteSrc)).toBe(true);
      });
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it('avoids the legacy monospace tower letter while retro sprite art is still loading', () => {
    const originalImage = globalThis.Image;
    class ImageStub {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
      }

      set src(value) {
        this._src = value;
      }

      get src() {
        return this._src;
      }
    }

    globalThis.Image = ImageStub;

    try {
      const renderer = createRenderer();
      const retroCosmetics = getEmbeddedShellCosmetics('retro-desktop');
      renderer.settings.towerPack = retroCosmetics.towerPack;
      renderer.ctx.fillText.mockClear();

      drawTower(renderer, {
        id: 'tower-loading-retro',
        type: 'Function',
        position: { row: 1, col: 1 },
        color: '#6fb9ff',
        upgradeLevel: 0,
        specialUpgradeLevel: 0,
        range: 2,
      });

      expect(renderer.ctx.fillText).not.toHaveBeenCalled();
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it('renders enemies, grid/path cache, impacts, deployables, combat text and particles', () => {
    const renderer = createRenderer();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(30_000);

    drawEnemies(renderer, [
      {
        id: 'enemy-active',
        isActive: true,
        x: 80,
        y: 90,
        type: 'buffer',
        health: 40,
        maxHealth: 100,
        size: 20,
        color: '#22cc66',
        isHit: true,
        isSlowed: true,
        isFrozen: false,
        isBoss: false,
      },
      {
        id: 'enemy-defeated',
        isActive: false,
        x: 120,
        y: 120,
        type: 'hijacker',
        health: 0,
        maxHealth: 100,
        size: 20,
        color: '#ff5f7a',
        defeatTime: 29_800,
      },
    ]);
    drawEnemy(renderer, {
      isActive: true,
      x: 100,
      y: 110,
      type: 'pathShaper',
      health: 80,
      maxHealth: 100,
      size: 18,
      color: '#ff9933',
      isFrozen: true,
      isBoss: true,
      hijackedTowerId: 't-1',
    });

    expect(getEnemyColors('unknown').body).toBe('#ff0000');
    expect(getEnemyShape('pathShaper')).toBe('square');
    drawBlob(renderer, 70, 70, 16);
    drawHealthBar(renderer, 80, 100, 40, 0.5);
    drawStatusIndicator(renderer, 80, 85, 'S', '#00f');

    drawGrid(renderer);
    drawPath(renderer);
    drawBackgroundCache(renderer);
    drawBackgroundCache(renderer);
    drawMarker(renderer, 1, 1, '#0f0', 'MID');
    expect(renderer.backgroundDirty).toBe(false);
    expect(renderer.ctx.drawImage).toHaveBeenCalled();

    drawImpacts(renderer, [
      { x: 90, y: 90, createdAt: 29_950, color: '#f0f', towerType: 'ForLoop', effect: 'splash' },
      {
        x: 130,
        y: 120,
        createdAt: 29_980,
        color: '#ff0',
        towerType: 'Switch',
        effect: 'field',
        scale: 1.3,
      },
    ]);
    expect(getImpactStyle('ForLoop', 'field')).toEqual({ lineDash: [6, 4], ringCount: 2 });
    expect(getImpactStyle('Unknown', null)).toEqual({ lineDash: [], ringCount: 1 });
    [
      'ForLoop',
      'WhileLoop',
      'IfCondition',
      'Variable',
      'Function',
      'Array',
      'Object',
      'Return',
      'TryCatch',
      'Switch',
    ].forEach((towerType) => {
      drawImpactGlyph(renderer, 100, 100, 10, '#fff', towerType);
    });

    drawDeployable(renderer, {
      position: { row: 2, col: 2 },
      color: '#f0f',
      glowColor: '#fff',
      icon: 'X',
      radius: 2,
      isTriggered: true,
      activeUntil: 30_100,
    });
    drawDeployables(renderer, [
      { position: { row: 3, col: 3 }, color: '#0ff', glowColor: '#fff', icon: '!' },
    ]);

    drawCombatText(renderer, [
      {
        createdAt: 29_950,
        duration: 600,
        x: 90,
        y: 90,
        text: '-20',
        color: '#ff4d6d',
        type: 'damage',
      },
      { createdAt: 20_000, duration: 300, x: 10, y: 10, text: 'old' },
    ]);
    expect(renderer.ctx.strokeText).toHaveBeenCalled();
    expect(renderer.ctx.fillText).toHaveBeenCalled();

    renderer.particles = [
      { x: 50, y: 50, vx: 0.5, vy: -0.2, size: 3, color: '#0ff', life: 0.6 },
      { x: 60, y: 50, vx: 0, vy: 0, size: 3, color: '#0ff', life: 0.01 },
    ];
    drawParticles(renderer);
    expect(renderer.particles.length).toBe(1);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    createExplosion(renderer, 120, 80, '#ff00de');
    expect(renderer.particles.length).toBeGreaterThan(1);

    renderer.particles = Array.from({ length: 45 }, (_, index) => ({
      x: 20 + index,
      y: 30,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#0ff',
      life: 0.9,
      shape: index % 2 === 0 ? 'line' : 'ring',
    }));
    createExplosion(renderer, 120, 80, '#ff00de');
    expect(renderer.particles.length).toBeLessThanOrEqual(42);

    nowSpy.mockRestore();
  });

  it('renders premium grid cosmetics separately from path overlays', () => {
    const renderer = createRenderer();
    renderer.settings.mapTheme = {
      gridEffectStyle: 'pulse-nodes',
      gridEffectColors: ['#60A5FA', '#E0F2FE', '#93C5FD'],
      overlayStyle: 'flow-sweep',
      overlayColors: ['#22C55E', '#86EFAC'],
    };

    drawMapPackOverlay(renderer);

    expect(renderer.ctx.arc).toHaveBeenCalled();
    expect(renderer.ctx.clip).toHaveBeenCalled();
    expect(renderer.ctx.fillRect).toHaveBeenCalled();
  });

  it('caches retro minesweeper grid chrome in the background instead of redrawing it every frame', () => {
    const renderer = createRenderer();
    renderer.settings.showGrid = false;
    renderer.settings.mapTheme = {
      gridEffectStyle: 'minesweeper-field',
      gridEffectColors: ['#7b7b7b', '#ffffff', '#2554c7'],
      overlayStyle: 'none',
    };

    renderer.backgroundCtx.fillRect.mockClear();
    renderer.backgroundCtx.stroke.mockClear();
    drawBackgroundCache(renderer);

    expect(renderer.backgroundCtx.fillRect).toHaveBeenCalled();
    expect(renderer.backgroundCtx.stroke).toHaveBeenCalled();

    renderer.ctx.fillRect.mockClear();
    renderer.ctx.stroke.mockClear();
    drawMapPackOverlay(renderer);

    expect(renderer.ctx.fillRect).not.toHaveBeenCalled();
    expect(renderer.ctx.stroke).not.toHaveBeenCalled();
  });

  it('updates interaction state and placement preview logic for towers and deployables', () => {
    const renderer = createRenderer();
    renderer.lastState = {
      towers: [{ position: { row: 1, col: 1 } }],
      deployables: [{ position: { row: 2, col: 2 } }],
    };

    setHoveredCell(renderer, 85, 45);
    expect(renderer.hoveredCell).toEqual({ row: 1, col: 2 });
    setHoveredCell(renderer, -1, -1);
    expect(renderer.hoveredCell).toBeNull();

    expect(getCellAtPosition(renderer, 30, 30)).toEqual({ row: 0, col: 0 });
    expect(getCellAtPosition(renderer, 999, 999)).toBeNull();
    expect(
      getTowerAtCell(renderer, [{ position: { row: 3, col: 3 }, id: 't3' }], { row: 3, col: 3 })
    ).toEqual(expect.objectContaining({ id: 't3' }));

    renderer.occupiedCells = new Set(['4,4']);
    expect(isCellOccupied(renderer, 4, 4)).toBe(true);
    renderer.occupiedCells = null;
    expect(isCellOccupied(renderer, 1, 1)).toBe(true);
    expect(isCellOccupied(renderer, 2, 2)).toBe(true);
    expect(isCellOccupied(renderer, 5, 5)).toBe(false);

    setPlacementMode(renderer, true, 'ForLoop', 'tower');
    expect(renderer.placementMode).toBe(true);
    setPlacementPreview(renderer, 'ForLoop', 90, 90, 'tower');
    expect(renderer.hoveredCell).toEqual({ row: 2, col: 2 });
    clearPlacementPreview(renderer);
    expect(renderer.hoveredCell).toBeNull();
    setSelectedTower(renderer, 'tower-99');
    expect(renderer.selectedTowerId).toBe('tower-99');
    clearHover(renderer);
    expect(renderer.hoveredCell).toBeNull();

    renderer.hoveredCell = { row: 3, col: 3 };
    renderer.placementItemType = 'ForLoop';
    renderer.placementModeKind = 'tower';
    renderer.settings = { showPlacementHints: true };
    renderer.pathSet = new Set(['0,0']);
    renderer.isCellOccupied = vi.fn(() => false);
    drawPlacementPreview(renderer);
    expect(renderer.drawTower).toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).toHaveBeenCalled();

    renderer.ctx.fillRect.mockClear();
    renderer.ctx.strokeRect.mockClear();
    renderer.hoveredCell = null;
    drawPlacementPreview(renderer);
    expect(renderer.ctx.fillRect).toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).toHaveBeenCalled();

    renderer.drawDeployable.mockClear();
    renderer.hoveredCell = { row: 0, col: 1 };
    renderer.placementItemType = 'Data Mine';
    renderer.placementModeKind = 'deployable';
    renderer.pathSet = new Set(['0,1']);
    drawPlacementPreview(renderer);
    expect(renderer.drawDeployable).toHaveBeenCalled();

    renderer.ctx.fillRect.mockClear();
    renderer.ctx.strokeRect.mockClear();
    renderer.hoveredCell = null;
    renderer.placementItemType = 'ForLoop';
    renderer.placementModeKind = 'tower';
    renderer.settings = { showPlacementHints: false };
    drawPlacementPreview(renderer);
    expect(renderer.ctx.fillRect).not.toHaveBeenCalled();
    expect(renderer.ctx.strokeRect).not.toHaveBeenCalled();
  });
});
