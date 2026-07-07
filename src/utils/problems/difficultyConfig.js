/**
 * Difficulty configuration for Tower Defense V2
 */

export const DEFAULT_PROBLEM_DIFFICULTY = 'EASY';

export const MAP_DIFFICULTY_CONFIG = {
  EASY: {
    gridSize: { cols: 14, rows: 12 },
    minPathLength: 30,
    minTurns: 6,
    maxTurns: 8,
    obstacleCount: 6,
    targetBuildableRatio: 0.52,
    minInteriorCoverage: 0.55,
    edgePenaltyDepth: 2,
    pathPatterns: ['switchback', 'weave', 'dogleg', 'crosscut'],
    cellSize: 40,
  },
  MEDIUM: {
    gridSize: { cols: 18, rows: 14 },
    minPathLength: 48,
    minTurns: 8,
    maxTurns: 12,
    obstacleCount: 10,
    targetBuildableRatio: 0.5,
    minInteriorCoverage: 0.58,
    edgePenaltyDepth: 2,
    pathPatterns: ['switchback', 'weave', 'dogleg', 'crosscut'],
    cellSize: 36,
  },
  HARD: {
    gridSize: { cols: 22, rows: 16 },
    minPathLength: 70,
    minTurns: 10,
    maxTurns: 16,
    obstacleCount: 16,
    targetBuildableRatio: 0.48,
    minInteriorCoverage: 0.6,
    edgePenaltyDepth: 2,
    pathPatterns: ['switchback', 'weave', 'dogleg', 'crosscut'],
    cellSize: 32,
  },
};

export const DIFFICULTY_BASE_STATS = {
  EASY: {
    initialCredits: 350,
    initialLives: 12,
    totalWaves: 7,
    baseEnemyHealth: 0.544,
    baseEnemySpeed: 0.81,
    enemiesPerWave: [6, 8, 10, 13, 18, 24, 32],
    creditMultiplier: 1.2,
  },
  MEDIUM: {
    initialCredits: 450,
    initialLives: 10,
    totalWaves: 10,
    baseEnemyHealth: 0.68,
    baseEnemySpeed: 0.9,
    enemiesPerWave: [8, 10, 12, 15, 20, 27, 35, 45, 57, 70],
    creditMultiplier: 1.0,
  },
  HARD: {
    initialCredits: 500,
    initialLives: 8,
    totalWaves: 15,
    baseEnemyHealth: 0.884,
    baseEnemySpeed: 1.035,
    enemiesPerWave: [10, 12, 14, 18, 23, 29, 36, 45, 55, 67, 80, 95, 112, 130, 150],
    creditMultiplier: 0.9,
  },
};

export const WAVE_DIFFICULTY_MULTIPLIERS = {
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

export const DEFAULT_GAME_SETTINGS = {
  startingCredits: null,
  startingLives: null,
  enemyHealthMultiplier: 1,
  enemySpeedMultiplier: 1,
  totalWaves: null,
  hardcoreMode: false,
  aiChatEnabled: true,
  aiCodeSnippetsEnabled: true,
  towerSelectorEnabled: true,
  deployableMenuEnabled: true,
  autoStartWaves: false,
};

export const HARDCORE_GAME_SETTINGS = {
  aiChatEnabled: false,
  aiCodeSnippetsEnabled: true,
  towerSelectorEnabled: false,
  deployableMenuEnabled: false,
  autoStartWaves: true,
};

export const AUTO_START_WAVE_SECONDS = {
  EASY: 300,
  MEDIUM: 600,
  HARD: 900,
};

export function getAutoStartWaveCountdownSeconds(difficulty) {
  const key = normalizeProblemDifficulty(difficulty);
  return AUTO_START_WAVE_SECONDS[key] || AUTO_START_WAVE_SECONDS[DEFAULT_PROBLEM_DIFFICULTY];
}

export function normalizeProblemDifficulty(difficulty) {
  if (!difficulty) return DEFAULT_PROBLEM_DIFFICULTY;
  const normalized = String(difficulty).trim().toUpperCase();
  if (normalized.startsWith('EASY')) return 'EASY';
  if (normalized.startsWith('MEDIUM')) return 'MEDIUM';
  if (normalized.startsWith('HARD')) return 'HARD';
  return DEFAULT_PROBLEM_DIFFICULTY;
}

export function getDifficultyConfig(difficulty) {
  const key = normalizeProblemDifficulty(difficulty);
  return MAP_DIFFICULTY_CONFIG[key] || MAP_DIFFICULTY_CONFIG[DEFAULT_PROBLEM_DIFFICULTY];
}

export function getDifficultyBaseStats(difficulty) {
  const key = normalizeProblemDifficulty(difficulty);
  return DIFFICULTY_BASE_STATS[key] || DIFFICULTY_BASE_STATS[DEFAULT_PROBLEM_DIFFICULTY];
}

export function validateGameSettings(settings, difficulty, options = {}) {
  const minimums = getDifficultyBaseStats(difficulty);
  const safeSettings = settings || DEFAULT_GAME_SETTINGS;
  const allowLowerTotalWaves = options.allowLowerTotalWaves === true;

  return {
    startingCredits: Math.max(
      safeSettings.startingCredits ?? minimums.initialCredits,
      minimums.initialCredits
    ),
    startingLives: Math.max(
      safeSettings.startingLives ?? minimums.initialLives,
      minimums.initialLives
    ),
    enemyHealthMultiplier: Math.max(
      safeSettings.enemyHealthMultiplier ?? 1,
      minimums.baseEnemyHealth
    ),
    enemySpeedMultiplier: Math.max(safeSettings.enemySpeedMultiplier ?? 1, minimums.baseEnemySpeed),
    totalWaves: allowLowerTotalWaves
      ? Math.max(safeSettings.totalWaves ?? minimums.totalWaves, 1)
      : Math.max(safeSettings.totalWaves ?? minimums.totalWaves, minimums.totalWaves),
    hardcoreMode: Boolean(safeSettings.hardcoreMode),
    aiChatEnabled: safeSettings.aiChatEnabled !== false,
    aiCodeSnippetsEnabled: safeSettings.aiCodeSnippetsEnabled !== false,
    towerSelectorEnabled: safeSettings.towerSelectorEnabled !== false,
    deployableMenuEnabled: safeSettings.deployableMenuEnabled !== false,
    upgradeMenuEnabled: true,
    autoStartWaves: Boolean(safeSettings.autoStartWaves),
  };
}
