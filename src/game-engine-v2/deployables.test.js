import { describe, expect, it } from 'vitest';
import { DeployableEntity } from './deployables';

describe('DeployableEntity', () => {
  it('initializes deployable config with defaults and exposes center/range checks', () => {
    const deployable = new DeployableEntity('Data Mine', { row: 2, col: 3 });

    expect(deployable.type).toBe('Data Mine');
    expect(deployable.remainingUses).toBeGreaterThan(0);
    expect(deployable.getCenter(40)).toEqual({ x: 140, y: 100 });

    const inRangeEnemy = { id: 'e1', x: 140, y: 100, isActive: true };
    const outRangeEnemy = { id: 'e2', x: 400, y: 400, isActive: true };
    expect(deployable.isInRange(inRangeEnemy, 40)).toBe(true);
    expect(deployable.isInRange(outRangeEnemy, 40)).toBe(false);
  });

  it('tracks affected enemies and trigger lifecycle', () => {
    const deployable = new DeployableEntity('Bandwidth Throttle', { row: 0, col: 0 });
    const enemy = { id: 'e1' };

    expect(deployable.canAffectEnemy(enemy)).toBe(true);
    deployable.markAffected(enemy);
    expect(deployable.canAffectEnemy(enemy)).toBe(false);

    deployable.activate(1000);
    expect(deployable.isTriggered).toBe(true);
    expect(deployable.isActiveWindow(1001)).toBe(true);
    deployable.consumeUse();
    expect(deployable.remainingUses).toBeLessThanOrEqual(0);
  });

  it('expires correctly for area and non-area triggers', () => {
    const areaDeployable = new DeployableEntity('Firewall Shard', { row: 0, col: 0 });
    areaDeployable.activate(2000);
    expect(areaDeployable.isExpired(1999)).toBe(false);
    expect(areaDeployable.isExpired(7001)).toBe(true);

    const burstDeployable = new DeployableEntity('Data Mine', { row: 0, col: 0 });
    burstDeployable.remainingUses = 0;
    expect(burstDeployable.isExpired(1000)).toBe(true);
  });
});
