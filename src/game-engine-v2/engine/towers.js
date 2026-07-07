import { getTowerByType } from '../constants.js';
import { ProjectileEntity } from '../entities.js';

function sortTargetsByMode(targeting, left, right) {
  switch (targeting) {
    case 'furthest':
      return right.enemy.progress - left.enemy.progress;
    case 'lowest-health':
      return left.enemy.health - right.enemy.health;
    case 'highest-health':
      return right.enemy.health - left.enemy.health;
    case 'closest':
    default:
      return left.distance - right.distance;
  }
}

function selectPrimaryTarget(targets, claimedTargetIds) {
  if (!targets.length) return null;
  return targets.find((target) => !claimedTargetIds.has(target.id)) || targets[0];
}

export function resolveTowerTargeting(tower, effects = {}) {
  if (effects.targeting) {
    return {
      mode: effects.targeting,
      locked: true,
      source: 'special-upgrade',
    };
  }

  if (effects.multiTarget?.mode === 'pierce') {
    return {
      mode: 'furthest',
      locked: false,
      source: 'multi-target',
    };
  }

  return {
    mode: tower.targeting,
    locked: false,
    source: 'tower',
  };
}

export function getActiveUpgradeEffects(engine, tower) {
  const towerConfig = getTowerByType(tower.type);
  const passiveEffects = towerConfig?.passiveEffects || towerConfig?.baseEffects || [];
  const effects = towerConfig?.specialEffects || [];
  const activeSpecial =
    tower.specialUpgradeLevel > 0
      ? effects.slice(0, Math.min(tower.specialUpgradeLevel, effects.length))
      : [];
  return [...passiveEffects, ...activeSpecial];
}

export function getAggregatedTowerEffects(engine, tower) {
  const effects = engine.getActiveUpgradeEffects(tower);
  const aggregated = {
    extraTargets: 0,
    multiTarget: null,
    damageMultiplier: 1,
    rangeBonus: 0,
    targeting: null,
    execute: null,
    splash: null,
    slow: null,
    field: null,
    delayedDamage: null,
    typeDamageBonus: {},
  };

  for (const effect of effects) {
    if (!effect) continue;

    if (Number.isFinite(effect.extraTargets)) {
      aggregated.extraTargets = Math.max(aggregated.extraTargets, effect.extraTargets);
    }

    if (effect.multiTarget) {
      const extraTargets = effect.multiTarget.extraTargets || effect.extraTargets || 0;
      if (extraTargets > 0) {
        aggregated.extraTargets = Math.max(aggregated.extraTargets, extraTargets);
        aggregated.multiTarget = {
          mode: effect.multiTarget.mode || aggregated.multiTarget?.mode || 'burst',
          extraTargets,
          secondaryDamageMultiplier:
            effect.multiTarget.secondaryDamageMultiplier ??
            aggregated.multiTarget?.secondaryDamageMultiplier ??
            1,
          primaryDamageMultiplier:
            effect.multiTarget.primaryDamageMultiplier ??
            aggregated.multiTarget?.primaryDamageMultiplier ??
            1,
          delayMs: effect.multiTarget.delayMs ?? aggregated.multiTarget?.delayMs ?? 0,
        };
      }
    }

    if (Number.isFinite(effect.damageMultiplier)) {
      aggregated.damageMultiplier *= 1 + effect.damageMultiplier;
    }

    if (Number.isFinite(effect.rangeBonus)) {
      aggregated.rangeBonus += effect.rangeBonus;
    }

    if (effect.targeting) {
      aggregated.targeting = effect.targeting;
    }

    if (effect.execute) {
      aggregated.execute = effect.execute;
    }

    if (effect.splash) {
      aggregated.splash = effect.splash;
    }

    if (effect.slow) {
      aggregated.slow = effect.slow;
    }

    if (effect.field) {
      aggregated.field = effect.field;
    }

    if (effect.delayedDamage) {
      aggregated.delayedDamage = effect.delayedDamage;
    }

    if (effect.typeDamageBonus) {
      Object.entries(effect.typeDamageBonus).forEach(([type, bonus]) => {
        if (!Number.isFinite(bonus)) return;
        const existing = aggregated.typeDamageBonus[type] || 0;
        aggregated.typeDamageBonus[type] = Math.max(existing, bonus);
      });
    }
  }

  return aggregated;
}

