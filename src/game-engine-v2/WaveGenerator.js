/**
 * Tower Defense Game Engine V2 - Wave Generator
 *
 * Generates enemy queues for each wave with difficulty scaling
 */

import { WAVE_DEFINITIONS } from './constants.js';
import {
  getDifficultyBaseStats,
  normalizeProblemDifficulty,
  WAVE_DIFFICULTY_MULTIPLIERS,
} from '../utils/problems/difficultyConfig.js';
import {
  getProgressiveWaveDefinition,
  getUnlockedEnemyTypesForLevel,
  normalizePlayerLevel,
} from './enemyProgression.js';

function resolveNightmareBossType(preferredType, unlockedTypes) {
  if (unlockedTypes.includes(preferredType)) {
    return preferredType;
  }

  return unlockedTypes[unlockedTypes.length - 1] || 'basic';
}

/**
 * Generates wave queues for the tower defense game
 */
export class WaveGenerator {
  constructor(problemDifficulty = 'MEDIUM', options = {}) {
    this.waveDefinitions = WAVE_DEFINITIONS;
    this.maxWaveDefinition = Math.max(...Object.keys(this.waveDefinitions).map(Number));
    this.settingsOverrides = {
      enemyHealthMultiplier: 1,
      enemySpeedMultiplier: 1,
    };
    this.setPlayerLevel(options.playerLevel ?? 1);
    this.setProblemDifficulty(problemDifficulty);
  }

  setProblemDifficulty(problemDifficulty) {
    this.problemDifficulty = normalizeProblemDifficulty(problemDifficulty);
    this.baseStats = getDifficultyBaseStats(this.problemDifficulty);
    this.totalWaves = this.baseStats.totalWaves || 5;
  }

  setPlayerLevel(playerLevel) {
    this.playerLevel = normalizePlayerLevel(playerLevel);
  }

  applySettings(settings = {}) {
    this.settingsOverrides = {
      enemyHealthMultiplier: settings.enemyHealthMultiplier ?? 1,
      enemySpeedMultiplier: settings.enemySpeedMultiplier ?? 1,
    };

    if (Number.isFinite(settings.totalWaves)) {
      this.totalWaves = settings.totalWaves;
    }

    if (settings.playerLevel !== undefined) {
      this.setPlayerLevel(settings.playerLevel);
    }
  }

  /**
   * Get wave definition for a specific wave number
   * @param {number} wave - Wave number (1-5)
   * @returns {Array} Wave definition array
   */
  getWaveDefinition(wave, playerLevel = this.playerLevel) {
    return getProgressiveWaveDefinition(this.waveDefinitions, wave, playerLevel);
  }

  getDesiredEnemyCount(wave, waveDifficulty = 'normal') {
    const baseCounts = this.baseStats?.enemiesPerWave || [];
    const fallbackCount = baseCounts[baseCounts.length - 1] || 10;
    const baseCount = baseCounts[wave - 1] || fallbackCount;
    const waveMultipliers =
      WAVE_DIFFICULTY_MULTIPLIERS[waveDifficulty] || WAVE_DIFFICULTY_MULTIPLIERS.normal;
    const globalCountBoost = 1.0;
    return Math.max(1, Math.ceil(baseCount * waveMultipliers.count * globalCountBoost));
  }

