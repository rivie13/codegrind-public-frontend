import { describe, expect, it, vi } from 'vitest';
import {
  applyGameSettings,
  cancelReservedPlacement,
  getReservedPlacementCount,
  isPositionOnPath,
  isValidDeployablePosition,
  isValidTowerPosition,
  placeDeployable,
  placeTower,
  reservePlacement,
  sellTower,
  setTowerTargeting,
  upgradeTower,
  upgradeTowerSpecial,
} from './placement';
import { TowerEntity } from '../entities';

const createEngine = () => {
  const engine = {
    state: { credits: 500, lives: 10, totalWaves: 5 },
    reservedPlacements: { tower: {}, deployable: {} },
    towers: [],
    deployables: [],
    gridRows: 8,
    gridCols: 8,
    pathNodes: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    gameSettings: { enemyHealthMultiplier: 1, enemySpeedMultiplier: 1 },
    totalWaves: 5,
    initialCredits: 350,
    initialLives: 10,
    waveGenerator: {
      totalWaves: 5,
      applySettings: vi.fn(),
    },
    updateState: vi.fn((patch) => {
      engine.state = { ...engine.state, ...patch };
    }),
    emit: vi.fn(),
    getState: vi.fn(() => ({
      ...engine.state,
      towerCount: engine.towers.length,
      deployableCount: engine.deployables.length,
    })),
  };

  engine.isPositionOnPath = (row, col) => isPositionOnPath(engine, row, col);
  engine.isValidTowerPosition = (position) => isValidTowerPosition(engine, position);
  engine.isValidDeployablePosition = (position, props) =>
    isValidDeployablePosition(engine, position, props);

  return engine;
};

