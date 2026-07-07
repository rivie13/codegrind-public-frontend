/**
 * Tower Defense Game Engine V2
 *
 * Main game engine class that manages all game state and logic.
 * This is a standalone engine that can be connected to React via events.
 */

import { GAME_CONSTANTS, GAME_STATUS } from './constants.js';
import { WaveGenerator } from './WaveGenerator.js';
import { Renderer } from './Renderer.js';
import {
  getDifficultyBaseStats,
  normalizeProblemDifficulty,
} from '../utils/problems/difficultyConfig.js';
import { updateCombatText, spawnCombatText, spawnDeployablePopup } from './engine/combatText.js';
import {
  calculateScore,
  calculateEndlessWaveBonus,
  addEndlessScore,
  getEndlessSurvivalTime,
  applyEndlessSurvivalBonus,
} from './engine/scoring.js';
import {
  startWave,
  checkWaveStatus,
  levelComplete,
  gameOver,
  startEndlessMode,
  generateEndlessWave,
} from './engine/wave.js';
import {
  placeTower,
  placeDeployable,
  upgradeTower,
  upgradeTowerSpecial,
  setTowerTargeting,
  sellTower,
  isValidTowerPosition,
  isValidDeployablePosition,
  isPositionOnPath,
  reservePlacement,
  getReservedPlacementCount,
  cancelReservedPlacement,
  applyGameSettings,
} from './engine/placement.js';
import { spawnEnemies, updateEnemies, updateEnemyPosition } from './engine/enemies.js';
import { updateDeployables, applyDeployableEffect } from './engine/deployables.js';
import { applyDelayedDamage, updateDamageFields } from './engine/damage.js';
import {
  getActiveUpgradeEffects,
  getAggregatedTowerEffects,
  getAuraBonusForTower,
  getTargetsInRange,
  updateTowers,
  findTargetForTower,
} from './engine/towers.js';
import {
  updateProjectiles,
  applyPendingDamage,
  applySplashDamage,
  spawnDamageField,
} from './engine/projectiles.js';
import { update as updateLoop } from './engine/loop.js';

const ENDLESS_SCORING = {
  WAVE_CLEAR_BONUS: 500,
  WAVE_MULTIPLIER: 50,
  BOSS_KILL_BONUS: 1000,
  SURVIVAL_BONUS_PER_MINUTE: 100,
};

// Re-export constants and renderer for convenience
export { GAME_CONSTANTS, GAME_STATUS, Renderer };

/**
 * Main game engine class
 */
