import {
  EDITOR_BACKGROUND_PACKS,
  EDITOR_EFFECT_PACKS,
  EDITOR_THEME_PACKS,
  ENEMY_PACKS,
  OPEN_SOURCE_FONT_PACKS,
  PROFILE_BACKGROUND_PACKS,
  PROFILE_BADGE_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  TD_BACKGROUND_PACKS,
  TD_DAMAGE_TEXT_PACKS,
  TD_DEPLOYABLE_PACKS,
  TD_DEATH_FX_PACKS,
  TD_MAP_PACKS,
  TD_SPECIAL_UPGRADE_PACKS,
  TD_TOWER_UNLOCK_PACKS,
  TOWER_PACKS,
} from '../../data/cosmetics/quickCosmeticPacks';
import { TD_GAMEPLAY_DEMO_MODE, TD_PREVIEW_KIND } from './tdGameplayPreview.utils';
export const FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400;500;600;700&family=Courier+Prime:wght@400;700&family=Fira+Code:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&family=Inconsolata:wght@400;700&family=JetBrains+Mono:wght@400;500;700&family=Roboto+Mono:wght@400;500;700&family=Source+Code+Pro:wght@400;600;700&family=Space+Mono:wght@400;700&family=Ubuntu+Mono:wght@400;700&family=Victor+Mono:wght@400;500;700&display=swap';

export const STORE_SECTIONS = [
  { id: 'editor', label: 'Editor Upgrades' },
  { id: 'td', label: 'TD Upgrades' },
  { id: 'profile', label: 'Profile Upgrades' },
  { id: 'combo', label: 'View All Together' },
];

export const CATALOG_STATUS_FILTER_OPTIONS = [
  { id: 'owned', label: 'Owned' },
  { id: 'not-owned', label: 'Not Owned' },
  { id: 'level-locked', label: 'Level Locked' },
  { id: 'level-unlocked', label: 'Level Unlocked' },
  { id: 'in-cart', label: 'In Cart' },
];

export const CATALOG_SORT_OPTIONS = [
  { id: 'none', label: 'No extra sort' },
  { id: 'name-asc', label: 'Name A-Z' },
  { id: 'name-desc', label: 'Name Z-A' },
  { id: 'price-asc', label: 'Price Low-High' },
  { id: 'price-desc', label: 'Price High-Low' },
  { id: 'level-asc', label: 'Level Low-High' },
  { id: 'level-desc', label: 'Level High-Low' },
  { id: 'owned-first', label: 'Owned First' },
  { id: 'locked-first', label: 'Locked First' },
];

export const RAINBOW_ROTATING_THEME_IDS = new Set([
  'rgb-strip',
  'blue-spectrum',
  'sunset-strip',
  'toxic-neon-strip',
]);
export const RAINBOW_THEME_PALETTES = {
  'rgb-strip': ['#FF4D4D', '#FF8A00', '#FFE066', '#34D399', '#22D3EE', '#A78BFA'],
  'blue-spectrum': ['#0EA5E9', '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8', '#93C5FD'],
  'sunset-strip': ['#F43F5E', '#FB7185', '#FB923C', '#F59E0B', '#FACC15', '#FDA4AF'],
  'toxic-neon-strip': ['#84CC16', '#A3E635', '#4ADE80', '#34D399', '#22D3EE', '#6EE7B7'],
};
export const RAINBOW_CHAR_DELAY_STEPS = 36;
export const RAINBOW_CHAR_ANIMATION_SECONDS = 15;
export const RAINBOW_CHAR_STYLE_ID = 'cg-store-rainbow-char-style';
export const STORE_TD_PREVIEW_LANGUAGE_ID = 'cg-store-td-python';

export const isAnimatedKeywordToken = (tokenType) => {
  if (typeof tokenType !== 'string') return false;
  return tokenType.includes('keyword') || tokenType.includes('brackets.');
};

