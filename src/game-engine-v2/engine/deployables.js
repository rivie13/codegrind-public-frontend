export function updateDeployables(engine, deltaTime, currentTime) {
  if (!engine.deployables.length) return;

  for (let i = engine.deployables.length - 1; i >= 0; i--) {
    const deployable = engine.deployables[i];
    const enemiesInRange = engine.enemies.filter(
      (enemy) => enemy.isActive && deployable.isInRange(enemy, engine.cellSize)
    );

    if (deployable.trigger === 'area') {
      if (!deployable.isTriggered && enemiesInRange.length > 0) {
        deployable.activate(currentTime);
        deployable.consumeUse();
        engine.emit('deployable-armed', { deployable: deployable.getState() });
        engine.emit('deployable-active-loop', { deployable: deployable.getState() });
        engine.emit('deployable-triggered', { deployable: deployable.getState() });
        engine.spawnDeployablePopup(deployable, currentTime);
      }

      if (deployable.isActiveWindow(currentTime)) {
        enemiesInRange.forEach((enemy) => {
          engine.applyDeployableEffect(deployable, enemy, currentTime, deltaTime);
        });
      }

      if (deployable.isExpired(currentTime)) {
        engine.emit('deployable-expire', { deployable: deployable.getState() });
        engine.deployables.splice(i, 1);
      }

      continue;
    }

    if (deployable.trigger === 'burst') {
      if (!deployable.isTriggered && enemiesInRange.length > 0) {
        deployable.activate(currentTime);
        engine.emit('deployable-armed', { deployable: deployable.getState() });
        enemiesInRange.forEach((enemy) => {
          engine.applyDeployableEffect(deployable, enemy, currentTime, deltaTime);
        });
        deployable.consumeUse();
        engine.emit('deployable-triggered', { deployable: deployable.getState() });
        engine.spawnDeployablePopup(deployable, currentTime);
      }

      if (deployable.isExpired(currentTime)) {
        engine.emit('deployable-expire', { deployable: deployable.getState() });
        engine.deployables.splice(i, 1);
      }

      continue;
    }

    if (deployable.remainingUses > 0 && enemiesInRange.length > 0) {
      for (const enemy of enemiesInRange) {
        if (deployable.remainingUses <= 0) break;
        if (!deployable.canAffectEnemy(enemy)) continue;

        if (!deployable.isTriggered) {
          deployable.activate(currentTime);
          engine.emit('deployable-armed', { deployable: deployable.getState() });
        }
        engine.applyDeployableEffect(deployable, enemy, currentTime, deltaTime);
        deployable.markAffected(enemy);
        deployable.consumeUse();

        engine.emit('deployable-triggered', {
          deployable: deployable.getState(),
          enemy: enemy.getState(),
        });

        engine.spawnDeployablePopup(deployable, currentTime);
      }
    }

    if (deployable.isExpired(currentTime)) {
      engine.emit('deployable-expire', { deployable: deployable.getState() });
      engine.deployables.splice(i, 1);
    }
  }
}