export class GameEngine {
  /**
   * @param {Object} options - Engine options
   * @param {number} options.initialCredits - Starting credits (default: 350)
   * @param {number} options.initialLives - Starting lives (default: 10)
   */
  constructor(options = {}) {
    // Unique ID for debugging
    this._engineId = Math.random().toString(36).substr(2, 9);

    // Expose constants for helper modules
    this.GAME_CONSTANTS = GAME_CONSTANTS;
    this.GAME_STATUS = GAME_STATUS;
    this.ENDLESS_SCORING = ENDLESS_SCORING;

    const normalizedDifficulty = normalizeProblemDifficulty(options.problemDifficulty);
    const baseStats = getDifficultyBaseStats(normalizedDifficulty);
    this.problemDifficulty = normalizedDifficulty;
    this.totalWaves = options.totalWaves || baseStats.totalWaves || GAME_CONSTANTS.TOTAL_WAVES;
    this.initialCredits =
      options.initialCredits ?? baseStats.initialCredits ?? GAME_CONSTANTS.INITIAL_CREDITS;
    this.initialLives =
      options.initialLives ?? baseStats.initialLives ?? GAME_CONSTANTS.INITIAL_LIVES;
    this.creditMultiplier = options.creditMultiplier ?? baseStats.creditMultiplier ?? 1;
    this.playerLevel =
      Number.isFinite(Number(options.playerLevel)) && Number(options.playerLevel) > 0
        ? Math.floor(Number(options.playerLevel))
        : 1;
    this.gameSettings = {
      enemyHealthMultiplier: 1,
      enemySpeedMultiplier: 1,
      totalWaves: this.totalWaves,
    };

    // Endless mode state
    this.isEndlessMode = false;
    this.endlessWave = 0;
    this.endlessStartScore = 0;
    this.endlessBossesKilled = 0;
    this.endlessStartTime = null;
    this.endlessSurvivalBonusApplied = false;
    this.endlessDifficulty = 'normal';

    // Game state
    this.state = {
      status: GAME_STATUS.PREHACK,
      credits: this.initialCredits,
      lives: this.initialLives,
      wave: 1,
      enemiesDefeated: 0,
      enemiesInWave: 0,
      score: 0,
      totalWaves: this.totalWaves,
      problemDifficulty: this.problemDifficulty,
      playerLevel: this.playerLevel,
      isEndlessMode: false,
      endlessWave: 0,
      endlessScore: 0,
      endlessBossesKilled: 0,
      endlessSurvivalTime: 0,
      deployables: [],
    };

    // Entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.deployables = [];
    this.enemyQueue = [];
    this.impacts = [];
    this.combatText = [];
    this.combatTextCooldowns = new Map();
    this.delayedDamage = [];
    this.damageFields = [];
    this.reservedPlacements = {
      tower: {},
      deployable: {},
    };

    // Path data (set by initialize())
    this.pathNodes = [];
    this.gridCols = 0;
    this.gridRows = 0;
    this.cellSize = 0;

    // Wave management
    this.waveGenerator = new WaveGenerator(this.problemDifficulty, {
      playerLevel: this.playerLevel,
    });
    this.waveGenerator.totalWaves = this.totalWaves;
    this.waveGenerator.applySettings(this.gameSettings);
    this.waveStartTime = 0;
    this.waveDifficulty = 'normal';

    // Animation budget
    this.animationBudget = {
      maxProjectiles: GAME_CONSTANTS.MAX_PROJECTILES,
      currentProjectiles: 0,
      priorityThreshold: 50,
    };

    // Pending attacks (damage applied when projectile hits)
    this.pendingAttacks = [];
    this.delayedDamage = [];
    this.damageFields = [];

    // Game loop
    this.lastUpdateTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    // Event listeners
    this.listeners = new Map();

    // Time tracking for score
    this.gameStartTime = null;
    this.totalGameTime = 0;

    // Code solution success (set via notifySolutionSuccess before levelComplete)
    this.solutionSuccess = false;

    // Cached state snapshot (avoid rebuilding every render)
    this._cachedState = null;
    this._stateDirty = true;

    // Throttle UI update events (renderer reads engine state directly)
    this.uiUpdateIntervalMs = 1000 / 30;
    this._lastUiUpdateTime = 0;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize the engine with path and grid data
   * @param {Object} config - Configuration
   * @param {Array} config.pathNodes - Array of [row, col] path points
   * @param {number} config.gridCols - Number of columns
   * @param {number} config.gridRows - Number of rows
   * @param {number} config.cellSize - Size of each cell in pixels
   */
  initialize(config) {
    this.pathNodes = config.pathNodes || [];
    this.gridCols = config.gridCols || 10;
    this.gridRows = config.gridRows || 10;
    this.cellSize = config.cellSize || 50;
    this._stateDirty = true;
    this._cachedState = null;

    // Generate initial wave queue
    this.enemyQueue = this.waveGenerator.generateWaveQueue(this.state.wave, this.waveDifficulty);
    this.state.enemiesInWave = this.enemyQueue.length;

    this.emit('initialized', this.getState());
  }

  // ==========================================================================
  // EVENT SYSTEM
  // ==========================================================================

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.listeners.get(event).delete(callback);
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for '${event}':`, err);
        }
      });
    }
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  /**
   * Get complete game state (for React)
   * @returns {Object} Current game state
   */
  getState() {
    return this._buildStateSnapshot(false);
  }

  getStateSnapshot(force = false) {
    return this._buildStateSnapshot(force);
  }

  getUiState() {
    return {
      status: this.state.status,
      credits: this.state.credits,
      lives: this.state.lives,
      wave: this.state.wave,
      enemiesDefeated: this.state.enemiesDefeated,
      enemiesInWave: this.state.enemiesInWave,
      enemiesRemaining: (this.enemyQueue?.length || 0) + (this.enemies?.length || 0),
      totalWaves: this.state.totalWaves,
      problemDifficulty: this.state.problemDifficulty,
      playerLevel: this.state.playerLevel,
      isEndlessMode: this.state.isEndlessMode,
      endlessWave: this.state.endlessWave,
      endlessScore: this.state.endlessScore,
      endlessBossesKilled: this.state.endlessBossesKilled,
      endlessSurvivalTime: this.state.endlessSurvivalTime,
    };
  }

  getRenderState() {
    return {
      status: this.state.status,
      currentTime: this.currentTime || Date.now(),
      towers: this.towers || [],
      enemies: this.enemies || [],
      projectiles: this.projectiles || [],
      deployables: this.deployables || [],
      damageFields: this.damageFields || [],
      impacts: this.impacts || [],
      combatText: this.combatText || [],
      pathNodes: this.pathNodes || [],
      gridCols: this.gridCols,
      gridRows: this.gridRows,
      cellSize: this.cellSize,
    };
  }

  _buildStateSnapshot(force) {
    if (!force && !this._stateDirty && this._cachedState) {
      return this._cachedState;
    }

    const nextState = {
      ...this.state,
      currentTime: this.currentTime || Date.now(),
      towers: (this.towers || []).map((t) => t.getState()),
      enemies: (this.enemies || []).map((e) => e.getState()),
      projectiles: (this.projectiles || []).map((p) => p.getState()),
      deployables: (this.deployables || []).map((d) => d.getState()),
      damageFields: this.damageFields || [],
      impacts: this.impacts || [],
      combatText: this.combatText || [],
      enemiesRemaining: (this.enemyQueue?.length || 0) + (this.enemies?.length || 0),
      pathNodes: this.pathNodes || [],
      gridCols: this.gridCols,
      gridRows: this.gridRows,
      cellSize: this.cellSize,
    };

    this._cachedState = nextState;
    this._stateDirty = false;
    return nextState;
  }

  /**
   * Update state and emit change event
   * @param {Object} updates - State updates
   */
  updateState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this._stateDirty = true;
    this.emit('state-change', { prev: prevState, current: this.state });
  }

  // ==========================================================================
  // GAME LOOP
  // ==========================================================================

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    this.emit('started', {});
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit('stopped', {});
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  gameLoop(timestamp) {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;

    // Only update if wave is active
    if (this.state.status === GAME_STATUS.PLAYING) {
      this.update(deltaTime);
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Main update function
   * @param {number} deltaTime - Time since last frame in ms
   */
  update(deltaTime) {
    updateLoop(this, deltaTime);
  }

  // ==========================================================================
  // SPAWN SYSTEM
  // ==========================================================================

  /**
   * Spawn enemies from the queue
   * @param {number} currentTime - Current timestamp
   */
  spawnEnemies(currentTime) {
    spawnEnemies(this, currentTime);
  }

  // ==========================================================================
  // ENEMY SYSTEM
  // ==========================================================================

  /**
   * Update all enemies
   * @param {number} deltaTime - Time since last frame
   */
  updateEnemies(deltaTime) {
    updateEnemies(this, deltaTime);
  }

  /**
   * Update enemy position from progress along path
   * @param {EnemyEntity} enemy - Enemy to update
   */
  updateEnemyPosition(enemy) {
    updateEnemyPosition(this, enemy);
  }

  // ==========================================================================
  // DEPLOYABLE SYSTEM
  // ==========================================================================

  /**
   * Update deployables and apply effects
   * @param {number} deltaTime - Time since last frame
   * @param {number} currentTime - Current timestamp
   */
  updateDeployables(deltaTime, currentTime) {
    updateDeployables(this, deltaTime, currentTime);
  }

  /**
   * Apply deployable effect to an enemy
   * @param {DeployableEntity} deployable
   * @param {EnemyEntity} enemy
   * @param {number} now
   * @param {number} deltaTime
   */
  applyDeployableEffect(deployable, enemy, now, deltaTime) {
    applyDeployableEffect(this, deployable, enemy, now, deltaTime);
  }

  // ========================================================================
  // TOWER UPGRADE EFFECT HELPERS
  // ========================================================================

  applyDelayedDamage(currentTime) {
    applyDelayedDamage(this, currentTime);
  }

  updateDamageFields(currentTime) {
    updateDamageFields(this, currentTime);
  }

  // ==========================================================================
  // TOWER SYSTEM
  // ==========================================================================

  getActiveUpgradeEffects(tower) {
    return getActiveUpgradeEffects(this, tower);
  }

  getAggregatedTowerEffects(tower) {
    return getAggregatedTowerEffects(this, tower);
  }

  getAuraBonusForTower(tower) {
    return getAuraBonusForTower(this, tower);
  }

  getTargetsInRange(tower, options = {}) {
    return getTargetsInRange(this, tower, options);
  }

  /**
   * Update all towers (process attacks)
   * @param {number} currentTime - Current timestamp
   */
  updateTowers(currentTime) {
    updateTowers(this, currentTime);
  }

  /**
   * Find the best target for a tower based on targeting strategy
   * @param {TowerEntity} tower - Tower to find target for
   * @returns {EnemyEntity|null} Target enemy or null
   */
  findTargetForTower(tower, options = {}) {
    return findTargetForTower(this, tower, options);
  }

  // ==========================================================================
  // PROJECTILE SYSTEM
  // ==========================================================================

  /**
   * Update all projectiles
   * @param {number} deltaTime - Time since last frame
   */
  updateProjectiles(deltaTime) {
    updateProjectiles(this, deltaTime);
  }

  /**
   * Apply pending damage to target
   * @param {string} targetId - Target enemy ID
   * @param {string} towerId - Source tower ID
   */
  applyPendingDamage(targetId, towerId) {
    return applyPendingDamage(this, targetId, towerId);
  }

  applySplashDamage(target, splashConfig, baseDamage, towerId, color) {
    applySplashDamage(this, target, splashConfig, baseDamage, towerId, color);
  }

  spawnDamageField(target, fieldConfig, baseDamage, towerId, color) {
    spawnDamageField(this, target, fieldConfig, baseDamage, towerId, color);
  }

  // ========================================================================
  // COMBAT TEXT HELPERS
  // ========================================================================

  updateCombatText(now) {
    updateCombatText(this, now);
  }

  spawnCombatText(entry, options = {}) {
    spawnCombatText(this, entry, options);
  }

  spawnDeployablePopup(deployable, now) {
    spawnDeployablePopup(this, deployable, now);
  }

  // ==========================================================================
  // WAVE MANAGEMENT
  // ==========================================================================

  /**
   * Start a new wave
   * @param {string} difficulty - Difficulty for wave 5 (normal, easy, hard, nightmare)
   * @returns {boolean} Success
   */
  startWave(difficulty = 'normal') {
    return startWave(this, difficulty);
  }

  /**
   * Check if wave is complete
   */
  checkWaveStatus() {
    checkWaveStatus(this);
  }

  /**
   * Handle level completion (victory)
   */
  levelComplete() {
    levelComplete(this);
  }

  /**
   * Handle game over
   */
  gameOver() {
    gameOver(this);
  }

  // ==========================================================================
  // TOWER ACTIONS
  // ==========================================================================

  /**
   * Place a tower on the grid
   * @param {string} type - Tower type
   * @param {{row: number, col: number}} position - Grid position
   * @returns {boolean} Success
   */
  placeTower(type, position) {
    return placeTower(this, type, position);
  }

  /**
   * Place a deployable on the grid
   * @param {string} type - Deployable type
   * @param {{row: number, col: number}} position - Grid position
   * @returns {boolean} Success
   */
  placeDeployable(type, position) {
    return placeDeployable(this, type, position);
  }

  /**
   * Upgrade a tower
   * @param {string} towerId - Tower ID
   * @returns {boolean} Success
   */
  upgradeTower(towerId) {
    return upgradeTower(this, towerId);
  }

  /**
   * Upgrade a tower's special ability
   * @param {string} towerId - Tower ID
   * @returns {boolean} Success
   */
  upgradeTowerSpecial(towerId) {
    return upgradeTowerSpecial(this, towerId);
  }

  /**
   * Update a tower's targeting preference
   * @param {string} towerId - Tower ID
   * @param {string} targeting - Targeting mode
   * @returns {boolean} Success
   */
  setTowerTargeting(towerId, targeting) {
    return setTowerTargeting(this, towerId, targeting);
  }

  /**
   * Transform a tower to a new type without refunding or repositioning
   * @param {string} towerId - Tower ID
   * @param {string} newType - New tower type
   * @returns {boolean} Success
   */
  transformTowerType(towerId, newType) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower || !tower.applyType) return false;
    const previousType = tower.type;
    tower.applyType(newType);
    this.updateState({});
    this.emit('tower-transformed', {
      tower: tower.getState(),
      previousType,
      newType: tower.type,
    });
    return true;
  }

  /**
   * Sell a tower
   * @param {string} towerId - Tower ID
   * @returns {boolean} Success
   */
  sellTower(towerId) {
    return sellTower(this, towerId);
  }

  /**
   * Check if a position is valid for tower placement
   * @param {{row: number, col: number}} position - Grid position
   * @returns {boolean} Valid
   */
  isValidTowerPosition(position) {
    return isValidTowerPosition(this, position);
  }

  /**
   * Check if a position is valid for deployable placement
   * @param {{row: number, col: number}} position - Grid position
   * @param {Object} deployableProps - Deployable configuration
   * @returns {boolean} Valid
   */
  isValidDeployablePosition(position, deployableProps) {
    return isValidDeployablePosition(this, position, deployableProps);
  }

  /**
   * Check if a grid cell is part of the path
   * @param {number} row
   * @param {number} col
   */
  isPositionOnPath(row, col) {
    return isPositionOnPath(this, row, col);
  }

  // ==========================================================================
  // SCORING
  // ==========================================================================

  /**
   * Calculate final score
   * @param {boolean} solutionSuccess - Whether code solution was successful
   * @returns {number} Final score
   */
  calculateScore(solutionSuccess = false) {
    return calculateScore(this, solutionSuccess);
  }

  calculateEndlessWaveBonus(endlessWave) {
    return calculateEndlessWaveBonus(this, endlessWave);
  }

  addEndlessScore(points) {
    addEndlessScore(this, points);
  }

  getEndlessSurvivalTime() {
    return getEndlessSurvivalTime(this);
  }

  applyEndlessSurvivalBonus() {
    applyEndlessSurvivalBonus(this);
  }

  /**
   * Record that the player's code submission was successful so that
   * levelComplete() can include the solution bonus when computing the final score.
   * @param {boolean} success
   */
  notifySolutionSuccess(success) {
    this.solutionSuccess = Boolean(success);
  }

  // ==========================================================================
  // GAME CONTROL
  // ==========================================================================

  /**
   * Reset the game to initial state
   */
  reset() {
    this.stop();

    // Reset state
    this.state = {
      status: GAME_STATUS.PREHACK,
      credits: this.initialCredits,
      lives: this.initialLives,
      wave: 1,
      enemiesDefeated: 0,
      enemiesInWave: 0,
      score: 0,
      totalWaves: this.totalWaves,
      problemDifficulty: this.problemDifficulty,
      playerLevel: this.playerLevel,
      isEndlessMode: false,
      endlessWave: 0,
      endlessScore: 0,
      endlessBossesKilled: 0,
      endlessSurvivalTime: 0,
      deployables: [],
    };

    // Clear entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.deployables = [];
    this.pendingAttacks = [];
    this.reservedPlacements = {
      tower: {},
      deployable: {},
    };

    // Reset wave
    this.enemyQueue = this.waveGenerator.generateWaveQueue(1, this.waveDifficulty);
    this.state.enemiesInWave = this.enemyQueue.length;
    this.waveStartTime = 0;
    this.waveDifficulty = 'normal';

    // Reset endless mode
    this.isEndlessMode = false;
    this.endlessWave = 0;
    this.endlessStartScore = 0;
    this.endlessBossesKilled = 0;
    this.endlessStartTime = null;
    this.endlessSurvivalBonusApplied = false;

    // Reset time
    this.gameStartTime = null;
    this.totalGameTime = 0;

    // Ensure the next snapshot reflects the reset state
    this._stateDirty = true;
    this._cachedState = null;

    this.emit('reset', this.getState());
  }

  /**
   * Reserve a placement by deducting credits now and consuming later on placement.
   * @param {'tower'|'deployable'} kind - Placement kind
   * @param {string} type - Tower/Deployable type
   * @returns {{success: boolean, reason?: string, cost?: number, credits?: number}}
   */
  reservePlacement(kind, type) {
    return reservePlacement(this, kind, type);
  }

  /**
   * Get total reserved placements for a kind.
   * @param {'tower'|'deployable'} kind
   * @returns {number}
   */
  getReservedPlacementCount(kind) {
    return getReservedPlacementCount(this, kind);
  }

  /**
   * Cancel a reserved placement and refund credits.
   * @param {'tower'|'deployable'} kind
   * @param {string} type
   * @returns {{success: boolean, reason?: string, cost?: number, credits?: number}}
   */
  cancelReservedPlacement(kind, type) {
    return cancelReservedPlacement(this, kind, type);
  }

  /**
   * Apply gameplay settings (only safe outside active wave)
   * @param {Object} settings - Settings overrides
   * @param {boolean} [options.applyToState=false] - Update credits/lives for prehack
   */
  applyGameSettings(settings = {}, options = {}) {
    return applyGameSettings(this, settings, options);
  }

  // ========================================================================
  // ENDLESS MODE
  // ========================================================================

  setPlayerLevel(playerLevel) {
    const normalizedLevel =
      Number.isFinite(Number(playerLevel)) && Number(playerLevel) > 0
        ? Math.floor(Number(playerLevel))
        : 1;
    if (normalizedLevel === this.playerLevel) return;

    this.playerLevel = normalizedLevel;
    if (typeof this.waveGenerator?.setPlayerLevel === 'function') {
      this.waveGenerator.setPlayerLevel(normalizedLevel);
    }

    const updates = { playerLevel: normalizedLevel };
    if (!this.isEndlessMode && this.state.status !== this.GAME_STATUS.PLAYING) {
      this.enemyQueue = this.waveGenerator.generateWaveQueue(this.state.wave, this.waveDifficulty);
      updates.enemiesInWave = this.enemyQueue.length;
    }

    this.updateState(updates);
  }

  startEndlessMode(options = {}) {
    return startEndlessMode(this, options);
  }

  generateEndlessWave(endlessWaveNum) {
    return generateEndlessWave(this, endlessWaveNum);
  }

  /**
   * Set game status manually (for prehack -> ready transition)
   * @param {string} status - New status
   */
  setStatus(status) {
    if (Object.values(GAME_STATUS).includes(status)) {
      this.updateState({ status });
      this.emit('status-changed', { status });
    }
  }

  /**
   * Destroy the engine and clean up
   */
  destroy() {
    this.stop();
    this.listeners.clear();
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.deployables = [];
    this.pendingAttacks = [];
    this.enemyQueue = [];
    this.pathNodes = [];
  }
}

export default GameEngine;
