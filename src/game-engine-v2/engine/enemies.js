import { EnemyEntity } from '../entities.js';

function resetEnemyModifiers(engine) {
  for (const enemy of engine.enemies) {
    enemy.externalSpeedMultiplier = 1;
    enemy.damageTakenMultiplier = 1;
  }
}

function applyBufferAuras(engine) {
  if (!engine.enemies.length) return;

  resetEnemyModifiers(engine);

  const buffers = engine.enemies.filter(
    (enemy) => enemy.isActive && enemy.special?.kind === 'aura-buffer'
  );

  if (!buffers.length) return;

  for (const buffer of buffers) {
    const radiusCells = buffer.special?.buffRadius ?? 2.5;
    const radiusPx = radiusCells * engine.cellSize;
    const radiusSq = radiusPx * radiusPx;
    const speedMultiplier = buffer.special?.speedMultiplier ?? 1.2;
    const damageTakenMultiplier = buffer.special?.damageTakenMultiplier ?? 0.9;

    for (const target of engine.enemies) {
      if (!target.isActive || target.id === buffer.id) continue;
      const dx = target.x - buffer.x;
      const dy = target.y - buffer.y;
      if (dx * dx + dy * dy > radiusSq) continue;

      target.externalSpeedMultiplier = Math.max(
        target.externalSpeedMultiplier || 1,
        speedMultiplier
      );
      target.damageTakenMultiplier = Math.min(
        target.damageTakenMultiplier || 1,
        damageTakenMultiplier
      );
    }
  }
}

function applyPathShorten(engine, enemy) {
  if (!enemy?.special || enemy.special.kind !== 'path-shaper') return;
  if (enemy.pathShortenTriggered) return;
  if (!engine.pathNodes || engine.pathNodes.length < 4) return;

  const shortenPercent = enemy.special.shortenPercent ?? 0.1;
  const oldLength = engine.pathNodes.length;
  const newLength = Math.max(3, Math.floor(oldLength * (1 - shortenPercent)));
  if (newLength >= oldLength) return;

  engine.pathNodes = engine.pathNodes.slice(0, newLength);
  const lengthScale = (oldLength - 1) / Math.max(1, newLength - 1);

  for (const target of engine.enemies) {
    if (!target.isActive) continue;
    target.progress = Math.min(0.99, target.progress * lengthScale);
    engine.updateEnemyPosition(target);
  }

  enemy.pathShortenTriggered = true;

  engine.spawnCombatText(
    {
      x: enemy.x,
      y: enemy.y,
      text: 'PATH -10%',
      color: '#ff9933',
      type: 'status',
      duration: 900,
      scale: 1,
    },
    { cooldownKey: `path-shaper-${enemy.id}`, cooldownMs: 1200 }
  );
}

function releaseTowerHijack(engine, enemy) {
  if (!enemy?.hijackedTowerId) return;

  const tower = engine.towers.find((t) => t.id === enemy.hijackedTowerId);
  if (tower && tower.disabledByEnemyId === enemy.id) {
    tower.isDisabled = false;
    tower.disabledByEnemyId = null;
  }

  enemy.hijackedTowerId = null;
}

function applyTowerHijack(engine, enemy) {
  if (!enemy?.isActive || enemy.special?.kind !== 'tower-hijack') return;

  if (enemy.hijackedTowerId) {
    const tower = engine.towers.find((t) => t.id === enemy.hijackedTowerId);
    if (!tower) {
      enemy.hijackedTowerId = null;
    }
    return;
  }

  if (!engine.towers.length) return;

  const hijackRange = enemy.special?.hijackRange ?? 1.6;
  const radiusPx = hijackRange * engine.cellSize;
  const radiusSq = radiusPx * radiusPx;

  let nearestTower = null;
  let nearestDistSq = Infinity;

  for (const tower of engine.towers) {
    if (tower.disabledByEnemyId && tower.disabledByEnemyId !== enemy.id) continue;

    const towerX = (tower.position.col + 0.5) * engine.cellSize;
    const towerY = (tower.position.row + 0.5) * engine.cellSize;
    const dx = towerX - enemy.x;
    const dy = towerY - enemy.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > radiusSq) continue;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestTower = tower;
    }
  }

  if (!nearestTower) return;

  nearestTower.isDisabled = true;
  nearestTower.disabledByEnemyId = enemy.id;
  enemy.hijackedTowerId = nearestTower.id;
}

