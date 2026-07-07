/**
 * Tower Defense Game Engine V2 - Canvas Renderer
 *
 * Renders all game elements on a canvas, preserving the cyberpunk visual style
 * from the original DOM-based implementation.
 */

import { COLORS } from './constants.js';
import { drawDeployables, drawDeployable } from './renderer/deployables.js';
import {
  drawGrid,
  drawPath,
  drawBackgroundCache,
  drawMarker,
  drawMapPackOverlay,
} from './renderer/grid.js';
import {
  drawTowers,
  getTowerConfig,
  getActiveSpecialEffects,
  getSpecialEffectColor,
  getSpecialEffectTag,
  computeAuraInfluence,
  drawTower,
  drawSelectedTowerRange,
} from './renderer/towers.js';
import {
  drawEnemies,
  drawEnemy,
  getEnemyColors,
  getEnemyShape,
  drawBlob,
  drawHealthBar,
  drawStatusIndicator,
} from './renderer/enemies.js';
import {
  drawProjectiles,
  drawProjectile,
  drawDefaultProjectile,
  drawForLoopProjectile,
  drawWhileLoopProjectile,
  drawIfConditionProjectile,
  drawVariableProjectile,
  drawFunctionProjectile,
  drawArrayProjectile,
  drawObjectProjectile,
  drawReturnProjectile,
  drawTryCatchProjectile,
  drawSwitchProjectile,
  drawRoundedRect,
} from './renderer/projectiles.js';
import {
  drawImpacts,
  drawDamageFields,
  getImpactStyle,
  drawImpactGlyph,
} from './renderer/impacts.js';
import { drawCombatText } from './renderer/combatText.js';
import { drawParticles, createExplosion } from './renderer/particles.js';
import { drawPlacementPreview } from './renderer/placement.js';
import { drawTowerAttackFx } from './renderer/attackFx.js';
import { preloadRendererThemeSprites } from './renderer/themeSprites.js';
import {
  setHoveredCell,
  getCellAtPosition,
  getTowerAtCell,
  isCellOccupied,
  setPlacementMode,
  setPlacementPreview,
  clearPlacementPreview,
  setSelectedTower,
  clearHover,
} from './renderer/interaction.js';

export function getPerformanceTierForState(gameState = {}, particleCount = 0) {
  const enemyCount = gameState.enemies?.length || 0;
  const projectileCount = gameState.projectiles?.length || 0;
  const impactCount = Math.min(gameState.impacts?.length || 0, 14);
  const combatTextCount = Math.min(gameState.combatText?.length || 0, 18);
  const damageFieldCount = gameState.damageFields?.length || 0;
  const activeParticleCount = Math.min(particleCount || 0, 26);

  const renderLoadScore =
    enemyCount +
    projectileCount * 1.15 +
    impactCount * 1.1 +
    combatTextCount * 0.7 +
    activeParticleCount * 0.3 +
    damageFieldCount * 2.5;

  if (renderLoadScore > 46) return 'ultra';
  if (renderLoadScore > 24) return 'heavy';
  return 'normal';
}

