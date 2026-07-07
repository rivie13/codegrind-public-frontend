/**
 * Tower Defense Game Engine V2 - Constants
 *
 * Re-exports TOWER_TYPES and ENEMY_TYPES from existing V1 components
 * and adds V2-specific constants for canvas rendering.
 *
 * IMPORTANT: We import from V1 components to maintain single source of truth.
 * Only V2-specific additions (targeting, shape for canvas) are defined here.
 */

// ============================================================================
// IMPORT FROM V1 COMPONENTS (Single Source of Truth)
// ============================================================================

import { TOWER_TYPES as V1_TOWER_TYPES } from '../components/towerDefense/data/towerTypes';

// V1 enemy definitions (moved here to remove V1 component dependency)
const V1_ENEMY_TYPES = {
  BASIC: {
    type: 'basic',
    health: 55,
    speed: 0.0013,
    reward: 9,
    damage: 1,
    color: '#FF3366',
    size: 16,
    description: 'Standard enemy',
  },
  EDGE: {
    type: 'edge',
    health: 38,
    speed: 0.0023,
    reward: 12,
    damage: 1,
    color: '#FFCC00',
    size: 14,
    description: 'Fast but weak edge case',
  },
  COMPLEX: {
    type: 'complex',
    health: 110,
    speed: 0.0011,
    reward: 16,
    damage: 2,
    color: '#FF66CC',
    size: 20,
    description: 'Tough enemy requiring complex solutions',
  },
  TIME_LIMIT: {
    type: 'timeLimit',
    health: 30,
    speed: 0.0027,
    reward: 18,
    damage: 2,
    color: '#00FFFF',
    size: 12,
    description: 'Very fast enemy, must be defeated quickly',
    special: {
      ignoreSlow: true,
      ignoreFreeze: true,
    },
  },
  SPACE_COMPLEX: {
    type: 'spaceComplex',
    health: 150,
    speed: 0.00085,
    reward: 24,
    damage: 2,
    color: '#9966FF',
    size: 24,
    description: 'Large, slow enemy with high health',
  },
  HIJACKER: {
    type: 'hijacker',
    health: 90,
    speed: 0.0012,
    reward: 22,
    damage: 2,
    color: '#FF6B6B',
    size: 18,
    description: 'Seizes the nearest tower and disables it until defeated',
    special: {
      kind: 'tower-hijack',
      hijackRange: 1.8,
    },
  },
  BUFFER: {
    type: 'buffer',
    health: 250,
    speed: 0.00072,
    reward: 30,
    damage: 2,
    color: '#33CC66',
    size: 22,
    description: 'Slow aura unit that strengthens nearby enemies',
    special: {
      kind: 'aura-buffer',
      buffRadius: 2.6,
      speedMultiplier: 1.25,
      damageTakenMultiplier: 0.85,
    },
  },
  PATH_SHAPER: {
    type: 'pathShaper',
    health: 150,
    speed: 0.00135,
    reward: 18,
    damage: 2,
    color: '#FFAA33',
    size: 16,
    description: 'Shortens the path by 10% if it reaches the end',
    special: {
      kind: 'path-shaper',
      shortenPercent: 0.1,
    },
  },
};

// ============================================================================
// V2 TOWER EXTENSIONS (Canvas-specific properties)
// ============================================================================

export const TARGETING_MODES = ['closest', 'furthest', 'highest-health', 'lowest-health'];

// Add targeting strategies for canvas-based game engine
const TOWER_TARGETING = {
  FOR_LOOP: 'furthest',
  WHILE_LOOP: 'closest',
  IF_CONDITION: 'lowest-health',
  VARIABLE: 'closest',
  AI_ASSIST: 'closest',
  FUNCTION: 'highest-health',
  ARRAY: 'closest',
  OBJECT: 'closest',
  RETURN: 'furthest',
  TRY_CATCH: 'closest',
  SWITCH: 'closest',
  BURST_TURRET: 'closest',
  BLAST_TURRET: 'closest',
  LOG: 'closest',
};

// Merge V1 tower types with V2 targeting extensions
export const TOWER_TYPES = Object.fromEntries(
  Object.entries(V1_TOWER_TYPES).map(([key, value]) => [
    key,
    {
      ...value,
      targeting: TOWER_TARGETING[key] || 'closest',
    },
  ])
);

// ============================================================================
// V2 ENEMY EXTENSIONS (Canvas-specific properties)
// ============================================================================

// Add shape hints for canvas rendering
const ENEMY_SHAPES = {
  BASIC: 'circle',
  EDGE: 'square',
  COMPLEX: 'rectangle',
  TIME_LIMIT: 'circle',
  SPACE_COMPLEX: 'blob',
  HIJACKER: 'rectangle',
  BUFFER: 'blob',
  PATH_SHAPER: 'square',
};

// Merge V1 enemy types with V2 shape extensions
export const ENEMY_TYPES = Object.fromEntries(
  Object.entries(V1_ENEMY_TYPES).map(([key, value]) => [
    key,
    {
      ...value,
      shape: ENEMY_SHAPES[key] || 'circle',
    },
  ])
);