  /**
   * Generate an enemy queue for a wave
   * @param {number} wave - Wave number (1-5)
   * @param {string} difficulty - Difficulty level (normal, easy, hard, nightmare)
   * @returns {Array} Array of enemy spawn configs
   */
  generateWaveQueue(wave, difficulty = 'normal', options = {}) {
    const effectivePlayerLevel = options.playerLevel ?? this.playerLevel;
    const waveDefinition = this.getWaveDefinition(wave, effectivePlayerLevel);
    if (!waveDefinition.length) return [];
    const enemyQueue = [];
    const unlockedTypes = getUnlockedEnemyTypesForLevel(effectivePlayerLevel);

    const waveMultipliers =
      WAVE_DIFFICULTY_MULTIPLIERS[difficulty] || WAVE_DIFFICULTY_MULTIPLIERS.normal;
    const baseHealthMult = this.baseStats?.baseEnemyHealth ?? 1;
    const baseSpeedMult = this.baseStats?.baseEnemySpeed ?? 1;
    const overrideHealth = this.settingsOverrides?.enemyHealthMultiplier ?? 1;
    const overrideSpeed = this.settingsOverrides?.enemySpeedMultiplier ?? 1;
    const finalHealthMult = baseHealthMult * overrideHealth * waveMultipliers.health;
    const finalSpeedMult = baseSpeedMult * overrideSpeed * waveMultipliers.speed;

    const desiredCount = this.getDesiredEnemyCount(wave, difficulty);
    const baseTotal = waveDefinition.reduce((sum, group) => sum + group.count, 0);
    const scale = baseTotal > 0 ? desiredCount / baseTotal : 1;
    const adjustedCounts = waveDefinition.map((group) =>
      Math.max(1, Math.round(group.count * scale))
    );

    let adjustedTotal = adjustedCounts.reduce((sum, count) => sum + count, 0);
    const minCount = desiredCount < waveDefinition.length ? 0 : 1;
    let guard = 0;
    while (adjustedTotal !== desiredCount && guard < 1000) {
      const index = guard % adjustedCounts.length;
      if (adjustedTotal < desiredCount) {
        adjustedCounts[index] += 1;
        adjustedTotal += 1;
      } else if (adjustedCounts[index] > minCount) {
        adjustedCounts[index] -= 1;
        adjustedTotal -= 1;
      }
      guard += 1;
    }

    if (wave === this.totalWaves && difficulty === 'nightmare' && waveMultipliers.bosses) {
      waveMultipliers.bosses.forEach((boss) => {
        enemyQueue.push({
          type: resolveNightmareBossType(boss.type, unlockedTypes),
          delay: boss.spawnDelay,
          spawnTime: 0,
          healthMultiplier: boss.healthMultiplier * baseHealthMult * overrideHealth,
          speedMultiplier: boss.speedMultiplier * baseSpeedMult * overrideSpeed,
          isBoss: true,
        });
      });
    }

    waveDefinition.forEach((enemyGroup, index) => {
      const adjustedCount = adjustedCounts[index] || 0;
      for (let i = 0; i < adjustedCount; i++) {
        enemyQueue.push({
          type: enemyGroup.type,
          delay: enemyGroup.delay,
          spawnTime: 0,
          healthMultiplier: finalHealthMult,
          speedMultiplier: finalSpeedMult,
          isBoss: false,
        });
      }
    });

    // Shuffle queue for variety (keep first enemy at front)
    const firstEnemy = enemyQueue.shift();
    this.shuffleArray(enemyQueue);
    if (firstEnemy) {
      enemyQueue.unshift(firstEnemy);
    }

    // Calculate spawn times
    let currentSpawnTime = 0;
    enemyQueue.forEach((enemy) => {
      currentSpawnTime += enemy.delay;
      enemy.spawnTime = Math.floor(currentSpawnTime * 0.75);
    });

    // Spread out spawns for nightmare difficulty
    if (wave === this.totalWaves && difficulty === 'nightmare') {
      enemyQueue.forEach((enemy) => {
        enemy.spawnTime = Math.floor(enemy.spawnTime * 1.1);
      });
    }

    return enemyQueue;
  }

  /**
   * Shuffle an array in place (Fisher-Yates)
   * @param {Array} array - Array to shuffle
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get total enemy count for a wave
   * @param {number} wave - Wave number
   * @param {string} difficulty - Difficulty level
   * @returns {number} Total enemy count
   */
  getWaveEnemyCount(wave, difficulty = 'normal') {
    let count = this.getDesiredEnemyCount(wave, difficulty);
    const multipliers =
      WAVE_DIFFICULTY_MULTIPLIERS[difficulty] || WAVE_DIFFICULTY_MULTIPLIERS.normal;

    if (wave === this.totalWaves && multipliers.bosses) {
      count += multipliers.bosses.length;
    }

    return count;
  }
}

export default WaveGenerator;
