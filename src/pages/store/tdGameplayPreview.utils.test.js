import { describe, expect, it } from 'vitest';
import { DEPLOYABLE_TYPES } from '../../game-engine-v2';
import { TOWER_TYPES as TD_TOWER_TYPES } from '../../components/towerDefense/data/towerTypes';
import {
  TD_GAMEPLAY_DEMO_MODE,
  getDeployableInfo,
  getMainCodePreviewTowers,
  getSpecialLevelForDemo,
  getSpecialTowerKeyFromPack,
  getSpecialUpgradeInfo,
} from './tdGameplayPreview.utils';

describe('tdGameplayPreview.utils', () => {
  it('parses tower key from special upgrade slug', () => {
    expect(getSpecialTowerKeyFromPack({ storeSlug: 'td.upgrade.for_loop.special1' })).toBe(
      'FOR_LOOP'
    );
  });

  it('builds special upgrade info from canonical tower types', () => {
    const info = getSpecialUpgradeInfo(
      {
        id: 'for_loop-special-1',
        storeSlug: 'td.upgrade.for_loop.special1',
        tier: 1,
        name: 'For Loop Special I',
      },
      TD_TOWER_TYPES
    );

    expect(info).toMatchObject({
      towerKey: 'FOR_LOOP',
      towerName: 'ForLoop',
      tier: 1,
      name: 'Extra Iteration',
      baseCost: 100,
    });
    expect(info.details).toContain('Mode sequence');
  });

  it('builds deployable info from canonical deployable constants', () => {
    const info = getDeployableInfo(
      {
        id: 'logic-bomb',
        storeSlug: 'td.deployable.logic_bomb',
        priceDataPackets: 120,
      },
      DEPLOYABLE_TYPES
    );

    expect(info).toMatchObject({
      title: 'Logic Bomb',
      placementType: 'any',
      effect: 'logicField',
      unlockCost: 120,
    });
    expect(info.description).toContain('corruption field');
  });

  it('supports default-unlocked deployable packs', () => {
    const info = getDeployableInfo(
      {
        id: 'data-mine',
        name: 'Data Mine',
        defaultUnlocked: true,
        description: 'Default unlocked deployable',
      },
      DEPLOYABLE_TYPES
    );

    expect(info.defaultUnlocked).toBe(true);
    expect(info.cost).toBe(0);
  });

  it('returns demo special level per mode', () => {
    expect(getSpecialLevelForDemo(TD_GAMEPLAY_DEMO_MODE.BASELINE)).toBe(0);
    expect(getSpecialLevelForDemo(TD_GAMEPLAY_DEMO_MODE.SPECIAL_1)).toBe(1);
    expect(getSpecialLevelForDemo(TD_GAMEPLAY_DEMO_MODE.SPECIAL_2)).toBe(2);
  });

  it('contains all main code preview towers without AI Assist', () => {
    const towers = getMainCodePreviewTowers();
    const keys = towers.map((tower) => tower.key);

    expect(keys).toContain('FUNCTION');
    expect(keys).toContain('VARIABLE');
    expect(keys).not.toContain('AI_ASSIST');
  });
});
