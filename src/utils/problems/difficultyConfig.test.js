import { describe, expect, it } from 'vitest';
import {
  AUTO_START_WAVE_SECONDS,
  DIFFICULTY_BASE_STATS,
  MAP_DIFFICULTY_CONFIG,
  getAutoStartWaveCountdownSeconds,
  getDifficultyBaseStats,
  getDifficultyConfig,
  normalizeProblemDifficulty,
  validateGameSettings,
} from './difficultyConfig';

describe('difficultyConfig', () => {
  it('normalizes difficulty values with fallback', () => {
    expect(normalizeProblemDifficulty('easy')).toBe('EASY');
    expect(normalizeProblemDifficulty(' medium challenge ')).toBe('MEDIUM');
    expect(normalizeProblemDifficulty('HARDCORE')).toBe('HARD');
    expect(normalizeProblemDifficulty('unknown')).toBe('EASY');
    expect(normalizeProblemDifficulty(null)).toBe('EASY');
  });

  it('returns auto-start countdown with fallback', () => {
    expect(getAutoStartWaveCountdownSeconds('EASY')).toBe(AUTO_START_WAVE_SECONDS.EASY);
    expect(getAutoStartWaveCountdownSeconds('medium-mode')).toBe(AUTO_START_WAVE_SECONDS.MEDIUM);
    expect(getAutoStartWaveCountdownSeconds('???')).toBe(AUTO_START_WAVE_SECONDS.EASY);
  });

  it('returns difficulty-specific map config and base stats', () => {
    expect(getDifficultyConfig('HARD')).toBe(MAP_DIFFICULTY_CONFIG.HARD);
    expect(getDifficultyConfig('invalid')).toBe(MAP_DIFFICULTY_CONFIG.EASY);
    expect(getDifficultyBaseStats('MEDIUM')).toBe(DIFFICULTY_BASE_STATS.MEDIUM);
    expect(getDifficultyBaseStats(undefined)).toBe(DIFFICULTY_BASE_STATS.EASY);
  });

  it('clamps settings to difficulty minimums and preserves explicit toggles', () => {
    const validated = validateGameSettings(
      {
        startingCredits: 1,
        startingLives: 0,
        enemyHealthMultiplier: 0.1,
        enemySpeedMultiplier: 0.1,
        totalWaves: 0,
        hardcoreMode: 'yes',
        aiChatEnabled: false,
        aiCodeSnippetsEnabled: false,
        towerSelectorEnabled: false,
        deployableMenuEnabled: false,
        autoStartWaves: 1,
      },
      'MEDIUM'
    );

    expect(validated.startingCredits).toBe(DIFFICULTY_BASE_STATS.MEDIUM.initialCredits);
    expect(validated.startingLives).toBe(DIFFICULTY_BASE_STATS.MEDIUM.initialLives);
    expect(validated.enemyHealthMultiplier).toBe(DIFFICULTY_BASE_STATS.MEDIUM.baseEnemyHealth);
    expect(validated.enemySpeedMultiplier).toBe(DIFFICULTY_BASE_STATS.MEDIUM.baseEnemySpeed);
    expect(validated.totalWaves).toBe(DIFFICULTY_BASE_STATS.MEDIUM.totalWaves);
    expect(validated.hardcoreMode).toBe(true);
    expect(validated.aiChatEnabled).toBe(false);
    expect(validated.aiCodeSnippetsEnabled).toBe(false);
    expect(validated.towerSelectorEnabled).toBe(false);
    expect(validated.deployableMenuEnabled).toBe(false);
    expect(validated.autoStartWaves).toBe(true);
    expect(validated.upgradeMenuEnabled).toBe(true);
  });

  it('allows lower total waves when option is enabled', () => {
    const validated = validateGameSettings(
      {
        totalWaves: 0,
      },
      'HARD',
      { allowLowerTotalWaves: true }
    );

    expect(validated.totalWaves).toBe(1);
  });

  it('uses safe defaults when settings are empty', () => {
    const validated = validateGameSettings({}, 'EASY');

    expect(validated.startingCredits).toBe(DIFFICULTY_BASE_STATS.EASY.initialCredits);
    expect(validated.startingLives).toBe(DIFFICULTY_BASE_STATS.EASY.initialLives);
    expect(validated.aiChatEnabled).toBe(true);
    expect(validated.aiCodeSnippetsEnabled).toBe(true);
    expect(validated.towerSelectorEnabled).toBe(true);
    expect(validated.deployableMenuEnabled).toBe(true);
    expect(validated.autoStartWaves).toBe(false);
  });
});
