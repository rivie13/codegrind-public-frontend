import { describe, expect, it, vi } from 'vitest';
import { DeployableEntity } from '../deployables';
import { applyDeployableEffect, updateDeployables } from './deployables';

const makeEnemy = (overrides = {}) => ({
  id: `enemy-${Math.random().toString(36).slice(2, 6)}`,
  x: 40,
  y: 40,
  isActive: true,
  maxHealth: 100,
  health: 100,
  color: '#fff',
  getState: () => ({ id: 'enemy' }),
  getHealthPercent() {
    return this.health / this.maxHealth;
  },
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  },
  applyFreeze: vi.fn(),
  applySlow: vi.fn(),
  ...overrides,
});

const makeEngine = () => ({
  deployables: [],
  enemies: [],
  impacts: [],
  cellSize: 40,
  emit: vi.fn(),
  spawnDeployablePopup: vi.fn(),
  spawnCombatText: vi.fn(),
  applyDeployableEffect: vi.fn(),
});

describe('engine/deployables', () => {
  it('updates area, burst, and per-enemy deployables', () => {
    const engine = makeEngine();
    const enemy = makeEnemy();
    engine.enemies = [enemy];
    engine.applyDeployableEffect = vi.fn();

    const area = new DeployableEntity('Bandwidth Throttle', { row: 1, col: 1 });
    const burst = new DeployableEntity('Data Mine', { row: 1, col: 1 });
    const perEnemy = new DeployableEntity('ICE Trap', { row: 1, col: 1 });
    engine.deployables = [area, burst, perEnemy];

    const now = 1000;
    updateDeployables(engine, 16, now);

    expect(engine.emit).toHaveBeenCalledWith('deployable-armed', expect.any(Object));
    expect(engine.emit).toHaveBeenCalledWith('deployable-triggered', expect.any(Object));
    expect(engine.spawnDeployablePopup).toHaveBeenCalled();
    expect(engine.applyDeployableEffect).toHaveBeenCalled();
    expect(engine.deployables.length).toBeLessThanOrEqual(2);

    updateDeployables(engine, 16, now + 10_000);
    expect(engine.deployables.length).toBeLessThanOrEqual(1);
  });

  it('applies all deployable effect types', () => {
    const engine = makeEngine();
    const enemy = makeEnemy();

    const damageDeployable = {
      id: 'dmg',
      effect: 'damage',
      damage: 20,
      color: '#f00',
      canAffectEnemy: () => true,
      markAffected: vi.fn(),
    };
    applyDeployableEffect(engine, damageDeployable, enemy, 0, 16);
    expect(enemy.health).toBe(80);

    const percentDeployable = {
      id: 'pct',
      effect: 'percentDamage',
      percentDamage: 0.25,
      canAffectEnemy: () => true,
      markAffected: vi.fn(),
      color: '#0f0',
    };
    applyDeployableEffect(engine, percentDeployable, enemy, 0, 16);
    expect(enemy.health).toBeLessThan(80);

    const freezeDeployable = {
      id: 'ice',
      effect: 'freeze',
      duration: 1200,
      canAffectEnemy: () => true,
      markAffected: vi.fn(),
      color: '#0ff',
    };
    applyDeployableEffect(engine, freezeDeployable, enemy, 0, 16);
    expect(enemy.applyFreeze).toHaveBeenCalled();

    const slowDeployable = {
      id: 'slow',
      effect: 'slow',
      slowFactor: 0.5,
      duration: 3000,
      activeUntil: 5000,
      color: '#ff0',
    };
    applyDeployableEffect(engine, slowDeployable, enemy, 1000, 16);
    expect(enemy.applySlow).toHaveBeenCalled();

    const blockDeployable = {
      id: 'block',
      effect: 'block',
      damage: 10,
      duration: 3000,
      activeUntil: 5000,
      color: '#fa0',
    };
    applyDeployableEffect(engine, blockDeployable, enemy, 1000, 1000);
    expect(enemy.applyFreeze).toHaveBeenCalled();

    const executeEnemy = makeEnemy({ health: 10, maxHealth: 100 });
    const executeDeployable = {
      id: 'exec',
      effect: 'execute',
      percentDamage: 0.1,
      executeThreshold: 0.3,
      canAffectEnemy: () => true,
      markAffected: vi.fn(),
      color: '#f0f',
    };
    applyDeployableEffect(engine, executeDeployable, executeEnemy, 0, 16);
    expect(executeEnemy.health).toBe(0);

    applyDeployableEffect(engine, { effect: 'unknown' }, enemy, 0, 16);
    expect(engine.spawnCombatText).toHaveBeenCalled();

    const logicFieldDeployable = {
      id: 'logic-field',
      effect: 'logicField',
      dotPercentPerSecond: 0.2,
      executeThreshold: 0.3,
      color: '#f0f',
    };
    const logicFieldEnemy = makeEnemy({ health: 20, maxHealth: 100 });
    applyDeployableEffect(engine, logicFieldDeployable, logicFieldEnemy, 0, 1000);
    expect(logicFieldEnemy.health).toBe(0);
  });
});
