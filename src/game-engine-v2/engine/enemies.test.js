import { describe, expect, it, vi } from 'vitest';
import { applyEnemyOnHit, spawnEnemies, updateEnemies, updateEnemyPosition } from './enemies';

const makeEngine = () => ({
  enemies: [],
  towers: [],
  enemyQueue: [],
  cellSize: 40,
  pathNodes: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  waveStartTime: 0,
  state: {
    wave: 2,
    lives: 10,
    credits: 100,
    enemiesDefeated: 0,
    endlessBossesKilled: 0,
  },
  creditMultiplier: 1,
  endlessBossesKilled: 0,
  ENDLESS_SCORING: { BOSS_KILL_BONUS: 250 },
  addEndlessScore: vi.fn(),
  emit: vi.fn(),
  spawnCombatText: vi.fn(),
  gameOver: vi.fn(),
  updateEnemyPosition: vi.fn(),
});

describe('engine/enemies', () => {
  it('spawns enemies from queue when spawn time is reached', () => {
    const engine = makeEngine();
    engine.enemyQueue = [
      { type: 'basic', delay: 100, spawnTime: 50, wave: 2 },
      { type: 'edge', delay: 100, spawnTime: 10, wave: 2, isBoss: true, isEndless: true },
    ];

    spawnEnemies(engine, 100);

    expect(engine.enemyQueue.length).toBe(0);
    expect(engine.enemies.length).toBe(2);
    expect(engine.updateEnemyPosition).toHaveBeenCalled();
    expect(engine.emit).toHaveBeenCalledWith('enemy-spawned', expect.any(Object));
  });

  it('updates enemy coordinates on path and hijacked tower anchors', () => {
    const engine = makeEngine();

    const normalEnemy = { id: 'e1', progress: 0.5 };
    updateEnemyPosition(engine, normalEnemy);
    expect(normalEnemy.x).toBeGreaterThan(0);
    expect(normalEnemy.y).toBeGreaterThan(0);

    const hijackedEnemy = { id: 'e2', progress: 0.2, hijackedTowerId: 't1' };
    engine.towers.push({
      id: 't1',
      position: { row: 3, col: 4 },
      disabledByEnemyId: 'e2',
    });
    updateEnemyPosition(engine, hijackedEnemy);
    expect(hijackedEnemy.x).toBe((4 + 0.5) * engine.cellSize);
    expect(hijackedEnemy.y).toBe((3 + 0.5) * engine.cellSize);

    const endEnemy = { id: 'e3', progress: 1 };
    updateEnemyPosition(engine, endEnemy);
    expect(endEnemy.x).toBe((4 + 0.5) * engine.cellSize);
    expect(endEnemy.y).toBe((0 + 0.5) * engine.cellSize);
  });

  it('applies on-hit edge debuff to nearest tower', () => {
    const engine = makeEngine();
    const tower = {
      id: 'tower-1',
      position: { row: 1, col: 1 },
      applySlowEffect: vi.fn(),
    };
    engine.towers = [tower];

    const edgeEnemy = { type: 'edge', x: 50, y: 50 };
    applyEnemyOnHit(engine, edgeEnemy);

    expect(tower.applySlowEffect).toHaveBeenCalledWith(0.65, 1200);
    expect(engine.spawnCombatText).toHaveBeenCalled();
  });

  it('processes reached-end enemies, path shaping, and removal', () => {
    const engine = makeEngine();
    engine.updateEnemyPosition = vi.fn((enemy) => {
      enemy.x = 10;
      enemy.y = 10;
    });

    const enemy = {
      id: 'path-shaper-1',
      type: 'pathShaper',
      isActive: true,
      progress: 0.6,
      x: 20,
      y: 20,
      damage: 2,
      special: { kind: 'path-shaper', shortenPercent: 0.1 },
      pathShortenTriggered: false,
      reachedEndTriggered: false,
      hijackedTowerId: null,
      update: vi.fn(() => 'reached-end'),
      getState: () => ({ id: 'path-shaper-1' }),
    };

    engine.enemies = [enemy];
    updateEnemies(engine, 16);

    expect(engine.state.lives).toBe(8);
    expect(engine.emit).toHaveBeenCalledWith('enemy-reached-end', expect.any(Object));
    expect(engine.enemies.length).toBe(0);
    expect(engine.pathNodes.length).toBeLessThan(5);
  });

  it('handles defeated enemies with rewards, splits, and endless boss scoring', () => {
    const engine = makeEngine();
    engine.updateEnemyPosition = vi.fn();
    vi.spyOn(Date, 'now').mockReturnValue(10_000);

    const complexEnemy = {
      id: 'complex-1',
      type: 'complex',
      wave: 2,
      progress: 0.4,
      x: 40,
      y: 40,
      isActive: false,
      reward: 20,
      creditsAwarded: false,
      countedAsDefeated: false,
      defeatTime: 9_000,
      update: vi.fn(() => 'defeated'),
      getState: () => ({ id: 'complex-1' }),
      hijackedTowerId: null,
    };

    const endlessBoss = {
      id: 'boss-1',
      type: 'basic',
      wave: 2,
      progress: 0.3,
      x: 10,
      y: 10,
      isActive: false,
      reward: 30,
      creditsAwarded: false,
      countedAsDefeated: false,
      defeatTime: 9_000,
      isEndless: true,
      isBoss: true,
      bossKillCounted: false,
      update: vi.fn(() => 'defeated'),
      getState: () => ({ id: 'boss-1' }),
      hijackedTowerId: null,
    };

    engine.enemies = [complexEnemy, endlessBoss];
    updateEnemies(engine, 16);

    expect(engine.state.enemiesDefeated).toBeGreaterThanOrEqual(2);
    expect(engine.state.credits).toBeGreaterThan(100);
    expect(engine.addEndlessScore).toHaveBeenCalledWith(engine.ENDLESS_SCORING.BOSS_KILL_BONUS);
    expect(engine.state.endlessBossesKilled).toBe(1);
    expect(engine.emit).toHaveBeenCalledWith('enemy-defeated', expect.any(Object));
  });
});
