import { describe, expect, it, vi } from 'vitest';

vi.mock('./enemies.js', () => ({
  applyEnemyOnHit: vi.fn(),
}));

import { applyEnemyOnHit } from './enemies.js';
import {
  applyPendingDamage,
  applySplashDamage,
  spawnDamageField,
  updateProjectiles,
} from './projectiles';

describe('engine/projectiles', () => {
  it('updates projectile animations and resolves impacts', () => {
    const target = { id: 'enemy-1', isActive: true, x: 100, y: 80 };
    const projectile = {
      targetId: 'enemy-1',
      towerId: 'tower-1',
      towerType: 'ForLoop',
      x: 10,
      y: 20,
      color: '#0ff',
      targetX: 0,
      targetY: 0,
      update: vi.fn(() => true),
    };

    const engine = {
      impacts: [{ createdAt: Date.now() - 500 }],
      enemies: [target],
      projectiles: [projectile],
      applyPendingDamage: vi.fn(),
    };

    updateProjectiles(engine, 16);

    expect(engine.projectiles.length).toBe(0);
    expect(engine.impacts.length).toBe(1);
    expect(engine.applyPendingDamage).toHaveBeenCalledWith('enemy-1', 'tower-1');
  });

  it('caps active impacts when projectile completions spike', () => {
    const now = Date.now();
    const projectile = {
      targetId: 'enemy-1',
      towerId: 'tower-1',
      towerType: 'Function',
      x: 14,
      y: 18,
      color: '#0ff',
      update: vi.fn(() => true),
    };

    const engine = {
      impacts: Array.from({ length: 18 }, (_, index) => ({
        x: index,
        y: index,
        color: '#f0f',
        towerType: 'ForLoop',
        createdAt: now - 40,
      })),
      enemies: [{ id: 'enemy-1', isActive: true, x: 100, y: 80 }],
      projectiles: [projectile],
      applyPendingDamage: vi.fn(),
    };

    updateProjectiles(engine, 16);

    expect(engine.impacts).toHaveLength(18);
    expect(engine.impacts.at(-1)).toEqual(
      expect.objectContaining({ x: 14, y: 18, towerType: 'Function' })
    );
  });

  it('applies pending damage with secondary effects and delayed damage', () => {
    const target = {
      id: 'enemy-1',
      type: 'basic',
      isActive: true,
      x: 50,
      y: 60,
      health: 100,
      maxHealth: 100,
      getState: () => ({ id: 'enemy-1' }),
      takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
      },
      applySlow: vi.fn(),
    };

    const engine = {
      pendingAttacks: [
        {
          targetId: 'enemy-1',
          towerId: 'tower-1',
          towerType: 'ForLoop',
          damage: 20,
          effects: {
            typeDamageBonus: { basic: 0.5 },
            slow: { factor: 0.6, duration: 1500 },
            splash: { radius: 1, damageMultiplier: 0.5 },
            field: { radius: 1, duration: 1000, tickMs: 200, damageMultiplier: 0.3 },
            delayedDamage: { delayMs: 400, damageMultiplier: 0.5 },
          },
        },
      ],
      enemies: [target],
      towers: [{ id: 'tower-1', getState: () => ({ id: 'tower-1' }) }],
      delayedDamage: [],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
      applySplashDamage: vi.fn(),
      spawnDamageField: vi.fn(),
    };

    const ok = applyPendingDamage(engine, 'enemy-1', 'tower-1');
    expect(ok).toBe(true);
    expect(engine.pendingAttacks.length).toBe(0);
    expect(engine.applySplashDamage).toHaveBeenCalled();
    expect(engine.spawnDamageField).toHaveBeenCalled();
    expect(target.applySlow).toHaveBeenCalled();
    expect(engine.delayedDamage.length).toBe(1);
    expect(applyEnemyOnHit).toHaveBeenCalledWith(engine, target);
  });

  it('supports execute-kill flow and emits enemy-killed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const target = {
      id: 'enemy-2',
      type: 'complex',
      isActive: true,
      x: 10,
      y: 10,
      health: 10,
      maxHealth: 100,
      getState: () => ({ id: 'enemy-2' }),
      takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) this.isActive = false;
        return this.health <= 0;
      },
      applySlow: vi.fn(),
    };

    const engine = {
      pendingAttacks: [
        {
          targetId: 'enemy-2',
          towerId: 'tower-2',
          towerType: 'Return',
          damage: 5,
          effects: {
            execute: { threshold: 0.5, chance: 1 },
          },
        },
      ],
      enemies: [target],
      towers: [{ id: 'tower-2', getState: () => ({ id: 'tower-2' }) }],
      delayedDamage: [],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
      applySplashDamage: vi.fn(),
      spawnDamageField: vi.fn(),
    };

    const ok = applyPendingDamage(engine, 'enemy-2', 'tower-2');
    expect(ok).toBe(true);
    expect(target.isActive).toBe(false);
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: expect.any(Object) })
    );
  });

  it('applies splash and spawns persistent damage fields', () => {
    const splashTarget = {
      id: 'main',
      x: 100,
      y: 100,
      isActive: true,
      getState: () => ({ id: 'main' }),
      takeDamage: vi.fn(() => false),
    };
    const nearbyEnemy = {
      id: 'near',
      x: 120,
      y: 110,
      isActive: true,
      getState: () => ({ id: 'near' }),
      takeDamage: vi.fn(() => true),
    };
    const engine = {
      cellSize: 40,
      impacts: [],
      damageFields: [],
      enemies: [splashTarget, nearbyEnemy],
      towers: [{ id: 'tower-x', getState: () => ({ id: 'tower-x' }) }],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
    };

    applySplashDamage(
      engine,
      splashTarget,
      { radius: 1, damageMultiplier: 0.5 },
      20,
      'tower-x',
      '#f0f'
    );
    expect(nearbyEnemy.takeDamage).toHaveBeenCalled();
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: expect.any(Object) })
    );

    spawnDamageField(
      engine,
      splashTarget,
      { radius: 1.5, duration: 1500, tickMs: 300, damageMultiplier: 0.2 },
      30,
      'tower-x',
      '#ff0'
    );
    expect(engine.damageFields.length).toBe(1);
    expect(engine.impacts.length).toBeGreaterThan(0);
  });

  it('caps splash and field impacts under load', () => {
    const splashTarget = {
      id: 'main',
      x: 100,
      y: 100,
      isActive: true,
      getState: () => ({ id: 'main' }),
      takeDamage: vi.fn(() => false),
    };
    const engine = {
      cellSize: 40,
      impacts: Array.from({ length: 18 }, (_, index) => ({
        x: index,
        y: index,
        color: '#0ff',
        towerType: 'ForLoop',
        createdAt: Date.now(),
      })),
      damageFields: [],
      enemies: [splashTarget],
      towers: [{ id: 'tower-x', type: 'Function', getState: () => ({ id: 'tower-x' }) }],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
    };

    applySplashDamage(
      engine,
      splashTarget,
      { radius: 1, damageMultiplier: 0.5 },
      20,
      'tower-x',
      '#f0f'
    );
    spawnDamageField(
      engine,
      splashTarget,
      { radius: 1.5, duration: 1500, tickMs: 300, damageMultiplier: 0.2 },
      30,
      'tower-x',
      '#ff0'
    );

    expect(engine.impacts).toHaveLength(18);
    expect(engine.impacts.at(-1)).toEqual(expect.objectContaining({ effect: 'field' }));
  });
});
