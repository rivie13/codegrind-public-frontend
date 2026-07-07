import { APARTMENT_CITY_ENTRY_STATE_INTRO } from '../../../utils/navigation/apartmentEntryState';
import { toAssetPath } from '../loadExternalTiledMap';
import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  createObjectAnchor,
  createMapPoint,
  createSyntheticZone,
  PREVIEW_SCENE_ACTOR_FRAME_CONFIG,
  PREVIEW_SCENE_ACTOR_VISUAL_CONFIG,
  PREVIEW_SCENE_DOOR_APPEARANCES,
  EXTERIOR_LEARNING_DOOR_ID,
  EXTERIOR_CHARGING_DOOR_ID,
  EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS,
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
  createSceneDoor,
  createDoorTransitionEffect,
  createSceneActorPoint,
  createExteriorNpcWalkPointTarget,
  createExteriorNpcNavGraphConfig,
  PREVIEW_SCENE_ACTOR_APPEARANCES,
} from './district01PreviewMapShared';

export const DISTRICT_01_PREVIEW_MAPS = {
  [DISTRICT_01_PREVIEW_LOCATION_IDS.apartment]: {
    defaultObjectivePointId: 'safehouse-terminal',
    defaultSpawn: createObjectAnchor('Spawns', 'PlayerSpawn'),
    id: DISTRICT_01_PREVIEW_LOCATION_IDS.apartment,
    interactions: {
      ApartmentExit: {
        desktopPrompt: 'Press E to leave the apartment',
        mobilePrompt: 'Tap Interact to leave the apartment.',
        kind: 'transition',
        requiresHubState: true,
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        targetSpawn: createObjectAnchor('Spawns', 'PLAYER_APARTMENT_SPAWN'),
        transitionWalkAxis: 'horizontal',
        transitionWalkTarget: APARTMENT_EXIT_WALK_TARGET,
      },
      [APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME]: {
        desktopPrompt: 'Press E to interact',
        hideWhenUnavailable: true,
        kind: 'terminal',
        requiresApartmentEntryState: APARTMENT_CITY_ENTRY_STATE_INTRO,
      },
      lookWindow: {
        desktopPrompt: 'Press E to look outside',
        kind: 'window',
        mobilePrompt: 'Tap Interact to look out the window.',
      },
    },
    hudLabel: 'Apartment',
    label: 'Apartment Safehouse',
    mapAssetPath: toAssetPath('city-v2/tiled/maps/district-01/apartment-seed.tmj'),
    mapCacheKey: 'city-phaser:district-01:apartment-seed',
    mapPoints: [
      createMapPoint('Interactables', APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME, {
        id: 'safehouse-terminal',
        kind: 'objective',
        label: 'Safehouse Terminal',
        shortLabel: 'TERM',
      }),
      createMapPoint('Exits', 'ApartmentExit', {
        anchor: 'top-center',
        id: 'apartment-exit',
        kind: 'travel',
        label: 'Apartment Exit',
        shortLabel: 'EXIT',
      }),
    ],
    supportsIntroSequence: true,
  },
  [DISTRICT_01_PREVIEW_LOCATION_IDS.exterior]: {
    ambientObjective: {
      footer:
        'Open the phone map to mark a stop, then press E at doors, field disks, or contact points.',
      hotkey: 'E',
      hudIcon: 'info',
      statusLabel: 'Street route',
      text: 'Inspect the field disk or enter a building.',
      title: 'Current Objective',
    },
    defaultObjectivePointId: null,
    defaultSpawn: createObjectAnchor('Spawns', 'PLAYER_APARTMENT_SPAWN'),
    hudLabel: 'Exterior',
    id: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
    interactions: {
      CLUSTER_MAP_BUILDING_ENTRANCE: {
        desktopPrompt: 'Press E to enter the office',
        mobilePrompt: 'Tap Interact to enter the office.',
        kind: 'transition',
        routeSurface: 'clusters',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
        targetSpawn: createObjectAnchor('Spawns', 'PlayerSpawn'),
        transitionWalkAxis: 'horizontal',
        transitionWalkTarget: EXTERIOR_CLUSTER_MAP_ENTRY_TARGET,
      },
      DATA_PACKET_STORE_ENTRANCE: {
        desktopPrompt: 'Press E to enter the bazaar',
        mobilePrompt: 'Tap Interact to enter the bazaar.',
        kind: 'transition',
        routeSurface: 'store',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar,
        targetSpawn: createObjectAnchor('Spawns', 'PlayerSpawn'),
        transitionWalkTarget: EXTERIOR_CHARGING_DOOR_APPROACH_TARGET,
        transitionEffect: createDoorTransitionEffect(
          PREVIEW_SCENE_DOOR_APPEARANCES.chargingStore,
          EXTERIOR_CHARGING_DOOR_TARGET,
          {
            facing: 'up',
            hideActorAfterMs: EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS,
            playerSnapTarget: EXTERIOR_CHARGING_DOOR_ENTRY_TARGET,
            sceneDoorId: EXTERIOR_CHARGING_DOOR_ID,
          }
        ),
      },
      LEARNING_PATH_BUILDING_ENTRANCE: {
        desktopPrompt: 'Press E to enter the studio',
        mobilePrompt: 'Tap Interact to enter the studio.',
        kind: 'transition',
        routeSurface: 'learning',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio,
        targetSpawn: createObjectAnchor(
          'Spawns',
          'DISTRICT_01_LEARNING_PATH_BUILDING_PLAYER_SPAWN'
        ),
        transitionWalkTarget: EXTERIOR_LEARNING_DOOR_APPROACH_TARGET,
        transitionEffect: createDoorTransitionEffect(
          PREVIEW_SCENE_DOOR_APPEARANCES.learning,
          EXTERIOR_LEARNING_DOOR_TARGET,
          {
            facing: 'up',
            hideActorAfterMs: EXTERIOR_DOOR_ENTRY_HIDE_ACTOR_AFTER_MS,
            playerSnapTarget: EXTERIOR_LEARNING_DOOR_ENTRY_TARGET,
            sceneDoorId: EXTERIOR_LEARNING_DOOR_ID,
          }
        ),
      },
      PLAYER_APARTMENT_BUILDING_ENTRANCE: {
        desktopPrompt: 'Press E to enter the apartment',
        mobilePrompt: 'Tap Interact to enter the apartment.',
        target: EXTERIOR_CHARGING_DOOR_APPROACH_TARGET,
        kind: 'transition',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.apartment,
        targetSpawn: createObjectAnchor('Exits', 'ApartmentExit', {
          anchor: 'top-center',
          offsetY: -12,
        }),
        transitionWalkAxis: 'horizontal',
        transitionWalkTarget: EXTERIOR_APARTMENT_ENTRY_TARGET,
      },
      DISTRICT_01_COLLECTABLE: {
        collectibleId: 'district-01-ada',
        target: EXTERIOR_CHARGING_DOOR_APPROACH_TARGET,
        kind: 'collectible',
        mobilePrompt: 'Tap Interact to inspect Ada.',
      },
      DISTRICT_01_LOCKDOWN_COP: {
        desktopPrompt: 'Press E to ask the officer about the lockdown',
        dialogue: {
          accentLabel: 'Port Meridian Police',
          footer:
            'The checkpoint stays active while the city chases the breach crew through District 01.',
          statusLabel: 'Checkpoint',
          text: 'Officer: "District 01 is locked down because hackers keep punching into the local mesh and spoofing doors, signage, and public terminals. Stay on the marked route, keep your device off untrusted ports, and do not cross any sealed access lines."',
          title: 'District 01 Lockdown',
          typingProfile: 'sysadmin',
        },
        display: {
          assetPath: toAssetPath(
            'city-v2/tiled/exteriors/PixelEdgeCity - PREMIUM/Assets/Characters/No Hands/NH_Police/FRONT/Police_idle_FRONT_anim.png'
          ),
          depth: 138,
          frame: 0,
          frameConfig: PREVIEW_SCENE_ACTOR_FRAME_CONFIG,
          kind: 'sprite',
          originX: 0.5,
          originY: PREVIEW_SCENE_ACTOR_VISUAL_CONFIG.originY,
          scale: PREVIEW_SCENE_ACTOR_VISUAL_CONFIG.scale,
          shadow: {
            alpha: 0.2,
            height: 6,
            width: 16,
          },
          textureKey: 'city-preview-npc:district-01-lockdown-cop',
          x: 486,
          y: 244,
        },
        kind: 'dialogue',
        mobilePrompt: 'Tap Interact to ask the officer about the lockdown.',
        zone: createSyntheticZone(470, 220, 32, 24),
      },
    },
    label: 'District 01 Exterior',
    mapAssetPath: toAssetPath('city-v2/tiled/maps/district-01/exterior-seed.tmj'),
    mapCacheKey: 'city-phaser:district-01:exterior-seed',
    mapPoints: [
      createMapPoint('Interactables', 'PLAYER_APARTMENT_BUILDING_ENTRANCE', {
        id: 'apartment-home',
        kind: 'home',
        label: 'Apartment',
        shortLabel: 'HOME',
      }),
      createMapPoint('Interactables', 'LEARNING_PATH_BUILDING_ENTRANCE', {
        id: 'learning-path',
        kind: 'learning',
        label: 'Learning Path',
        routeSurface: 'learning',
        shortLabel: 'LEARN',
        targetPath: '/learning',
      }),
      createMapPoint('Interactables', 'CLUSTER_MAP_BUILDING_ENTRANCE', {
        id: 'cluster-map',
        kind: 'clusters',
        label: 'Cluster Map',
        routeSurface: 'clusters',
        shortLabel: 'CLUST',
        targetPath: '/games/clusters',
      }),
      createMapPoint('Interactables', 'DATA_PACKET_STORE_ENTRANCE', {
        id: 'data-packet-store',
        kind: 'store',
        label: 'Data Packet Store',
        routeSurface: 'store',
        shortLabel: 'STORE',
        targetPath: '/store',
      }),
    ],
    sceneDoors: [
      createSceneDoor(
        EXTERIOR_LEARNING_DOOR_ID,
        PREVIEW_SCENE_DOOR_APPEARANCES.learning,
        EXTERIOR_LEARNING_DOOR_TARGET
      ),
      createSceneDoor(
        EXTERIOR_CHARGING_DOOR_ID,
        PREVIEW_SCENE_DOOR_APPEARANCES.chargingStore,
        EXTERIOR_CHARGING_DOOR_TARGET
      ),
    ],
    sceneActors: [
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.exteriorApartmentResident,
        id: 'district-01-apartment-resident-01',
        navGraph: createExteriorNpcNavGraphConfig({
          avoidedTags: ['burger', 'center', 'store'],
          nodeWeightMultipliers: {
            DISTRICT_01_BURGER_TRUCK_ORDER: 1.25,
            DISTRICT_01_BURGR_TRUCK_HANGOUT: 1.25,
            DISTRICT_01_EXPLORE_02: 1.2,
            DISTRICT_01_EXPLORE_04: 1.8,
            DISTRICT_01_EXPLORE_05: 2.2,
            DISTRICT_01_NPC_ENTER_APARTMENT: 2.5,
          },
          preferredTags: ['apartment', 'east-side', 'right-side'],
        }),
        spawn: createExteriorNpcWalkPointTarget('DISTRICT_01_NPC_ENTER_APARTMENT'),
        speed: 30,
      },
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.exteriorShopper,
        id: 'district-01-shopper-01',
        navGraph: createExteriorNpcNavGraphConfig({
          avoidedTags: ['apartment', 'center'],
          nodeWeightMultipliers: {
            DISTRICT_01_BURGER_TRUCK_ORDER: 4,
            DISTRICT_01_BURGR_TRUCK_HANGOUT: 3.2,
            DISTRICT_01_EXPLORE_01: 1.8,
            DISTRICT_01_NPC_ENTER_STORE: 2.4,
          },
          preferredTags: ['burger', 'crosswalk', 'left-side', 'store'],
        }),
        spawn: createExteriorNpcWalkPointTarget('DISTRICT_01_NPC_ENTER_STORE'),
        speed: 28,
      },
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.exteriorWalker,
        id: 'district-01-upper-right-looper-01',
        navGraph: createExteriorNpcNavGraphConfig({
          avoidedTags: ['burger', 'center', 'store'],
          nodeWeightMultipliers: {
            DISTRICT_01_EXPLORE_02: 2.2,
            DISTRICT_01_EXPLORE_04: 2.1,
            DISTRICT_01_EXPLORE_05: 1.7,
            DISTRICT_01_NPC_ENTER_APARTMENT: 2,
          },
          preferredTags: ['apartment', 'east-side', 'right-side', 'upper-right'],
        }),
        spawn: createExteriorNpcWalkPointTarget('DISTRICT_01_EXPLORE_02'),
        speed: 26,
      },
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.exteriorWalker,
        id: 'district-01-walker-01',
        navGraph: createExteriorNpcNavGraphConfig({
          avoidedTags: ['apartment', 'store'],
          nodeWeightMultipliers: {
            DISTRICT_01_BURGER_TRUCK_ORDER: 3.4,
            DISTRICT_01_BURGR_TRUCK_HANGOUT: 2.7,
            DISTRICT_01_EXPLORE_01: 1.6,
            DISTRICT_01_EXPLORE_03: 1.2,
            DISTRICT_01_NPC_ENTER_STORE: 1.7,
          },
          preferredTags: ['burger', 'center', 'left-side', 'south-side'],
        }),
        spawn: createExteriorNpcWalkPointTarget('DISTRICT_01_EXPLORE_03'),
        speed: 28,
      },
    ],
    supportsIntroSequence: false,
  },
  [DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio]: {
    ambientObjective: {
      footer: 'Press E at the Street Sandbox terminal or at the exit to head back outside.',
      hotkey: 'E',
      hudIcon: 'terminal',
      statusLabel: 'Sandbox route',
      text: 'The Street Sandbox terminal is live in this room. Tap the line or head back outside.',
      title: 'Current Objective',
    },
    defaultObjectivePointId: null,
    defaultSpawn: createObjectAnchor('Spawns', 'DISTRICT_01_LEARNING_PATH_BUILDING_PLAYER_SPAWN'),
    id: DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio,
    interactions: {
      DISTRICT_01_LEARNING_PATH_BUILDING_EXIT_01: {
        desktopPrompt: 'Press E to head back outside',
        mobilePrompt: 'Tap Interact to head back outside.',
        kind: 'transition',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        targetSpawn: createObjectAnchor('Collision', 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT', {
          anchor: 'bottom-center',
          offsetY: 12,
        }),
        transitionEffect: createDoorTransitionEffect(
          PREVIEW_SCENE_DOOR_APPEARANCES.learning,
          createObjectAnchor('Exits', 'DISTRICT_01_LEARNING_PATH_BUILDING_EXIT_01', {
            anchor: 'bottom-center',
          }),
          {
            facing: 'down',
          }
        ),
      },
      DISTRICT_01_LEARNING_PATH_BUILDING_EXIT_02: {
        desktopPrompt: 'Press E to head back outside',
        mobilePrompt: 'Tap Interact to head back outside.',
        kind: 'transition',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        targetSpawn: createObjectAnchor('Collision', 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT', {
          anchor: 'bottom-center',
          offsetY: 12,
        }),
        transitionEffect: createDoorTransitionEffect(
          PREVIEW_SCENE_DOOR_APPEARANCES.learning,
          createObjectAnchor('Exits', 'DISTRICT_01_LEARNING_PATH_BUILDING_EXIT_02', {
            anchor: 'bottom-center',
          }),
          {
            facing: 'down',
          }
        ),
      },
      DISTRICT_01_LEARNING_PATH_BUILDING_TERMINAL_INTERACTION_ZONE: {
        desktopPrompt: 'Press E to open the sandbox rig',
        mobilePrompt: 'Tap Interact to open the sandbox rig.',
        kind: 'terminal',
        routeSurface: 'learning',
        terminalName: 'Street Sandbox Terminal',
      },
    },
    label: 'Module Guide Studio',
    mapAssetPath: toAssetPath('city-v2/tiled/maps/district-01/learning-path-building-interior.tmj'),
    mapCacheKey: 'city-phaser:district-01:learning-path-building-interior',
    mapPoints: [],
    supportsIntroSequence: false,
  },
  [DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice]: {
    ambientObjective: {
      footer: 'Press E at the broker terminal or at the exit to step back into the street.',
      hotkey: 'E',
      hudIcon: 'terminal',
      statusLabel: 'Broker route',
      text: "Broker's Core is live in this office. Tap the line when you are ready, or head back outside.",
      title: 'Current Objective',
    },
    defaultObjectivePointId: null,
    defaultSpawn: createObjectAnchor('Spawns', 'PlayerSpawn'),
    id: DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
    interactions: {
      DISTRICT_01_CLUSTER_MAP_BUILDING_EXIT: {
        desktopPrompt: 'Press E to head back outside',
        mobilePrompt: 'Tap Interact to head back outside.',
        kind: 'transition',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        targetSpawn: createObjectAnchor('Interactables', 'CLUSTER_MAP_BUILDING_ENTRANCE', {
          anchor: 'bottom-center',
          offsetY: 12,
        }),
        transitionWalkTarget: CLUSTER_MAP_BUILDING_EXIT_WALK_TARGET,
      },
      DISTRICT_01_CLUSTER_MAP_TERMINAL_INTERACTION_ZONE: {
        desktopPrompt: 'Press E to tap the broker line',
        mobilePrompt: 'Tap Interact to tap the broker line.',
        kind: 'terminal',
        routeSurface: 'clusters',
        terminalName: "Broker's Core Terminal",
      },
    },
    label: 'Array Fixer Office',
    mapAssetPath: toAssetPath('city-v2/tiled/maps/district-01/cluster-map-building-interior.tmj'),
    mapCacheKey: 'city-phaser:district-01:cluster-map-building-interior',
    mapPoints: [],
    supportsIntroSequence: false,
  },
  [DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar]: {
    ambientObjective: {
      footer: 'Press E at the bazaar counter or at the exit to head back outside.',
      hotkey: 'E',
      hudIcon: 'terminal',
      statusLabel: 'Bazaar route',
      text: 'The Packet Bazaar clerk is on duty behind the counter. Talk to the clerk or step back outside.',
      title: 'Current Objective',
    },
    defaultObjectivePointId: null,
    defaultSpawn: createObjectAnchor('Spawns', 'PlayerSpawn'),
    id: DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar,
    interactions: {
      DISTRICT_01_DATA_PACKET_SHOP_EXIT: {
        desktopPrompt: 'Press E to head back outside',
        mobilePrompt: 'Tap Interact to head back outside.',
        kind: 'transition',
        targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        targetSpawn: createObjectAnchor('Collision', 'DATA_PACKET_STORE_DOOR_PLACEMENT', {
          anchor: 'bottom-center',
          offsetY: 12,
        }),
        transitionEffect: createDoorTransitionEffect(
          PREVIEW_SCENE_DOOR_APPEARANCES.chargingStore,
          createObjectAnchor('Exits', 'DISTRICT_01_DATA_PACKET_SHOP_EXIT', {
            anchor: 'bottom-center',
          }),
          {
            facing: 'down',
          }
        ),
      },
      DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE: {
        desktopPrompt: 'Press E to talk to the bazaar clerk',
        kind: 'terminal',
        mobilePrompt: 'Tap Interact to talk to the bazaar clerk.',
        routeSurface: 'store',
        terminalName: 'Packet Bazaar Terminal',
      },
    },
    label: 'Packet Bazaar',
    mapAssetPath: toAssetPath('city-v2/tiled/maps/district-01/data-packet-store-interior.tmj'),
    mapCacheKey: 'city-phaser:district-01:data-packet-store-interior',
    mapPoints: [],
    sceneActors: [
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.bazaarClerk,
        collidesWithWorld: false,
        depth: 124,
        facing: 'down',
        id: 'packet-bazaar-clerk-01',
        interactionName: 'DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE',
        spawn: createObjectAnchor(
          'Interactables',
          'DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE',
          {
            anchor: 'center',
            offsetY: 10,
          }
        ),
      },
      {
        appearance: PREVIEW_SCENE_ACTOR_APPEARANCES.bazaarBrowser,
        id: 'packet-bazaar-browser-01',
        route: [
          createSceneActorPoint(320, 350, {
            waitMs: 220,
          }),
          createSceneActorPoint(252, 336, {
            waitMs: 220,
          }),
          createSceneActorPoint(188, 314, {
            waitMs: 260,
          }),
          createSceneActorPoint(262, 334, {
            waitMs: 240,
          }),
          createSceneActorPoint(360, 352, {
            waitMs: 260,
          }),
        ],
        spawn: {
          x: 392,
          y: 350,
        },
        speed: 22,
      },
    ],
    supportsIntroSequence: false,
  },
};