describe('engine/placement', () => {
  it('places towers and deployables with credits/state updates', () => {
    const engine = createEngine();

    engine.reservedPlacements.tower.FOR_LOOP = 1;
    const towerPlaced = placeTower(engine, 'ForLoop', { row: 2, col: 2 });
    expect(towerPlaced).toBe(true);
    expect(engine.towers.length).toBe(1);
    expect(engine.state.credits).toBeLessThan(500);
    expect(engine.reservedPlacements.tower.FOR_LOOP).toBe(0);
    expect(engine.emit).toHaveBeenCalledWith(
      'tower-placed',
      expect.objectContaining({ credits: engine.state.credits })
    );

    engine.reservedPlacements.deployable.DATA_MINE = 1;
    const deployablePlaced = placeDeployable(engine, 'Data Mine', { row: 0, col: 0 });
    expect(deployablePlaced).toBe(true);
    expect(engine.deployables.length).toBe(1);
    expect(engine.reservedPlacements.deployable.DATA_MINE).toBe(0);
  });

  it('rejects invalid placements and insufficient credits', () => {
    const engine = createEngine();

    engine.state.credits = 1;
    expect(placeTower(engine, 'ForLoop', { row: 2, col: 2 })).toBe(false);

    engine.state.credits = 500;
    placeTower(engine, 'ForLoop', { row: 2, col: 2 });
    expect(placeTower(engine, 'ForLoop', { row: 2, col: 2 })).toBe(false);

    engine.pathNodes = [];
    expect(isValidTowerPosition(engine, { row: 2, col: 3 })).toBe(false);
  });

  it('rejects tower placement on a cell occupied by a deployable', () => {
    const engine = createEngine();

    // Place a deployable with 'any' placementType on a non-path cell
    engine.reservedPlacements.deployable.BUFFER_OVERFLOW = 1;
    const anyPlaced = placeDeployable(engine, 'Buffer Overflow', { row: 3, col: 3 });
    expect(anyPlaced).toBe(true);
    expect(engine.deployables.length).toBe(1);

    // Tower placement on the same off-path cell must be rejected
    expect(placeTower(engine, 'ForLoop', { row: 3, col: 3 })).toBe(false);
    expect(engine.towers.length).toBe(0);

    // Tower placement on an adjacent free cell must still succeed
    expect(placeTower(engine, 'ForLoop', { row: 3, col: 4 })).toBe(true);
    expect(engine.towers.length).toBe(1);
  });

  it('upgrades, special-upgrades, and sells towers', () => {
    const engine = createEngine();
    const tower = new TowerEntity('ForLoop', { row: 3, col: 3 });
    engine.towers.push(tower);

    expect(upgradeTower(engine, tower.id)).toBe(true);
    expect(tower.upgradeLevel).toBe(1);

    expect(upgradeTowerSpecial(engine, tower.id)).toBe(true);
    expect(tower.specialUpgradeLevel).toBe(1);

    const creditsBeforeSell = engine.state.credits;
    expect(sellTower(engine, tower.id)).toBe(true);
    expect(engine.towers.length).toBe(0);
    expect(engine.state.credits).toBeGreaterThan(creditsBeforeSell);
  });

  it('updates manual targeting until a targeting special upgrade locks it', () => {
    const engine = createEngine();
    const tower = new TowerEntity('Array', { row: 3, col: 3 });
    engine.towers.push(tower);

    expect(setTowerTargeting(engine, tower.id, 'furthest')).toBe(true);
    expect(tower.targeting).toBe('furthest');
    expect(engine.emit).toHaveBeenCalledWith(
      'tower-targeting-changed',
      expect.objectContaining({
        tower: expect.objectContaining({
          targeting: 'furthest',
          effectiveTargeting: 'furthest',
          targetingLocked: false,
        }),
      })
    );

    expect(upgradeTowerSpecial(engine, tower.id)).toBe(true);
    expect(tower.getState().effectiveTargeting).toBe('highest-health');
    expect(tower.getState().targetingLocked).toBe(true);
    expect(setTowerTargeting(engine, tower.id, 'closest')).toBe(false);
    expect(tower.targeting).toBe('furthest');
  });

  it('validates path placement rules for towers and deployables', () => {
    const engine = createEngine();

    expect(isPositionOnPath(engine, 0, 1)).toBe(true);
    expect(isPositionOnPath(engine, 2, 2)).toBe(false);

    expect(isValidTowerPosition(engine, { row: 0, col: 1 })).toBe(false);
    expect(isValidTowerPosition(engine, { row: 4, col: 4 })).toBe(true);

    expect(isValidDeployablePosition(engine, { row: 0, col: 1 }, { placementType: 'path' })).toBe(
      true
    );
    expect(isValidDeployablePosition(engine, { row: 4, col: 4 }, { placementType: 'path' })).toBe(
      false
    );
    expect(isValidDeployablePosition(engine, { row: 4, col: 4 }, { placementType: 'any' })).toBe(
      true
    );
  });

  it('reserves and cancels placements', () => {
    const engine = createEngine();

    expect(reservePlacement(engine, 'tower', 'ForLoop')).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(reservePlacement(engine, 'deployable', 'Data Mine')).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(getReservedPlacementCount(engine, 'tower')).toBe(1);
    expect(getReservedPlacementCount(engine, 'deployable')).toBe(1);

    expect(cancelReservedPlacement(engine, 'tower', 'ForLoop')).toEqual(
      expect.objectContaining({ success: true })
    );
    expect(cancelReservedPlacement(engine, 'tower', 'ForLoop')).toEqual(
      expect.objectContaining({ success: false, reason: 'none' })
    );
  });

  it('applies game settings and emits settings-changed', () => {
    const engine = createEngine();

    applyGameSettings(
      engine,
      {
        startingCredits: 700,
        startingLives: 20,
        totalWaves: 9,
        enemyHealthMultiplier: 1.4,
        enemySpeedMultiplier: 1.2,
      },
      { applyToState: true }
    );

    expect(engine.initialCredits).toBe(700);
    expect(engine.initialLives).toBe(20);
    expect(engine.totalWaves).toBe(9);
    expect(engine.waveGenerator.applySettings).toHaveBeenCalled();
    expect(engine.emit).toHaveBeenCalledWith(
      'settings-changed',
      expect.objectContaining({ totalWaves: 9 })
    );
  });
});
