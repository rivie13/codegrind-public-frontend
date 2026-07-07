import { describe, expect, it } from 'vitest';

import {
  RETRO_DESKTOP_BACKGROUND_PACK,
  RETRO_DESKTOP_MAP_PACK,
  getEmbeddedShellCosmetics,
} from './embeddedShellThemes';

describe('getEmbeddedShellCosmetics', () => {
  it('returns retro-desktop renderer overrides for the retro desktop shell', () => {
    const cosmetics = getEmbeddedShellCosmetics('retro-desktop');

    expect(cosmetics).toEqual(
      expect.objectContaining({
        pathGradientMode: 'minesweeper-trace',
        tdAttackFxMode: 'data-stream',
        damageTextPack: expect.objectContaining({ id: 'retro-arcade' }),
        deathFxPack: expect.objectContaining({ id: 'pixel-burst' }),
        mapTheme: expect.objectContaining({
          id: 'retro-desktop-shell',
          gridEffectStyle: 'minesweeper-field',
        }),
        towerPack: expect.objectContaining({
          id: 'retro-desktop-shell',
          towerEffect: 'circuit-traces',
        }),
        enemyPack: expect.objectContaining({ id: 'retro-desktop-shell' }),
      })
    );
  });

  it('keeps the retro default map and background defaults split for store previews', () => {
    expect(RETRO_DESKTOP_MAP_PACK.mapBackground).toBeUndefined();
    expect(RETRO_DESKTOP_MAP_PACK.gridColor).toBeUndefined();
    expect(RETRO_DESKTOP_BACKGROUND_PACK.pathColor).toBeUndefined();
    expect(RETRO_DESKTOP_BACKGROUND_PACK.overlayStyle).toBeUndefined();
  });

  it('returns null for shells without a renderer override', () => {
    expect(getEmbeddedShellCosmetics()).toBeNull();
    expect(getEmbeddedShellCosmetics('default')).toBeNull();
  });
});
