import { beforeEach, describe, expect, it, vi } from 'vitest';
import { update } from './loop';
import { GameEngine } from '../GameEngine';
import { TowerEntity, EnemyEntity, ProjectileEntity } from '../entities';
import { DeployableEntity } from '../deployables';
import { applyDelayedDamage, updateDamageFields } from './damage';
import {
  addEndlessScore,
  applyEndlessSurvivalBonus,
  calculateEndlessWaveBonus,
  calculateScore,
  getEndlessSurvivalTime,
} from './scoring';
import { spawnCombatText, spawnDeployablePopup, updateCombatText } from './combatText';

describe('engine runtime modules', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('applies delayed damage entries and emits kill events for lethal hits', () => {
    const target = {
      id: 'enemy-1',
      isActive: true,
      x: 80,
      y: 96,
      takeDamage: vi.fn(() => true),
      getState: vi.fn(() => ({ id: 'enemy-1' })),
    };
    const engine = {
      delayedDamage: [
        { targetId: 'enemy-1', sourceTowerId: 'tower-1', damage: 12, applyAt: 500, color: '#ff0' },
        { targetId: 'enemy-1', sourceTowerId: 'tower-1', damage: 8, applyAt: 2_000, color: '#f0f' },
      ],
      enemies: [target],
      towers: [{ id: 'tower-1', getState: () => ({ id: 'tower-1' }) }],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
    };

    applyDelayedDamage(engine, 1_000);

    expect(target.takeDamage).toHaveBeenCalledWith(12);
    expect(engine.spawnCombatText).toHaveBeenCalledWith(
      expect.objectContaining({ text: '-12', color: '#ff0' }),
      expect.objectContaining({ cooldownKey: expect.stringContaining('delayed-enemy-1') })
    );
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: expect.objectContaining({ id: 'enemy-1' }) })
    );
    expect(engine.delayedDamage).toHaveLength(1);
    expect(engine.delayedDamage[0].damage).toBe(8);
  });

  it('ticks and expires damage fields while applying AoE damage', () => {
    const nearEnemy = {
      id: 'near',
      isActive: true,
      x: 105,
      y: 110,
      takeDamage: vi.fn(() => true),
      getState: () => ({ id: 'near' }),
    };
    const farEnemy = {
      id: 'far',
      isActive: true,
      x: 400,
      y: 400,
      takeDamage: vi.fn(() => false),
      getState: () => ({ id: 'far' }),
    };
    const engine = {
      damageFields: [
        {
          id: 'expired',
          endTime: 200,
          nextTickAt: 100,
          tickMs: 100,
          x: 100,
          y: 100,
          radius: 80,
          damagePerTick: 5,
        },
        {
          id: 'active',
          sourceTowerId: 'tower-2',
          endTime: 2_000,
          nextTickAt: 500,
          tickMs: 300,
          x: 100,
          y: 100,
          radius: 120,
          damagePerTick: 9,
          color: '#ffaa00',
        },
      ],
      enemies: [nearEnemy, farEnemy],
      towers: [{ id: 'tower-2', getState: () => ({ id: 'tower-2' }) }],
      spawnCombatText: vi.fn(),
      emit: vi.fn(),
    };

    updateDamageFields(engine, 1_000);

    expect(engine.damageFields).toHaveLength(1);
    expect(engine.damageFields[0].nextTickAt).toBe(1_300);
    expect(nearEnemy.takeDamage).toHaveBeenCalledWith(9);
    expect(farEnemy.takeDamage).not.toHaveBeenCalled();
    expect(engine.spawnCombatText).toHaveBeenCalledWith(
      expect.objectContaining({ text: '-9', color: '#ffaa00' }),
      expect.objectContaining({ cooldownKey: expect.stringContaining('field-active-near') })
    );
    expect(engine.emit).toHaveBeenCalledWith(
      'enemy-killed',
      expect.objectContaining({ enemy: { id: 'near' } })
    );
  });

  it('calculates score and endless scoring helpers correctly', () => {
    const scoreEngine = {
      GAME_CONSTANTS: {
        SCORE_PER_LIFE: 50,
        SCORE_PER_10_CREDITS: 4,
        TIME_BONUS_BASE: 500,
        TIME_PENALTY_PER_SECOND: 2,
        SOLUTION_BONUS: 120,
      },
      state: {
        lives: 8,
        credits: 136,
      },
      totalGameTime: 45_000,
    };
    expect(calculateScore(scoreEngine, true)).toBe(982);
    expect(calculateScore(scoreEngine, false)).toBe(862);

    const endlessEngine = {
      ENDLESS_SCORING: {
        WAVE_CLEAR_BONUS: 20,
        WAVE_MULTIPLIER: 6,
        SURVIVAL_BONUS_PER_MINUTE: 15,
      },
      state: {
        score: 200,
        endlessScore: 40,
        endlessSurvivalTime: 0,
      },
      endlessStartTime: 1_000,
      endlessSurvivalBonusApplied: false,
    };

    expect(calculateEndlessWaveBonus(endlessEngine, 5)).toBe(160);

    addEndlessScore(endlessEngine, 0);
    expect(endlessEngine.state.score).toBe(200);
    addEndlessScore(endlessEngine, 25);
    expect(endlessEngine.state.score).toBe(225);
    expect(endlessEngine.state.endlessScore).toBe(65);

    vi.spyOn(Date, 'now').mockReturnValue(121_000);
    expect(getEndlessSurvivalTime(endlessEngine)).toBe(120_000);
    applyEndlessSurvivalBonus(endlessEngine);
    expect(endlessEngine.endlessSurvivalBonusApplied).toBe(true);
    expect(endlessEngine.state.endlessSurvivalTime).toBe(120_000);
    expect(endlessEngine.state.endlessScore).toBe(95);

    // Idempotent once applied
    applyEndlessSurvivalBonus(endlessEngine);
    expect(endlessEngine.state.endlessScore).toBe(95);
  });

  it('manages combat text lifetimes, cooldowns, and deployable popups', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(5_000);
    const engine = {
      cellSize: 40,
      combatText: Array.from({ length: 80 }, (_, i) => ({
        id: `old-${i}`,
        createdAt: 0,
        duration: 100,
        x: 0,
        y: 0,
        text: 'x',
      })),
      combatTextCooldowns: new Map(),
    };

    updateCombatText(engine, 90);
    expect(engine.combatText.length).toBe(80);
    updateCombatText(engine, 150);
    expect(engine.combatText.length).toBe(0);

    spawnCombatText(engine, null);
    spawnCombatText(engine, { x: NaN, y: 1, text: 'bad' });
    spawnCombatText(engine, { x: 10, y: 10, text: '' });
    expect(engine.combatText).toHaveLength(0);

    for (let i = 0; i < 80; i++) {
      engine.combatText.push({
        id: `seed-${i}`,
        createdAt: 0,
        x: i,
        y: i,
        text: 'seed',
      });
    }
    spawnCombatText(
      engine,
      { x: 80, y: 90, text: '-10', color: '#ff0', type: 'damage', scale: 1.2 },
      { cooldownKey: 'same-hit', cooldownMs: 200 }
    );
    expect(engine.combatText.length).toBe(80);
    expect(engine.combatText.at(-1).text).toBe('-10');

    nowSpy.mockReturnValue(5_050);
    spawnCombatText(
      engine,
      { x: 80, y: 90, text: '-10' },
      { cooldownKey: 'same-hit', cooldownMs: 200 }
    );
    expect(engine.combatText.filter((entry) => entry.text === '-10')).toHaveLength(1);

    const popupEngine = {
      ...engine,
      combatText: [],
      combatTextCooldowns: new Map(),
    };
    const deployable = {
      id: 'd-1',
      effect: 'freeze',
      color: '#00ffff',
      getCenter: () => ({ x: 44, y: 66 }),
    };
    spawnDeployablePopup(popupEngine, deployable, 6_000);
    expect(popupEngine.combatText.at(-1).text).toBe('ICE');
  });

  it('runs the main update loop and throttles ui update emissions', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_050);
    const engine = {
      _stateDirty: false,
      _lastUiUpdateTime: null,
      uiUpdateIntervalMs: 100,
      spawnEnemies: vi.fn(),
      updateEnemies: vi.fn(),
      updateDeployables: vi.fn(),
      applyDelayedDamage: vi.fn(),
      updateDamageFields: vi.fn(),
      updateTowers: vi.fn(),
      updateProjectiles: vi.fn(),
      updateCombatText: vi.fn(),
      checkWaveStatus: vi.fn(),
      getUiState: vi.fn(() => ({ wave: 1, status: 'playing', credits: 123 })),
      emit: vi.fn(),
    };

    update(engine, 16);
    update(engine, 16);

    expect(engine.currentTime).toBe(1_050);
    expect(engine._stateDirty).toBe(true);
    expect(engine.spawnEnemies).toHaveBeenCalledWith(1_000);
    expect(engine.spawnEnemies).toHaveBeenCalledWith(1_050);
    expect(engine.updateEnemies).toHaveBeenCalledTimes(2);
    expect(engine.updateDeployables).toHaveBeenCalledWith(16, 1_000);
    expect(engine.updateDeployables).toHaveBeenCalledWith(16, 1_050);
    expect(engine.applyDelayedDamage).toHaveBeenCalledWith(1_000);
    expect(engine.applyDelayedDamage).toHaveBeenCalledWith(1_050);
    expect(engine.getUiState).toHaveBeenCalledTimes(1);
    expect(engine.emit).toHaveBeenCalledTimes(1);
    expect(engine.emit).toHaveBeenCalledWith('update', {
      wave: 1,
      status: 'playing',
      credits: 123,
    });
  });

  it('builds lightweight render state from live engine entities', () => {
    const engine = new GameEngine();
    engine.initialize({
      pathNodes: [
        [0, 0],
        [0, 1],
      ],
      gridCols: 10,
      gridRows: 8,
      cellSize: 40,
    });

    const tower = new TowerEntity('ForLoop', { row: 1, col: 2 });
    tower.upgradeLevel = 1;
    const enemy = new EnemyEntity('basic', 1, 1, 1);
    enemy.x = 120;
    enemy.y = 80;
    const projectile = new ProjectileEntity({
      towerId: tower.id,
      targetId: enemy.id,
      towerType: tower.type,
      startPos: { x: 100, y: 80 },
      targetPos: { x: 120, y: 80 },
      damage: 12,
      duration: 300,
    });
    const deployable = new DeployableEntity('DataMine', { row: 3, col: 4 });

    engine.currentTime = 9_999;
    engine.towers = [tower];
    engine.enemies = [enemy];
    engine.projectiles = [projectile];
    engine.deployables = [deployable];
    engine.damageFields = [{ id: 'field-1' }];
    engine.impacts = [{ id: 'impact-1' }];
    engine.combatText = [{ id: 'text-1' }];
    engine._stateDirty = true;

    const renderState = engine.getRenderState();
    const uiState = engine.getState();

    expect(renderState.currentTime).toBe(9_999);
    expect(renderState.towers[0]).toBe(tower);
    expect(renderState.enemies[0]).toBe(enemy);
    expect(renderState.projectiles[0]).toBe(projectile);
    expect(renderState.deployables[0]).toBe(deployable);
    expect(renderState.towers[0].range).toBeCloseTo(tower.getRange());
    expect(renderState.towers[0].attackSpeed).toBeCloseTo(uiState.towers[0].attackSpeed);
    expect(renderState.damageFields).toBe(engine.damageFields);
    expect(renderState.impacts).toBe(engine.impacts);
    expect(renderState.combatText).toBe(engine.combatText);
    expect(uiState.towers[0]).not.toBe(tower);
    expect(uiState.enemies[0]).not.toBe(enemy);
    expect(uiState.projectiles[0]).not.toBe(projectile);
  });
});
