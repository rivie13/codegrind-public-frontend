import {
  getPlayerCharacterPreset,
  PLAYER_CHARACTER_FRAME_CONFIG,
} from '../../player-character/playerCharacterPresets';
import getAssetUrl from '../../utils/assets/assetUrl';
import { toAssetPath } from './loadExternalTiledMap';

export const MAP_ASSET_PATH = toAssetPath('city-v2/tiled/maps/district-01/apartment-seed.tmj');
export const MAP_CACHE_KEY = 'city-phaser:apartment-seed';
export const MANUAL_TILE_TEXTURE_PREFIX = 'city-phaser:manual:';
export const TILESET_TEXTURE_PREFIX = 'city-phaser:tileset:';
export const HUD_PADDING = 16;
export const MIN_CAMERA_ZOOM = 2;
export const PLAYER_FRAME_CONFIG = PLAYER_CHARACTER_FRAME_CONFIG;
export const PLAYER_IDLE_FRAME_RATE = 5;
export const PLAYER_WALK_FRAME_RATE = 12;
export const PLAYER_SPEED = 110;
export const INTRO_NOTIFICATION_SOUND_SRC = getAssetUrl(
  '/audio/generated_sound_effects/event_sound_effects/cyberpunk_buttonclick.wav'
);
export const INTRO_CITY_TILESET_NAME = 'Dusk_City_Background';
export const INTRO_CITY_UNCROPPED_STRIP = {
  textureKey: 'city-phaser:backdrop:uncropped-strip',
  keyPrefix: 'city-phaser:backdrop:uncropped:',
  path: toAssetPath('city-v2/tiled/backgrounds_loadingScreens/Dusk_City_Background_UNCROPPED.png'),
};
export const INTRO_OVERLAY_DEPTH = 12000;
export const TERMINAL_CUE_DEPTH = 11000;
export const INTRO_BAR_RATIO = 0.13;
export const INTRO_ADVANCE_ARM_DELAY_MS = 320;
export const RETRO_HUD_ICON_ASSETS = {
  bell: {
    key: 'city-phaser:retro-icon:bell',
    path: toAssetPath(
      'city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Travel_Bell_Notification_Ringing.png'
    ),
  },
  info: {
    key: 'city-phaser:retro-icon:info',
    path: toAssetPath(
      'city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Speech_Bubble_Information_Guide_Tutorial.png'
    ),
  },
  terminal: {
    key: 'city-phaser:retro-icon:terminal',
    path: toAssetPath(
      'city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Terminal_Window_CMD_Command_Line_Development_Code_Programming.png'
    ),
  },
  warning: {
    key: 'city-phaser:retro-icon:warning',
    path: toAssetPath(
      'city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Warning_Sign_Triangle_Exclaimation_Mark_Error.png'
    ),
  },
};
export const TERMINAL_CUE_WINDOW_WIDTH = 148;
export const TERMINAL_CUE_WINDOW_HEIGHT = 58;
export const INTRO_SEQUENCE_STEPS = [
  {
    cameraDurationMs: 1850,
    focus: 'map',
    hudAccentLabel: 'Port Meridian // District 01',
    hudIcon: 'info',
    hudPlacement: 'top-left',
    hudStatusLabel: 'City feed',
    hudTitle: 'Port Meridian',
    showCityBackdrop: true,
    text: 'Port Meridian is a vertical river city built from freight lines, floodwalls, warehouse roofs, clinic signage, and mirrored finance towers. District 01 sits low along the water where the trains scream overhead and every public screen tries to sell reinvention. The whole place runs on aspiration packaged as a service.',
  },
  {
    cameraDurationMs: 1600,
    focus: 'window',
    hudAccentLabel: 'Safehouse window',
    hudIcon: 'warning',
    hudPlacement: 'top-right',
    hudStatusLabel: 'Night signal',
    hudTitle: 'The Pitch',
    text: 'At night, Port Meridian almost looks generous. Carrier lights drift across the river, commuter rails spark between towers, and ad projectors paint the mist like the city is still expanding for people like you. Every screen promises the same escape hatch: learn to code, learn to hack, reinvent yourself, get hired. Up close it is sales copy stacked on panic, and nobody can tell you where the first real door is.',
  },
  {
    cameraDurationMs: 1500,
    focus: 'player',
    hudAccentLabel: 'Career switch log',
    hudIcon: 'info',
    hudPlacement: 'bottom-left',
    hudStatusLabel: 'Field note',
    hudTitle: 'Second Attempt',
    text: 'You are not a prodigy, a rebel icon, or the kind of person this city notices on sight. You are a career switcher trying to force a second life out of a system that keeps monetizing the climb. You have not broken through yet. You are still looking for the skills, the first foothold, and proof that useful work is something you can actually reach.',
  },
  {
    cameraDurationMs: 1550,
    focus: 'apartment',
    hudAccentLabel: 'Safehouse inventory',
    hudIcon: 'info',
    hudPlacement: 'bottom-right',
    hudStatusLabel: 'Room scan',
    hudTitle: 'The Safehouse',
    text: 'So this room became your fallback coordinate in District 01: cheap walls, a borrowed view, a desk that wobbles, and just enough hardware to keep applying, learning, and refusing to disappear. Small, temporary, unimpressive. Still yours for tonight.',
  },
  {
    cameraDurationMs: 1500,
    focus: 'apartment',
    hudAccentLabel: 'Safehouse scan',
    hudIcon: 'warning',
    hudPlacement: 'bottom-right',
    hudStatusLabel: 'Static build-up',
    hudTitle: 'Pressure',
    text: 'Port Meridian has a talent for turning ambition into static. Days dissolve into starter guides, miracle ads, job posts, and the private suspicion that everyone else got the map you missed. Most nights this room feels less like home and more like a waiting room for a future that keeps moving the entrance.',
  },
  {
    cameraDurationMs: 1700,
    focus: 'terminal',
    hudAccentLabel: 'Safehouse terminal',
    hudIcon: 'terminal',
    hudPlacement: 'top-left',
    hudStatusLabel: 'Wake signal',
    hudTitle: 'Off-Pattern Signal',
    playTerminalPing: true,
    text: "Then the safehouse terminal chirps with something that does not sound sponsored. Not polished. Not optimized. Just a crooked signal cutting through Port Meridian's ad-noise. In a city built on filters, anything that arrives uninvited is worth opening.",
  },
];
export const PLAYER_BODY_CONFIG = {
  height: 10,
  offsetX: 3,
  offsetY: 22,
  width: 10,
};
export const COLLISION_DEBUG_COLORS = {
  authored: 0xff9f1c,
  interaction: 0xd946ef,
  physics: 0x38bdf8,
  player: 0x22c55e,
};
export const HUD_TEXT_STYLE = {
  color: '#d7ffe7',
  fontFamily: 'Consolas, monospace',
  fontSize: '13px',
  padding: { x: 8, y: 4 },
};
export const STATUS_TEXT_STYLE = {
  color: '#9ae6b4',
  fontFamily: 'Consolas, monospace',
  fontSize: '13px',
  wordWrap: { width: 420 },
};
export const RETRO_WINDOW_TITLE_STYLE = {
  color: '#f5f7ff',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
};
export const RETRO_WINDOW_BODY_STYLE = {
  color: '#202020',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '10px',
  fontStyle: 'bold',
};
export const RETRO_WINDOW_META_STYLE = {
  color: '#f5f7ff',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '9px',
  fontStyle: 'bold',
};
export const WINDOW_VIEW_TITLE_STYLE = {
  color: '#f5f7ff',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
};
export const WINDOW_VIEW_BODY_STYLE = {
  color: '#171717',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
  wordWrap: { width: 400 },
};
export const WINDOW_VIEW_BUTTON_STYLE = {
  color: '#171717',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
};
export const PREVIEW_DEBUG_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_CITY_PHASER_DEBUG === 'true';
export const PREVIEW_KEY_CAPTURES = [
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
  'W',
  'A',
  'S',
  'D',
  'E',
  'SPACE',
  'ENTER',
  'ESC',
];
export const PREVIEW_DIRECTION_BY_CODE = {
  ArrowDown: 'arrowdown',
  ArrowLeft: 'arrowleft',
  ArrowRight: 'arrowright',
  ArrowUp: 'arrowup',
  KeyA: 'arrowleft',
  KeyD: 'arrowright',
  KeyS: 'arrowdown',
  KeyW: 'arrowup',
};
export const INTERACTION_LABEL_LAYOUT = {
  borderInset: 2,
  gap: 7,
  margin: 10,
  offsetY: 8,
  paddingX: 8,
  paddingY: 6,
  keyPaddingX: 6,
  keyPaddingY: 4,
  minKeyWidth: 22,
  minKeyHeight: 18,
  titleBarHeight: 12,
  titlePaddingX: 6,
};
export const INTERACTION_LABEL_TITLE_STYLE = {
  color: '#f5f7ff',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '8px',
  fontStyle: 'bold',
};
export const INTERACTION_LABEL_KEY_STYLE = {
  color: '#171717',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '10px',
  fontStyle: 'bold',
};
export const INTERACTION_LABEL_TEXT_STYLE = {
  color: '#171717',
  fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
  fontSize: '10px',
  fontStyle: 'bold',
};
export const getInteractionLabelViewportScale = (gameWidth, gameHeight) =>
  Math.min(Math.max(Math.min(gameWidth / 960, gameHeight / 720), 0.9), 1);
export const getWorldCueViewportScale = (gameWidth, gameHeight) =>
  Math.min(Math.max(Math.min(gameWidth / 960, gameHeight / 720), 0.82), 1.04);
export const LAYERS_BELOW_PLAYER = [
  'Skyline_Background',
  'Floor',
  'Walls',
  'WallProps',
  'Floor_Props',
  'PropsLow',
];
export const LAYERS_ABOVE_PLAYER = ['WallTops', 'PropsHigh', 'tableProps'];
export const DEFAULT_PLAYER_CHARACTER_PRESET = getPlayerCharacterPreset();
