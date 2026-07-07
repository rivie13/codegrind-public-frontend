export const DISTRICT_01_ID = 'district-01';
export const DISTRICT_01_START_SCENE_ID = 'apartment-room-01';

const PUBLIC_MEDIA_BLOB_BASE_URL =
  'https://codegrindpublicmedia.blob.core.windows.net/public-media';
const CITY_MAP_ASSET_DIR = '/images/City_Map_Images';
const CITY_MAP_AVATAR_ASSET_DIR = `${CITY_MAP_ASSET_DIR}/Avatar_Walking_Animations_Images`;

const createSceneArt = (filename, alt) => ({
  assetPath: `${CITY_MAP_ASSET_DIR}/${filename}`,
  fallbackSrc: `${PUBLIC_MEDIA_BLOB_BASE_URL}${CITY_MAP_ASSET_DIR}/${filename}`,
  alt,
});

const createAvatarAsset = (filename, alt) => ({
  assetPath: `${CITY_MAP_AVATAR_ASSET_DIR}/${filename}`,
  fallbackSrc: `${PUBLIC_MEDIA_BLOB_BASE_URL}${CITY_MAP_AVATAR_ASSET_DIR}/${filename}`,
  alt,
});

export const DISTRICT_01_TRAVEL_TRANSITION_ART = createSceneArt(
  'city-d01-travel-bg-v01.jpg',
  'District 01 travel transition background'
);

export const DISTRICT_01_AVATAR_ASSETS = {
  idle: {
    north: createAvatarAsset('Avatar-idle-north.png', 'District 01 avatar idle north'),
    south: createAvatarAsset('Avatar-idle-south.png', 'District 01 avatar idle south'),
    east: createAvatarAsset('Avatar-idle-east.png', 'District 01 avatar idle east'),
    west: createAvatarAsset('Avatar-idle-west.png', 'District 01 avatar idle west'),
  },
  walk: {
    north: createAvatarAsset('Avatar-walking-north.gif', 'District 01 avatar walking north'),
    south: createAvatarAsset('Avatar-walking-south.gif', 'District 01 avatar walking south'),
    east: createAvatarAsset('Avatar-walking-east.gif', 'District 01 avatar walking east'),
    west: createAvatarAsset('Avatar-walking-west.gif', 'District 01 avatar walking west'),
    northeast: createAvatarAsset(
      'Avatar-walking-northeast.gif',
      'District 01 avatar walking northeast'
    ),
    northwest: createAvatarAsset(
      'Avatar-walking-northwest.gif',
      'District 01 avatar walking northwest'
    ),
    southeast: createAvatarAsset(
      'Avatar-walking-southeast.gif',
      'District 01 avatar walking southeast'
    ),
    southwest: createAvatarAsset(
      'Avatar-walking-southwest.gif',
      'District 01 avatar walking southwest'
    ),
  },
};