// ============================================================================
// WAVE DEFINITIONS
// ============================================================================

export const WAVE_DEFINITIONS = {
  1: [{ type: 'basic', count: 5, delay: 950 }],
  2: [
    { type: 'basic', count: 5, delay: 850 },
    { type: 'edge', count: 2, delay: 1500 },
  ],
  3: [
    { type: 'basic', count: 4, delay: 850 },
    { type: 'edge', count: 3, delay: 1250 },
    { type: 'complex', count: 2, delay: 2000 },
  ],
  4: [
    { type: 'basic', count: 5, delay: 750 },
    { type: 'edge', count: 3, delay: 1100 },
    { type: 'complex', count: 2, delay: 1850 },
    { type: 'timeLimit', count: 2, delay: 2400 },
    { type: 'hijacker', count: 1, delay: 2600 },
  ],
  5: [
    { type: 'basic', count: 6, delay: 700 },
    { type: 'edge', count: 4, delay: 900 },
    { type: 'complex', count: 2, delay: 1700 },
    { type: 'timeLimit', count: 2, delay: 2200 },
    { type: 'spaceComplex', count: 1, delay: 3200 },
    { type: 'buffer', count: 1, delay: 3200 },
    { type: 'pathShaper', count: 1, delay: 2800 },
  ],
};

// ============================================================================
// DIFFICULTY MULTIPLIERS (for Wave 5)
// ============================================================================

export const DIFFICULTY_MULTIPLIERS = {
  normal: {
    count: 1.0,
    health: 1.0,
    speed: 1.0,
  },
  easy: {
    count: 0.8,
    health: 0.7,
    speed: 0.9,
  },
  hard: {
    count: 1.5,
    health: 1.5,
    speed: 1.3,
  },
  nightmare: {
    count: 2.0,
    health: 2.5,
    speed: 1.5,
    bosses: [
      { type: 'spaceComplex', healthMultiplier: 3.0, speedMultiplier: 0.8, spawnDelay: 1000 },
      { type: 'timeLimit', healthMultiplier: 2.5, speedMultiplier: 1.8, spawnDelay: 15000 },
    ],
  },
};

// ============================================================================
// GAME CONSTANTS
// ============================================================================

export const GAME_CONSTANTS = {
  INITIAL_CREDITS: 350,
  INITIAL_LIVES: 10,
  TOTAL_WAVES: 5,

  // Upgrade bonuses
  DAMAGE_BONUS_PER_UPGRADE: 0.12, // 12% per upgrade level
  RANGE_BONUS_PER_UPGRADE: 0.25, // 0.25 range per upgrade level
  SPEED_BONUS_PER_UPGRADE: 0.07, // 7% attack speed per upgrade level

  // Sell value
  SELL_REFUND_RATE: 0.6, // 60% of total investment

  // Wave completion bonus
  WAVE_BONUS_BASE: 30,
  WAVE_BONUS_PER_WAVE: 10,
  WAVE_BONUS_MULTIPLIER: 0.8,

  // Scoring
  SCORE_PER_LIFE: 100,
  SCORE_PER_10_CREDITS: 1,
  TIME_BONUS_BASE: 1000,
  TIME_PENALTY_PER_SECOND: 0.1,
  SOLUTION_BONUS: 5000,

  // Animation budget
  MAX_PROJECTILES: 25,
  MAX_PARTICLES: 35,

  // Game loop
  FIXED_TIMESTEP: 16.67, // ~60 FPS
  SPAWN_PROTECTION_MS: 500, // Enemies can't be targeted for 500ms after spawn
};

// ============================================================================
// DEPLOYABLES (One-time use items)
// ============================================================================

