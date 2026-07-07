import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getTowerByTypeMock, ProjectileEntityMock } = vi.hoisted(() => ({
  getTowerByTypeMock: vi.fn(),
  ProjectileEntityMock: vi.fn(function ProjectileEntity(payload) {
    Object.assign(this, payload, { entity: 'projectile' });
  }),
}));

vi.mock('../constants.js', () => ({
  getTowerByType: getTowerByTypeMock,
}));

vi.mock('../entities.js', () => ({
  ProjectileEntity: ProjectileEntityMock,
}));

import {
  findTargetForTower,
  getActiveUpgradeEffects,
  getAggregatedTowerEffects,
  getAuraBonusForTower,
  getTargetsInRange,
  resolveTowerTargeting,
  updateTowers,
} from './towers';

const createTower = (overrides = {}) => ({
  id: 'tower-1',
  type: 'ForLoop',
  targeting: 'closest',
  position: { row: 1, col: 1 },
  specialUpgradeLevel: 0,
  getRange: vi.fn(() => 3),
  distanceTo: vi.fn((row, col) => Math.sqrt((row - 1) ** 2 + (col - 1) ** 2)),
  canAttack: vi.fn(() => true),
  getDamage: vi.fn(() => 20),
  getAttackCooldown: vi.fn(() => 900),
  recordAttack: vi.fn(),
  getState: vi.fn(() => ({ id: 'tower-1' })),
  ...overrides,
});

const createEnemy = (id, overrides = {}) => ({
  id,
  isActive: true,
  progress: 0.5,
  health: 60,
  maxHealth: 100,
  x: 100,
  y: 100,
  canBeTargeted: vi.fn(() => true),
  getState: vi.fn(() => ({ id })),
  ...overrides,
});