export const buildThemeKeyframes = (themeId, palette) => {
  if (!Array.isArray(palette) || palette.length < 2) {
    return '';
  }

  const steps = palette
    .map((color, index) => {
      const pct = Math.round((index / (palette.length - 1)) * 100);
      const rgb = color
        .replace('#', '')
        .match(/.{1,2}/g)
        .map((hex) => Number.parseInt(hex, 16))
        .join(', ');
      return `${pct}% { color: ${color}; text-shadow: 0 0 1px rgba(${rgb}, 0.24); }`;
    })
    .join(' ');

  return `
    @keyframes cg-rainbow-char-wave-${themeId} {
      ${steps}
    }

    .cg-rainbow-theme-${themeId} {
      animation-name: cg-rainbow-char-wave-${themeId};
    }
  `;
};

export const ensureRainbowCharStyleSheet = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(RAINBOW_CHAR_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = RAINBOW_CHAR_STYLE_ID;

  const delayClasses = Array.from({ length: RAINBOW_CHAR_DELAY_STEPS }, (_, index) => {
    const delay = ((index * RAINBOW_CHAR_ANIMATION_SECONDS) / RAINBOW_CHAR_DELAY_STEPS).toFixed(3);
    return `.cg-rainbow-delay-${index}{animation-delay:-${delay}s;}`;
  }).join('');

  const themeKeyframes = Object.entries(RAINBOW_THEME_PALETTES)
    .map(([themeId, palette]) => buildThemeKeyframes(themeId, palette))
    .join('');

  style.textContent = `
    .cg-rainbow-char {
      animation-duration: ${RAINBOW_CHAR_ANIMATION_SECONDS}s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      will-change: color;
    }

    ${themeKeyframes}
    ${delayClasses}
  `;

  document.head.appendChild(style);
};

export const EDITOR_DEFAULT_ID = 'editor-surface-default';
export const EDITOR_DEFAULT_OPTION = {
  id: EDITOR_DEFAULT_ID,
  name: 'Surface Default',
  description: 'No cosmetic override — shows surface baseline theme.',
  free: true,
  defaultUnlocked: true,
};
export const EDITOR_THEME_PACK_OPTIONS = [EDITOR_DEFAULT_OPTION, ...EDITOR_THEME_PACKS];
export const EDITOR_FONT_PACK_OPTIONS = [EDITOR_DEFAULT_OPTION, ...OPEN_SOURCE_FONT_PACKS];
export const EDITOR_BACKGROUND_PACK_OPTIONS = [EDITOR_DEFAULT_OPTION, ...EDITOR_BACKGROUND_PACKS];
export const EDITOR_EFFECT_PACK_OPTIONS = [EDITOR_DEFAULT_OPTION, ...EDITOR_EFFECT_PACKS];

export const TD_HOMEPAGE_DEFAULT_ID = 'homepage-default';
export const TD_HOMEPAGE_DEFAULT_OPTION = {
  id: TD_HOMEPAGE_DEFAULT_ID,
  name: 'Retro Desktop Default',
  description:
    'Matches the retro desktop shell baseline with pixel icon towers and classic board chrome.',
  free: true,
  defaultUnlocked: true,
};

export const TD_MAP_PACK_OPTIONS = [TD_HOMEPAGE_DEFAULT_OPTION, ...TD_MAP_PACKS];
export const TD_BACKGROUND_PACK_OPTIONS = [TD_HOMEPAGE_DEFAULT_OPTION, ...TD_BACKGROUND_PACKS];
export const TD_TOWER_PACK_OPTIONS = [TD_HOMEPAGE_DEFAULT_OPTION, ...TOWER_PACKS];

export const LIGHTNING_INTERNAL_MODES = [
  { id: 'edge-sweep', name: 'Edge Sweep' },
  { id: 'cross-pulse', name: 'Cross Pulse' },
  { id: 'orbit-spark', name: 'Orbit Spark' },
];

export const LIGHTNING_LINK_MODES = [
  { id: 'off', name: 'Off' },
  { id: 'soft-link', name: 'Soft Link' },
];

