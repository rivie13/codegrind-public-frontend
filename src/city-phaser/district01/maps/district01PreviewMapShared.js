import { toAssetPath } from '../loadExternalTiledMap';

export const DISTRICT_01_PREVIEW_LOCATION_IDS = {
  apartment: 'apartment-room-01',
  clusterMapOffice: 'array-fixer-office-01',
  exterior: 'exterior-seed',
  learningStudio: 'learning-module-guide-01',
  packetBazaar: 'packet-bazaar-interior-01',
};

export const APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME = 'APARTMENT_TEMINAL_INTERACTION_ZONE';

const LEGACY_INTERACTION_NAME_ALIASES = {
  Terminal_Interaction_Point: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
};

const PREVIEW_ROUTE_SURFACES = new Set(['learning', 'clusters', 'store']);
const GUEST_TRIAL_TRACKS = new Set(['beginner', 'pro']);

const normalizePreviewRouteSurface = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return PREVIEW_ROUTE_SURFACES.has(normalized) ? normalized : null;
};

const normalizeGuestTrialTrack = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return GUEST_TRIAL_TRACKS.has(normalized) ? normalized : null;
};

const getGuestPreviewInteractionRestriction = ({
  guestPhoneContext = null,
  interaction = null,
}) => {
  if (!guestPhoneContext || typeof guestPhoneContext !== 'object') {
    return null;
  }

  if (guestPhoneContext.isAuthenticated === true) {
    return null;
  }

  const routeSurface = normalizePreviewRouteSurface(interaction?.routeSurface);

  if (!routeSurface) {
    return null;
  }

  const selectedTrialTrack = normalizeGuestTrialTrack(guestPhoneContext.selectedTrialTrack);

  if (routeSurface === 'store') {
    return {
      code: 'store-signin-required',
      routeSurface,
      selectedTrialTrack,
    };
  }

  if (selectedTrialTrack === 'beginner' && routeSurface === 'clusters') {
    return {
      code: 'track-route-locked',
      routeSurface,
      selectedTrialTrack,
    };
  }

  if (selectedTrialTrack === 'pro' && routeSurface === 'learning') {
    return {
      code: 'track-route-locked',
      routeSurface,
      selectedTrialTrack,
    };
  }

  return null;
};

const createObjectAnchor = (layerName, objectName, options = {}) => ({
  anchor: options.anchor || 'object-origin',
  layerName,
  objectName,
  offsetX: options.offsetX ?? 0,
  offsetY: options.offsetY ?? 0,
});

const createMapPoint = (layerName, objectName, options = {}) => ({
  anchor: options.anchor || 'center',
  id: options.id || objectName,
  kind: options.kind || 'poi',
  label: options.label || objectName,
  layerName,
  objectName,
  routeSurface: options.routeSurface || null,
  shortLabel: options.shortLabel || options.label || objectName,
  targetPath: options.targetPath || null,
});

const createSyntheticZone = (x, y, width, height) => ({
  height,
  width,
  x,
  y,
});

const PREVIEW_SCENE_ACTOR_ASSET_ROOT =
  'city-v2/tiled/exteriors/PixelEdgeCity - PREMIUM/Assets/Characters/No Hands';
const PREVIEW_SCENE_ACTOR_FRAME_CONFIG = Object.freeze({
  frameHeight: 48,
  frameWidth: 64,
});
const PREVIEW_SCENE_ACTOR_VISUAL_CONFIG = Object.freeze({
  bodyOffsetY: 24,
  originY: 32 / 48,
  scale: 1.3,
});
const PREVIEW_SCENE_BUILDING_LIGHT_DOOR_ASSET_ROOT =
  'city-v2/tiled/raw/district-01/exteriors/pixel-edge-city/objects/machinery/building-lights';
