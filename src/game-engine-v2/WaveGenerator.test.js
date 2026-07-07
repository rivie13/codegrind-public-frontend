import { describe, expect, it, vi } from 'vitest';
import { WaveGenerator } from './WaveGenerator';

describe('WaveGenerator', () => {
  it('uses normalized difficulty and settings overrides', () => {
    const generator = new WaveGenerator('hard');
    expect(generator.totalWaves).toBeGreaterThan(1);

    generator.applySettings({
      enemyHealthMultiplier: 1.5,
      enemySpeedMultiplier: 1.2,
      totalWaves: 7,
    });

    expect(generator.totalWaves).toBe(7);
    expect(generator.settingsOverrides.enemyHealthMultiplier).toBe(1.5);
  });

  it('returns a valid fallback wave definition for out-of-range waves', () => {
    const generator = new WaveGenerator('medium');
    const wave = generator.getWaveDefinition(999);

    expect(Array.isArray(wave)).toBe(true);
    expect(wave.length).toBeGreaterThan(0);
  });

  it('progressively unlocks enemy types by player level', () => {
    const generator = new WaveGenerator('medium', { playerLevel: 1 });
    const lowLevelTypes = new Set(generator.getWaveDefinition(5).map((group) => group.type));
    expect(lowLevelTypes).toEqual(new Set(['basic']));

    generator.setPlayerLevel(3);
    const levelThreeTypes = new Set(generator.getWaveDefinition(5).map((group) => group.type));
    expect(levelThreeTypes.has('basic')).toBe(true);
    expect(levelThreeTypes.has('edge')).toBe(true);
    expect(levelThreeTypes.has('complex')).toBe(false);

    generator.setPlayerLevel(15);
    const highLevelTypes = new Set(generator.getWaveDefinition(5).map((group) => group.type));
    expect(highLevelTypes.has('pathShaper')).toBe(true);
    expect(highLevelTypes.has('buffer')).toBe(true);
  });

  it('generates wave queue with spawn times and scaled counts', () => {
    const generator = new WaveGenerator('medium');
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const queue = generator.generateWaveQueue(3, 'hard');

    expect(queue.length).toBe(generator.getDesiredEnemyCount(3, 'hard'));
    expect(queue[0].spawnTime).toBeGreaterThanOrEqual(0);
    expect(queue.every((enemy) => enemy.spawnTime >= 0)).toBe(true);
    expect(queue.some((enemy) => enemy.healthMultiplier > 1)).toBe(true);
  });

  it('adds nightmare bosses on final wave and reports total count', () => {
    const generator = new WaveGenerator('medium');
    generator.applySettings({ totalWaves: 5 });

    const queue = generator.generateWaveQueue(5, 'nightmare');
    const bossCount = queue.filter((enemy) => enemy.isBoss).length;

    expect(bossCount).toBeGreaterThan(0);
    expect(generator.getWaveEnemyCount(5, 'nightmare')).toBeGreaterThan(queue.length - bossCount);
  });

  it('keeps nightmare-only bosses within the unlocked roster for low-level players', () => {
    const generator = new WaveGenerator('medium', { playerLevel: 1 });
    generator.applySettings({ totalWaves: 5 });

    const queue = generator.generateWaveQueue(5, 'nightmare');

    expect(queue.length).toBeGreaterThan(0);
    expect(queue.some((enemy) => enemy.isBoss)).toBe(true);
    expect(queue.every((enemy) => enemy.type === 'basic')).toBe(true);
  });

  it('spawns only unlocked enemy types for low-level players', () => {
    const generator = new WaveGenerator('medium', { playerLevel: 1 });
    const queue = generator.generateWaveQueue(4, 'normal');

    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((enemy) => enemy.type === 'basic' || enemy.isBoss)).toBe(true);
  });
});
