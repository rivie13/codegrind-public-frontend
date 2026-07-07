/**
 * Tower Defense Game Engine V2 - Deployable Entity
 */

import { DEPLOYABLE_TYPES, getDeployableByType } from './constants.js';
import { Entity } from './entities.js';

export class DeployableEntity extends Entity {
  /**
   * @param {string} type - Deployable type
   * @param {{row: number, col: number}} position - Grid position
   */
  constructor(type, position) {
    super();

    const config = getDeployableByType(type) || DEPLOYABLE_TYPES.DATA_MINE;

    this.type = config.type;
    this.key = config.key;
    this.position = { ...position };
    this.cost = config.cost;
    this.placementType = config.placementType;

    this.damage = config.damage || 0;
    this.percentDamage = config.percentDamage || 0;
    this.radius = config.radius || 1;
    this.duration = config.duration || 0;
    this.effect = config.effect;
    this.trigger = config.trigger || 'burst';
    this.slowFactor = config.slowFactor || 0.5;
    this.executeThreshold = config.executeThreshold || 0.3;

    this.remainingUses = config.uses ?? 1;
    this.isTriggered = false;
    this.triggeredAt = null;
    this.activeUntil = null;

    this.affectedEnemies = new Set();

    this.color = config.color;
    this.glowColor = config.glowColor;
    this.icon = config.icon;
    this.description = config.description;
  }

  getCenter(cellSize) {
    return {
      x: (this.position.col + 0.5) * cellSize,
      y: (this.position.row + 0.5) * cellSize
    };
  }

  isInRange(enemy, cellSize) {
    if (!enemy || !enemy.isActive) return false;
    const center = this.getCenter(cellSize);
    const dx = enemy.x - center.x;
    const dy = enemy.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.radius * cellSize;
  }

  canAffectEnemy(enemy) {
    return enemy?.id && !this.affectedEnemies.has(enemy.id);
  }

  markAffected(enemy) {
    if (enemy?.id) {
      this.affectedEnemies.add(enemy.id);
    }
  }

  activate(now) {
    if (this.isTriggered) return;
    this.isTriggered = true;
    this.triggeredAt = now;
    if (this.duration > 0) {
      this.activeUntil = now + this.duration;
    }
  }

  isActiveWindow(now) {
    if (!this.isTriggered) return false;
    if (!this.activeUntil) return false;
    return now <= this.activeUntil;
  }

  consumeUse() {
    if (this.remainingUses > 0) {
      this.remainingUses -= 1;
    }
  }

  isExpired(now) {
    if (this.trigger === 'area') {
      if (!this.isTriggered) return false;
      if (!this.activeUntil) return true;
      return now > this.activeUntil;
    }

    return this.remainingUses <= 0;
  }

  getState() {
    return {
      id: this.id,
      type: this.type,
      key: this.key,
      position: this.position,
      radius: this.radius,
      effect: this.effect,
      trigger: this.trigger,
      color: this.color,
      glowColor: this.glowColor,
      icon: this.icon,
      isTriggered: this.isTriggered,
      activeUntil: this.activeUntil
    };
  }
}

export default DeployableEntity;
