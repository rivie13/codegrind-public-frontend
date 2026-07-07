/**
 * Tower Defense Game Engine V2
 *
 * Main entry point - exports all engine components
 */

// Core engine
export { GameEngine, default } from './GameEngine.js';

// Renderer
export { Renderer } from './Renderer.js';

// React Hook
export { useGameEngine } from './useGameEngine.js';

// Entities
export { Entity, EnemyEntity, TowerEntity, ProjectileEntity } from './entities.js';

// Deployables
export { DeployableEntity } from './deployables.js';

// Wave generation
export { WaveGenerator } from './WaveGenerator.js';
export {
  ENEMY_REVEAL_LEVEL_THRESHOLDS,
  normalizePlayerLevel,
  getUnlockedEnemyTypesForLevel,
  filterWaveDefinitionByPlayerLevel,
  getProgressiveWaveDefinition,
} from './enemyProgression.js';

// Constants
export {
  TOWER_TYPES,
  ENEMY_TYPES,
  DEPLOYABLE_TYPES,
  WAVE_DEFINITIONS,
  DIFFICULTY_MULTIPLIERS,
  GAME_CONSTANTS,
  GAME_STATUS,
  COLORS,
  getTowerByType,
  getEnemyByType,
  getDeployableByType,
} from './constants.js';
