import { TOWER_TYPES } from '../data/towerTypes';

// Tower logic component for game mechanics
export class TowerEntity {
  constructor(type, position) {
    const towerType = type.toUpperCase().replace(/\s+/g, '_');
    // First try to find exact match, then try case-insensitive match
    let towerProperties = TOWER_TYPES[towerType];

    if (!towerProperties) {
      // Try to find by type property
      towerProperties = Object.values(TOWER_TYPES).find(t => 
        t.type === type || t.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Fallback to default if still not found
    towerProperties = towerProperties || TOWER_TYPES.FOR_LOOP;

    this.id = Math.random().toString(36).substr(2, 9);
    this.type = towerProperties.type; // Use the correct type from properties
    this.level = 1;
    this.position = position;
    this.damage = towerProperties.damage;
    this.range = towerProperties.range;
    this.attackSpeed = towerProperties.attackSpeed;
    this.aoeRadius = towerProperties.aoeRadius || 0;
    this.aoeDamageMultiplier = towerProperties.aoeDamageMultiplier || 0;
    this.lastAttackTime = 0;
    this.target = null;
    this.cost = towerProperties.cost;
    this.upgradeLevel = 0;
    this.upgrades = [...(towerProperties.upgrades || towerProperties.specialUpgrades || [])];
    this.upgradeCosts = towerProperties.upgradeCosts ? [...towerProperties.upgradeCosts] : [50, 80]; // Use tower-specific upgrade costs or default

    // Log tower creation for debugging
    // console.log(`Created ${this.type} tower with damage=${this.damage}, speed=${this.attackSpeed}, range=${this.range}`);
  }

  // Get the current damage value including level bonuses
  getDamage() {
    // Apply level bonus and any other modifiers
    return this.damage * (1 + (this.level - 1) * 0.12);
  }

  // Check if the tower can attack based on its attack speed
  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= 1000 / this.attackSpeed;
  }

  // Check if an enemy is in range
  isInRange(enemy, pathNodes) {
    const enemyNodeIndex = Math.floor(enemy.progress * pathNodes.length);

    if (enemyNodeIndex >= pathNodes.length) {
      return false;
    }

    const [enemyRow, enemyCol] = pathNodes[enemyNodeIndex];
    const rowDiff = Math.abs(enemyRow - this.position.row);
    const colDiff = Math.abs(enemyCol - this.position.col);

    // Calculate Manhattan distance
    return rowDiff + colDiff <= this.range;
  }

  // Find a target enemy
  findTarget(enemies, pathNodes) {
    // Find enemies in range
    const enemiesInRange = enemies.filter(enemy => 
      this.isInRange(enemy, pathNodes) && enemy.health > 0
    );

    if (enemiesInRange.length === 0) {
      return null;
    }

    // Different targeting strategies based on tower type
    switch (this.type) {
      case 'ForLoop':
        // Target enemies in sequence (first in path)
        return enemiesInRange.sort((a, b) => b.progress - a.progress)[0];

      case 'WhileLoop':
        // Target the enemy with the lowest health
        return enemiesInRange.sort((a, b) => a.health - b.health)[0];

      case 'IfCondition':
        // Target specific enemy types if available, otherwise first in range
        const priorityEnemy = enemiesInRange.find(e => e.type === 'edge');
        return priorityEnemy || enemiesInRange[0];

      case 'Function':
        // Target enemy with highest health
        return enemiesInRange.sort((a, b) => b.health - a.health)[0];

      case 'Array':
        // Target multiple enemies if possible
        return enemiesInRange[0]; // Default behavior, multi-target handled in attack method

      case 'Object':
        // Target area with most enemies
        return enemiesInRange[0]; // Default behavior, area effect handled in attack method

      case 'Return':
        // Target enemy furthest along the path
        return enemiesInRange.sort((a, b) => b.progress - a.progress)[0];

      case 'TryCatch':
        // Target enemy with highest health to trap it
        return enemiesInRange.sort((a, b) => b.health - a.health)[0];

      case 'Switch':
        // Target based on enemy type
        // Prioritize edge cases, then complex, then regular enemies
        const edgeEnemy = enemiesInRange.find(e => e.type === 'edge');
        const complexEnemy = enemiesInRange.find(e => e.type === 'complex');
        return edgeEnemy || complexEnemy || enemiesInRange[0];

      default:
        // Default to first enemy in path
        return enemiesInRange[0];
    }
  }

  // Attack the current target
  attack(currentTime, enemies, pathNodes) {
    if (!this.canAttack(currentTime)) {
      return { didAttack: false, targetId: null, damage: 0 };
    }

    // Find a target if we don't have one or the current one is dead
    if (!this.target || this.target.health <= 0 || !this.isInRange(this.target, pathNodes)) {
      this.target = this.findTarget(enemies, pathNodes);
    }

    if (!this.target) {
      return { didAttack: false, targetId: null, damage: 0 };
    }

    // Apply damage based on tower type and level
    let actualDamage = this.getDamage();

    // Special effects based on tower type
    switch (this.type) {
      case 'ForLoop':
        // ForLoop can hit multiple enemies in sequence if upgraded
        if (this.upgradeLevel >= 2) {
          const targets = enemies
            .filter(enemy => this.isInRange(enemy, pathNodes) && enemy.health > 0)
            .slice(0, this.upgradeLevel + 1); // Hit more targets with higher upgrade

          targets.forEach(target => {
            target.health -= actualDamage;
          });

          this.lastAttackTime = currentTime;
          return { 
            didAttack: true, 
            targetIds: targets.map(t => t.id), 
            damage: actualDamage 
          };
        }
        break;

      case 'WhileLoop':
        // WhileLoop attacks faster with each upgrade
        actualDamage = this.damage * (1 + (this.level - 1) * 0.1);
        break;

      case 'IfCondition':
        // IfCondition does more damage to specific enemy types
        if (this.target.type === 'edge') {
          actualDamage *= 1.5;
        }
        break;

      case 'Variable':
        // Variable doesn't attack directly but buffs nearby towers
        return { didAttack: false, targetId: null, damage: 0 };

      case 'Function':
        // Function does high damage but attacks slowly
        actualDamage *= 2;
        break;

      case 'Array':
        // Array can hit multiple enemies in an area
        if (this.upgradeLevel >= 1) {
          // Get enemies in same general area
          const targetsInArea = enemies
            .filter(enemy => this.isInRange(enemy, pathNodes) && enemy.health > 0)
            .slice(0, 3 + this.upgradeLevel); // Number of targets increases with upgrades

          targetsInArea.forEach(target => {
            target.health -= actualDamage * 0.7; // Reduced damage for multi-target
          });

          this.lastAttackTime = currentTime;
          return {
            didAttack: true,
            targetIds: targetsInArea.map(t => t.id),
            damage: actualDamage * 0.7
          };
        }
        break;

      case 'Object':
        // Object creates damage field that persists
        // Base implementation just does damage - field effect would need more game state changes
        actualDamage *= 1.2;
        break;

      case 'Return':
        // Return does high single-target damage with knockback effect
        actualDamage *= 2.5;
        // Knockback effect would need more game state changes
        break;

      case 'TryCatch':
        // TryCatch traps enemy and does damage over time
        // Apply a slow/debuff effect - would need more game state changes
        actualDamage *= 0.8; // Lower initial damage but applies effect
        break;

      case 'Switch':
        // Switch changes attack based on enemy type
        if (this.target.type === 'edge') {
          actualDamage *= 1.8;
        } else if (this.target.type === 'complex') {
          actualDamage *= 1.5;
        } else {
          actualDamage *= 1.2;
        }
        break;
      case 'BlastTurret': {
        // Apply splash damage around the target
        if (this.aoeRadius > 0) {
          const targetsInSplash = enemies.filter(enemy => {
            if (enemy.health <= 0) return false;
            const enemyNodeIndex = Math.floor(enemy.progress * pathNodes.length);
            const targetNodeIndex = Math.floor(this.target.progress * pathNodes.length);
            if (enemyNodeIndex >= pathNodes.length || targetNodeIndex >= pathNodes.length) return false;
            const [enemyRow, enemyCol] = pathNodes[enemyNodeIndex];
            const [targetRow, targetCol] = pathNodes[targetNodeIndex];
            const rowDiff = Math.abs(enemyRow - targetRow);
            const colDiff = Math.abs(enemyCol - targetCol);
            return rowDiff + colDiff <= this.aoeRadius;
          });

          targetsInSplash.forEach(target => {
            const splashDamage = actualDamage * (this.aoeDamageMultiplier || 0.6);
            target.health -= splashDamage;
          });

          this.lastAttackTime = currentTime;
          return {
            didAttack: true,
            targetIds: targetsInSplash.map(t => t.id),
            damage: actualDamage * (this.aoeDamageMultiplier || 0.6)
          };
        }
        break;
      }
      case 'BurstTurret': {
        const burstRounds = 3;
        const burstDamage = actualDamage * 0.4;
        for (let i = 0; i < burstRounds; i++) {
          if (this.target.health <= 0) break;
          this.target.health -= burstDamage;
        }
        this.lastAttackTime = currentTime;
        return {
          didAttack: true,
          targetId: this.target.id,
          damage: burstDamage
        };
      }
    }

    // Apply the damage to the target
    this.target.health -= actualDamage;

    // Update last attack time
    this.lastAttackTime = currentTime;

    return {
      didAttack: true,
      targetId: this.target.id,
      damage: actualDamage
    };
  }

  // Upgrade the tower
  upgrade() {
    if (this.level < 3) {
      this.level++;
      this.damage = this.damage * 1.1;
      this.range = this.range + 0.25;
      this.attackSpeed = this.attackSpeed * 1.05;
      return true;
    }
    return false;
  }

  // Apply a specific upgrade
  applyUpgrade(upgradeIndex) {
    if (upgradeIndex < this.upgrades.length && this.upgradeLevel < this.upgrades.length) {
      const upgrade = this.upgrades[upgradeIndex];

      // Apply upgrade effects
      switch (upgrade.name) {
        case 'Faster Iteration':
          this.attackSpeed *= 1.25;
          break;
        case 'Extended Range':
          this.range += 1;
          break;
        case 'Nested Loop':
          // Special ability already handled in attack method
          break;
        case 'Condition Enhancement':
          this.damage *= 1.5;
          break;
        case 'Break Statement':
          // Special ability already handled in attack method
          break;
        case 'Additional Branch':
          // Special ability already handled in attack method
          break;
        case 'Switch Statement':
          // Special ability already handled in attack method
          break;
        case 'Type Specialization':
          // Special ability already handled in attack method
          break;
        case 'Constant Declaration':
          // Special ability for buffing other towers
          break;
        case 'Parameter Expansion':
          this.range += 1;
          this.damage *= 1.2;
          break;
        case 'Recursive Function':
          // Special ability already handled in attack method
          break;
        case 'Sorting Attack':
          // Special ability handled in attack method
          break;
        case 'Mapping Attack':
          this.damage *= 0.9; // Slightly reduced base damage
          // Multi-target effect handled in attack method
          break;
        case 'Filter Attack':
          this.damage *= 1.3; // Increased damage since it ignores some enemies
          break;
        case 'Inheritance Boost':
          this.range += 0.5;
          this.damage *= 1.2;
          break;
        case 'Polymorphic Attack':
          // Different effects handled in attack method
          break;
        case 'Encapsulation Shield':
          // Shield effect would need more game state changes
          break;
        case 'Early Return':
          this.damage *= 1.5;
          // Instant defeat chance would need additional logic
          break;
        case 'Multiple Returns':
          // Multi-target handled in attack method
          break;
        case 'Error Handling':
          this.damage *= 1.3;
          break;
        case 'Finally Block':
          // Final burst damage would need more game state changes
          break;
        case 'Multiple Cases':
          this.range += 0.5;
          // Multi-target capability handled in attack method
          break;
        case 'Default Case':
          this.damage *= 1.2;
          break;
      }

      this.upgradeLevel++;
      return true;
    }
    return false;
  }

  // Get the current upgrade options
  getAvailableUpgrades() {
    return this.upgrades.slice(this.upgradeLevel);
  }

  // Get the next upgrade cost
  getNextUpgradeCost() {
    // For level upgrades (1→2, 2→3), use the upgradeCosts array
    if (this.level < 3) {
      return this.upgradeCosts[this.level - 1];
    }

    // For special upgrades, return from the upgrades array if available
    return this.upgradeLevel < this.upgrades.length 
      ? this.upgrades[this.upgradeLevel].cost 
      : null;
  }
}
