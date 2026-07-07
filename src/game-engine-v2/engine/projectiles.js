import { getTowerByType } from '../constants.js';
import { applyEnemyOnHit } from './enemies.js';

const MAX_ACTIVE_IMPACTS = 18;

function pushImpact(engine, impact) {
  engine.impacts.push(impact);

  if (engine.impacts.length > MAX_ACTIVE_IMPACTS) {
    engine.impacts.splice(0, engine.impacts.length - MAX_ACTIVE_IMPACTS);
  }
}

export function updateProjectiles(engine, deltaTime) {
  const now = Date.now();
  const impactTTL = 180;
  if (engine.impacts.length > 0) {
    engine.impacts = engine.impacts.filter((impact) => now - impact.createdAt < impactTTL);
  }

  const enemyMap = new Map(engine.enemies.map((e) => [e.id, e]));
  for (let i = engine.projectiles.length - 1; i >= 0; i--) {
    const projectile = engine.projectiles[i];
    const target = enemyMap.get(projectile.targetId);
    if (target && target.isActive) {
      projectile.targetX = target.x;
      projectile.targetY = target.y;
    }
    const complete = projectile.update(deltaTime);

    if (complete) {
      pushImpact(engine, {
        x: projectile.x,
        y: projectile.y,
        color: projectile.color,
        towerType: projectile.towerType,
        createdAt: now,
      });
      engine.applyPendingDamage(projectile.targetId, projectile.towerId);
      engine.projectiles.splice(i, 1);
    }
  }
}

export function applyPendingDamage(engine, targetId, towerId) {
  const attackIndex = engine.pendingAttacks.findIndex(
    (a) => a.targetId === targetId && a.towerId === towerId
  );

  if (attackIndex === -1) return false;

  const attack = engine.pendingAttacks[attackIndex];
  engine.pendingAttacks.splice(attackIndex, 1);
  const effects = attack.effects || {};

  const target = engine.enemies.find((e) => e.id === targetId);
  if (!target || !target.isActive) return false;

  const wasActive = target.isActive;

  let damage = attack.damage;
  const typeBonus = effects.typeDamageBonus?.[target.type] || 0;
  if (Number.isFinite(typeBonus) && typeBonus !== 0) {
    damage *= 1 + typeBonus;
  }

  const towerColor = getTowerByType(attack.towerType)?.color || '#00e5ff';
  let killed = false;
  let executed = false;

  if (effects.execute) {
    const threshold = effects.execute.threshold ?? 0;
    const chance = effects.execute.chance ?? 0;
    const healthPercent = target.health / target.maxHealth;
    if (healthPercent <= threshold && Math.random() < chance) {
      executed = true;
      killed = target.takeDamage(target.health);
      engine.spawnCombatText(
        {
          x: target.x,
          y: target.y,
          text: 'EXEC',
          color: towerColor,
          type: 'status',
          duration: 700,
          scale: 1.1,
        },
        { cooldownKey: `exec-${targetId}-${towerId}`, cooldownMs: 300 }
      );
    }
  }

  if (!executed) {
    killed = target.takeDamage(damage);
    engine.spawnCombatText(
      {
        x: target.x,
        y: target.y,
        text: `-${Math.round(damage)}`,
        color: towerColor,
        type: 'damage',
      },
      { cooldownKey: `hit-${targetId}-${towerId}`, cooldownMs: 120 }
    );
  }

  engine.emit('projectile-hit', {
    targetId,
    towerId,
    damage,
    killed,
  });

  if (wasActive) {
    applyEnemyOnHit(engine, target);
  }

  if (effects.slow && target.isActive) {
    const { factor = 0.7, duration = 1200 } = effects.slow;
    target.applySlow(factor, duration);
    engine.spawnCombatText(
      {
        x: target.x,
        y: target.y,
        text: `SLOW ${Math.round((1 - factor) * 100)}%`,
        color: '#00ffff',
        type: 'status',
        duration: 600,
        scale: 0.95,
      },
      { cooldownKey: `slow-${targetId}-${towerId}`, cooldownMs: 350 }
    );
  }

  if (Number.isFinite(attack.auraDamageBonusPct) && attack.auraDamageBonusPct > 0) {
    engine.spawnCombatText(
      {
        x: target.x,
        y: target.y - 14,
        text: `BNS +${attack.auraDamageBonusPct}%`,
        color: '#c084fc',
        type: 'status',
        duration: 700,
        scale: 0.9,
      },
      { cooldownKey: `aura-bns-${targetId}-${towerId}`, cooldownMs: 450 }
    );
  }

  if (effects.splash) {
    engine.applySplashDamage(target, effects.splash, damage, towerId, towerColor);
  }

  if (effects.field) {
    engine.spawnDamageField(target, effects.field, damage, towerId, towerColor);
  }

  if (effects.delayedDamage) {
    const { delayMs = 600, damageMultiplier: delayedMultiplier = 0.5 } = effects.delayedDamage;
    const delayedDamage = Math.max(1, damage * delayedMultiplier);
    engine.delayedDamage.push({
      targetId: target.id,
      sourceTowerId: towerId,
      applyAt: Date.now() + delayMs,
      damage: delayedDamage,
      color: towerColor,
    });
    engine.spawnCombatText(
      {
        x: target.x,
        y: target.y,
        text: 'DELAY',
        color: '#ff66cc',
        type: 'status',
        duration: 650,
        scale: 0.95,
      },
      { cooldownKey: `delay-${targetId}-${towerId}`, cooldownMs: 350 }
    );
  }

  if (killed) {
    engine.emit('enemy-killed', {
      enemy: target.getState(),
      tower: engine.towers.find((t) => t.id === towerId)?.getState(),
    });
  }

  return true;
}