function applyEdgeTowerSlow(engine, enemy) {
  if (!engine.towers.length) return;

  const radiusCells = 3.2;
  const radiusPx = radiusCells * engine.cellSize;
  const radiusSq = radiusPx * radiusPx;

  let nearestTower = null;
  let nearestDistSq = Infinity;

  for (const tower of engine.towers) {
    const towerX = (tower.position.col + 0.5) * engine.cellSize;
    const towerY = (tower.position.row + 0.5) * engine.cellSize;
    const dx = towerX - enemy.x;
    const dy = towerY - enemy.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > radiusSq) continue;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestTower = tower;
    }
  }

  if (!nearestTower) return;

  nearestTower.applySlowEffect?.(0.65, 1200);

  engine.spawnCombatText(
    {
      x: (nearestTower.position.col + 0.5) * engine.cellSize,
      y: (nearestTower.position.row + 0.5) * engine.cellSize,
      text: 'JAM',
      color: '#ffcc00',
      type: 'status',
      duration: 700,
      scale: 0.95,
    },
    { cooldownKey: `tower-jam-${nearestTower.id}`, cooldownMs: 600 }
  );
}

function applySpaceComplexPulse(engine, enemy) {
  const now = Date.now();
  if (now - (enemy.lastPulseTime || 0) < 1200) return;

  const radiusCells = 2.6;
  const radiusPx = radiusCells * engine.cellSize;
  const radiusSq = radiusPx * radiusPx;
  const progressBoost = 0.02;

  for (const target of engine.enemies) {
    if (!target.isActive || target.id === enemy.id) continue;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    if (dx * dx + dy * dy > radiusSq) continue;
    target.applyProgressBoost?.(progressBoost);
    engine.updateEnemyPosition(target);
  }

  enemy.lastPulseTime = now;

  engine.spawnCombatText(
    {
      x: enemy.x,
      y: enemy.y,
      text: 'SURGE',
      color: '#cc55ff',
      type: 'status',
      duration: 600,
      scale: 1,
    },
    { cooldownKey: `surge-${enemy.id}`, cooldownMs: 700 }
  );
}

function spawnMicroSwarm(engine, enemy) {
  const spawnCount = enemy.isBoss ? 4 : 3;
  const wave = enemy.wave || engine.state.wave;

  for (let i = 0; i < spawnCount; i++) {
    const swarm = new EnemyEntity('edge', wave, 0.22, 0.5);
    swarm.progress = Math.max(0, enemy.progress - 0.01 * (i + 1));
    swarm.prevProgress = swarm.progress;
    engine.updateEnemyPosition(swarm);
    engine.enemies.push(swarm);
  }

  engine.spawnCombatText(
    {
      x: enemy.x,
      y: enemy.y,
      text: 'SPLIT',
      color: '#66ccff',
      type: 'status',
      duration: 700,
      scale: 1,
    },
    { cooldownKey: `split-${enemy.id}`, cooldownMs: 800 }
  );
}

export function applyEnemyOnHit(engine, enemy) {
  if (!enemy) return;

  if (enemy.type === 'edge') {
    applyEdgeTowerSlow(engine, enemy);
  }

  if (enemy.type === 'spaceComplex') {
    applySpaceComplexPulse(engine, enemy);
  }
}

export function spawnEnemies(engine, currentTime) {
  if (engine.enemyQueue.length === 0) return;

  const waveElapsedTime = currentTime - engine.waveStartTime;

  for (let i = engine.enemyQueue.length - 1; i >= 0; i--) {
    const enemyData = engine.enemyQueue[i];

    const adjustedSpawnTime = enemyData.spawnTime;

    if (waveElapsedTime >= adjustedSpawnTime) {
      const enemy = new EnemyEntity(
        enemyData.type,
        enemyData.wave || engine.state.wave,
        enemyData.healthMultiplier || 1,
        enemyData.speedMultiplier || 1
      );

      if (enemyData.isBoss) {
        enemy.isBoss = true;
      }

      if (enemyData.isEndless) {
        enemy.isEndless = true;
      }

      engine.updateEnemyPosition(enemy);

      engine.enemies.push(enemy);
      engine.enemyQueue.splice(i, 1);

      engine.emit('enemy-spawned', { enemy: enemy.getState() });
    }
  }
}

