/**
 * Tower Defense Game Engine V2 - Entity Classes
 *
 * Base Entity class and specialized entity types (Enemy, Tower, Projectile)
 */

import {
  ENEMY_TYPES,
  TOWER_TYPES,
  TARGETING_MODES,
  GAME_CONSTANTS,
  getTowerByType,
  getEnemyByType,
} from './constants.js';

// ============================================================================
// BASE ENTITY CLASS
// ============================================================================

let entityIdCounter = 0;

/**
 * Base class for all game entities
 */
export class Entity {
  constructor() {
    this.id = `entity-${++entityIdCounter}-${Date.now().toString(36)}`;
    this.isActive = true;
    this.createdAt = Date.now();
  }

  /**
   * Update the entity state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(_deltaTime) {
    // Override in subclasses
  }

  /**
   * Deactivate the entity
   */
  deactivate() {
    this.isActive = false;
  }
}

// ============================================================================
// ENEMY ENTITY
// ============================================================================

/**
 * Enemy entity that follows a path
 */
export class EnemyEntity extends Entity {
  /**
   * @param {string} type - Enemy type (basic, edge, complex, timeLimit, spaceComplex)
   * @param {number} wave - Current wave number (affects scaling)
   * @param {number} healthMultiplier - Health multiplier (for difficulty)
   * @param {number} speedMultiplier - Speed multiplier (for difficulty)
   */
  constructor(type = 'basic', wave = 1, healthMultiplier = 1, speedMultiplier = 1) {
    super();

    // Get base properties
    const props = getEnemyByType(type) || ENEMY_TYPES.BASIC;

    // Identification
    this.type = props.type;
    this.isBoss = healthMultiplier >= 2.5; // Mark as boss for special visuals
    this.wave = wave;

    // Health - scales with wave and multiplier
    this.maxHealth = Math.floor(props.health * healthMultiplier * (1 + (wave - 1) * 0.1));
    this.health = this.maxHealth;

    // Movement
    this.baseSpeed = props.speed;
    this.speed = props.speed * speedMultiplier;
    this.progress = 0; // 0 to 1 along the path
    this.prevProgress = 0; // For interpolation

    // Position (calculated from progress)
    this.x = 0;
    this.y = 0;

    // Combat
    this.reward = Math.floor(props.reward * (1 + (wave - 1) * 0.05));
    this.damage = props.damage;

    // Visuals
    this.size = props.size;
    this.color = props.color;
    this.shape = props.shape || 'circle';

    // Special behavior metadata
    this.special = props.special || null;
    this.hijackedTowerId = null;
    this.pathShortenTriggered = false;
    this.lastPulseTime = 0;

    // External modifiers (auras, debuffs)
    this.externalSpeedMultiplier = 1;
    this.damageTakenMultiplier = 1;

    // Status effects
    this.isSlowed = false;
    this.slowFactor = 1.0;
    this.slowEndTime = 0;

    this.isFrozen = false;
    this.freezeEndTime = 0;

    this.isKnockedback = false;
    this.knockbackEndTime = 0;

    // State tracking
    this.isHit = false;
    this.hitEndTime = 0;
    this.spawnTime = Date.now();
    this.defeatTime = 0;

    // Prevent double-counting
    this.creditsAwarded = false;
    this.reachedEndTriggered = false;
    this.countedAsDefeated = false;
  }