export const DEPLOYABLE_TYPES = {
  DATA_MINE: {
    key: 'DATA_MINE',
    type: 'Data Mine',
    cost: 35,
    damage: 80,
    radius: 1.5,
    placementType: 'path',
    effect: 'damage',
    trigger: 'burst',
    uses: 1,
    color: '#ff3366',
    glowColor: 'rgba(255, 51, 102, 0.5)',
    icon: '💣',
    description: 'Explodes when an enemy passes, dealing 80 damage in a small radius.',
  },
  ICE_TRAP: {
    key: 'ICE_TRAP',
    type: 'ICE Trap',
    cost: 45,
    radius: 1,
    duration: 3000,
    placementType: 'path',
    effect: 'freeze',
    trigger: 'per-enemy',
    uses: 3,
    color: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.5)',
    icon: '❄️',
    description: 'Freezes the first 3 enemies for 3 seconds.',
  },
  BANDWIDTH_THROTTLE: {
    key: 'BANDWIDTH_THROTTLE',
    type: 'Bandwidth Throttle',
    cost: 25,
    radius: 2,
    duration: 5000,
    placementType: 'path',
    effect: 'slow',
    trigger: 'area',
    slowFactor: 0.5,
    uses: 1,
    color: '#ff9900',
    glowColor: 'rgba(255, 153, 0, 0.5)',
    icon: '🔻',
    description: 'Slows all enemies in range by 50% for 5 seconds.',
  },
  BUFFER_OVERFLOW: {
    key: 'BUFFER_OVERFLOW',
    type: 'Buffer Overflow',
    cost: 70,
    radius: 2.5,
    placementType: 'any',
    effect: 'percentDamage',
    trigger: 'burst',
    percentDamage: 0.5,
    uses: 1,
    color: '#9966ff',
    glowColor: 'rgba(153, 102, 255, 0.5)',
    icon: '💥',
    description: 'Deals 50% of max health to enemies in range.',
  },
  FIREWALL_SHARD: {
    key: 'FIREWALL_SHARD',
    type: 'Firewall Shard',
    cost: 55,
    radius: 0.5,
    duration: 4000,
    damage: 5,
    placementType: 'path',
    effect: 'block',
    trigger: 'area',
    uses: 1,
    color: '#ff6600',
    glowColor: 'rgba(255, 102, 0, 0.8)',
    icon: '🛡️',
    description: 'Blocks the path for 4 seconds and damages waiting enemies.',
  },
  LOGIC_BOMB: {
    key: 'LOGIC_BOMB',
    type: 'Logic Bomb',
    cost: 90,
    radius: 4,
    duration: 3000,
    placementType: 'any',
    effect: 'logicField',
    trigger: 'area',
    dotPercentPerSecond: 0.12,
    executeThreshold: 0.3,
    uses: 1,
    color: '#ff00ff',
    glowColor: 'rgba(255, 0, 255, 0.5)',
    icon: '☠️',
    description:
      'Creates a 3-second corruption field, draining enemies over time and executing those under 30% health.',
  },
};

// ============================================================================
// GAME STATES
// ============================================================================

export const GAME_STATUS = {
  PREHACK: 'prehack', // Initial state, waiting to start
  READY: 'ready', // Ready to start a wave (Function + Object placed)
  PLAYING: 'playing', // Wave in progress (matches V1)
  WAVE_COMPLETE: 'wave-complete', // Wave finished
  LEVEL_COMPLETE: 'level-complete', // All waves finished - victory!
  GAME_OVER: 'game-over', // Player lost all lives
};

// ============================================================================
// COLOR PALETTE (Cyberpunk theme)
// ============================================================================

export const COLORS = {
  // Primary colors
  NEON_GREEN: '#00ff00',
  NEON_CYAN: '#00ccff',
  NEON_PINK: '#FF00DE',
  NEON_YELLOW: '#FFCC00',
  NEON_PURPLE: '#9966FF',

  // Background colors
  DEEP_BLACK: '#1e1e1e',
  DARK_BLUE: '#0a0a1a',
  NAVY: '#0f4667',

  // UI colors
  SUCCESS: '#00ff8c',
  WARNING: '#ff9900',
  DANGER: '#ff3366',

  // Path colors
  PATH_FILL: 'rgba(0, 255, 136, 0.1)',
  PATH_BORDER: 'rgba(0, 255, 136, 0.3)',

  // Grid colors
  GRID_LINE: 'rgba(0, 255, 140, 0.1)',
  GRID_CELL_HOVER: 'rgba(0, 204, 255, 0.2)',
  GRID_CELL_VALID: 'rgba(0, 255, 136, 0.3)',
  GRID_CELL_INVALID: 'rgba(255, 51, 102, 0.3)',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tower properties by type name
 * @param {string} type - Tower type (e.g., 'ForLoop', 'WhileLoop')
 * @returns {Object|null} Tower properties or null if not found
 */
export function getTowerByType(type) {
  // Try direct match first
  const key = type.toUpperCase().replace(/\s+/g, '_');
  if (TOWER_TYPES[key]) {
    return TOWER_TYPES[key];
  }

  // Try to find by type property
  return (
    Object.values(TOWER_TYPES).find(
      (t) => t.type === type || t.type.toLowerCase() === type.toLowerCase()
    ) || null
  );
}

/**
 * Get enemy properties by type name
 * @param {string} type - Enemy type (e.g., 'basic', 'edge')
 * @returns {Object|null} Enemy properties or null if not found
 */
export function getEnemyByType(type) {
  const key = type.toUpperCase().replace(/\s+/g, '_');
  if (ENEMY_TYPES[key]) {
    return ENEMY_TYPES[key];
  }

  return (
    Object.values(ENEMY_TYPES).find(
      (e) => e.type === type || e.type.toLowerCase() === type.toLowerCase()
    ) || null
  );
}

/**
 * Get deployable properties by type name
 * @param {string} type - Deployable type (e.g., 'Data Mine')
 * @returns {Object|null} Deployable properties or null if not found
 */
export function getDeployableByType(type) {
  if (!type) return null;
  const key = type.toUpperCase().replace(/\s+/g, '_');
  if (DEPLOYABLE_TYPES[key]) {
    return DEPLOYABLE_TYPES[key];
  }

  return (
    Object.values(DEPLOYABLE_TYPES).find(
      (d) => d.type === type || d.type.toLowerCase() === type.toLowerCase()
    ) || null
  );
}