export const TD_PATH_GRADIENT_PACKS = [
  {
    id: TD_HOMEPAGE_DEFAULT_ID,
    name: 'Retro Desktop Default',
    free: true,
    defaultUnlocked: true,
  },
  {
    id: 'amber-flow',
    name: 'Amber Flow',
    storeSlug: 'td.fx.path-gradient.amber-flow.v1',
    storeCategory: 'td_path_gradient_fx',
    storeSlot: 'td.pathGradient',
    priceDataPackets: 65,
  },
  {
    id: 'plasma-ribbon',
    name: 'Plasma Ribbon',
    storeSlug: 'td.fx.path-gradient.plasma-ribbon.v1',
    storeCategory: 'td_path_gradient_fx',
    storeSlot: 'td.pathGradient',
    priceDataPackets: 75,
  },
  {
    id: 'neon-vein',
    name: 'Neon Vein',
    storeSlug: 'td.fx.path-gradient.neon-vein.v1',
    storeCategory: 'td_path_gradient_fx',
    storeSlot: 'td.pathGradient',
    priceDataPackets: 80,
  },
  {
    id: 'flat',
    name: 'Flat Path',
    storeSlug: 'td.fx.path-gradient.flat.v1',
    storeCategory: 'td_path_gradient_fx',
    storeSlot: 'td.pathGradient',
    priceDataPackets: 40,
  },
];

export const TD_ATTACK_FX_PACKS = [
  {
    id: 'none',
    name: 'Retro Desktop Default',
    free: true,
    defaultUnlocked: true,
  },
  {
    id: 'pulse-rings',
    name: 'Pulse Rings',
    storeSlug: 'td.fx.attack.pulse-rings.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 65,
  },
  {
    id: 'ember-sparks',
    name: 'Ember Sparks',
    storeSlug: 'td.fx.attack.ember-sparks.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 70,
  },
  {
    id: 'ion-scan',
    name: 'Ion Scan',
    storeSlug: 'td.fx.attack.ion-scan.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 75,
  },
  {
    id: 'marker-burst',
    name: 'Marker Burst',
    storeSlug: 'td.fx.attack.marker-burst.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 80,
  },
  {
    id: 'data-stream',
    name: 'Data Stream',
    storeSlug: 'td.fx.attack.data-stream.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 85,
  },
  {
    id: 'void-tendrils',
    name: 'Void Tendrils',
    storeSlug: 'td.fx.attack.void-tendrils.v1',
    storeCategory: 'td_attack_fx',
    storeSlot: 'td.attackFx',
    priceDataPackets: 95,
  },
];

export const TD_PREVIEW_KIND_OPTIONS = [
  { id: TD_PREVIEW_KIND.COSMETIC, name: 'Cosmetic Upgrades' },
  { id: TD_PREVIEW_KIND.GAMEPLAY, name: 'Deployables and Special Upgrades' },
];

export const TD_GAMEPLAY_DEMO_OPTIONS = [
  { id: TD_GAMEPLAY_DEMO_MODE.BASELINE, name: 'Baseline (No Special)' },
  { id: TD_GAMEPLAY_DEMO_MODE.SPECIAL_1, name: 'Special I Demo' },
  { id: TD_GAMEPLAY_DEMO_MODE.SPECIAL_2, name: 'Special II Demo' },
];

export const TD_PATH_NODES = [
  { col: 0, row: 5 },
  { col: 3, row: 5 },
  { col: 3, row: 8 },
  { col: 8, row: 8 },
  { col: 8, row: 3 },
  { col: 6, row: 3 },
  { col: 6, row: 2 },
  { col: 12, row: 2 },
  { col: 12, row: 9 },
  { col: 14, row: 9 },
  { col: 14, row: 4 },
  { col: 16, row: 4 },
  { col: 16, row: 8 },
  { col: 17, row: 8 },
  { col: 17, row: 5 },
  { col: 19, row: 5 },
];