export function applyDeployableEffect(engine, deployable, enemy, now, deltaTime) {
  if (!enemy?.isActive) return;

  const enemyX = enemy.x;
  const enemyY = enemy.y;
  const popupColor = deployable.color || enemy.color || '#00e5ff';

  switch (deployable.effect) {
    case 'damage':
      if (deployable.canAffectEnemy(enemy)) {
        enemy.takeDamage(deployable.damage);
        deployable.markAffected(enemy);
        engine.impacts.push({
          x: enemyX,
          y: enemyY,
          color: popupColor,
          towerType: 'Data Mine',
          createdAt: now,
          scale: 2.1,
          effect: 'deployable-burst',
        });
        engine.spawnCombatText({
          x: enemyX,
          y: enemyY,
          text: `-${Math.round(deployable.damage)}`,
          color: popupColor,
          type: 'damage',
        });
      }
      break;

    case 'percentDamage':
      if (deployable.canAffectEnemy(enemy)) {
        const percentDamage = enemy.maxHealth * deployable.percentDamage;
        enemy.takeDamage(percentDamage);
        deployable.markAffected(enemy);
        engine.impacts.push({
          x: enemyX,
          y: enemyY,
          color: popupColor,
          towerType: 'Buffer Overflow',
          createdAt: now,
          scale: 2.4,
          effect: 'overflow-burst',
        });
        engine.spawnCombatText({
          x: enemyX,
          y: enemyY,
          text: `-${Math.round(percentDamage)}`,
          color: popupColor,
          type: 'damage',
        });
      }
      break;

    case 'freeze':
      if (deployable.canAffectEnemy(enemy)) {
        enemy.applyFreeze(deployable.duration || 0);
        deployable.markAffected(enemy);
        engine.impacts.push({
          x: enemyX,
          y: enemyY,
          color: popupColor,
          towerType: 'ICE Trap',
          createdAt: now,
          scale: 1.9,
          effect: 'ice-burst',
        });
        engine.spawnCombatText(
          {
            x: enemyX,
            y: enemyY,
            text: 'ICE',
            color: popupColor,
            type: 'status',
            duration: 900,
            scale: 1.1,
          },
          { cooldownKey: `freeze-${deployable.id}-${enemy.id}`, cooldownMs: 800 }
        );
      }
      break;

    case 'slow': {
      const remaining = deployable.activeUntil
        ? Math.max(0, deployable.activeUntil - now)
        : deployable.duration;
      enemy.applySlow(deployable.slowFactor || 0.5, remaining || 0);
      engine.spawnCombatText(
        {
          x: enemyX,
          y: enemyY,
          text: 'SLOW',
          color: popupColor,
          type: 'status',
          duration: 800,
          scale: 1.05,
        },
        { cooldownKey: `slow-${deployable.id}-${enemy.id}`, cooldownMs: 900 }
      );
      break;
    }

    case 'block': {
      const remaining = deployable.activeUntil
        ? Math.max(0, deployable.activeUntil - now)
        : deployable.duration;
      enemy.applyFreeze(remaining || 0);
      const damagePerSecond = deployable.damage || 0;
      if (damagePerSecond > 0) {
        enemy.takeDamage(damagePerSecond * (deltaTime / 1000));
      }
      engine.spawnCombatText(
        {
          x: enemyX,
          y: enemyY,
          text: 'LOCK',
          color: popupColor,
          type: 'status',
          duration: 900,
          scale: 1.05,
        },
        { cooldownKey: `block-${deployable.id}-${enemy.id}`, cooldownMs: 1000 }
      );
      break;
    }

    case 'execute':
      if (deployable.canAffectEnemy(enemy)) {
        let damageDealt = 0;
        if (deployable.percentDamage) {
          damageDealt += enemy.maxHealth * deployable.percentDamage;
        }
        if (deployable.damage) {
          damageDealt += deployable.damage;
        }

        if (damageDealt > 0) {
          enemy.takeDamage(damageDealt);
          engine.spawnCombatText({
            x: enemyX,
            y: enemyY,
            text: `-${Math.round(damageDealt)}`,
            color: popupColor,
            type: 'damage',
          });
        }

        let executed = false;
        if (enemy.getHealthPercent() <= (deployable.executeThreshold || 0.3)) {
          enemy.takeDamage(enemy.health);
          executed = true;
        }

        deployable.markAffected(enemy);
        engine.impacts.push({
          x: enemyX,
          y: enemyY,
          color: popupColor,
          towerType: 'Logic Bomb',
          createdAt: now,
          scale: 2.5,
          effect: 'logic-exec',
        });
        engine.spawnCombatText(
          {
            x: enemyX,
            y: enemyY,
            text: executed ? 'EXEC' : 'BOMB',
            color: popupColor,
            type: 'status',
            duration: 900,
            scale: 1.15,
          },
          { cooldownKey: `execute-${deployable.id}-${enemy.id}`, cooldownMs: 1200 }
        );
      }
      break;

    case 'logicField': {
      const dotPercentPerSecond = Number(deployable.dotPercentPerSecond || 0.1);
      const dotDamage = enemy.maxHealth * dotPercentPerSecond * (Math.max(1, deltaTime) / 1000);
      const killedFromDot = enemy.takeDamage(dotDamage);

      engine.impacts.push({
        x: enemyX,
        y: enemyY,
        color: popupColor,
        towerType: 'Logic Bomb',
        createdAt: now,
        scale: 1.6,
        effect: 'logic-field',
      });

      engine.spawnCombatText(
        {
          x: enemyX,
          y: enemyY,
          text: `DOT -${Math.max(1, Math.round(dotDamage))}`,
          color: popupColor,
          type: 'damage',
        },
        { cooldownKey: `logic-dot-${deployable.id}-${enemy.id}`, cooldownMs: 450 }
      );

      if (!killedFromDot && enemy.getHealthPercent() <= (deployable.executeThreshold || 0.3)) {
        enemy.takeDamage(enemy.health);
        engine.spawnCombatText(
          {
            x: enemyX,
            y: enemyY,
            text: 'EXEC',
            color: '#ff67f9',
            type: 'status',
            duration: 950,
            scale: 1.15,
          },
          { cooldownKey: `logic-exec-${deployable.id}-${enemy.id}`, cooldownMs: 700 }
        );
      }

      break;
    }

    default:
      break;
  }
}