export const DISTRICT_01_SCENES = {
  'apartment-room-01': {
    id: 'apartment-room-01',
    districtId: DISTRICT_01_ID,
    title: 'Apartment Safehouse',
    subtitle: 'Spawn scene and classic map fallback terminal',
    description:
      'District 01 starts in a compact hacker apartment with a doorway to the street and a single terminal for hub navigation.',
    spawn: { x: 18, y: 76 },
    walkBounds: { xMin: 10, xMax: 88, yMin: 69.5, yMax: 97.5 },
    exits: [
      {
        id: 'apartment-to-street',
        label: 'Street access',
        targetSceneId: 'docks-street-01',
        spawn: { x: 16, y: 74 },
        zone: { xMin: 82, xMax: 91, yMin: 66, yMax: 84 },
        highlightZone: { xMin: 83.5, xMax: 88.5, yMin: 31, yMax: 48 },
      },
    ],
    hotspots: [],
    palette: {
      background:
        'linear-gradient(135deg, rgba(5, 10, 18, 0.98) 0%, rgba(16, 29, 45, 0.94) 40%, rgba(7, 56, 62, 0.9) 100%)',
      accent: '#7DF9FF',
    },
    art: createSceneArt('city-d01-apartment-bg-v01.jpg', 'Apartment Safehouse scene background'),
    avatar: {
      state: 'idle',
      direction: 'south',
      scale: 1.2,
      mobileScaleBoost: 1.2,
    },
  },
  'docks-street-01': {
    id: 'docks-street-01',
    districtId: DISTRICT_01_ID,
    title: 'Neon Docks Street',
    subtitle: 'Transit scene linking the first playable loop',
    description:
      'This street block connects the apartment, contractor office, and packet bazaar while reserving space for future movement and travel transitions.',
    spawn: { x: 22, y: 76 },
    walkBounds: { xMin: 8, xMax: 92, yMin: 62, yMax: 86 },
    walkZones: [
      { xMin: 8, xMax: 28, yMin: 66, yMax: 86 },
      { xMin: 24, xMax: 58, yMin: 60, yMax: 80 },
      { xMin: 54, xMax: 92, yMin: 58, yMax: 80 },
      { xMin: 10, xMax: 90, yMin: 74, yMax: 88 },
    ],
    exits: [
      {
        id: 'street-to-apartment',
        label: 'Return to apartment',
        targetSceneId: 'apartment-room-01',
        spawn: { x: 78, y: 76 },
        zone: { xMin: 8, xMax: 18, yMin: 68, yMax: 86 },
      },
      {
        id: 'street-to-contractor',
        label: 'Enter contractor office',
        targetSceneId: 'array-fixer-office-01',
        spawn: { x: 20, y: 78 },
        zone: { xMin: 34, xMax: 46, yMin: 68, yMax: 86 },
      },
      {
        id: 'street-to-shop',
        label: 'Enter packet bazaar',
        targetSceneId: 'packet-bazaar-interior-01',
        spawn: { x: 18, y: 78 },
        zone: { xMin: 56, xMax: 68, yMin: 68, yMax: 86 },
      },
      {
        id: 'street-to-learning-guide',
        label: 'Enter module guide studio',
        targetSceneId: 'learning-module-guide-01',
        spawn: { x: 18, y: 78 },
        zone: { xMin: 78, xMax: 90, yMin: 68, yMax: 86 },
      },
    ],
    hotspots: [],
    palette: {
      background:
        'linear-gradient(135deg, rgba(7, 11, 17, 0.98) 0%, rgba(16, 15, 44, 0.94) 45%, rgba(7, 71, 72, 0.88) 100%)',
      accent: '#00FFCC',
    },
    art: createSceneArt('city-d01-street-bg-v01.jpg', 'Neon Docks Street scene background'),
    avatar: {
      state: 'walk',
      direction: 'east',
      scale: 0.9,
      mobileScaleBoost: 1.15,
    },
  },
  'array-fixer-office-01': {
    id: 'array-fixer-office-01',
    districtId: DISTRICT_01_ID,
    title: 'Array Fixer Office',
    subtitle: 'Contractor scene for mission launch wiring',
    description:
      'The first contractor office is set up as the bridge back into the current mission surfaces so the city stays additive rather than replacing proven routes.',
    spawn: { x: 16, y: 78 },
    walkBounds: { xMin: 12, xMax: 84, yMin: 64, yMax: 86 },
    walkZones: [
      { xMin: 12, xMax: 30, yMin: 58, yMax: 86 },
      { xMin: 20, xMax: 74, yMin: 74, yMax: 86 },
      { xMin: 26, xMax: 42, yMin: 64, yMax: 80 },
      { xMin: 54, xMax: 72, yMin: 68, yMax: 80 },
      { xMin: 68, xMax: 86, yMin: 60, yMax: 86 },
    ],
    exits: [
      {
        id: 'contractor-to-street',
        label: 'Back to street',
        targetSceneId: 'docks-street-01',
        spawn: { x: 70, y: 76 },
        zone: { xMin: 12, xMax: 22, yMin: 66, yMax: 86 },
        highlightZone: { xMin: 13, xMax: 20, yMin: 20, yMax: 52 },
      },
    ],
    hotspots: [
      {
        id: 'contractor-fixer',
        label: 'Array Fixer',
        type: 'contractor',
        zone: { xMin: 72, xMax: 84, yMin: 68, yMax: 86 },
        highlightZone: { xMin: 60, xMax: 84, yMin: 14, yMax: 58 },
        prompt: 'Talk to Array Fixer',
        action: { kind: 'route', href: '/games/clusters', cta: 'Talk to Array Fixer' },
        accent: 'rgba(255, 176, 77, 0.96)',
      },
    ],
    palette: {
      background:
        'linear-gradient(135deg, rgba(9, 8, 23, 0.98) 0%, rgba(31, 16, 48, 0.94) 50%, rgba(7, 48, 76, 0.88) 100%)',
      accent: '#FF9A5C',
    },
    art: createSceneArt('city-d01-contractor-bg-v01.jpg', 'Array Fixer Office scene background'),
    avatar: {
      state: 'idle',
      direction: 'south',
      scale: 1.15,
      mobileScaleBoost: 1.2,
    },
  },
  'learning-module-guide-01': {
    id: 'learning-module-guide-01',
    districtId: DISTRICT_01_ID,
    title: 'Module Guide Studio',
    subtitle: 'Learning path scene for guided module entry',
    description:
      'The learning guide studio is the calmer trial-space for module progression, language-path routing, and returning later to finish the guided learning track.',
    spawn: { x: 44, y: 82 },
    walkBounds: { xMin: 12, xMax: 84, yMin: 64, yMax: 86 },
    walkZones: [
      { xMin: 28, xMax: 64, yMin: 78, yMax: 90 },
      { xMin: 36, xMax: 58, yMin: 68, yMax: 82 },
      { xMin: 42, xMax: 60, yMin: 56, yMax: 72 },
      { xMin: 48, xMax: 64, yMin: 46, yMax: 62 },
    ],
    exits: [
      {
        id: 'learning-guide-to-street',
        label: 'Back to street',
        targetSceneId: 'docks-street-01',
        spawn: { x: 70, y: 76 },
        zone: { xMin: 32, xMax: 58, yMin: 78, yMax: 90 },
        highlightZone: { xMin: 34, xMax: 56, yMin: 74, yMax: 90 },
      },
    ],
    hotspots: [
      {
        id: 'learning-guide-contractor',
        label: 'Module Guide',
        type: 'learning',
        zone: { xMin: 48, xMax: 64, yMin: 56, yMax: 76 },
        highlightZone: { xMin: 44, xMax: 72, yMin: 12, yMax: 40 },
        prompt: 'Talk to Module Guide',
        action: {
          kind: 'route',
          href: '/learning',
          routeKey: 'learning-guide',
          cta: 'Talk to Module Guide',
        },
      },
    ],
    palette: {
      background:
        'linear-gradient(135deg, rgba(7, 17, 22, 0.98) 0%, rgba(14, 37, 42, 0.94) 50%, rgba(10, 67, 69, 0.88) 100%)',
      accent: '#89FFF0',
    },
    art: createSceneArt(
      'city-d01-learning-contractor-bg-v01.jpg',
      'Module Guide Studio scene background'
    ),
    avatar: {
      state: 'idle',
      direction: 'south',
      scale: 1.15,
      mobileScaleBoost: 1.2,
    },
  },
  'packet-bazaar-interior-01': {
    id: 'packet-bazaar-interior-01',
    districtId: DISTRICT_01_ID,
    title: 'Packet Bazaar',
    subtitle: 'Store scene placeholder for first shop interaction',
    description:
      'The bazaar scene anchors the first store interaction and gives the city shell a second functional destination in the initial loop.',
    spawn: { x: 18, y: 78 },
    walkBounds: { xMin: 10, xMax: 86, yMin: 64, yMax: 86 },
    walkZones: [
      { xMin: 8, xMax: 24, yMin: 62, yMax: 86 },
      { xMin: 14, xMax: 84, yMin: 76, yMax: 90 },
      { xMin: 24, xMax: 48, yMin: 70, yMax: 84 },
      { xMin: 52, xMax: 78, yMin: 70, yMax: 84 },
    ],
    exits: [
      {
        id: 'shop-to-street',
        label: 'Back to street',
        targetSceneId: 'docks-street-01',
        spawn: { x: 74, y: 76 },
        zone: { xMin: 8, xMax: 18, yMin: 66, yMax: 86 },
        highlightZone: { xMin: 9, xMax: 18, yMin: 18, yMax: 50 },
      },
    ],
    hotspots: [
      {
        id: 'shop-vendor-counter',
        label: 'Vendor counter',
        type: 'store',
        zone: { xMin: 42, xMax: 64, yMin: 66, yMax: 82 },
        highlightZone: { xMin: 32, xMax: 72, yMin: 12, yMax: 44 },
        prompt: 'Talk to Packet Vendor',
        action: { kind: 'route', href: '/store', cta: 'Talk to Packet Vendor' },
      },
    ],
    palette: {
      background:
        'linear-gradient(135deg, rgba(11, 10, 18, 0.98) 0%, rgba(28, 36, 20, 0.94) 45%, rgba(66, 61, 16, 0.88) 100%)',
      accent: '#FFD166',
    },
    art: createSceneArt('city-d01-shop-bg-v01.jpg', 'Packet Bazaar scene background'),
    avatar: {
      state: 'idle',
      direction: 'west',
      scale: 1.2,
      mobileScaleBoost: 1.2,
    },
  },
};

export const DISTRICT_01_SCENE_ORDER = Object.keys(DISTRICT_01_SCENES);

const DISTRICT_01_TRAVEL_TRANSITIONS = {
  'apartment-room-01:docks-street-01': {
    durationMs: 5000,
    avatar: {
      x: 30,
      y: 90,
      state: 'walk',
      direction: 'south',
      scale: 1.2,
      mobileScaleBoost: 1.2,
    },
  },
  'docks-street-01:apartment-room-01': {
    durationMs: 5000,
    avatar: {
      x: 30,
      y: 90,
      state: 'walk',
      direction: 'north',
      scale: 1.2,
      mobileScaleBoost: 1.2,
    },
  },
};

export const getDistrict01Scene = (sceneId) => DISTRICT_01_SCENES[sceneId] || null;

export const getDistrict01TravelTransition = (fromSceneId, toSceneId) =>
  DISTRICT_01_TRAVEL_TRANSITIONS[`${fromSceneId}:${toSceneId}`] || null;