const PREVIEW_SCENE_DOOR_FRAME_CONFIG = Object.freeze({
  frameHeight: 32,
  frameWidth: 16,
});
const PREVIEW_SCENE_CHARGING_DOOR_FRAME_CONFIG = Object.freeze({
  frameHeight: 32,
  frameWidth: 32,
});
const PREVIEW_SCENE_DOUBLE_DOOR_FRAME_CONFIG = Object.freeze({
  frameHeight: 32,
  frameWidth: 32,
});

const createPecDoorAppearance = (appearanceId, assetPath, options = {}) => ({
  animationKeyPrefix: `city-preview-door:${appearanceId}`,
  depth: options.depth ?? 136,
  frameConfig: options.frameConfig ?? PREVIEW_SCENE_DOOR_FRAME_CONFIG,
  frameCount: options.frameCount ?? 4,
  originX: options.originX ?? 0.5,
  originY: options.originY ?? 1,
  scale: options.scale ?? 1,
  textureKey: `city-preview-door:${appearanceId}:sheet`,
  assetPath: toAssetPath(assetPath),
});

const createPecSceneActorAppearance = (appearanceId, folderName, filePrefix, options = {}) => ({
  animationKeyPrefix: `city-preview-scene-actor:${appearanceId}`,
  depth: options.depth ?? 138,
  frameConfig: PREVIEW_SCENE_ACTOR_FRAME_CONFIG,
  idleFrameCount: options.idleFrameCount ?? 4,
  originY: options.originY ?? PREVIEW_SCENE_ACTOR_VISUAL_CONFIG.originY,
  scale: options.scale ?? PREVIEW_SCENE_ACTOR_VISUAL_CONFIG.scale,
  shadow: {
    alpha: options.shadow?.alpha ?? 0.2,
    height: options.shadow?.height ?? 6,
    width: options.shadow?.width ?? 16,
  },
  textures: {
    idleDown: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/FRONT/${filePrefix}_idle_FRONT_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:idle:down`,
    },
    idleSide: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/SIDE/${filePrefix}_idle_SIDE_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:idle:side`,
    },
    idleUp: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/BACK/${filePrefix}_idle_BACK_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:idle:up`,
    },
    walkDown: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/FRONT/${filePrefix}_walk_FRONT_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:walk:down`,
    },
    walkSide: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/SIDE/${filePrefix}_walk_SIDE_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:walk:side`,
    },
    walkUp: {
      assetPath: toAssetPath(
        `${PREVIEW_SCENE_ACTOR_ASSET_ROOT}/${folderName}/BACK/${filePrefix}_walk_BACK_anim.png`
      ),
      key: `city-preview-scene-actor:${appearanceId}:walk:up`,
    },
  },
  walkFrameCount: options.walkFrameCount ?? 8,
});

const PREVIEW_SCENE_DOOR_APPEARANCES = Object.freeze({
  chargingStore: createPecDoorAppearance(
    'district-01-charging-store-door-01',
    'city-v2/tiled/raw/district-01/exteriors/pixel-edge-city/premade/charging/animated/Charging_Station_Layer_5_door_anim.png',
    {
      frameConfig: PREVIEW_SCENE_CHARGING_DOOR_FRAME_CONFIG,
      frameCount: 6,
    }
  ),
  learning: createPecDoorAppearance(
    'district-01-learning-door-01',
    `${PREVIEW_SCENE_BUILDING_LIGHT_DOOR_ASSET_ROOT}/Blue_Door_2_anim.png`,
    {
      frameConfig: PREVIEW_SCENE_DOUBLE_DOOR_FRAME_CONFIG,
      frameCount: 4,
    }
  ),
});

const EXTERIOR_LEARNING_DOOR_ID = 'district-01-exterior-learning-door-01';
const EXTERIOR_CHARGING_DOOR_ID = 'district-01-exterior-charging-door-01';
const EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS = 20;
const EXTERIOR_DOOR_ENTRY_SNAP_OFFSET_Y = -6;
const EXTERIOR_SCENE_VISIT_DWELL_RANGE_MS = Object.freeze({
  max: 15000,
  min: 10000,
});
const EXTERIOR_LEARNING_DOOR_TARGET = createObjectAnchor(
  'Collision',
  'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
  }
);
const EXTERIOR_LEARNING_DOOR_ENTRY_TARGET = createObjectAnchor(
  'Collision',
  'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: EXTERIOR_DOOR_ENTRY_SNAP_OFFSET_Y,
  }
);
const EXTERIOR_LEARNING_DOOR_APPROACH_TARGET = createObjectAnchor(
  'Collision',
  'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: 10,
  }
);
const EXTERIOR_CHARGING_DOOR_TARGET = createObjectAnchor(
  'Collision',
  'DATA_PACKET_STORE_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
  }
);
const EXTERIOR_CHARGING_DOOR_ENTRY_TARGET = createObjectAnchor(
  'Collision',
  'DATA_PACKET_STORE_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: EXTERIOR_DOOR_ENTRY_SNAP_OFFSET_Y,
  }
);
const EXTERIOR_CHARGING_DOOR_APPROACH_TARGET = createObjectAnchor(
  'Collision',
  'DATA_PACKET_STORE_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: 10,
  }
);
const EXTERIOR_APARTMENT_ENTRY_TARGET = createObjectAnchor(
  'Interactables',
  'PLAYER_APARTMENT_BUILDING_ENTRANCE',
  {
    anchor: 'right-center',
  }
);
const EXTERIOR_CLUSTER_MAP_ENTRY_TARGET = createObjectAnchor(
  'Interactables',
  'CLUSTER_MAP_BUILDING_ENTRANCE',
  {
    anchor: 'left-center',
  }
);
const APARTMENT_EXIT_WALK_TARGET = createObjectAnchor('Exits', 'ApartmentExit', {
  anchor: 'left-center',
});
const CLUSTER_MAP_BUILDING_EXIT_WALK_TARGET = createObjectAnchor(
  'Exits',
  'DISTRICT_01_CLUSTER_MAP_BUILDING_EXIT',
  {
    anchor: 'bottom-center',
  }
);
const EXTERIOR_CHARGING_DOOR_EXIT_TARGET = createObjectAnchor(
  'Collision',
  'DATA_PACKET_STORE_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: 20,
  }
);
const EXTERIOR_CHARGING_STORE_TRIGGER_TARGET = createObjectAnchor(
  'Interactables',
  'DATA_PACKET_STORE_ENTRANCE',
  {
    anchor: 'center',
  }
);
const EXTERIOR_CHARGING_DOOR_WALKOUT_TARGET = createObjectAnchor(
  'Collision',
  'DATA_PACKET_STORE_DOOR_PLACEMENT',
  {
    anchor: 'bottom-center',
    offsetY: 40,
  }
);

const createSceneDoor = (id, appearance, target, options = {}) => ({
  appearance,
  closedFrame: options.closedFrame ?? 0,
  depth: options.depth,
  id,
  offsetX: options.offsetX ?? 0,
  offsetY: options.offsetY ?? 0,
  target,
});

const createDoorTransitionEffect = (appearance, target, options = {}) => ({
  appearance,
  closeDelayMs: options.closeDelayMs ?? 160,
  completeAfterMs: options.completeAfterMs ?? 720,
  depth: options.depth,
  facing: options.facing || null,
  hideActorAfterMs: options.hideActorAfterMs ?? 180,
  overlayTarget: target,
  offsetX: options.offsetX ?? 0,
  offsetY: options.offsetY ?? 0,
  playerSnapTarget: options.playerSnapTarget || target,
  playerSnapOffsetX: options.playerSnapOffsetX ?? 0,
  playerSnapOffsetY: options.playerSnapOffsetY ?? 0,
  sceneDoorId: options.sceneDoorId || null,
  showActorAfterMs: options.showActorAfterMs ?? null,
});

const createSceneActorPoint = (x, y, options = {}) => ({
  arrivalDistance: options.arrivalDistance ?? 4,
  facing: options.facing || null,
  nextRouteIndex: options.nextRouteIndex,
  nextRouteIndexChoices: options.nextRouteIndexChoices ?? null,
  speed: options.speed,
  target: { x, y },
  transition: options.transition || null,
  waitMs: options.waitMs ?? 0,
});

const createSceneActorObjectPoint = (layerName, objectName, options = {}) => ({
  arrivalDistance: options.arrivalDistance ?? 4,
  facing: options.facing || null,
  nextRouteIndex: options.nextRouteIndex,
  nextRouteIndexChoices: options.nextRouteIndexChoices ?? null,
  speed: options.speed,
  target: createObjectAnchor(layerName, objectName, {
    anchor: options.anchor || 'center',
    offsetX: options.offsetX ?? 0,
    offsetY: options.offsetY ?? 0,
  }),
  transition: options.transition || null,
  waitMs: options.waitMs ?? 0,
});

const createSceneActorTransition = (resumeTarget, options = {}) => ({
  effect: options.effect || null,
  exitEffect: options.exitEffect || null,
  hiddenDurationMs: options.hiddenDurationMs ?? 1200,
  hiddenDurationRangeMs: options.hiddenDurationRangeMs || null,
  hideActorImmediately: options.hideActorImmediately === true,
  nextRouteIndex: options.nextRouteIndex,
  nextRouteIndexChoices: options.nextRouteIndexChoices ?? null,
  resumeFacing: options.resumeFacing || null,
  resumeWaitMs: options.resumeWaitMs ?? 0,
  resumeTarget,
  showActorAfterMs: options.showActorAfterMs ?? null,
});

const EXTERIOR_NPC_WALK_POINT_LAYER_NAME = 'NPCWalkPoints';

const createExteriorNpcWalkPointTarget = (objectName, options = {}) =>
  createObjectAnchor(EXTERIOR_NPC_WALK_POINT_LAYER_NAME, objectName, {
    anchor: options.anchor || 'object-origin',
    offsetX: options.offsetX ?? 0,
    offsetY: options.offsetY ?? 0,
  });

const EXTERIOR_NPC_WALK_GRAPH = Object.freeze({
  crosswalkPairs: Object.freeze([
    Object.freeze(['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT']),
    Object.freeze(['DISTRICT_01_CROSSWALK_02_LEFT', 'DISTRICT_01_CROSSWALK_02_RIGHT']),
  ]),
  defaultWaitRangeMs: Object.freeze({
    max: 1800,
    min: 700,
  }),
  layerName: EXTERIOR_NPC_WALK_POINT_LAYER_NAME,
  maxNeighbors: 4,
  nodeOverrides: Object.freeze({
    DISTRICT_01_NPC_ENTER_APARTMENT: Object.freeze({
      facing: 'up',
      target: createExteriorNpcWalkPointTarget('DISTRICT_01_NPC_ENTER_APARTMENT'),
      transition: createSceneActorTransition(
        createExteriorNpcWalkPointTarget('DISTRICT_01_NPC_ENTER_APARTMENT'),
        {
          hiddenDurationRangeMs: EXTERIOR_SCENE_VISIT_DWELL_RANGE_MS,
          resumeFacing: 'down',
        }
      ),
      waitMs: 0,
    }),
    DISTRICT_01_NPC_ENTER_STORE: Object.freeze({
      arrivalDistance: 16,
      facing: 'up',
      target: EXTERIOR_CHARGING_STORE_TRIGGER_TARGET,
      transition: createSceneActorTransition(
        createExteriorNpcWalkPointTarget('DISTRICT_01_NPC_ENTER_STORE'),
        {
          effect: createDoorTransitionEffect(
            PREVIEW_SCENE_DOOR_APPEARANCES.chargingStore,
            EXTERIOR_CHARGING_DOOR_TARGET,
            {
              facing: 'up',
              hideActorAfterMs: EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS,
              playerSnapTarget: EXTERIOR_CHARGING_DOOR_ENTRY_TARGET,
              sceneDoorId: EXTERIOR_CHARGING_DOOR_ID,
            }
          ),
          exitEffect: createDoorTransitionEffect(
            PREVIEW_SCENE_DOOR_APPEARANCES.chargingStore,
            EXTERIOR_CHARGING_DOOR_TARGET,
            {
              facing: 'down',
              sceneDoorId: EXTERIOR_CHARGING_DOOR_ID,
            }
          ),
          hiddenDurationRangeMs: EXTERIOR_SCENE_VISIT_DWELL_RANGE_MS,
          hideActorImmediately: true,
          resumeFacing: 'down',
        }
      ),
      waitMs: 0,
    }),
  }),
  nodeTags: Object.freeze({
    DISTRICT_01_BURGER_TRUCK_ORDER: Object.freeze(['burger', 'hangout', 'left-side']),
    DISTRICT_01_BURGR_TRUCK_HANGOUT: Object.freeze(['burger', 'hangout', 'left-side']),
    DISTRICT_01_CROSSWALK_02_LEFT: Object.freeze(['crosswalk', 'left-side', 'south-crosswalk']),
    DISTRICT_01_CROSSWALK_02_RIGHT: Object.freeze(['crosswalk', 'right-side', 'south-crosswalk']),
    DISTRICT_01_CROSSWALK_LEFT: Object.freeze(['crosswalk', 'left-side', 'north-crosswalk']),
    DISTRICT_01_CROSSWALK_RIGHT: Object.freeze(['crosswalk', 'right-side', 'north-crosswalk']),
    DISTRICT_01_EXPLORE_01: Object.freeze(['east-side', 'hangout', 'south-side']),
    DISTRICT_01_EXPLORE_02: Object.freeze(['east-side', 'hangout', 'upper-right']),
    DISTRICT_01_EXPLORE_03: Object.freeze(['hangout', 'south-side']),
    DISTRICT_01_EXPLORE_04: Object.freeze(['center', 'hangout', 'right-side']),
    DISTRICT_01_EXPLORE_05: Object.freeze(['center', 'hangout', 'right-side']),
    DISTRICT_01_NPC_ENTER_APARTMENT: Object.freeze(['apartment', 'right-side', 'transition']),
    DISTRICT_01_NPC_ENTER_STORE: Object.freeze(['right-side', 'store', 'transition']),
  }),
  nodeWaitRangesMs: Object.freeze({
    DISTRICT_01_BURGER_TRUCK_ORDER: Object.freeze({
      max: 2600,
      min: 1400,
    }),
    DISTRICT_01_BURGR_TRUCK_HANGOUT: Object.freeze({
      max: 2600,
      min: 1500,
    }),
    DISTRICT_01_CROSSWALK_02_LEFT: Object.freeze({
      max: 500,
      min: 180,
    }),
    DISTRICT_01_CROSSWALK_02_RIGHT: Object.freeze({
      max: 500,
      min: 180,
    }),
    DISTRICT_01_CROSSWALK_LEFT: Object.freeze({
      max: 500,
      min: 180,
    }),
    DISTRICT_01_CROSSWALK_RIGHT: Object.freeze({
      max: 500,
      min: 180,
    }),
    DISTRICT_01_NPC_ENTER_APARTMENT: Object.freeze({
      max: 900,
      min: 350,
    }),
    DISTRICT_01_NPC_ENTER_STORE: Object.freeze({
      max: 900,
      min: 350,
    }),
  }),
});

const createExteriorNpcNavGraphConfig = (options = {}) => ({
  ...EXTERIOR_NPC_WALK_GRAPH,
  avoidedTags: options.avoidedTags ? [...options.avoidedTags] : [],
  nodeWeightMultipliers: {
    ...(options.nodeWeightMultipliers || {}),
  },
  preferredTags: options.preferredTags ? [...options.preferredTags] : [],
});

const PREVIEW_SCENE_ACTOR_APPEARANCES = Object.freeze({
  bazaarBrowser: createPecSceneActorAppearance(
    'packet-bazaar-browser-01',
    'NH_Character 10',
    'Char_10'
  ),
  bazaarClerk: createPecSceneActorAppearance('packet-bazaar-clerk-01', 'NH_Character 5', 'Char_5', {
    depth: 124,
    shadow: {
      width: 14,
    },
  }),
  exteriorApartmentResident: createPecSceneActorAppearance(
    'district-01-apartment-resident-01',
    'NH_Character 1',
    'Char_1'
  ),
  exteriorShopper: createPecSceneActorAppearance(
    'district-01-shopper-01',
    'NH_Character 3',
    'Char_3'
  ),
  exteriorWalker: createPecSceneActorAppearance(
    'district-01-walker-01',
    'NH_Character 7',
    'Char_7'
  ),
});

export {
  LEGACY_INTERACTION_NAME_ALIASES,
  PREVIEW_ROUTE_SURFACES,
  GUEST_TRIAL_TRACKS,
  normalizePreviewRouteSurface,
  normalizeGuestTrialTrack,
  getGuestPreviewInteractionRestriction,
  createObjectAnchor,
  createMapPoint,
  createSyntheticZone,
  PREVIEW_SCENE_ACTOR_ASSET_ROOT,
  PREVIEW_SCENE_ACTOR_FRAME_CONFIG,
  PREVIEW_SCENE_ACTOR_VISUAL_CONFIG,
  PREVIEW_SCENE_BUILDING_LIGHT_DOOR_ASSET_ROOT,
  PREVIEW_SCENE_DOOR_FRAME_CONFIG,
  PREVIEW_SCENE_CHARGING_DOOR_FRAME_CONFIG,
  PREVIEW_SCENE_DOUBLE_DOOR_FRAME_CONFIG,
  createPecDoorAppearance,
  createPecSceneActorAppearance,
  PREVIEW_SCENE_DOOR_APPEARANCES,
  EXTERIOR_LEARNING_DOOR_ID,
  EXTERIOR_CHARGING_DOOR_ID,
  EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS,
  EXTERIOR_DOOR_ENTRY_SNAP_OFFSET_Y,
  EXTERIOR_SCENE_VISIT_DWELL_RANGE_MS,
  EXTERIOR_LEARNING_DOOR_TARGET,
  EXTERIOR_LEARNING_DOOR_ENTRY_TARGET,
  EXTERIOR_LEARNING_DOOR_APPROACH_TARGET,
  EXTERIOR_CHARGING_DOOR_TARGET,
  EXTERIOR_CHARGING_DOOR_ENTRY_TARGET,
  EXTERIOR_CHARGING_DOOR_APPROACH_TARGET,
  EXTERIOR_APARTMENT_ENTRY_TARGET,
  EXTERIOR_CLUSTER_MAP_ENTRY_TARGET,
  APARTMENT_EXIT_WALK_TARGET,
  CLUSTER_MAP_BUILDING_EXIT_WALK_TARGET,
  EXTERIOR_CHARGING_DOOR_EXIT_TARGET,
  EXTERIOR_CHARGING_STORE_TRIGGER_TARGET,
  EXTERIOR_CHARGING_DOOR_WALKOUT_TARGET,
  createSceneDoor,
  createDoorTransitionEffect,
  createSceneActorPoint,
  createSceneActorObjectPoint,
  createSceneActorTransition,
  EXTERIOR_NPC_WALK_POINT_LAYER_NAME,
  createExteriorNpcWalkPointTarget,
  EXTERIOR_NPC_WALK_GRAPH,
  createExteriorNpcNavGraphConfig,
  PREVIEW_SCENE_ACTOR_APPEARANCES,
};