  /**
   * Update enemy position along path
   * @param {number} deltaTime - Time since last update in ms
   * @returns {string} - 'active', 'reached-end', or 'defeated'
   */
  update(deltaTime) {
    if (!this.isActive) {
      return 'defeated';
    }

    // Update status effects
    const now = Date.now();

    if (this.isSlowed && now >= this.slowEndTime) {
      this.isSlowed = false;
      this.slowFactor = 1.0;
    }

    if (this.isFrozen && now >= this.freezeEndTime) {
      this.isFrozen = false;
    }

    if (this.isKnockedback && now >= this.knockbackEndTime) {
      this.isKnockedback = false;
    }

    if (this.isHit && now >= this.hitEndTime) {
      this.isHit = false;
    }

    // Store previous progress for interpolation
    this.prevProgress = this.progress;

    // Calculate effective speed
    let effectiveSpeed = this.speed * (this.externalSpeedMultiplier || 1);
    if (this.hijackedTowerId) {
      effectiveSpeed = 0;
    } else if (this.isFrozen) {
      effectiveSpeed = 0;
    } else if (this.isSlowed) {
      effectiveSpeed = this.speed * this.slowFactor;
    }

    // Move along path (normalize to ~60fps)
    this.progress += effectiveSpeed * (deltaTime / 16.67);

    // Check if reached end
    if (this.progress >= 1) {
      this.isActive = false;
      return 'reached-end';
    }

    // Check if defeated
    if (this.health <= 0) {
      if (!this.defeatTime) {
        this.defeatTime = now;
      }
      this.isActive = false;
      return 'defeated';
    }

    return 'active';
  }