export const TD_PREVIEW_TOWER_POSITIONS = [
  { type: 'Function', row: 4, col: 5 },
  { type: 'ForLoop', row: 7, col: 10 },
  { type: 'Variable', row: 3, col: 15 },
  { type: 'Function', row: 8, col: 6 },
];

export const PROFILE_PREVIEW_USER_DATA = {
  id: 1,
  username: 'rivie13',
  email: 'rivie13@codegrind.local',
  hasPassword: true,
  bio: "Riv's bio",
  avatarUrl: '',
  createdAt: '2025-07-07T00:00:00.000Z',
  membershipTier: 'FREE',
  subscriptionStatus: null,
  subscriptionCancelAtPeriodEnd: false,
  subscriptionCancelAt: null,
  discordProfile: { linked: false, level: 1 },
  progress: {
    level: 5,
    roleName: 'Script Kiddie',
    xpIntoLevel: 589,
    xpToNextLevel: 618,
  },
  equippedCosmetics: {},
};

export const LOCAL_CATALOG_FALLBACK_PACKS = [
  ...EDITOR_THEME_PACKS,
  ...OPEN_SOURCE_FONT_PACKS,
  ...EDITOR_BACKGROUND_PACKS,
  ...EDITOR_EFFECT_PACKS,
  ...TD_BACKGROUND_PACKS,
  ...TD_MAP_PACKS,
  ...TOWER_PACKS,
  ...ENEMY_PACKS,
  ...TD_TOWER_UNLOCK_PACKS,
  ...TD_SPECIAL_UPGRADE_PACKS,
  ...TD_DEPLOYABLE_PACKS,
  ...TD_DAMAGE_TEXT_PACKS,
  ...TD_DEATH_FX_PACKS,
  ...TD_PATH_GRADIENT_PACKS,
  ...TD_ATTACK_FX_PACKS,
  ...PROFILE_BACKGROUND_PACKS,
  ...PROFILE_CALLING_CARD_PACKS,
  ...PROFILE_BADGE_PACKS,
];

export const getPackById = (packs, id) => packs.find((pack) => pack.id === id) || packs[0];
export const getDefaultPackId = (packs) =>
  packs.find((pack) => pack?.defaultUnlocked || pack?.free)?.id || packs[0]?.id;

export const expandPathNodes = (waypoints) => {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return [];

  const expanded = [[waypoints[0].row, waypoints[0].col]];
  for (let i = 1; i < waypoints.length; i += 1) {
    const prev = waypoints[i - 1];
    const next = waypoints[i];

    if (prev.row === next.row) {
      const step = next.col > prev.col ? 1 : -1;
      for (let col = prev.col + step; col !== next.col + step; col += step) {
        expanded.push([prev.row, col]);
      }
    } else if (prev.col === next.col) {
      const step = next.row > prev.row ? 1 : -1;
      for (let row = prev.row + step; row !== next.row + step; row += step) {
        expanded.push([row, prev.col]);
      }
    }
  }

  return expanded;
};

export const findPackByStoreSlug = (packs, slug, fallback) => {
  if (!slug) return fallback;
  return (
    packs.find(
      (pack) =>
        pack?.storeSlug === slug ||
        (Array.isArray(pack?.legacyStoreSlugs) && pack.legacyStoreSlugs.includes(slug))
    ) || fallback
  );
};

export const buildModeLabel = ({
  pack,
  owned,
  free,
  unavailable,
  price,
  lockedByLevel,
  requiresLevel,
}) => {
  if (pack?.defaultUnlocked) {
    return `${pack.name} (Default Unlocked)`;
  }
  if (free) {
    return `${pack.name} (Free)`;
  }
  if (unavailable) {
    return `${pack.name} (Catalog Sync Needed)`;
  }
  if (owned) {
    return `${pack.name} (Owned)`;
  }
  if (lockedByLevel) {
    return `${pack.name} (Level ${requiresLevel || 1} Locked, ${price} DP)`;
  }
  return `${pack.name} (${price} DP, Not Owned)`;
};
