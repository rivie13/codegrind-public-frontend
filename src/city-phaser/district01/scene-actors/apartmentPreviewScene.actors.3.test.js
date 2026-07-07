import { describe, expect, it, vi } from 'vitest';

import {
  createShadow,
  createSprite,
  createPointObject,
  createScene,
} from './sceneActorTestHelpers';

describe('apartmentPreviewScene actors 3', () => {
  it('plans an authored crosswalk traversal from NPCWalkPoints and arms the cooldown on crosswalk arrival', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_NPC_ENTER_STORE', 256, 196),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT']],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeTags: {
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk'],
            DISTRICT_01_NPC_ENTER_STORE: ['store'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_CROSSWALK_RIGHT: 50,
            DISTRICT_01_NPC_ENTER_STORE: 1,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_CROSSWALK_LEFT',
        },
      },
      navState: {
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_CROSSWALK_LEFT',
        lastDestinationNodeName: null,
      },
      sprite: createSprite(104, 74),
    };

    const route = scene.planSceneActorNavRoute(entry);

    expect(route).toHaveLength(1);
    expect(route[0]).toMatchObject({
      navCrosswalkCooldownActiveOnArrival: true,
      navNodeName: 'DISTRICT_01_CROSSWALK_RIGHT',
      navShouldPlanNextRoute: true,
    });

    randomSpy.mockRestore();
  });

  it('forces a non-crosswalk follow-up after a crosswalk arrival cooldown is active', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_NPC_ENTER_STORE', 256, 196),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT']],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeTags: {
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk'],
            DISTRICT_01_NPC_ENTER_STORE: ['store'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_CROSSWALK_LEFT: 50,
            DISTRICT_01_NPC_ENTER_STORE: 3,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_CROSSWALK_RIGHT',
        },
      },
      navState: {
        crosswalkCooldownActive: true,
        currentNodeName: 'DISTRICT_01_CROSSWALK_RIGHT',
        lastDestinationNodeName: null,
      },
      sprite: createSprite(176, 74),
    };

    const route = scene.planSceneActorNavRoute(entry);

    expect(route).toHaveLength(1);
    expect(route[0]).toMatchObject({
      navClearsCrosswalkCooldown: true,
      navCrosswalkCooldownActiveOnArrival: false,
      navNodeName: 'DISTRICT_01_NPC_ENTER_STORE',
    });

    randomSpy.mockRestore();
  });

  it('forces burger-only follow-up after crossing onto the left curb', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_BURGER_TRUCK_ORDER', 40, 96),
      createPointObject('DISTRICT_01_BURGR_TRUCK_HANGOUT', 56, 144),
      createPointObject('DISTRICT_01_LEFT_HANGOUT', 72, 112),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT']],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 3,
          nodeTags: {
            DISTRICT_01_BURGER_TRUCK_ORDER: ['burger', 'hangout', 'left-side'],
            DISTRICT_01_BURGR_TRUCK_HANGOUT: ['burger', 'hangout', 'left-side'],
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_LEFT_HANGOUT: ['hangout', 'left-side'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_BURGER_TRUCK_ORDER: 1,
            DISTRICT_01_BURGR_TRUCK_HANGOUT: 1.2,
            DISTRICT_01_LEFT_HANGOUT: 25,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_CROSSWALK_LEFT',
        },
      },
      navState: {
        crosswalkCooldownActive: true,
        crosswalkFollowUpRule: 'burger-only',
        currentNodeName: 'DISTRICT_01_CROSSWALK_LEFT',
        lastDestinationNodeName: null,
      },
      sprite: createSprite(104, 74),
    };

    const route = scene.planSceneActorNavRoute(entry);

    expect(route).toHaveLength(1);
    expect(['DISTRICT_01_BURGER_TRUCK_ORDER', 'DISTRICT_01_BURGR_TRUCK_HANGOUT']).toContain(
      route[0].navNodeName
    );
    expect(route[0].navNodeName).not.toBe('DISTRICT_01_LEFT_HANGOUT');

    randomSpy.mockRestore();
  });

  it('forces a non-burger follow-up after crossing onto the right curb', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_RIGHT_BURGER_DECOY', 248, 76),
      createPointObject('DISTRICT_01_RIGHT_HANGOUT', 292, 112),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT']],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 3,
          nodeTags: {
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_RIGHT_BURGER_DECOY: ['burger', 'hangout', 'right-side'],
            DISTRICT_01_RIGHT_HANGOUT: ['hangout', 'right-side'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_RIGHT_BURGER_DECOY: 25,
            DISTRICT_01_RIGHT_HANGOUT: 1,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_CROSSWALK_RIGHT',
        },
      },
      navState: {
        crosswalkCooldownActive: true,
        crosswalkFollowUpRule: 'non-burger-only',
        currentNodeName: 'DISTRICT_01_CROSSWALK_RIGHT',
        lastDestinationNodeName: null,
      },
      sprite: createSprite(176, 74),
    };

    const route = scene.planSceneActorNavRoute(entry);

    expect(route).toHaveLength(1);
    expect(route[0].navNodeName).toBe('DISTRICT_01_RIGHT_HANGOUT');

    randomSpy.mockRestore();
  });

  it('latches the blocked crosswalk pair when a crosswalk arrival route point resolves', () => {
    const scene = createScene({ sceneActors: [] });
    const entry = {
      actorConfig: {
        navGraph: {
          layerName: 'NPCWalkPoints',
        },
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'right',
      lastProgressAt: 0,
      lastProgressDistance: Number.POSITIVE_INFINITY,
      lastRouteIndex: 0,
      navState: {
        blockedCrosswalkPairId: null,
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_CROSSWALK_LEFT',
        lastDestinationNodeName: null,
      },
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      route: [
        {
          arrivalDistance: 6,
          navCrosswalkCooldownActiveOnArrival: true,
          navCrosswalkPairId: 'pair-02',
          navNodeName: 'DISTRICT_01_CROSSWALK_RIGHT',
          navShouldBlockCrosswalkPairOnArrival: true,
          navShouldPlanNextRoute: true,
          target: {
            x: 176,
            y: 74,
          },
          waitMs: 0,
        },
      ],
      shadow: createShadow(176, 74),
      sprite: createSprite(176, 74),
      stuckAttemptCount: 0,
      stuckRouteIndex: -1,
      waitUntil: 0,
    };

    scene.planSceneActorNavRoute = vi.fn(() => []);

    expect(() => scene.updateSceneActor(entry, 0)).not.toThrow();
    expect(entry.navState.crosswalkCooldownActive).toBe(true);
    expect(entry.navState.blockedCrosswalkPairId).toBe('pair-02');
  });

  it('spreads nav destinations away from nodes already reserved by other actors', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_START_A', 24, 24),
      createPointObject('DISTRICT_01_SHARED_DESTINATION', 124, 24),
      createPointObject('DISTRICT_01_ALT_DESTINATION', 24, 140),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const reservedEntry = {
      actorConfig: {
        id: 'reserved-actor',
        navGraph: {
          layerName: 'NPCWalkPoints',
        },
      },
      currentRouteIndex: 0,
      navState: {
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_SHARED_DESTINATION',
        lastDestinationNodeName: 'DISTRICT_01_SHARED_DESTINATION',
      },
      route: [
        {
          navNodeName: 'DISTRICT_01_SHARED_DESTINATION',
        },
      ],
      sprite: createSprite(124, 24),
    };
    const entry = {
      actorConfig: {
        id: 'seeking-actor',
        navGraph: {
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeWeightMultipliers: {
            DISTRICT_01_ALT_DESTINATION: 3,
            DISTRICT_01_SHARED_DESTINATION: 10,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_START_A',
        },
      },
      currentRouteIndex: 0,
      navState: {
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_START_A',
        lastDestinationNodeName: null,
      },
      route: [],
      sprite: createSprite(24, 24),
    };

    scene.sceneActorEntries = [reservedEntry, entry];

    const route = scene.planSceneActorNavRoute(entry);

    expect(route).toHaveLength(1);
    expect(route[0]).toMatchObject({
      navNodeName: 'DISTRICT_01_ALT_DESTINATION',
    });

    randomSpy.mockRestore();
  });
});