  /**
   * Take damage from a tower attack
   * @param {number} amount - Damage amount
   * @returns {boolean} - True if enemy was killed by this damage
   */
  takeDamage(amount) {
    if (!this.isActive || this.health <= 0) {
      return false;
    }

    const damageMultiplier = Number.isFinite(this.damageTakenMultiplier)
      ? this.damageTakenMultiplier
      : 1;
    const adjustedAmount = Math.max(0, amount * damageMultiplier);
    this.health = Math.max(0, this.health - adjustedAmount);
    this.isHit = true;
    this.hitEndTime = Date.now() + 300; // Hit effect lasts 300ms

    if (this.health <= 0) {
      this.isActive = false;
      this.defeatTime = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Apply slow effect
   * @param {number} factor - Speed multiplier (0.5 = half speed)
   * @param {number} duration - Duration in ms
   */
  applySlow(factor, duration) {
    if (this.special?.ignoreSlow) return;
    this.isSlowed = true;
    this.slowFactor = factor;
    this.slowEndTime = Date.now() + duration;
  }

  /**
   * Apply freeze effect
   * @param {number} duration - Duration in ms
   */
  applyFreeze(duration) {
    if (this.special?.ignoreFreeze) return;
    this.isFrozen = true;
    this.freezeEndTime = Date.now() + duration;
  }

  /**
   * Push enemy forward along the path
   * @param {number} amount - Progress to add (e.g., 0.02)
   */
  applyProgressBoost(amount) {
    this.progress = Math.min(0.99, this.progress + amount);
  }

  /**
   * Apply knockback effect
   * @param {number} amount - Progress to subtract (e.g., 0.1)
   */
  applyKnockback(amount) {
    this.progress = Math.max(0, this.progress - amount);
    this.isKnockedback = true;
    this.knockbackEndTime = Date.now() + 500;
  }

  /**
   * Get health percentage (0-1)
   */
  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  /**
   * Check if enemy can be targeted (past spawn protection)
   */
  canBeTargeted() {
    return (
      this.isActive &&
      this.health > 0 &&
      Date.now() - this.spawnTime >= GAME_CONSTANTS.SPAWN_PROTECTION_MS
    );
  }

  /**
   * Get serializable state for React
   */
  getState() {
    return {
      id: this.id,
      type: this.type,
      health: this.health,
      maxHealth: this.maxHealth,
      progress: this.progress,
      x: this.x,
      y: this.y,
      size: this.size,
      color: this.color,
      isActive: this.isActive,
      defeatTime: this.defeatTime,
      isBoss: this.isBoss,
      isHit: this.isHit,
      isSlowed: this.isSlowed,
      isFrozen: this.isFrozen,
      isKnockedback: this.isKnockedback,
      hijackedTowerId: this.hijackedTowerId,
    };
  }
}

// ============================================================================
// TOWER ENTITY
// ============================================================================

/**
 * Tower entity that attacks enemies
 */
export class TowerEntity extends Entity {
  /**
   * @param {string} type - Tower type (ForLoop, WhileLoop, etc.)
   * @param {{row: number, col: number}} position - Grid position
   */
  constructor(type, position) {
    super();

    // Get base properties
    const props = getTowerByType(type) || TOWER_TYPES.FOR_LOOP;

    // Identification
    this.type = props.type;
    this.position = { ...position };

    // Stats
    this.baseDamage = props.damage;
    this.baseRange = props.range;
    this.baseAttackSpeed = props.attackSpeed;
    this.cost = props.cost;

    // Upgrades
    this.upgradeLevel = 0; // 0, 1, or 2
    this.upgradeCosts = [...(props.upgradeCosts || [50, 80])];
    this.specialUpgradeLevel = 0;
    this.specialUpgradeCosts = [
      ...(props.specialUpgradeCosts ||
        (props.specialUpgrades ? props.specialUpgrades.map((upgrade) => upgrade.cost) : [])),
    ];

    // Combat
    this.lastAttackTime = 0;
    this.targeting = props.targeting || 'closest';

    // Debuffs
    this.isSlowed = false;
    this.slowFactor = 1;
    this.slowEndTime = 0;

    // Visuals
    this.color = props.color;
    this.description = props.description;
    this.conceptKey = props.conceptKey;

    // Disable state (for hijacker enemies)
    this.isDisabled = false;
    this.disabledByEnemyId = null;
  }

  /**
   * Update tower stats for a new type without changing position or ID.
   * @param {string} type - New tower type
   */
  applyType(type) {
    const props = getTowerByType(type) || TOWER_TYPES.FOR_LOOP;
    this.type = props.type;
    this.baseDamage = props.damage;
    this.baseRange = props.range;
    this.baseAttackSpeed = props.attackSpeed;
    this.cost = props.cost;
    this.upgradeCosts = [...(props.upgradeCosts || [50, 80])];
    this.specialUpgradeCosts = [
      ...(props.specialUpgradeCosts ||
        (props.specialUpgrades ? props.specialUpgrades.map((upgrade) => upgrade.cost) : [])),
    ];
    this.targeting = props.targeting || 'closest';
    this.color = props.color;
    this.description = props.description;
    this.conceptKey = props.conceptKey;

    if (this.upgradeLevel > 2) {
      this.upgradeLevel = 2;
    }
    if (this.specialUpgradeLevel > this.specialUpgradeCosts.length) {
      this.specialUpgradeLevel = this.specialUpgradeCosts.length;
    }
  }

  /**
   * Get current damage (with upgrades)
   */
  getDamage() {
    return this.baseDamage * (1 + GAME_CONSTANTS.DAMAGE_BONUS_PER_UPGRADE * this.upgradeLevel);
  }

  /**
   * Get current range (with upgrades)
   */
  getRange() {
    return this.baseRange + GAME_CONSTANTS.RANGE_BONUS_PER_UPGRADE * this.upgradeLevel;
  }

  get damage() {
    return this.getDamage();
  }

  get range() {
    return this.getRange();
  }

  get attackSpeed() {
    return this.baseAttackSpeed * (1 + GAME_CONSTANTS.SPEED_BONUS_PER_UPGRADE * this.upgradeLevel);
  }

  /**
   * Get attack cooldown in ms
   */
  getAttackCooldown(speedMultiplier = 1) {
    const speed =
      this.baseAttackSpeed *
      (1 + GAME_CONSTANTS.SPEED_BONUS_PER_UPGRADE * this.upgradeLevel) *
      speedMultiplier;
    return 1000 / speed;
  }

  /**
   * Check if tower can attack
   * @param {number} currentTime - Current timestamp
   */
  canAttack(currentTime, speedMultiplier = 1) {
    if (this.isDisabled) return false;

    if (this.isSlowed && currentTime >= this.slowEndTime) {
      this.isSlowed = false;
      this.slowFactor = 1;
      this.slowEndTime = 0;
    }

    const effectiveMultiplier = speedMultiplier * (this.slowFactor || 1);
    return currentTime - this.lastAttackTime >= this.getAttackCooldown(effectiveMultiplier);
  }

  /**
   * Apply a slow debuff to tower attack speed
   * @param {number} factor - Attack speed multiplier (0.6 = 40% slower)
   * @param {number} duration - Duration in ms
   */
  applySlowEffect(factor, duration) {
    this.isSlowed = true;
    this.slowFactor = Math.min(this.slowFactor || 1, factor);
    this.slowEndTime = Date.now() + duration;
  }

  /**
   * Record an attack
   * @param {number} currentTime - Current timestamp
   */
  recordAttack(currentTime) {
    this.lastAttackTime = currentTime;
  }

  /**
   * Check if tower can be upgraded
   */
  canUpgrade() {
    return this.upgradeLevel < 2;
  }

  /**
   * Check if tower can be special upgraded
   */
  canSpecialUpgrade() {
    return this.specialUpgradeLevel < this.specialUpgradeCosts.length;
  }

  /**
   * Get next upgrade cost (or null if max level)
   */
  getNextUpgradeCost() {
    if (!this.canUpgrade()) return null;
    return this.upgradeCosts[this.upgradeLevel];
  }

  /**
   * Get next special upgrade cost (or null if max)
   */
  getNextSpecialUpgradeCost() {
    if (!this.canSpecialUpgrade()) return null;
    return this.specialUpgradeCosts[this.specialUpgradeLevel];
  }

  /**
   * Upgrade the tower
   * @returns {boolean} Success
   */
  upgrade() {
    if (!this.canUpgrade()) return false;
    this.upgradeLevel++;
    return true;
  }

  /**
   * Upgrade the tower's special ability
   * @returns {boolean} Success
   */
  upgradeSpecial() {
    if (!this.canSpecialUpgrade()) return false;
    this.specialUpgradeLevel++;
    return true;
  }

  getTargetingOverride() {
    const towerConfig = getTowerByType(this.type) || TOWER_TYPES.FOR_LOOP;
    const specialEffects = towerConfig?.specialEffects || [];
    return (
      specialEffects.slice(0, this.specialUpgradeLevel).find((effect) => effect?.targeting)
        ?.targeting || null
    );
  }

  isTargetingLocked() {
    return this.getTargetingOverride() != null;
  }

  getEffectiveTargeting() {
    return this.getTargetingOverride() || this.targeting;
  }

  setTargeting(targeting) {
    if (!TARGETING_MODES.includes(targeting)) return false;
    if (this.isTargetingLocked()) return false;
    this.targeting = targeting;
    return true;
  }

  /**
   * Get sell value (60% of total investment)
   */
  getSellValue() {
    let totalCost = this.cost;
    for (let i = 0; i < this.upgradeLevel; i++) {
      totalCost += this.upgradeCosts[i];
    }
    for (let i = 0; i < this.specialUpgradeLevel; i++) {
      totalCost += this.specialUpgradeCosts[i];
    }
    return Math.floor(totalCost * GAME_CONSTANTS.SELL_REFUND_RATE);
  }

  /**
   * Calculate distance to a grid position
   * @param {number} row - Target row
   * @param {number} col - Target col
   */
  distanceTo(row, col) {
    const dr = this.position.row - row;
    const dc = this.position.col - col;
    return Math.sqrt(dr * dr + dc * dc);
  }

  /**
   * Check if a position is in range
   * @param {number} row - Target row
   * @param {number} col - Target col
   */
  isInRange(row, col) {
    return this.distanceTo(row, col) <= this.getRange();
  }

  /**
   * Get serializable state for React
   */
  getState() {
    const targetingOverride = this.getTargetingOverride();

    return {
      id: this.id,
      type: this.type,
      position: this.position,
      damage: this.getDamage(),
      range: this.getRange(),
      attackSpeed:
        this.baseAttackSpeed * (1 + GAME_CONSTANTS.SPEED_BONUS_PER_UPGRADE * this.upgradeLevel),
      lastAttackTime: this.lastAttackTime,
      upgradeLevel: this.upgradeLevel,
      specialUpgradeLevel: this.specialUpgradeLevel,
      targeting: this.targeting,
      effectiveTargeting: targetingOverride || this.targeting,
      targetingLocked: targetingOverride != null,
      targetingOverride,
      cost: this.cost,
      color: this.color,
      isDisabled: this.isDisabled,
      disabledByEnemyId: this.disabledByEnemyId,
      isSlowed: this.isSlowed,
      canUpgrade: this.canUpgrade(),
      nextUpgradeCost: this.getNextUpgradeCost(),
      canSpecialUpgrade: this.canSpecialUpgrade(),
      nextSpecialUpgradeCost: this.getNextSpecialUpgradeCost(),
      sellValue: this.getSellValue(),
    };
  }
}

// ============================================================================
// PROJECTILE ENTITY
// ============================================================================

/**
 * Projectile entity for visualizing attacks
 */
export class ProjectileEntity extends Entity {
  /**
   * @param {Object} config - Projectile configuration
   * @param {string} config.towerId - ID of tower that fired
   * @param {string} config.targetId - ID of target enemy
   * @param {string} config.towerType - Type of tower for styling
   * @param {{x: number, y: number}} config.startPos - Starting position
   * @param {{x: number, y: number}} config.targetPos - Target position
   * @param {number} config.damage - Damage to deal
   * @param {number} config.duration - Animation duration in ms
   */
  constructor(config) {
    super();

    this.towerId = config.towerId;
    this.targetId = config.targetId;
    this.towerType = config.towerType;
    this.damage = config.damage;

    // Positions
    this.startX = config.startPos.x;
    this.startY = config.startPos.y;
    this.targetX = config.targetPos.x;
    this.targetY = config.targetPos.y;

    // Current position
    this.x = this.startX;
    this.y = this.startY;

    // Animation
    this.duration = config.duration || 300;
    this.startDelayMs = config.startDelayMs || 0;
    this.startTime = Date.now() + this.startDelayMs;
    this.progress = 0; // 0 to 1

    // Curved path settings
    this.curveDirection = Math.random() < 0.5 ? -1 : 1;
    this.curveSeed = 0.9 + Math.random() * 0.8;

    // Trail points for curved path rendering
    this.trail = [{ x: this.startX, y: this.startY }];
    this.maxTrailPoints = 12;

    // Visuals based on tower type
    this.color = getTowerByType(config.towerType)?.color || '#FFFFFF';

    // Special effects
    this.effect = config.effect || null;
    this.isSecondaryTarget = config.isSecondaryTarget || false;
  }

  /**
   * Update projectile position
   * @param {number} deltaTime - Time since last update (not used, time-based animation)
   * @returns {boolean} True if animation complete
   */
  update(_deltaTime) {
    const now = Date.now();
    const elapsed = now - this.startTime;
    if (elapsed < 0) {
      return false;
    }
    this.progress = Math.min(1, elapsed / this.duration);

    const easeOutQuad = (t) => t * (2 - t);
    const t = easeOutQuad(this.progress);

    // Curved interpolation (quadratic bezier)
    const dx = this.targetX - this.startX;
    const dy = this.targetY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;

    const baseCurve = Math.min(140, Math.max(28, distance * 0.35));
    const curveMagnitude = baseCurve * this.curveDirection * this.curveSeed;

    const controlX = (this.startX + this.targetX) / 2 + normalX * curveMagnitude;
    const controlY = (this.startY + this.targetY) / 2 + normalY * curveMagnitude;

    const oneMinusT = 1 - t;
    this.x =
      oneMinusT * oneMinusT * this.startX + 2 * oneMinusT * t * controlX + t * t * this.targetX;
    this.y =
      oneMinusT * oneMinusT * this.startY + 2 * oneMinusT * t * controlY + t * t * this.targetY;

    // Update trail
    if (this.trail) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailPoints) {
        this.trail.shift();
      }
    }

    if (this.progress >= 1) {
      this.isActive = false;
      return true; // Animation complete
    }

    return false;
  }

  /**
   * Get serializable state for React/rendering
   */
  getState() {
    return {
      id: this.id,
      targetId: this.targetId,
      x: this.x,
      y: this.y,
      startX: this.startX,
      startY: this.startY,
      targetX: this.targetX,
      targetY: this.targetY,
      progress: this.progress,
      trail: this.trail,
      curveDirection: this.curveDirection,
      curveSeed: this.curveSeed,
      color: this.color,
      towerType: this.towerType,
      effect: this.effect,
      isActive: this.isActive,
      isSecondaryTarget: this.isSecondaryTarget,
    };
  }
}
