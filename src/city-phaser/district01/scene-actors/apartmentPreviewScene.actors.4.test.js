import { describe, expect, it, vi } from 'vitest';

import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  getDistrict01PreviewMap,
  createSprite,
  createPointObject,
  createScene,
} from './sceneActorTestHelpers';

describe('apartmentPreviewScene actors 4', () => {
  it('does not follow another actor into the same immediate next node', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const navObjects = [
      createPointObject('DISTRICT_01_START_A', 24, 24),
      createPointObject('DISTRICT_01_SHARED_HOP', 84, 24),
      createPointObject('DISTRICT_01_BLOCKED_DESTINATION', 144, 24),
      createPointObject('DISTRICT_01_ALT_DESTINATION', 24, 84),
      createPointObject('DISTRICT_01_BLOCKED_HELPER', 144, 84),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const otherEntry = {
      actorConfig: {
        id: 'other-actor',
        navGraph: {
          layerName: 'NPCWalkPoints',
        },
      },
      currentRouteIndex: 0,
      navState: {
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_START_A',
        lastDestinationNodeName: 'DISTRICT_01_BLOCKED_DESTINATION',
      },
      route: [
        {
          navNodeName: 'DISTRICT_01_SHARED_HOP',
        },
        {
          navNodeName: 'DISTRICT_01_BLOCKED_DESTINATION',
        },
      ],
      sprite: createSprite(32, 24),
    };
    const entry = {
      actorConfig: {
        id: 'seeking-actor',
        navGraph: {
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeWeightMultipliers: {
            DISTRICT_01_ALT_DESTINATION: 1,
            DISTRICT_01_BLOCKED_DESTINATION: 50,
            DISTRICT_01_BLOCKED_HELPER: 0,
            DISTRICT_01_SHARED_HOP: 0,
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

    scene.sceneActorEntries = [otherEntry, entry];

    const route = scene.planSceneActorNavRoute(entry);

    expect(route.map((point) => point.navNodeName)).toEqual(['DISTRICT_01_ALT_DESTINATION']);

    randomSpy.mockRestore();
  });

  it('enforces a same-side non-crosswalk follow-up while crosswalk cooldown is active', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_CENTER_HANGOUT', 220, 112),
      createPointObject('DISTRICT_01_LEFT_OUTER_HANGOUT', 72, 112),
      createPointObject('DISTRICT_01_RIGHT_OUTER_HANGOUT', 292, 112),
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
            DISTRICT_01_CENTER_HANGOUT: ['center', 'hangout'],
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_LEFT_OUTER_HANGOUT: ['hangout', 'left-side'],
            DISTRICT_01_RIGHT_OUTER_HANGOUT: ['hangout', 'right-side'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_CENTER_HANGOUT: 6,
            DISTRICT_01_LEFT_OUTER_HANGOUT: 4,
            DISTRICT_01_RIGHT_OUTER_HANGOUT: 1,
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
      navNodeName: 'DISTRICT_01_RIGHT_OUTER_HANGOUT',
    });

    randomSpy.mockRestore();
  });

  it('continues forward from a blocked crosswalk curb instead of turning back', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_CROSSWALK_02_LEFT', 104, 200),
      createPointObject('DISTRICT_01_CROSSWALK_02_RIGHT', 260, 200),
      createPointObject('DISTRICT_01_LEFT_HANGOUT', 48, 74),
      createPointObject('DISTRICT_01_RIGHT_HANGOUT', 304, 74),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [
            ['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT'],
            ['DISTRICT_01_CROSSWALK_02_LEFT', 'DISTRICT_01_CROSSWALK_02_RIGHT'],
          ],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 3,
          nodeTags: {
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_CROSSWALK_02_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_02_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_LEFT_HANGOUT: ['hangout', 'left-side'],
            DISTRICT_01_RIGHT_HANGOUT: ['hangout', 'right-side'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_LEFT_HANGOUT: 1,
            DISTRICT_01_RIGHT_HANGOUT: 6,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_CROSSWALK_RIGHT',
        },
      },
      currentRouteIndex: 0,
      navState: {
        blockedCrosswalkPairId: 'DISTRICT_01_CROSSWALK_LEFT::DISTRICT_01_CROSSWALK_RIGHT',
        crosswalkCooldownActive: true,
        currentNodeName: 'DISTRICT_01_CROSSWALK_RIGHT',
        lastDestinationNodeName: null,
      },
      route: [],
      sprite: createSprite(176, 74),
    };

    const route = scene.planSceneActorNavRoute(entry);
    const routeNodeNames = route.map((point) => point.navNodeName);

    expect(routeNodeNames).toEqual(['DISTRICT_01_RIGHT_HANGOUT']);
    expect(routeNodeNames).not.toContain('DISTRICT_01_CROSSWALK_LEFT');
    expect(routeNodeNames).not.toContain('DISTRICT_01_CROSSWALK_02_RIGHT');
    expect(routeNodeNames).not.toContain('DISTRICT_01_CROSSWALK_02_LEFT');

    randomSpy.mockRestore();
  });

  it('blocks reusing the same crosswalk pair to return after a same-side activity', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const navObjects = [
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74),
      createPointObject('DISTRICT_01_CROSSWALK_02_LEFT', 104, 200),
      createPointObject('DISTRICT_01_CROSSWALK_02_RIGHT', 260, 200),
      createPointObject('DISTRICT_01_LEFT_TOP_HANGOUT', 40, 40),
      createPointObject('DISTRICT_01_LEFT_BOTTOM_HANGOUT', 40, 240),
      createPointObject('DISTRICT_01_RIGHT_HANGOUT', 260, 100),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );
    scene.resolvedCollisionRectangles = [
      { height: 40, width: 60, x: 140, y: 0 },
      { height: 80, width: 60, x: 140, y: 100 },
      { height: 120, width: 60, x: 140, y: 226 },
    ];

    const entry = {
      actorConfig: {
        navGraph: {
          crosswalkPairs: [
            ['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT'],
            ['DISTRICT_01_CROSSWALK_02_LEFT', 'DISTRICT_01_CROSSWALK_02_RIGHT'],
          ],
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeTags: {
            DISTRICT_01_CROSSWALK_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_CROSSWALK_02_LEFT: ['crosswalk', 'left-side'],
            DISTRICT_01_CROSSWALK_02_RIGHT: ['crosswalk', 'right-side'],
            DISTRICT_01_LEFT_TOP_HANGOUT: ['hangout', 'left-side'],
            DISTRICT_01_LEFT_BOTTOM_HANGOUT: ['hangout', 'left-side'],
            DISTRICT_01_RIGHT_HANGOUT: ['hangout', 'right-side'],
          },
          nodeWeightMultipliers: {
            DISTRICT_01_LEFT_BOTTOM_HANGOUT: 3,
            DISTRICT_01_LEFT_TOP_HANGOUT: 8,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_RIGHT_HANGOUT',
        },
      },
      currentRouteIndex: 0,
      navState: {
        blockedCrosswalkPairId: null,
        crosswalkCooldownActive: false,
        currentNodeName: 'DISTRICT_01_RIGHT_HANGOUT',
        lastDestinationNodeName: 'DISTRICT_01_RIGHT_HANGOUT',
      },
      route: [],
      sprite: createSprite(260, 100),
    };

    const graph = scene.buildSceneActorNavGraph(entry.actorConfig.navGraph);

    entry.navState.blockedCrosswalkPairId = graph.nodesByName.get(
      'DISTRICT_01_CROSSWALK_RIGHT'
    )?.crosswalkPairId;

    const route = scene.planSceneActorNavRoute(entry);
    const routeNodeNames = route.map((point) => point.navNodeName);

    expect(routeNodeNames).toContain('DISTRICT_01_CROSSWALK_02_RIGHT');
    expect(routeNodeNames).toContain('DISTRICT_01_CROSSWALK_02_LEFT');
    expect(routeNodeNames).not.toContain('DISTRICT_01_CROSSWALK_RIGHT');
    expect(routeNodeNames).not.toContain('DISTRICT_01_CROSSWALK_LEFT');
    expect(route.at(-1)).toMatchObject({
      navNodeName: 'DISTRICT_01_LEFT_BOTTOM_HANGOUT',
    });

    randomSpy.mockRestore();
  });

  it('builds a local avoidance vector away from nearby moving actors', () => {
    const scene = createScene({ sceneActors: [] });
    const entry = {
      actorConfig: {
        id: 'entry',
        route: [{ target: { x: 180, y: 100 } }],
      },
      sprite: createSprite(100, 100),
    };
    const otherEntry = {
      actorConfig: {
        id: 'other',
        route: [{ target: { x: 80, y: 100 } }],
      },
      sprite: createSprite(116, 100),
    };

    scene.sceneActorEntries = [entry, otherEntry];

    const avoidanceVector = scene.resolveSceneActorAvoidanceVector(entry);

    expect(avoidanceVector).not.toBeNull();
    expect(avoidanceVector.x).toBeLessThan(0);
    expect(Math.abs(avoidanceVector.y)).toBeLessThan(0.001);
  });

  it('gives burger-capable exterior walkers a burger-truck destination from their live graph config', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const exteriorActors = getDistrict01PreviewMap(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior
    ).sceneActors;
    const navObjects = [
      createPointObject('DISTRICT_01_BURGER_TRUCK_ORDER', 51.6666666666667, 316.333333333333),
      createPointObject('DISTRICT_01_BURGR_TRUCK_HANGOUT', 76.3333333333333, 222.333333333333),
      createPointObject('DISTRICT_01_CROSSWALK_LEFT', 104, 74.3333333333333),
      createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 175.666666666667, 75),
      createPointObject('DISTRICT_01_NPC_ENTER_STORE', 256.666666666667, 195.666666666667),
      createPointObject('DISTRICT_01_EXPLORE_01', 552.666666666667, 349),
      createPointObject('DISTRICT_01_EXPLORE_02', 527.333333333333, 58),
      createPointObject('DISTRICT_01_EXPLORE_03', 238.333333333333, 347.333333333333),
      createPointObject('DISTRICT_01_NPC_ENTER_APARTMENT', 517.666666666667, 254.333333333333),
      createPointObject('DISTRICT_01_EXPLORE_04', 384, 164.333333333333),
      createPointObject('DISTRICT_01_EXPLORE_05', 325.333333333333, 258.666666666667),
      createPointObject('DISTRICT_01_CROSSWALK_02_LEFT', 112.666666666667, 362),
      createPointObject('DISTRICT_01_CROSSWALK_02_RIGHT', 176.333333333333, 362.333333333333),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    ['district-01-shopper-01', 'district-01-walker-01'].forEach((actorId) => {
      const actorConfig = exteriorActors.find((actor) => actor.id === actorId);
      const spawnPoint = navObjects.find((node) => node.name === actorConfig.spawn.objectName);
      const entry = {
        actorConfig,
        currentRouteIndex: 0,
        navState: {
          blockedCrosswalkPairId: null,
          crosswalkCooldownActive: false,
          currentNodeName: actorConfig.spawn.objectName,
          lastDestinationNodeName: null,
        },
        route: [],
        sprite: createSprite(spawnPoint.x, spawnPoint.y),
      };

      scene.sceneActorEntries = [entry];
      scene.resolvedCollisionRectangles = [
        {
          height: 260,
          width: 60,
          x: 114.666666666667,
          y: 85.6666666666667,
        },
        {
          height: 53.6666666666667,
          width: 58.6666666666667,
          x: 114,
          y: 2,
        },
        {
          height: 72.6666666666666,
          width: 54.3333333333333,
          x: 118,
          y: 372.666666666667,
        },
        {
          height: 56,
          width: 87.3333333333334,
          x: 2.66666666666667,
          y: 368,
        },
        {
          height: 122,
          width: 64.5,
          x: 15.5,
          y: 4.5,
        },
      ];

      const route = scene.planSceneActorNavRoute(entry);
      const destinationNodeName = route.at(-1)?.navNodeName;

      expect(['DISTRICT_01_BURGER_TRUCK_ORDER', 'DISTRICT_01_BURGR_TRUCK_HANGOUT']).toContain(
        destinationNodeName
      );
    });

    randomSpy.mockRestore();
  });
});