export function getAuraBonusForTower(engine, tower) {
  let damageMultiplier = 0;
  let speedMultiplier = 0;

  for (const source of engine.towers) {
    if (source.id === tower.id) continue;
    if (source.type !== 'Variable' || source.specialUpgradeLevel < 2) continue;

    const sourceEffects = engine.getActiveUpgradeEffects(source);
    const aura = sourceEffects.find((effect) => effect?.aura)?.aura;
    if (!aura) continue;

    const dr = tower.position.row - source.position.row;
    const dc = tower.position.col - source.position.col;
    const distance = Math.sqrt(dr * dr + dc * dc);
    if (distance > aura.radius) continue;

    if (Number.isFinite(aura.damageMultiplier)) {
      damageMultiplier = Math.max(damageMultiplier, aura.damageMultiplier);
    }
    if (Number.isFinite(aura.speedMultiplier)) {
      speedMultiplier = Math.max(speedMultiplier, aura.speedMultiplier);
    }
  }

  return { damageMultiplier, speedMultiplier };
}

export function getTargetsInRange(engine, tower, options = {}) {
  const { targeting = tower.targeting, rangeBonus = 0, minHealthPercent = null } = options;

  if (!engine.pathNodes || engine.pathNodes.length === 0) {
    console.warn('[GameEngine] getTargetsInRange: No path nodes defined');
    return [];
  }

  const targetsInRange = [];
  const effectiveRange = tower.getRange() + rangeBonus;
  const towerX = (tower.position.col + 0.5) * engine.cellSize;
  const towerY = (tower.position.row + 0.5) * engine.cellSize;
  const effectiveRangePx = effectiveRange * engine.cellSize;

  for (const enemy of engine.enemies) {
    if (!enemy.canBeTargeted()) continue;
    if (minHealthPercent != null && enemy.health / enemy.maxHealth < minHealthPercent) continue;

    let distance = null;

    if (Number.isFinite(enemy.x) && Number.isFinite(enemy.y)) {
      const dx = enemy.x - towerX;
      const dy = enemy.y - towerY;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      if (distPx > effectiveRangePx) continue;
      distance = distPx / engine.cellSize;
    } else {
      const pathIndex = Math.floor(enemy.progress * (engine.pathNodes.length - 1));
      if (pathIndex < 0 || pathIndex >= engine.pathNodes.length) continue;

      const [enemyRow, enemyCol] = engine.pathNodes[pathIndex];
      distance = tower.distanceTo(enemyRow, enemyCol);
      if (distance > effectiveRange) continue;
    }

    targetsInRange.push({ enemy, distance });
  }

  if (targetsInRange.length === 0) return [];

  targetsInRange.sort((left, right) => sortTargetsByMode(targeting, left, right));

  return targetsInRange.map((target) => target.enemy);
}

function getChainTargets(engine, tower, primaryTarget, candidates, count, rangeBonus) {
  const chainTargets = [];
  if (!primaryTarget || count <= 0) return chainTargets;

  const maxRangePx = (tower.getRange() + rangeBonus) * engine.cellSize;
  let lastTarget = primaryTarget;
  const remaining = [...candidates];

  for (let i = 0; i < count; i++) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const candidate of remaining) {
      if (!candidate.isActive) continue;
      const dx = candidate.x - lastTarget.x;
      const dy = candidate.y - lastTarget.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRangePx) continue;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = candidate;
      }
    }

    if (!nearest) break;
    chainTargets.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    lastTarget = nearest;
  }

  return chainTargets;
}