/**
 * Canvas renderer for the game engine
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas element to render to
   * @param {Object} options - Renderer options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Grid settings (set via configure)
    this.cellSize = options.cellSize || 50;
    this.gridCols = options.gridCols || 10;
    this.gridRows = options.gridRows || 10;
    this.pathNodes = [];

    // Visual settings
    this.settings = {
      showGrid: true,
      showRangeOnHover: true,
      showPlacementHints: false,
      particleEffects: true,
      projectileTrails: true,
      glowEffects: true,
      hitEffects: true,
      combatText: true,
      explosionEffects: true,
      staticBackground: true,
      pathGradientMode: 'homepage-default',
      mapTheme: null,
      towerPack: null,
      enemyPack: null,
      tdAttackFxMode: 'none',
      damageTextPack: null,
      deathFxPack: null,
      ...options.settings,
    };

    this.disableDynamicResolution = Boolean(options.disableDynamicResolution);

    // Selection state
    this.selectedTowerId = null;
    this.hoveredCell = null;
    this.placementMode = false;
    this.placementItemType = null;
    this.placementModeKind = 'tower';

    // Animation state
    this.particles = [];
    this.glowPhase = 0;
    this.performanceTier = 'normal';
    this.renderScale = 1;
    this.devicePixelRatio =
      typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.logicalWidth = 0;
    this.logicalHeight = 0;
    this.backgroundCanvas = null;
    this.backgroundCtx = null;
    this.backgroundDirty = true;
    this.spriteImageCache = new Map();
    preloadRendererThemeSprites(this, this.settings);

    // Cache for performance
    this.pathSet = new Set();
    this.occupiedCells = new Set();
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Configure renderer with game data
   * @param {Object} config - Configuration
   */
  configure(config) {
    this.cellSize = config.cellSize || this.cellSize;
    this.gridCols = config.gridCols || this.gridCols;
    this.gridRows = config.gridRows || this.gridRows;
    this.pathNodes = config.pathNodes || [];

    // Build path set for quick lookup
    this.pathSet.clear();
    this.pathNodes.forEach(([row, col]) => {
      this.pathSet.add(`${row},${col}`);
    });

    // Logical canvas size
    this.logicalWidth = this.gridCols * this.cellSize;
    this.logicalHeight = this.gridRows * this.cellSize;

    // Set CSS size once
    this.canvas.style.width = `${this.logicalWidth}px`;
    this.canvas.style.height = `${this.logicalHeight}px`;

    // Resize backing store with current scale
    this.updateRenderScale(this.renderScale);

    // Background cache setup
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = this.logicalWidth;
    this.backgroundCanvas.height = this.logicalHeight;
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    this.backgroundDirty = true;
  }

  /**
   * Update backing store resolution and transform for dynamic scaling
   * @param {number} scale - Resolution scale (0.6 to 1.0)
   */
  updateRenderScale(scale) {
    const clampedScale = Math.max(0.6, Math.min(1, scale));
    const scaleFactor = clampedScale * this.devicePixelRatio;

    if (
      this.renderScale === clampedScale &&
      this.canvas.width === Math.floor(this.logicalWidth * scaleFactor) &&
      this.canvas.height === Math.floor(this.logicalHeight * scaleFactor)
    ) {
      return;
    }

    this.renderScale = clampedScale;
    this.canvas.width = Math.floor(this.logicalWidth * scaleFactor);
    this.canvas.height = Math.floor(this.logicalHeight * scaleFactor);
    this.ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    this.ctx.imageSmoothingEnabled = this.renderScale < 1;
    if (this.ctx.imageSmoothingQuality) {
      this.ctx.imageSmoothingQuality = this.renderScale < 0.85 ? 'low' : 'medium';
    }
  }

  /**
   * Update visual settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    const prev = this.settings;
    this.settings = { ...this.settings, ...settings };
    if (prev.towerPack !== this.settings.towerPack || prev.enemyPack !== this.settings.enemyPack) {
      preloadRendererThemeSprites(this, this.settings);
    }
    if (
      prev.showGrid !== this.settings.showGrid ||
      prev.glowEffects !== this.settings.glowEffects ||
      prev.staticBackground !== this.settings.staticBackground ||
      prev.pathGradientMode !== this.settings.pathGradientMode ||
      prev.mapTheme !== this.settings.mapTheme
    ) {
      this.backgroundDirty = true;
    }
  }

  /**
   * Sync renderer path nodes with engine state
   * @param {Array} nextPathNodes - Array of [row, col] path points
   */
  syncPathNodes(nextPathNodes) {
    if (!Array.isArray(nextPathNodes) || nextPathNodes.length < 2) return;

    const sameLength = this.pathNodes.length === nextPathNodes.length;
    let samePath = sameLength;

    if (sameLength) {
      for (let i = 0; i < nextPathNodes.length; i += 1) {
        const [row, col] = nextPathNodes[i];
        const prevNode = this.pathNodes[i];
        if (!prevNode || prevNode[0] !== row || prevNode[1] !== col) {
          samePath = false;
          break;
        }
      }
    }

    if (samePath) return;

    this.pathNodes = nextPathNodes;
    this.pathSet.clear();
    this.pathNodes.forEach(([row, col]) => {
      this.pathSet.add(`${row},${col}`);
    });
    this.backgroundDirty = true;
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  /**
   * Render a complete frame
   * @param {Object} gameState - Current game state
   */
  render(gameState) {
    this.lastState = gameState;
    this.syncPathNodes(gameState?.pathNodes);
    this.performanceTier = getPerformanceTierForState(gameState, this.particles.length);

    // Fast lookup for occupied cells (placement validity)
    this.occupiedCells.clear();
    (gameState.towers || []).forEach((tower) => {
      this.occupiedCells.add(`${tower.position.row},${tower.position.col}`);
    });
    (gameState.deployables || []).forEach((deployable) => {
      this.occupiedCells.add(`${deployable.position.row},${deployable.position.col}`);
    });

    if (!this.placementItemType || this.selectedTowerId) {
      this.placementMode = false;
      this.placementItemType = null;
      this.placementModeKind = 'tower';
      this.hoveredCell = null;
    }

    const desiredScale = this.disableDynamicResolution
      ? 1
      : this.performanceTier === 'ultra'
        ? 0.7
        : this.performanceTier === 'heavy'
          ? 0.85
          : 1;
    this.updateRenderScale(desiredScale);

    // Clear canvas (use logical size, since context is scaled)
    this.ctx.fillStyle = this.settings.mapTheme?.mapBackground || COLORS.DEEP_BLACK;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Update glow animation phase
    this.glowPhase = (this.glowPhase + 0.05) % (Math.PI * 2);

    // Draw layers (back to front)
    if (this.settings.staticBackground) {
      this.drawBackgroundCache();
    } else if (this.performanceTier === 'normal') {
      this.drawGrid();
      this.drawPath();
    } else {
      this.drawBackgroundCache();
    }
    drawMapPackOverlay(this);
    this.drawDeployables(gameState.deployables || []);
    this.drawTowers(gameState.towers);
    this.drawDamageFields(gameState.damageFields || []);
    this.drawEnemies(gameState.enemies);
    this.drawProjectiles(gameState.projectiles, gameState.enemies);
    drawTowerAttackFx(this, gameState.towers, gameState.projectiles, gameState.enemies);
    this.drawImpacts(gameState.impacts);
    this.drawParticles();
    this.drawCombatText(gameState.combatText);

    // Draw overlays
    if (this.placementMode && this.placementItemType) {
      this.drawPlacementPreview();
    }

    if (this.selectedTowerId) {
      this.drawSelectedTowerRange(gameState.towers);
    }
  }

  // ==========================================================================
  // DEPLOYABLE RENDERING
  // ==========================================================================

  drawDeployables(deployables) {
    return drawDeployables(this, deployables);
  }

  drawDeployable(deployable, options = {}) {
    return drawDeployable(this, deployable, options);
  }

  // ==========================================================================
  // GRID RENDERING
  // ==========================================================================

  /**
   * Draw the grid
   */
  drawGrid() {
    return drawGrid(this);
  }

  /**
   * Draw the path
   */
  drawPath() {
    return drawPath(this);
  }

  /**
   * Draw cached background for heavy/ultra tiers
   */
  drawBackgroundCache() {
    return drawBackgroundCache(this);
  }

  /**
   * Draw a path marker
   * @param {number} col - Column
   * @param {number} row - Row
   * @param {string} color - Marker color
   * @param {string} label - Label text
   */
  drawMarker(col, row, color, label) {
    return drawMarker(this, col, row, color, label);
  }

  // ==========================================================================
  // TOWER RENDERING
  // ==========================================================================

  /**
   * Draw all towers
   * @param {Array} towers - Tower states
   */
  drawTowers(towers) {
    return drawTowers(this, towers);
  }

  getTowerConfig(tower) {
    return getTowerConfig(this, tower);
  }

  getActiveSpecialEffects(tower) {
    return getActiveSpecialEffects(this, tower);
  }

  getSpecialEffectColor(effects) {
    return getSpecialEffectColor(effects);
  }

  getSpecialEffectTag(effects) {
    return getSpecialEffectTag(effects);
  }

  computeAuraInfluence(towers) {
    return computeAuraInfluence(this, towers);
  }

  /**
   * Draw a single tower
   * @param {Object} tower - Tower state
   */
  drawTower(tower) {
    return drawTower(this, tower);
  }

  /**
   * Draw selected tower's range
   * @param {Array} towers - Tower states
   */
  drawSelectedTowerRange(towers) {
    return drawSelectedTowerRange(this, towers);
  }

  // ==========================================================================
  // ENEMY RENDERING
  // ==========================================================================

  /**
   * Draw all enemies
   * @param {Array} enemies - Enemy states
   */
  drawEnemies(enemies) {
    return drawEnemies(this, enemies);
  }

  /**
   * Draw a single enemy
   * @param {Object} enemy - Enemy state
   */
  drawEnemy(enemy, performanceTier = 'normal') {
    return drawEnemy(this, enemy, performanceTier);
  }

  /**
   * Get enemy color scheme
   * @param {string} type - Enemy type
   * @returns {Object} Color scheme
   */
  getEnemyColors(type) {
    return getEnemyColors(type);
  }

  /**
   * Get enemy shape
   * @param {string} type - Enemy type
   * @returns {string} Shape name
   */
  getEnemyShape(type) {
    return getEnemyShape(type);
  }

  /**
   * Draw a blob shape
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} size - Size
   */
  drawBlob(x, y, size) {
    return drawBlob(this, x, y, size);
  }

  /**
   * Draw a health bar
   * @param {number} x - Center X
   * @param {number} y - Top Y
   * @param {number} width - Bar width
   * @param {number} percent - Health percent (0-1)
   */
  drawHealthBar(x, y, width, percent) {
    return drawHealthBar(this, x, y, width, percent);
  }

  /**
   * Draw a status effect indicator
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} symbol - Symbol to draw
   * @param {string} color - Color
   */
  drawStatusIndicator(x, y, symbol, color) {
    return drawStatusIndicator(this, x, y, symbol, color);
  }

  // ==========================================================================
  // PROJECTILE RENDERING
  // ==========================================================================

  /**
   * Draw all projectiles
   * @param {Array} projectiles - Projectile states
   */
  drawProjectiles(projectiles, enemies = []) {
    return drawProjectiles(this, projectiles, enemies);
  }

  /**
   * Draw a single projectile
   * @param {Object} projectile - Projectile state
   */
  drawProjectile(projectile, options = {}) {
    return drawProjectile(this, projectile, options);
  }

  // ========================================================================
  // PROJECTILE DRAW HELPERS (Tower-specific canvas visuals)
  // ========================================================================

  drawDefaultProjectile(x, y, size, color) {
    return drawDefaultProjectile(this, x, y, size, color);
  }

  drawForLoopProjectile(x, y, size, color) {
    return drawForLoopProjectile(this, x, y, size, color);
  }

  drawWhileLoopProjectile(startX, startY, endX, endY, size, color) {
    return drawWhileLoopProjectile(this, startX, startY, endX, endY, size, color);
  }

  drawIfConditionProjectile(x, y, size, color) {
    return drawIfConditionProjectile(this, x, y, size, color);
  }

  drawVariableProjectile(x, y, size, color) {
    return drawVariableProjectile(this, x, y, size, color);
  }

  drawFunctionProjectile(x, y, size, color) {
    return drawFunctionProjectile(this, x, y, size, color);
  }

  drawArrayProjectile(x, y, size, color) {
    return drawArrayProjectile(this, x, y, size, color);
  }

  drawObjectProjectile(x, y, size, color) {
    return drawObjectProjectile(this, x, y, size, color);
  }

  drawReturnProjectile(x, y, size, color, angle) {
    return drawReturnProjectile(this, x, y, size, color, angle);
  }

  drawTryCatchProjectile(x, y, size, color) {
    return drawTryCatchProjectile(this, x, y, size, color);
  }

  drawSwitchProjectile(x, y, size, color, angle, progress = 0) {
    return drawSwitchProjectile(this, x, y, size, color, angle, progress);
  }

  drawRoundedRect(x, y, w, h, r, fillColor) {
    return drawRoundedRect(this, x, y, w, h, r, fillColor);
  }

  // ========================================================================
  // IMPACT FLASHES
  // ========================================================================

  drawImpacts(impacts = []) {
    return drawImpacts(this, impacts);
  }

  drawDamageFields(damageFields = []) {
    return drawDamageFields(this, damageFields);
  }

  getImpactStyle(towerType, effect) {
    return getImpactStyle(towerType, effect);
  }

  drawImpactGlyph(x, y, size, color, towerType) {
    return drawImpactGlyph(this, x, y, size, color, towerType);
  }

  // ========================================================================
  // COMBAT TEXT (DAMAGE/STATUS POPUPS)
  // ========================================================================

  drawCombatText(combatText = []) {
    return drawCombatText(this, combatText);
  }

  // ==========================================================================
  // PARTICLE EFFECTS
  // ==========================================================================

  /**
   * Draw particle effects
   */
  drawParticles() {
    return drawParticles(this);
  }

  /**
   * Create explosion particles
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} color - Particle color
   */
  createExplosion(x, y, color) {
    return createExplosion(this, x, y, color);
  }

  // ==========================================================================
  // PLACEMENT PREVIEW
  // ==========================================================================

  /**
   * Draw tower placement preview
   */
  drawPlacementPreview() {
    return drawPlacementPreview(this);
  }

  // ==========================================================================
  // INTERACTION
  // ==========================================================================

  /**
   * Set hovered cell from mouse position
   * @param {number} mouseX - Mouse X relative to canvas
   * @param {number} mouseY - Mouse Y relative to canvas
   */
  setHoveredCell(mouseX, mouseY) {
    return setHoveredCell(this, mouseX, mouseY);
  }

  /**
   * Get cell at mouse position
   * @param {number} mouseX - Mouse X relative to canvas
   * @param {number} mouseY - Mouse Y relative to canvas
   * @returns {{row: number, col: number}|null} Cell position or null
   */
  getCellAtPosition(mouseX, mouseY) {
    return getCellAtPosition(this, mouseX, mouseY);
  }

  /**
   * Find tower at cell position
   * @param {Array} towers - Tower states
   * @param {{row: number, col: number}} cell - Cell position
   * @returns {Object|null} Tower state or null
   */
  getTowerAtCell(towers, cell) {
    return getTowerAtCell(this, towers, cell);
  }

  isCellOccupied(row, col) {
    return isCellOccupied(this, row, col);
  }

  /**
   * Set placement mode
   * @param {boolean} enabled - Enable placement mode
   * @param {string} towerType - Tower type to place
   */
  setPlacementMode(enabled, itemType = null, kind = 'tower') {
    return setPlacementMode(this, enabled, itemType, kind);
  }

  /**
   * Set placement preview position
   * @param {string} towerType - Tower type
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  setPlacementPreview(itemType, mouseX, mouseY, kind = 'tower') {
    return setPlacementPreview(this, itemType, mouseX, mouseY, kind);
  }

  /**
   * Clear placement preview
   */
  clearPlacementPreview() {
    return clearPlacementPreview(this);
  }

  /**
   * Set selected tower
   * @param {string|null} towerId - Tower ID or null to deselect
   */
  setSelectedTower(towerId) {
    return setSelectedTower(this, towerId);
  }

  /**
   * Clear hover state
   */
  clearHover() {
    return clearHover(this);
  }
}

export default Renderer;
