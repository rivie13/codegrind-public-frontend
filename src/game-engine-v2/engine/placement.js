import {
  TOWER_TYPES,
  DEPLOYABLE_TYPES,
  getTowerByType,
  getDeployableByType,
} from '../constants.js';
import { TowerEntity } from '../entities.js';
import { DeployableEntity } from '../deployables.js';

export function placeTower(engine, type, position) {
  const towerProps = getTowerByType(type);
  if (!towerProps) return false;

  const towerKey =
    Object.keys(TOWER_TYPES).find((k) => TOWER_TYPES[k] === towerProps) ||
    type.toUpperCase().replace(/\s+/g, '_');
  const reservedCount = engine.reservedPlacements.tower[towerKey] || 0;
  const useReservation = reservedCount > 0;

  if (engine.state.credits < towerProps.cost) return false;

  if (!engine.isValidTowerPosition(position)) return false;

  const occupied = engine.towers.some(
    (t) => t.position.row === position.row && t.position.col === position.col
  );
  if (occupied) return false;

  const occupiedByDeployable = engine.deployables.some(
    (d) => d.position.row === position.row && d.position.col === position.col
  );
  if (occupiedByDeployable) return false;

  const tower = new TowerEntity(type, position);
  engine.towers.push(tower);

  if (useReservation) {
    engine.reservedPlacements.tower[towerKey] = Math.max(0, reservedCount - 1);
  }

  engine.state.credits -= tower.cost;
  engine.updateState({ credits: engine.state.credits });

  engine.emit('tower-placed', {
    tower: tower.getState(),
    credits: engine.state.credits,
  });

  return true;
}

export function placeDeployable(engine, type, position) {
  const deployableProps = getDeployableByType(type);
  if (!deployableProps) return false;

  const deployableKey =
    Object.keys(DEPLOYABLE_TYPES).find((k) => DEPLOYABLE_TYPES[k] === deployableProps) ||
    type.toUpperCase().replace(/\s+/g, '_');
  const reservedCount = engine.reservedPlacements.deployable[deployableKey] || 0;
  const useReservation = reservedCount > 0;

  if (engine.state.credits < deployableProps.cost) return false;
  if (!engine.isValidDeployablePosition(position, deployableProps)) return false;

  const occupiedByTower = engine.towers.some(
    (t) => t.position.row === position.row && t.position.col === position.col
  );
  if (occupiedByTower) return false;

  const occupiedByDeployable = engine.deployables.some(
    (d) => d.position.row === position.row && d.position.col === position.col
  );
  if (occupiedByDeployable) return false;

  const deployable = new DeployableEntity(type, position);
  engine.deployables.push(deployable);

  if (useReservation) {
    engine.reservedPlacements.deployable[deployableKey] = Math.max(0, reservedCount - 1);
  }

  engine.state.credits -= deployable.cost;
  engine.updateState({ credits: engine.state.credits });

  engine.emit('deployable-placed', {
    deployable: deployable.getState(),
    credits: engine.state.credits,
  });

  return true;
}

export function upgradeTower(engine, towerId) {
  const tower = engine.towers.find((t) => t.id === towerId);
  if (!tower || !tower.canUpgrade()) return false;

  const cost = tower.getNextUpgradeCost();
  if (engine.state.credits < cost) return false;

  tower.upgrade();
  engine.state.credits -= cost;

  engine.updateState({ credits: engine.state.credits });

  engine.emit('tower-upgraded', {
    tower: tower.getState(),
    credits: engine.state.credits,
  });

  return true;
}

export function upgradeTowerSpecial(engine, towerId) {
  const tower = engine.towers.find((t) => t.id === towerId);
  if (!tower || !tower.canSpecialUpgrade()) return false;

  const cost = tower.getNextSpecialUpgradeCost();
  if (engine.state.credits < cost) return false;

  tower.upgradeSpecial();
  engine.state.credits -= cost;

  engine.updateState({ credits: engine.state.credits });

  engine.emit('tower-special-upgraded', {
    tower: tower.getState(),
    credits: engine.state.credits,
  });

  return true;
}

export function setTowerTargeting(engine, towerId, targeting) {
  const tower = engine.towers.find((candidate) => candidate.id === towerId);
  if (!tower || !tower.setTargeting?.(targeting)) return false;

  engine.updateState({});

  engine.emit('tower-targeting-changed', {
    tower: tower.getState(),
  });

  return true;
}

export function sellTower(engine, towerId) {
  const towerIndex = engine.towers.findIndex((t) => t.id === towerId);
  if (towerIndex === -1) return false;

  const tower = engine.towers[towerIndex];
  const refund = tower.getSellValue();

  engine.towers.splice(towerIndex, 1);
  engine.state.credits += refund;

  engine.updateState({ credits: engine.state.credits });

  engine.emit('tower-sold', {
    towerId: towerId,
    refund: refund,
    credits: engine.state.credits,
  });

  return true;
}

