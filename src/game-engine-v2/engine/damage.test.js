import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyDelayedDamage, updateDamageFields } from './damage.js';

function makeEnemy({ id = 'e1', x = 100, y = 100, isActive = true, health = 100 } = {}) {
  return {
    id,
    x,
    y,
    isActive,
    takeDamage: vi.fn(() => false), // returns true if killed
    getState: () => ({ id }),
  };
}

function makeTower(id = 't1') {
  return { id, getState: () => ({ id }) };
}

function makeEngine(overrides = {}) {
  const enemies = overrides.enemies || [];
  const towers = overrides.towers || [];
  return {
    enemies,
    towers,
    delayedDamage: overrides.delayedDamage || [],
    damageFields: overrides.damageFields || [],
    combatText: [],
    combatTextCooldowns: new Map(),
    cellSize: 40,
    spawnCombatText: vi.fn(),
    emit: vi.fn(),
  };
}

describe('applyDelayedDamage', () => {
  it('does nothing when delayedDamage is empty', () => {
    const engine = makeEngine();
    applyDelayedDamage(engine, Date.now());
    expect(engine.emit).not.toHaveBeenCalled();
  });

  it('skips entries whose applyAt is in the future', () => {
    const enemy = makeEnemy();
    const engine = makeEngine({
      enemies: [enemy],
      delayedDamage: [
        { targetId: 'e1', damage: 50, applyAt: Date.now() + 5000, sourceTowerId: 't1' },
      ],
    });
    applyDelayedDamage(engine, Date.now());
    expect(enemy.takeDamage).not.toHaveBeenCalled();
    expect(engine.delayedDamage).toHaveLength(1);
  });

  it('applies damage to the target when applyAt has passed', () => {
    const enemy = makeEnemy();
    const engine = makeEngine({
      enemies: [enemy],
      towers: [makeTower()],
      delayedDamage: [
        { targetId: 'e1', damage: 30, applyAt: Date.now() - 1000, sourceTowerId: 't1' },
      ],
    });
    applyDelayedDamage(engine, Date.now());
    expect(enemy.takeDamage).toHaveBeenCalledWith(30);
    expect(engine.delayedDamage).toHaveLength(0);
    expect(engine.spawnCombatText).toHaveBeenCalled();
  });

  it('emits enemy-killed when takeDamage returns true', () => {
    const enemy = makeEnemy();
    enemy.takeDamage = vi.fn(() => true); // killed
    const engine = makeEngine({
      enemies: [enemy],
      towers: [makeTower()],
      delayedDamage: [
        {
          targetId: 'e1',
          damage: 999,
          applyAt: Date.now() - 100,
          sourceTowerId: 't1',
          color: '#ff0000',
        },
      ],
    });
    applyDelayedDamage(engine, Date.now());
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: { id: 'e1' } })
    );
  });

  it('skips inactive enemies', () => {
    const enemy = makeEnemy({ isActive: false });
    const engine = makeEngine({
      enemies: [enemy],
      delayedDamage: [
        { targetId: 'e1', damage: 10, applyAt: Date.now() - 100, sourceTowerId: 't1' },
      ],
    });
    applyDelayedDamage(engine, Date.now());
    expect(enemy.takeDamage).not.toHaveBeenCalled();
    expect(engine.delayedDamage).toHaveLength(0); // entry is still removed
  });

  it('uses default damage color when none specified', () => {
    const enemy = makeEnemy();
    const engine = makeEngine({
      enemies: [enemy],
      towers: [],
      delayedDamage: [
        { targetId: 'e1', damage: 10, applyAt: Date.now() - 100, sourceTowerId: 't1' },
      ],
    });
    applyDelayedDamage(engine, Date.now());
    const callArg = engine.spawnCombatText.mock.calls[0][0];
    expect(callArg.color).toBe('#ff66cc');
  });
});

