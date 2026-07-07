import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONSTANTS } from './constants';
import { EnemyEntity, Entity, ProjectileEntity, TowerEntity } from './entities';

describe('game-engine-v2 entities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates/deactivates base entities', () => {
    const entity = new Entity();
    expect(entity.isActive).toBe(true);
    entity.deactivate();
    expect(entity.isActive).toBe(false);
  });

  it('updates enemy state, status effects, and damage flow', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const enemy = new EnemyEntity('basic', 3, 1.2, 1.1);

    expect(enemy.maxHealth).toBeGreaterThan(0);
    expect(enemy.reward).toBeGreaterThan(0);

    enemy.applySlow(0.5, 200);
    enemy.applyFreeze(200);
    enemy.applyKnockback(0.1);
    enemy.applyProgressBoost(0.2);
    expect(enemy.progress).toBeLessThanOrEqual(0.99);

    enemy.slowEndTime = Date.now() - 1;
    enemy.freezeEndTime = Date.now() - 1;
    enemy.knockbackEndTime = Date.now() - 1;
    enemy.hitEndTime = Date.now() - 1;
    enemy.isHit = true;

    const result = enemy.update(16.67);
    expect(result).toBe('active');
    expect(enemy.isSlowed).toBe(false);
    expect(enemy.isFrozen).toBe(false);
    expect(enemy.isKnockedback).toBe(false);
    expect(enemy.isHit).toBe(false);

    const killed = enemy.takeDamage(enemy.health + 1);
    expect(killed).toBe(true);
    expect(enemy.isActive).toBe(false);
  });

  it('honors untargetable window and completion transitions', () => {
    const enemy = new EnemyEntity('timeLimit', 1, 1, 1);
    enemy.spawnTime = Date.now();
    expect(enemy.canBeTargeted()).toBe(false);

    enemy.spawnTime = Date.now() - GAME_CONSTANTS.SPAWN_PROTECTION_MS - 10;
    expect(enemy.canBeTargeted()).toBe(true);

    enemy.progress = 0.999;
    expect(enemy.update(16.67)).toBe('reached-end');
  });

  it('manages tower upgrades, cooldowns, and sale value', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
    const tower = new TowerEntity('ForLoop', { row: 1, col: 2 });

    expect(tower.canUpgrade()).toBe(true);
    expect(tower.upgrade()).toBe(true);
    expect(tower.upgrade()).toBe(true);
    expect(tower.canUpgrade()).toBe(false);

    expect(tower.canSpecialUpgrade()).toBe(true);
    tower.upgradeSpecial();
    expect(tower.specialUpgradeLevel).toBe(1);

    tower.recordAttack(2_000_000);
    expect(tower.canAttack(2_000_001)).toBe(false);
    expect(tower.canAttack(2_010_000)).toBe(true);

    tower.applySlowEffect(0.6, 100);
    expect(tower.slowFactor).toBe(0.6);

    tower.applyType('WhileLoop');
    expect(tower.type).toBe('WhileLoop');
    expect(tower.getSellValue()).toBeGreaterThan(0);
    expect(tower.getState().position).toEqual({ row: 1, col: 2 });
  });

  it('animates projectiles and exposes serializable state', () => {
    const start = 3_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(start);
    vi.spyOn(Math, 'random').mockReturnValue(0.8);

    const projectile = new ProjectileEntity({
      towerId: 't1',
      targetId: 'e1',
      towerType: 'ForLoop',
      startPos: { x: 0, y: 0 },
      targetPos: { x: 100, y: 0 },
      damage: 10,
      duration: 200,
    });

    vi.spyOn(Date, 'now').mockReturnValue(start + 100);
    expect(projectile.update(16)).toBe(false);
    expect(projectile.progress).toBeGreaterThan(0);
    expect(projectile.trail.length).toBeGreaterThan(1);

    vi.spyOn(Date, 'now').mockReturnValue(start + 300);
    expect(projectile.update(16)).toBe(true);
    expect(projectile.isActive).toBe(false);
    expect(projectile.getState().targetId).toBe('e1');
  });
});