export function isValidTowerPosition(engine, position) {
  if (position.row < 0 || position.row >= engine.gridRows) return false;
  if (position.col < 0 || position.col >= engine.gridCols) return false;

  if (!engine.pathNodes || engine.pathNodes.length === 0) {
    console.warn('[GameEngine] No path nodes defined - blocking tower placement for safety');
    return false;
  }

  const posRow = Number(position.row);
  const posCol = Number(position.col);

  const isOnPath = engine.pathNodes.some(
    ([pathRow, pathCol]) => Number(pathRow) === posRow && Number(pathCol) === posCol
  );

  if (isOnPath) {
    return false;
  }

  return true;
}

export function isValidDeployablePosition(engine, position, deployableProps) {
  if (position.row < 0 || position.row >= engine.gridRows) return false;
  if (position.col < 0 || position.col >= engine.gridCols) return false;

  if (!engine.pathNodes || engine.pathNodes.length === 0) {
    console.warn('[GameEngine] No path nodes defined - blocking deployable placement for safety');
    return false;
  }

  const onPath = engine.isPositionOnPath(position.row, position.col);

  if (deployableProps.placementType === 'path') {
    return onPath;
  }

  return true;
}

export function isPositionOnPath(engine, row, col) {
  const posRow = Number(row);
  const posCol = Number(col);

  return engine.pathNodes.some(
    ([pathRow, pathCol]) => Number(pathRow) === posRow && Number(pathCol) === posCol
  );
}

export function reservePlacement(engine, kind, type) {
  const isTower = kind === 'tower';
  const props = isTower ? getTowerByType(type) : getDeployableByType(type);
  if (!props) return { success: false, reason: 'invalid' };

  if (engine.state.credits < props.cost) {
    return { success: false, reason: 'credits', cost: props.cost, credits: engine.state.credits };
  }

  const key = isTower
    ? Object.keys(TOWER_TYPES).find((k) => TOWER_TYPES[k] === props) ||
      type.toUpperCase().replace(/\s+/g, '_')
    : Object.keys(DEPLOYABLE_TYPES).find((k) => DEPLOYABLE_TYPES[k] === props) ||
      type.toUpperCase().replace(/\s+/g, '_');

  const bucket = isTower ? engine.reservedPlacements.tower : engine.reservedPlacements.deployable;
  bucket[key] = (bucket[key] || 0) + 1;

  return { success: true, cost: props.cost, credits: engine.state.credits };
}

export function getReservedPlacementCount(engine, kind) {
  const bucket =
    kind === 'deployable' ? engine.reservedPlacements.deployable : engine.reservedPlacements.tower;
  return Object.values(bucket).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

export function cancelReservedPlacement(engine, kind, type) {
  const isTower = kind === 'tower';
  const props = isTower ? getTowerByType(type) : getDeployableByType(type);
  if (!props) return { success: false, reason: 'invalid' };

  const key = isTower
    ? Object.keys(TOWER_TYPES).find((k) => TOWER_TYPES[k] === props) ||
      type.toUpperCase().replace(/\s+/g, '_')
    : Object.keys(DEPLOYABLE_TYPES).find((k) => DEPLOYABLE_TYPES[k] === props) ||
      type.toUpperCase().replace(/\s+/g, '_');

  const bucket = isTower ? engine.reservedPlacements.tower : engine.reservedPlacements.deployable;
  const reservedCount = Number(bucket[key] || 0);
  if (!reservedCount) return { success: false, reason: 'none' };

  bucket[key] = Math.max(0, reservedCount - 1);
  if (bucket[key] === 0) {
    delete bucket[key];
  }

  return { success: true, cost: props.cost, credits: engine.state.credits };
}

export function applyGameSettings(engine, settings = {}, options = {}) {
  const { applyToState = false } = options;

  if (Number.isFinite(settings.startingCredits)) {
    engine.initialCredits = settings.startingCredits;
  }

  if (Number.isFinite(settings.startingLives)) {
    engine.initialLives = settings.startingLives;
  }

  if (Number.isFinite(settings.totalWaves)) {
    engine.totalWaves = settings.totalWaves;
    engine.waveGenerator.totalWaves = settings.totalWaves;
  }

  engine.gameSettings = {
    enemyHealthMultiplier:
      settings.enemyHealthMultiplier ?? engine.gameSettings.enemyHealthMultiplier,
    enemySpeedMultiplier: settings.enemySpeedMultiplier ?? engine.gameSettings.enemySpeedMultiplier,
    totalWaves: engine.totalWaves,
  };

  engine.waveGenerator.applySettings({
    enemyHealthMultiplier: engine.gameSettings.enemyHealthMultiplier,
    enemySpeedMultiplier: engine.gameSettings.enemySpeedMultiplier,
    totalWaves: engine.totalWaves,
  });

  if (applyToState) {
    engine.updateState({
      credits: engine.initialCredits,
      lives: engine.initialLives,
      totalWaves: engine.totalWaves,
    });
  } else {
    engine.updateState({ totalWaves: engine.totalWaves });
  }

  engine.emit('settings-changed', {
    settings: engine.gameSettings,
    totalWaves: engine.totalWaves,
  });

  return engine.getState();
}