describe('updateDamageFields', () => {
  it('does nothing when damageFields is empty', () => {
    const engine = makeEngine();
    updateDamageFields(engine, Date.now());
    expect(engine.emit).not.toHaveBeenCalled();
  });

  it('removes expired damage fields', () => {
    const engine = makeEngine({
      damageFields: [
        {
          id: 'f1',
          endTime: Date.now() - 1000,
          nextTickAt: 0,
          tickMs: 100,
          x: 0,
          y: 0,
          radius: 50,
          damagePerTick: 5,
          sourceTowerId: 't1',
        },
      ],
    });
    updateDamageFields(engine, Date.now());
    expect(engine.damageFields).toHaveLength(0);
  });

  it('skips tick when nextTickAt is in the future', () => {
    const now = Date.now();
    const enemy = makeEnemy({ x: 0, y: 0 });
    const engine = makeEngine({
      enemies: [enemy],
      damageFields: [
        {
          id: 'f1',
          endTime: now + 5000,
          nextTickAt: now + 1000,
          tickMs: 100,
          x: 0,
          y: 0,
          radius: 50,
          damagePerTick: 5,
          sourceTowerId: 't1',
        },
      ],
    });
    updateDamageFields(engine, now);
    expect(enemy.takeDamage).not.toHaveBeenCalled();
  });

  it('applies damage to enemies within radius and advances nextTickAt', () => {
    const now = Date.now();
    const enemy = makeEnemy({ x: 10, y: 10 }); // within radius 50 of origin
    const field = {
      id: 'f1',
      endTime: now + 5000,
      nextTickAt: now - 100,
      tickMs: 200,
      x: 0,
      y: 0,
      radius: 50,
      damagePerTick: 15,
      sourceTowerId: 't1',
      color: '#ff0000',
    };
    const engine = makeEngine({ enemies: [enemy], towers: [], damageFields: [field] });
    updateDamageFields(engine, now);
    expect(enemy.takeDamage).toHaveBeenCalledWith(15);
    expect(field.nextTickAt).toBe(now + 200);
  });

  it('skips enemies outside radius', () => {
    const now = Date.now();
    const farEnemy = makeEnemy({ x: 1000, y: 1000 });
    const field = {
      id: 'f1',
      endTime: now + 5000,
      nextTickAt: now - 100,
      tickMs: 200,
      x: 0,
      y: 0,
      radius: 10,
      damagePerTick: 15,
      sourceTowerId: 't1',
    };
    const engine = makeEngine({ enemies: [farEnemy], damageFields: [field] });
    updateDamageFields(engine, now);
    expect(farEnemy.takeDamage).not.toHaveBeenCalled();
  });

  it('emits enemy-killed when a field tick kills an enemy', () => {
    const now = Date.now();
    const enemy = makeEnemy({ x: 0, y: 0 });
    enemy.takeDamage = vi.fn(() => true); // killed
    const field = {
      id: 'f1',
      endTime: now + 5000,
      nextTickAt: now - 100,
      tickMs: 200,
      x: 0,
      y: 0,
      radius: 50,
      damagePerTick: 999,
      sourceTowerId: 't1',
    };
    const engine = makeEngine({ enemies: [enemy], towers: [makeTower()], damageFields: [field] });
    updateDamageFields(engine, now);
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: { id: 'e1' } })
    );
  });

  it('skips inactive enemies in damage fields', () => {
    const now = Date.now();
    const enemy = makeEnemy({ isActive: false, x: 0, y: 0 });
    const field = {
      id: 'f1',
      endTime: now + 5000,
      nextTickAt: now - 100,
      tickMs: 200,
      x: 0,
      y: 0,
      radius: 50,
      damagePerTick: 10,
      sourceTowerId: 't1',
    };
    const engine = makeEngine({ enemies: [enemy], damageFields: [field] });
    updateDamageFields(engine, now);
    expect(enemy.takeDamage).not.toHaveBeenCalled();
  });
});