export function updateEnemies(engine, deltaTime) {
  applyBufferAuras(engine);

  for (let i = engine.enemies.length - 1; i >= 0; i--) {
    const enemy = engine.enemies[i];
    const result = enemy.update(deltaTime);

    if (result === 'active' || result === 'reached-end') {
      engine.updateEnemyPosition(enemy);
      applyTowerHijack(engine, enemy);
    }

    if (result === 'reached-end') {
      if (!enemy.reachedEndTriggered) {
        enemy.reachedEndTriggered = true;
        engine.state.lives -= enemy.damage;

        applyPathShorten(engine, enemy);

        engine.emit('enemy-reached-end', {
          enemy: enemy.getState(),
          damage: enemy.damage,
          livesRemaining: engine.state.lives,
        });

        if (engine.state.lives <= 0) {
          engine.gameOver();
          return;
        }
      }

      releaseTowerHijack(engine, enemy);
      engine.enemies.splice(i, 1);
    } else if (result === 'defeated') {
      if (!enemy.countedAsDefeated) {
        enemy.countedAsDefeated = true;
        engine.state.enemiesDefeated++;

        if (enemy.type === 'complex') {
          spawnMicroSwarm(engine, enemy);
        }

        if (!enemy.creditsAwarded) {
          enemy.creditsAwarded = true;
          const reward = Math.floor(enemy.reward * engine.creditMultiplier * 0.6);
          engine.state.credits += reward;

          engine.emit('enemy-defeated', {
            enemy: enemy.getState(),
            reward: reward,
            credits: engine.state.credits,
          });
        }

        if (enemy.isEndless && enemy.isBoss && !enemy.bossKillCounted) {
          enemy.bossKillCounted = true;
          engine.endlessBossesKilled += 1;
          engine.state.endlessBossesKilled = engine.endlessBossesKilled;
          engine.addEndlessScore(engine.ENDLESS_SCORING.BOSS_KILL_BONUS);
        }
      }

      if (enemy.defeatTime && Date.now() - enemy.defeatTime > 200) {
        releaseTowerHijack(engine, enemy);
        engine.enemies.splice(i, 1);
      }
    }
  }
}

export function updateEnemyPosition(engine, enemy) {
  if (!engine.pathNodes || engine.pathNodes.length === 0) {
    console.warn('[GameEngine] updateEnemyPosition: No path nodes defined');
    return;
  }

  if (enemy.hijackedTowerId) {
    const tower = engine.towers.find((t) => t.id === enemy.hijackedTowerId);
    if (tower && tower.disabledByEnemyId === enemy.id) {
      enemy.x = (tower.position.col + 0.5) * engine.cellSize;
      enemy.y = (tower.position.row + 0.5) * engine.cellSize;
      return;
    }
  }

  const lastIndex = engine.pathNodes.length - 1;
  const boundedProgress = Math.max(0, Math.min(enemy.progress, 1));

  if (lastIndex === 0 || boundedProgress >= 1) {
    const [lastRow, lastCol] = engine.pathNodes[lastIndex];
    const previousIndex = Math.max(0, lastIndex - 1);
    const [prevRow, prevCol] = engine.pathNodes[previousIndex];
    enemy.x = (lastCol + 0.5) * engine.cellSize;
    enemy.y = (lastRow + 0.5) * engine.cellSize;
    enemy.headingAngle = Math.atan2(lastRow - prevRow, lastCol - prevCol);
    return;
  }

  const scaledProgress = boundedProgress * lastIndex;
  const pathIndex = Math.floor(scaledProgress);
  const nextIndex = Math.min(pathIndex + 1, lastIndex);

  if (
    pathIndex < 0 ||
    pathIndex >= engine.pathNodes.length ||
    nextIndex < 0 ||
    nextIndex >= engine.pathNodes.length
  ) {
    return;
  }

  const t = scaledProgress - pathIndex;

  const [row1, col1] = engine.pathNodes[pathIndex];
  const [row2, col2] = engine.pathNodes[nextIndex];

  const row = row1 + (row2 - row1) * t;
  const col = col1 + (col2 - col1) * t;

  enemy.x = (col + 0.5) * engine.cellSize;
  enemy.y = (row + 0.5) * engine.cellSize;

  const dx = col2 - col1;
  const dy = row2 - row1;
  enemy.headingAngle = Math.atan2(dy, dx);
}