export function applySplashDamage(engine, target, splashConfig, baseDamage, towerId, color) {
  const radiusCells = splashConfig.radius ?? 1;
  const radius = radiusCells * engine.cellSize;
  const splashMultiplier = splashConfig.damageMultiplier ?? 0.5;
  const splashDamage = Math.max(1, baseDamage * splashMultiplier);

  pushImpact(engine, {
    x: target.x,
    y: target.y,
    color: color || '#ff9966',
    towerType: engine.towers.find((tower) => tower.id === towerId)?.type || 'Splash',
    createdAt: Date.now(),
    scale: 1.8,
    effect: 'splash',
  });

  for (const enemy of engine.enemies) {
    if (!enemy.isActive || enemy.id === target.id) continue;
    const dx = enemy.x - target.x;
    const dy = enemy.y - target.y;
    if (Math.sqrt(dx * dx + dy * dy) > radius) continue;

    const killed = enemy.takeDamage(splashDamage);
    engine.spawnCombatText(
      {
        x: enemy.x,
        y: enemy.y,
        text: `-${Math.round(splashDamage)}`,
        color: color || '#ff66cc',
        type: 'damage',
      },
      { cooldownKey: `splash-${enemy.id}-${towerId}`, cooldownMs: 200 }
    );

    if (killed) {
      engine.emit('enemy-killed', {
        enemy: enemy.getState(),
        tower: engine.towers.find((t) => t.id === towerId)?.getState(),
      });
    }
  }
}

export function spawnDamageField(engine, target, fieldConfig, baseDamage, towerId, color) {
  const now = Date.now();
  const radius = (fieldConfig.radius ?? 1) * engine.cellSize;
  const duration = fieldConfig.duration ?? 2000;
  const tickMs = fieldConfig.tickMs ?? 500;
  const damagePerTick = Math.max(1, baseDamage * (fieldConfig.damageMultiplier ?? 0.2));

  engine.damageFields.push({
    id: `field-${now}-${Math.random().toString(36).slice(2, 6)}`,
    sourceTowerId: towerId,
    x: target.x,
    y: target.y,
    radius,
    damagePerTick,
    tickMs,
    nextTickAt: now,
    endTime: now + duration,
    color,
  });

  pushImpact(engine, {
    x: target.x,
    y: target.y,
    color: color || '#ffdd00',
    towerType: 'Field',
    createdAt: now,
    scale: 1.5,
    effect: 'field',
  });
}