describe('engine/towers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getTowerByTypeMock.mockReset();
    ProjectileEntityMock.mockClear();
  });

  it('builds active effects list from passive/base and unlocked special upgrades', () => {
    getTowerByTypeMock.mockReturnValue({
      passiveEffects: [{ rangeBonus: 1 }],
      specialEffects: [{ damageMultiplier: 0.2 }, { extraTargets: 1 }, { slow: { factor: 0.6 } }],
    });
    const tower = createTower({ specialUpgradeLevel: 2 });

    const effects = getActiveUpgradeEffects({}, tower);

    expect(effects).toEqual([{ rangeBonus: 1 }, { damageMultiplier: 0.2 }, { extraTargets: 1 }]);
  });

  it('prioritizes special-upgrade targeting over manual targeting and pierce defaults', () => {
    const tower = createTower({ targeting: 'closest' });

    expect(resolveTowerTargeting(tower, { targeting: 'highest-health' })).toEqual({
      mode: 'highest-health',
      locked: true,
      source: 'special-upgrade',
    });

    expect(resolveTowerTargeting(tower, { multiTarget: { mode: 'pierce' } })).toEqual({
      mode: 'furthest',
      locked: false,
      source: 'multi-target',
    });

    expect(resolveTowerTargeting(tower, {})).toEqual({
      mode: 'closest',
      locked: false,
      source: 'tower',
    });
  });

  it('aggregates stacking and override effects into a single attack profile', () => {
    const engine = {
      getActiveUpgradeEffects: vi.fn(() => [
        {
          extraTargets: 1,
          damageMultiplier: 0.2,
          rangeBonus: 0.5,
          typeDamageBonus: { basic: 0.3 },
        },
        {
          multiTarget: {
            mode: 'sequence',
            extraTargets: 2,
            secondaryDamageMultiplier: 0.7,
            primaryDamageMultiplier: 1.1,
            delayMs: 120,
          },
          targeting: 'furthest',
          execute: { threshold: 0.2, chance: 0.5 },
          splash: { radius: 1, damageMultiplier: 0.4 },
          slow: { factor: 0.7, duration: 1500 },
          field: { radius: 1.2, duration: 1000, tickMs: 200 },
          delayedDamage: { delayMs: 400, damageMultiplier: 0.3 },
          typeDamageBonus: { basic: 0.4, edge: 0.5 },
        },
      ]),
    };

    const aggregated = getAggregatedTowerEffects(engine, createTower());

    expect(aggregated.extraTargets).toBe(2);
    expect(aggregated.damageMultiplier).toBeCloseTo(1.2);
    expect(aggregated.rangeBonus).toBeCloseTo(0.5);
    expect(aggregated.targeting).toBe('furthest');
    expect(aggregated.execute).toEqual({ threshold: 0.2, chance: 0.5 });
    expect(aggregated.splash).toEqual({ radius: 1, damageMultiplier: 0.4 });
    expect(aggregated.slow).toEqual({ factor: 0.7, duration: 1500 });
    expect(aggregated.field).toEqual({ radius: 1.2, duration: 1000, tickMs: 200 });
    expect(aggregated.delayedDamage).toEqual({ delayMs: 400, damageMultiplier: 0.3 });
    expect(aggregated.typeDamageBonus).toEqual({ basic: 0.4, edge: 0.5 });
    expect(aggregated.multiTarget).toEqual(
      expect.objectContaining({ mode: 'sequence', extraTargets: 2, delayMs: 120 })
    );
  });

  it('computes aura bonuses from nearby upgraded Variable towers', () => {
    const targetTower = createTower({ id: 'target', position: { row: 4, col: 4 } });
    const sourceNear = createTower({
      id: 'source-near',
      type: 'Variable',
      specialUpgradeLevel: 2,
      position: { row: 5, col: 5 },
    });
    const sourceFar = createTower({
      id: 'source-far',
      type: 'Variable',
      specialUpgradeLevel: 2,
      position: { row: 20, col: 20 },
    });
    const engine = {
      towers: [targetTower, sourceNear, sourceFar],
      getActiveUpgradeEffects: vi.fn((tower) => {
        if (tower.id === 'source-near') {
          return [{ aura: { radius: 3, damageMultiplier: 0.25, speedMultiplier: 0.15 } }];
        }
        if (tower.id === 'source-far') {
          return [{ aura: { radius: 2, damageMultiplier: 0.8, speedMultiplier: 0.8 } }];
        }
        return [];
      }),
    };

    const aura = getAuraBonusForTower(engine, targetTower);

    expect(aura).toEqual({ damageMultiplier: 0.25, speedMultiplier: 0.15 });
  });

  it('filters and sorts targets in range using targeting mode and health filters', () => {
    const tower = createTower();
    const close = createEnemy('close', { x: 70, y: 60, progress: 0.1, health: 90 });
    const far = createEnemy('far', { x: 160, y: 60, progress: 0.9, health: 40 });
    const pathOnly = createEnemy('path-only', {
      x: undefined,
      y: undefined,
      progress: 0.5,
      health: 20,
    });
    const untargetable = createEnemy('ghost', { canBeTargeted: vi.fn(() => false) });

    const engine = {
      cellSize: 40,
      pathNodes: [
        [1, 1],
        [1, 2],
        [1, 3],
      ],
      enemies: [close, far, pathOnly, untargetable],
    };

    expect(getTargetsInRange(engine, tower, { targeting: 'furthest' }).map((e) => e.id)).toEqual([
      'far',
      'path-only',
      'close',
    ]);
    expect(
      getTargetsInRange(engine, tower, { targeting: 'lowest-health' }).map((e) => e.id)
    ).toEqual(['path-only', 'far', 'close']);
    expect(
      getTargetsInRange(engine, tower, { targeting: 'highest-health', minHealthPercent: 0.3 }).map(
        (e) => e.id
      )
    ).toEqual(['close', 'far']);
  });

  it('returns empty target list and warns when path nodes are unavailable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = {
      pathNodes: [],
      enemies: [],
      cellSize: 40,
    };

    const targets = getTargetsInRange(engine, createTower());

    expect(targets).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('updates towers in burst mode by queuing burst attacks and projectiles', () => {
    getTowerByTypeMock.mockImplementation((type) => {
      if (type === 'BurstTurret') {
        return { burstRounds: 3, burstDelayMs: 50, burstDamageMultiplier: 0.5 };
      }
      return {};
    });

    const target = createEnemy('enemy-1', { x: 140, y: 60 });
    const tower = createTower({ type: 'BurstTurret' });
    const engine = {
      towers: [tower],
      enemies: [target],
      cellSize: 40,
      pathNodes: [[1, 1]],
      pendingAttacks: [{ timestamp: 200 }],
      projectiles: [],
      animationBudget: { maxProjectiles: 6 },
      getAggregatedTowerEffects: vi.fn(() => ({
        extraTargets: 0,
        damageMultiplier: 1,
        rangeBonus: 0,
      })),
      getAuraBonusForTower: vi.fn(() => ({ damageMultiplier: 0.2, speedMultiplier: 0.1 })),
      getTargetsInRange: vi.fn(() => [target]),
      emit: vi.fn(),
      applyPendingDamage: vi.fn(),
    };

    updateTowers(engine, 3_500);

    expect(tower.recordAttack).toHaveBeenCalledWith(3_500);
    expect(engine.pendingAttacks).toHaveLength(3);
    expect(engine.pendingAttacks[0]).toEqual(
      expect.objectContaining({
        towerType: 'BurstTurret',
        targetId: 'enemy-1',
        impactDelayMs: 0,
        multiTargetMode: 'burst',
      })
    );
    expect(engine.projectiles).toHaveLength(3);
    expect(ProjectileEntityMock).toHaveBeenCalledTimes(3);
    expect(engine.emit).toHaveBeenCalledWith(
      'tower-attack',
      expect.objectContaining({ target: expect.objectContaining({ id: 'enemy-1' }) })
    );
  });

  it('handles chain multi-target attacks and immediate damage fallback when projectiles cannot spawn', () => {
    getTowerByTypeMock.mockReturnValue({});

    const tower = createTower({ type: 'ForLoop' });
    const targetA = createEnemy('a', { x: 80, y: 60 });
    const targetB = createEnemy('b', { x: 100, y: 60 });
    const targetC = createEnemy('c', { x: 120, y: 60 });

    const engine = {
      towers: [tower],
      enemies: [targetA, targetB, targetC],
      cellSize: 40,
      pathNodes: [[1, 1]],
      pendingAttacks: [],
      projectiles: [],
      animationBudget: { maxProjectiles: 0 },
      getAggregatedTowerEffects: vi.fn(() => ({
        extraTargets: 2,
        rangeBonus: 0,
        damageMultiplier: 1,
        multiTarget: {
          mode: 'chain',
          extraTargets: 2,
          primaryDamageMultiplier: 1,
          secondaryDamageMultiplier: 0.5,
          delayMs: 120,
        },
      })),
      getAuraBonusForTower: vi.fn(() => ({ damageMultiplier: 0, speedMultiplier: 0 })),
      getTargetsInRange: vi.fn(() => [targetA, targetB, targetC]),
      emit: vi.fn(),
      applyPendingDamage: vi.fn(),
    };

    updateTowers(engine, 9_000);

    expect(engine.pendingAttacks).toHaveLength(3);
    expect(engine.pendingAttacks.every((attack) => attack.multiTargetMode === 'chain')).toBe(true);
    expect(engine.applyPendingDamage).toHaveBeenCalledTimes(3);
    expect(engine.emit).toHaveBeenCalledWith(
      'tower-attack',
      expect.objectContaining({ target: expect.objectContaining({ id: 'a' }) })
    );
  });

  it('applies an immediate damage portion for WhileLoop beams before projectile completion', () => {
    getTowerByTypeMock.mockReturnValue({});

    const tower = createTower({
      type: 'WhileLoop',
      getDamage: vi.fn(() => 20),
      getAttackCooldown: vi.fn(() => 800),
    });
    const target = createEnemy('beam-target', { x: 120, y: 60 });

    const engine = {
      towers: [tower],
      enemies: [target],
      cellSize: 40,
      pathNodes: [[1, 1]],
      pendingAttacks: [],
      projectiles: [],
      animationBudget: { maxProjectiles: 4 },
      getAggregatedTowerEffects: vi.fn(() => ({
        extraTargets: 0,
        damageMultiplier: 1,
        rangeBonus: 0,
      })),
      getAuraBonusForTower: vi.fn(() => ({ damageMultiplier: 0, speedMultiplier: 0 })),
      getTargetsInRange: vi.fn(() => [target]),
      emit: vi.fn(),
      applyPendingDamage: vi.fn(),
    };

    updateTowers(engine, 12_000);

    expect(engine.applyPendingDamage).toHaveBeenCalledTimes(1);
    expect(engine.pendingAttacks).toHaveLength(2);
    expect(engine.pendingAttacks.every((attack) => attack.targetId === 'beam-target')).toBe(true);
    expect(engine.pendingAttacks.every((attack) => attack.towerType === 'WhileLoop')).toBe(true);
    expect(engine.pendingAttacks.reduce((sum, attack) => sum + attack.damage, 0)).toBeCloseTo(20);
    expect(engine.projectiles).toHaveLength(1);
  });

  it('prefers an unclaimed target before reusing an already targeted enemy', () => {
    getTowerByTypeMock.mockReturnValue({});

    const targetA = createEnemy('a', { x: 80, y: 60, progress: 0.9 });
    const targetB = createEnemy('b', { x: 100, y: 60, progress: 0.8 });
    const towerOne = createTower({ id: 'tower-1' });
    const towerTwo = createTower({
      id: 'tower-2',
      position: { row: 2, col: 2 },
      distanceTo: vi.fn((row, col) => Math.sqrt((row - 2) ** 2 + (col - 2) ** 2)),
      getState: vi.fn(() => ({ id: 'tower-2' })),
    });

    const engine = {
      towers: [towerOne, towerTwo],
      enemies: [targetA, targetB],
      cellSize: 40,
      pathNodes: [[1, 1]],
      pendingAttacks: [],
      projectiles: [],
      animationBudget: { maxProjectiles: 0 },
      getAggregatedTowerEffects: vi.fn(() => ({
        extraTargets: 0,
        damageMultiplier: 1,
        rangeBonus: 0,
      })),
      getAuraBonusForTower: vi.fn(() => ({ damageMultiplier: 0, speedMultiplier: 0 })),
      getTargetsInRange: vi
        .fn()
        .mockReturnValueOnce([targetA, targetB])
        .mockReturnValueOnce([targetA, targetB]),
      emit: vi.fn(),
      applyPendingDamage: vi.fn(),
    };

    updateTowers(engine, 5_000);

    expect(engine.pendingAttacks).toHaveLength(2);
    expect(engine.pendingAttacks[0].targetId).toBe('a');
    expect(engine.pendingAttacks[1].targetId).toBe('b');
  });

  it('falls back to the claimed best target when no alternative target exists', () => {
    getTowerByTypeMock.mockReturnValue({});

    const target = createEnemy('solo', { x: 80, y: 60, progress: 0.9 });
    const towerOne = createTower({ id: 'tower-1' });
    const towerTwo = createTower({
      id: 'tower-2',
      position: { row: 2, col: 2 },
      distanceTo: vi.fn((row, col) => Math.sqrt((row - 2) ** 2 + (col - 2) ** 2)),
      getState: vi.fn(() => ({ id: 'tower-2' })),
    });

    const engine = {
      towers: [towerOne, towerTwo],
      enemies: [target],
      cellSize: 40,
      pathNodes: [[1, 1]],
      pendingAttacks: [],
      projectiles: [],
      animationBudget: { maxProjectiles: 0 },
      getAggregatedTowerEffects: vi.fn(() => ({
        extraTargets: 0,
        damageMultiplier: 1,
        rangeBonus: 0,
      })),
      getAuraBonusForTower: vi.fn(() => ({ damageMultiplier: 0, speedMultiplier: 0 })),
      getTargetsInRange: vi.fn().mockReturnValue([target]),
      emit: vi.fn(),
      applyPendingDamage: vi.fn(),
    };

    updateTowers(engine, 6_000);

    expect(engine.pendingAttacks).toHaveLength(2);
    expect(engine.pendingAttacks[0].targetId).toBe('solo');
    expect(engine.pendingAttacks[1].targetId).toBe('solo');
  });

  it('returns the first available target for convenience targeting', () => {
    const first = createEnemy('first');
    const second = createEnemy('second');
    const engine = {
      getTargetsInRange: vi.fn(() => [first, second]),
    };

    expect(findTargetForTower(engine, createTower())).toBe(first);

    engine.getTargetsInRange.mockReturnValue([]);
    expect(findTargetForTower(engine, createTower())).toBeNull();
  });
});
