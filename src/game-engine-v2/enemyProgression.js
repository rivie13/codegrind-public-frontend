/**
 * Enemy progression helpers for funnel-friendly reveal/spawn pacing.
 *
 * Design target from UX funnel tracker:
 * - L1-2: basic only
 * - L3-4: + edge
 * - ...
 * - L15+: all enemy types
 */

export const ENEMY_REVEAL_LEVEL_THRESHOLDS = [
  { minLevel: 1, enemyTypes: ['basic'] },
  { minLevel: 3, enemyTypes: ['edge'] },
  { minLevel: 5, enemyTypes: ['complex'] },
  { minLevel: 7, enemyTypes: ['timeLimit'] },
  { minLevel: 9, enemyTypes: ['hijacker'] },
  { minLevel: 11, enemyTypes: ['spaceComplex'] },
  { minLevel: 13, enemyTypes: ['buffer'] },
  { minLevel: 15, enemyTypes: ['pathShaper'] },
];

export function normalizePlayerLevel(playerLevel) {
  const numericLevel = Number(playerLevel);
  if (!Number.isFinite(numericLevel) || numericLevel < 1) return 1;
  return Math.floor(numericLevel);
}

export function getUnlockedEnemyTypesForLevel(playerLevel = 1) {
  const normalizedLevel = normalizePlayerLevel(playerLevel);
  const unlocked = [];

  ENEMY_REVEAL_LEVEL_THRESHOLDS.forEach(({ minLevel, enemyTypes }) => {
    if (normalizedLevel < minLevel) return;
    enemyTypes.forEach((enemyType) => {
      if (!unlocked.includes(enemyType)) {
        unlocked.push(enemyType);
      }
    });
  });

  // Safety fallback: there should always be at least BASIC.
  if (!unlocked.length) {
    unlocked.push('basic');
  }

  return unlocked;
}

export function filterWaveDefinitionByPlayerLevel(waveDefinition, playerLevel = 1) {
  const source = Array.isArray(waveDefinition) ? waveDefinition : [];
  if (!source.length) return [];

  const unlockedSet = new Set(getUnlockedEnemyTypesForLevel(playerLevel));
  const filtered = source.filter((group) => unlockedSet.has(group?.type));
  if (filtered.length) return filtered;

  const fallbackType = source.find((group) => group?.type === 'basic')?.type || source[0]?.type;
  if (!fallbackType) return [];
  return source.filter((group) => group?.type === fallbackType);
}

export function getProgressiveWaveDefinition(waveDefinitions, wave, playerLevel = 1) {
  const normalizedWaveDefinitions = waveDefinitions || {};
  const waveKeys = Object.keys(normalizedWaveDefinitions)
    .map(Number)
    .filter((key) => Number.isFinite(key));
  if (!waveKeys.length) return [];

  const maxWaveKey = Math.max(...waveKeys);
  const minWaveKey = Math.min(...waveKeys);
  const numericWave = Number(wave);
  const safeWave = Number.isFinite(numericWave) ? Math.floor(numericWave) : minWaveKey;
  const waveKey = Math.min(Math.max(minWaveKey, safeWave), maxWaveKey);
  const baseDefinition =
    normalizedWaveDefinitions[waveKey] || normalizedWaveDefinitions[minWaveKey] || [];

  return filterWaveDefinitionByPlayerLevel(baseDefinition, playerLevel);
}
