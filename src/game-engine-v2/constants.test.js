import { describe, expect, it } from 'vitest';
import {
  DEPLOYABLE_TYPES,
  ENEMY_TYPES,
  GAME_CONSTANTS,
  TOWER_TYPES,
  WAVE_DEFINITIONS,
  getDeployableByType,
  getEnemyByType,
  getTowerByType,
} from './constants';

describe('game-engine-v2 constants', () => {
  it('resolves towers by key and type name', () => {
    expect(getTowerByType('FOR_LOOP')).toBe(TOWER_TYPES.FOR_LOOP);
    expect(getTowerByType('ForLoop')).toBe(TOWER_TYPES.FOR_LOOP);
    expect(getTowerByType('forloop')).toBe(TOWER_TYPES.FOR_LOOP);
    expect(getTowerByType('unknown')).toBeNull();
  });

  it('resolves enemies by key and type name', () => {
    expect(getEnemyByType('BASIC')).toBe(ENEMY_TYPES.BASIC);
    expect(getEnemyByType('basic')).toBe(ENEMY_TYPES.BASIC);
    expect(getEnemyByType('timeLimit')).toBe(ENEMY_TYPES.TIME_LIMIT);
    expect(getEnemyByType('missing')).toBeNull();
  });

  it('resolves deployables by key and display name', () => {
    expect(getDeployableByType('DATA_MINE')).toBe(DEPLOYABLE_TYPES.DATA_MINE);
    expect(getDeployableByType('Data Mine')).toBe(DEPLOYABLE_TYPES.DATA_MINE);
    expect(getDeployableByType('logic bomb')).toBe(DEPLOYABLE_TYPES.LOGIC_BOMB);
    expect(getDeployableByType()).toBeNull();
    expect(getDeployableByType('missing')).toBeNull();
  });

  it('exposes expected wave and game constants', () => {
    expect(WAVE_DEFINITIONS[1][0].type).toBe('basic');
    expect(WAVE_DEFINITIONS[5].length).toBeGreaterThan(3);
    expect(GAME_CONSTANTS.TOTAL_WAVES).toBe(5);
    expect(GAME_CONSTANTS.SELL_REFUND_RATE).toBe(0.6);
  });
});
