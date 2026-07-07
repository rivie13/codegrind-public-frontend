import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PLAYER_CHARACTER_ID,
  getPlayerCharacterPreset,
  getPlayerCharacterPreviewSpriteStyle,
  PLAYER_CHARACTER_FRAME_CONFIG,
  PLAYER_CHARACTER_PREVIEW_INTERVAL_MS,
  PLAYER_CHARACTER_PRESETS,
  resolvePlayerCharacterId,
} from './playerCharacterPresets';

describe('playerCharacterPresets', () => {
  it('falls back to the default preset for unknown ids', () => {
    expect(resolvePlayerCharacterId('missing-character')).toBe(DEFAULT_PLAYER_CHARACTER_ID);
    expect(getPlayerCharacterPreset('missing-character').id).toBe(DEFAULT_PLAYER_CHARACTER_ID);
  });

  it('builds six selectable presets from the exported atlas sheets', () => {
    expect(PLAYER_CHARACTER_PRESETS).toHaveLength(6);

    const preset = getPlayerCharacterPreset('selectable_character_03');

    expect(preset.frameConfig).toEqual(PLAYER_CHARACTER_FRAME_CONFIG);
    expect(preset.sheetPath).toMatch(/selectable_character_03\.png$/);
    expect(preset.animationFrameIndices.idleSide).toEqual([56, 57, 58, 59, 60, 61]);
    expect(preset.animationFrameIndices.idleUp).toEqual([62, 63, 64, 65, 66, 67]);
    expect(preset.animationFrameIndices.idleDown).toEqual([74, 75, 76, 77, 78, 79]);
    expect(preset.animationFrameIndices.walkSide).toEqual([112, 113, 114, 115, 116, 117]);
    expect(preset.animationFrameIndices.walkUp).toEqual([118, 119, 120, 121, 122, 123]);
    expect(preset.animationFrameIndices.walkDown).toEqual([130, 131, 132, 133, 134, 135]);
    expect(preset.previewFrameIndices).toEqual([130, 131, 132, 133, 134, 135]);
    expect(preset.animationKeys.walkDown).toBe(
      'city-phaser:player-character:anim:selectable_character_03:walk-down'
    );
  });

  it('resolves preset objects without falling back to the default sheet', () => {
    expect(getPlayerCharacterPreset(PLAYER_CHARACTER_PRESETS[4]).id).toBe(
      'selectable_character_05'
    );
  });

  it('builds sprite-preview styles from the shared atlas metadata', () => {
    const style = getPlayerCharacterPreviewSpriteStyle('selectable_character_02');

    expect(style.backgroundImage).toContain('selectable_character_02.png');
    expect(style.backgroundPosition).toBe('-1152px -256px');
    expect(style.backgroundRepeat).toBe('no-repeat');
    expect(style.backgroundSize).toBe('3584px auto');
    expect(style.height).toBe('128px');
    expect(style.imageRendering).toBe('pixelated');
    expect(style.width).toBe('64px');
  });

  it('supports explicit frame overrides for walk animation previews', () => {
    const style = getPlayerCharacterPreviewSpriteStyle('selectable_character_02', {
      frameIndex: 131,
    });

    expect(style.backgroundPosition).toBe('-1216px -256px');
    expect(PLAYER_CHARACTER_PREVIEW_INTERVAL_MS).toBe(150);
  });
});