export function updateTowers(engine, currentTime) {
  engine.pendingAttacks = engine.pendingAttacks.filter(
    (attack) => currentTime - attack.timestamp < 3000
  );

  const claimedTargetIds = new Set();

  for (const tower of engine.towers) {
    const effects = engine.getAggregatedTowerEffects(tower);
    const auraBonus = engine.getAuraBonusForTower(tower);
    const speedMultiplier = 1 + auraBonus.speedMultiplier;

    if (!tower.canAttack(currentTime, speedMultiplier)) continue;

    const targetingState = resolveTowerTargeting(tower, effects);
    const targets = engine.getTargetsInRange(tower, {
      targeting: targetingState.mode,
      rangeBonus: effects.rangeBonus,
    });
    if (!targets.length) continue;

    const primaryTarget = selectPrimaryTarget(targets, claimedTargetIds);
    if (!primaryTarget) continue;

    const remainingTargets = targets.filter((target) => target.id !== primaryTarget.id);

    const extraTargets =
      effects.extraTargets > 0 ? remainingTargets.slice(0, effects.extraTargets) : [];
    const chainTargets =
      effects.multiTarget?.mode === 'chain'
        ? getChainTargets(
            engine,
            tower,
            primaryTarget,
            remainingTargets,
            effects.extraTargets,
            effects.rangeBonus
          )
        : null;
    const attackTargets = [primaryTarget, ...(chainTargets ?? extraTargets)];
    attackTargets.forEach((target) => claimedTargetIds.add(target.id));

    const projectileEffect = {
      hasExecute: Boolean(effects.execute),
      hasSlow: Boolean(effects.slow),
      hasSplash: Boolean(effects.splash),
      hasField: Boolean(effects.field),
      hasDelayedDamage: Boolean(effects.delayedDamage),
      hasAuraBoost: Number.isFinite(auraBonus.damageMultiplier) && auraBonus.damageMultiplier > 0,
      auraDamageBonusPct: Math.max(0, Math.round((auraBonus.damageMultiplier || 0) * 100)),
      hasBeamPierce: tower.type === 'WhileLoop' && tower.specialUpgradeLevel >= 1,
      hasArcDischarge: tower.type === 'WhileLoop' && tower.specialUpgradeLevel >= 2,
    };

    const damage = tower.getDamage() * effects.damageMultiplier * (1 + auraBonus.damageMultiplier);
    const multiTarget = effects.multiTarget;
    const primaryMultiplier = multiTarget?.primaryDamageMultiplier ?? 1;
    const secondaryMultiplier = multiTarget?.secondaryDamageMultiplier ?? 1;
    const impactDelayMs = multiTarget?.delayMs ?? 0;
    tower.recordAttack(currentTime);

    const towerX = (tower.position.col + 0.5) * engine.cellSize;
    const towerY = (tower.position.row + 0.5) * engine.cellSize;

    const towerConfig = getTowerByType(tower.type);
    const burstRounds = towerConfig?.burstRounds ?? 0;
    const burstDelayMs = towerConfig?.burstDelayMs ?? 0;
    const burstDamageMultiplier = towerConfig?.burstDamageMultiplier ?? 1;

    if (burstRounds > 1) {
      for (let i = 0; i < burstRounds; i++) {
        const scheduledDelay = burstDelayMs * i;
        const finalDamage = Math.max(1, damage * burstDamageMultiplier);
        const attackInfo = {
          towerId: tower.id,
          targetId: primaryTarget.id,
          damage: finalDamage,
          timestamp: currentTime,
          towerType: tower.type,
          effects: effects,
          auraDamageBonusPct: projectileEffect.auraDamageBonusPct,
          isSecondaryTarget: i > 0,
          impactDelayMs: scheduledDelay,
          multiTargetMode: 'burst',
        };

        engine.pendingAttacks.push(attackInfo);

        if (engine.projectiles.length < engine.animationBudget.maxProjectiles) {
          const baseCooldown = tower.getAttackCooldown(1 + auraBonus.speedMultiplier);
          const beamDuration = Math.max(140, baseCooldown * 0.35);
          const projectile = new ProjectileEntity({
            towerId: tower.id,
            targetId: primaryTarget.id,
            towerType: tower.type,
            startPos: { x: towerX, y: towerY },
            targetPos: { x: primaryTarget.x, y: primaryTarget.y },
            damage: finalDamage,
            duration: beamDuration + (scheduledDelay > 0 ? 80 : 0),
            isSecondaryTarget: i > 0,
            effect: projectileEffect,
          });

          engine.projectiles.push(projectile);
        }

        if (i === 0) {
          engine.emit('tower-attack', {
            tower: tower.getState(),
            target: primaryTarget.getState(),
            damage: damage,
          });
        }
      }

      continue;
    }

    attackTargets.forEach((target, index) => {
      const isSecondary = index > 0;
      const damageMultiplier = isSecondary ? secondaryMultiplier : primaryMultiplier;
      const finalDamage = Math.max(1, damage * damageMultiplier);
      const isWhileLoop = tower.type === 'WhileLoop';
      const scheduledDelay =
        multiTarget?.mode === 'sequence' && impactDelayMs > 0
          ? impactDelayMs * index
          : isSecondary && impactDelayMs > 0
            ? impactDelayMs
            : 0;
      const chainStart =
        isSecondary && multiTarget?.mode === 'chain' ? attackTargets[index - 1] : null;
      const startPos = chainStart ? { x: chainStart.x, y: chainStart.y } : { x: towerX, y: towerY };
      const attackInfo = {
        towerId: tower.id,
        targetId: target.id,
        damage: finalDamage,
        timestamp: currentTime,
        towerType: tower.type,
        effects: effects,
        auraDamageBonusPct: projectileEffect.auraDamageBonusPct,
        isSecondaryTarget: isSecondary,
        impactDelayMs: scheduledDelay,
        multiTargetMode: multiTarget?.mode || null,
      };

      // WhileLoop feels like a true beam by applying part of the damage as soon as the beam connects,
      // then resolving the remaining portion when the beam animation completes.
      if (isWhileLoop && scheduledDelay === 0) {
        const immediateDamage = Math.max(1, finalDamage * 0.5);
        const trailingDamage = Math.max(1, finalDamage - immediateDamage);

        engine.pendingAttacks.push({
          ...attackInfo,
          damage: immediateDamage,
          impactDelayMs: 0,
        });
        engine.applyPendingDamage(target.id, tower.id);
        attackInfo.damage = trailingDamage;
      }

      engine.pendingAttacks.push(attackInfo);

      let spawnedProjectile = false;
      if (
        multiTarget?.mode === 'chain' &&
        engine.projectiles.length >= engine.animationBudget.maxProjectiles
      ) {
        engine.projectiles.shift();
      }

      if (engine.projectiles.length < engine.animationBudget.maxProjectiles) {
        const baseCooldown = tower.getAttackCooldown(1 + auraBonus.speedMultiplier);
        const beamDuration = isWhileLoop ? Math.max(220, baseCooldown * 0.85) : 300;
        const projectile = new ProjectileEntity({
          towerId: tower.id,
          targetId: target.id,
          towerType: tower.type,
          startPos,
          targetPos: { x: target.x, y: target.y },
          damage: finalDamage,
          duration: beamDuration + (scheduledDelay > 0 ? 120 : 0),
          isSecondaryTarget: isSecondary,
          effect: projectileEffect,
        });

        engine.projectiles.push(projectile);
        spawnedProjectile = true;
      }

      if (!spawnedProjectile) {
        engine.applyPendingDamage(target.id, tower.id);
      }

      if (index === 0) {
        engine.emit('tower-attack', {
          tower: tower.getState(),
          target: target.getState(),
          damage: damage,
        });
      }
    });
  }
}

export function findTargetForTower(engine, tower, options = {}) {
  const targetingState = options.targeting
    ? { mode: options.targeting }
    : resolveTowerTargeting(tower, options.effects || {});
  const targets = engine.getTargetsInRange(tower, {
    ...options,
    targeting: targetingState.mode,
  });
  return targets.length > 0 ? targets[0] : null;
}
