import { toAssetPath } from '../city-phaser/district01/loadExternalTiledMap';

export const DEFAULT_PLAYER_CHARACTER_ID = 'selectable_character_01';
const PLAYER_CHARACTER_ROW_FRAME_COUNT = 56;
const PLAYER_CHARACTER_IDLE_FRAME_START = PLAYER_CHARACTER_ROW_FRAME_COUNT;
const PLAYER_CHARACTER_WALK_FRAME_START = PLAYER_CHARACTER_ROW_FRAME_COUNT * 2;
const PLAYER_CHARACTER_WALK_FRAME_COUNT = 6;
const PLAYER_CHARACTER_UP_FRAME_OFFSET = PLAYER_CHARACTER_WALK_FRAME_COUNT;
const PLAYER_CHARACTER_DOWN_FRAME_OFFSET = PLAYER_CHARACTER_WALK_FRAME_COUNT * 3;
export const PLAYER_CHARACTER_PREVIEW_SCALE = 4;
export const PLAYER_CHARACTER_PREVIEW_INTERVAL_MS = 150;

export const PLAYER_CHARACTER_FRAME_CONFIG = Object.freeze({
  frameHeight: 32,
  frameWidth: 16,
});

const buildFrameRange = (start, count) =>
  Object.freeze(Array.from({ length: count }, (_, index) => start + index));

const buildPlayerTextureKeys = (playerCharacterId) =>
  Object.freeze({
    atlas: `city-phaser:player-character:atlas:${playerCharacterId}`,
  });

const buildPlayerAnimationKeys = (playerCharacterId) =>
  Object.freeze({
    idleDown: `city-phaser:player-character:anim:${playerCharacterId}:idle-down`,
    idleSide: `city-phaser:player-character:anim:${playerCharacterId}:idle-side`,
    idleUp: `city-phaser:player-character:anim:${playerCharacterId}:idle-up`,
    walkDown: `city-phaser:player-character:anim:${playerCharacterId}:walk-down`,
    walkSide: `city-phaser:player-character:anim:${playerCharacterId}:walk-side`,
    walkUp: `city-phaser:player-character:anim:${playerCharacterId}:walk-up`,
  });

const createPlayerCharacterPreset = (playerCharacterId, index) => {
  const textureKeys = buildPlayerTextureKeys(playerCharacterId);
  const animationKeys = buildPlayerAnimationKeys(playerCharacterId);
  const animationFrameIndices = Object.freeze({
    // The authored selectable-character strips are ordered as:
    // right-facing side, up, left-facing side, down.
    // Runtime reuses the right-facing side strip and flips it for left.
    idleDown: buildFrameRange(
      PLAYER_CHARACTER_IDLE_FRAME_START + PLAYER_CHARACTER_DOWN_FRAME_OFFSET,
      PLAYER_CHARACTER_WALK_FRAME_COUNT
    ),
    idleSide: buildFrameRange(PLAYER_CHARACTER_IDLE_FRAME_START, PLAYER_CHARACTER_WALK_FRAME_COUNT),
    idleUp: buildFrameRange(
      PLAYER_CHARACTER_IDLE_FRAME_START + PLAYER_CHARACTER_UP_FRAME_OFFSET,
      PLAYER_CHARACTER_WALK_FRAME_COUNT
    ),
    walkSide: buildFrameRange(PLAYER_CHARACTER_WALK_FRAME_START, PLAYER_CHARACTER_WALK_FRAME_COUNT),
    walkUp: buildFrameRange(
      PLAYER_CHARACTER_WALK_FRAME_START + PLAYER_CHARACTER_UP_FRAME_OFFSET,
      PLAYER_CHARACTER_WALK_FRAME_COUNT
    ),
    walkDown: buildFrameRange(
      PLAYER_CHARACTER_WALK_FRAME_START + PLAYER_CHARACTER_DOWN_FRAME_OFFSET,
      PLAYER_CHARACTER_WALK_FRAME_COUNT
    ),
  });

  return Object.freeze({
    animationFrameIndices,
    animationKeys,
    frameConfig: PLAYER_CHARACTER_FRAME_CONFIG,
    id: playerCharacterId,
    label: `Character ${String(index + 1).padStart(2, '0')}`,
    previewFrameIndices: animationFrameIndices.walkDown,
    sheetPath: toAssetPath(
      `city-v2/tiled/player-character/Player_Characters_Default/${playerCharacterId}.png`
    ),
    textureKeys,
  });
};

export const PLAYER_CHARACTER_PRESETS = Object.freeze(
  Array.from({ length: 6 }, (_, index) => {
    const numericId = String(index + 1).padStart(2, '0');
    return createPlayerCharacterPreset(`selectable_character_${numericId}`, index);
  })
);

const PLAYER_CHARACTER_PRESET_MAP = new Map(
  PLAYER_CHARACTER_PRESETS.map((preset) => [preset.id, preset])
);

const isPlayerCharacterPreset = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof value.id === 'string' &&
  PLAYER_CHARACTER_PRESET_MAP.has(value.id);

export const normalizeSelectedPlayerCharacterId = (value) => {
  if (typeof value !== 'string') return null;

  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  return PLAYER_CHARACTER_PRESET_MAP.has(normalizedValue) ? normalizedValue : null;
};

export const resolvePlayerCharacterId = (value) => {
  return normalizeSelectedPlayerCharacterId(value) || DEFAULT_PLAYER_CHARACTER_ID;
};

export const getPlayerCharacterPreset = (value = DEFAULT_PLAYER_CHARACTER_ID) => {
  if (isPlayerCharacterPreset(value)) {
    return PLAYER_CHARACTER_PRESET_MAP.get(value.id);
  }

  return PLAYER_CHARACTER_PRESET_MAP.get(resolvePlayerCharacterId(value));
};

const resolvePreviewFrameIndex = (preset, frameIndex) => {
  const numericFrameIndex = Number(frameIndex);

  if (Number.isInteger(numericFrameIndex) && numericFrameIndex >= 0) {
    return numericFrameIndex;
  }

  return preset.previewFrameIndices[0] || preset.animationFrameIndices.walkDown[0] || 0;
};

const getPlayerCharacterFrameCoordinates = (frameIndex) => ({
  column: frameIndex % PLAYER_CHARACTER_ROW_FRAME_COUNT,
  row: Math.floor(frameIndex / PLAYER_CHARACTER_ROW_FRAME_COUNT),
});

export const getPlayerCharacterPreviewSpriteStyle = (
  presetOrPresetId,
  scaleOrOptions = PLAYER_CHARACTER_PREVIEW_SCALE
) => {
  const preset = getPlayerCharacterPreset(presetOrPresetId);
  const options =
    typeof scaleOrOptions === 'number' ? { scale: scaleOrOptions } : scaleOrOptions || {};
  const scale = options.scale || PLAYER_CHARACTER_PREVIEW_SCALE;
  const frameIndex = resolvePreviewFrameIndex(preset, options.frameIndex);
  const { column, row } = getPlayerCharacterFrameCoordinates(frameIndex);
  const { frameHeight, frameWidth } = preset.frameConfig;

  return {
    backgroundImage: `url(${preset.sheetPath})`,
    backgroundPosition: `-${column * frameWidth * scale}px -${row * frameHeight * scale}px`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${PLAYER_CHARACTER_ROW_FRAME_COUNT * frameWidth * scale}px auto`,
    height: `${frameHeight * scale}px`,
    imageRendering: 'pixelated',
    width: `${frameWidth * scale}px`,
  };
};
