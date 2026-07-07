import { describe, expect, it } from 'vitest';

import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  getDistrict01PreviewMap,
  EXTERIOR_ROUTE_BLOCKERS,
  resolveRoutePointPosition,
  isPointInsideRouteBlocker,
} from './district01PreviewMapsTestHelpers';

describe('district01PreviewMaps 2', () => {
  it('defines an exterior and bazaar NPC cast for the district preview', () => {
    const exteriorActors = getDistrict01PreviewMap(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior
    ).sceneActors;
    const exteriorNavActors = exteriorActors.filter((actor) => actor.navGraph);

    expect(exteriorActors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'district-01-apartment-resident-01',
          navGraph: expect.objectContaining({
            crosswalkPairs: [
              ['DISTRICT_01_CROSSWALK_LEFT', 'DISTRICT_01_CROSSWALK_RIGHT'],
              ['DISTRICT_01_CROSSWALK_02_LEFT', 'DISTRICT_01_CROSSWALK_02_RIGHT'],
            ],
            layerName: 'NPCWalkPoints',
            preferredTags: expect.arrayContaining(['apartment', 'east-side']),
          }),
          spawn: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_NPC_ENTER_APARTMENT',
          }),
        }),
        expect.objectContaining({
          id: 'district-01-walker-01',
          navGraph: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            preferredTags: expect.arrayContaining(['burger', 'center', 'south-side']),
          }),
          spawn: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_EXPLORE_03',
          }),
        }),
        expect.objectContaining({
          id: 'district-01-shopper-01',
          navGraph: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            preferredTags: expect.arrayContaining(['burger', 'crosswalk', 'store']),
          }),
          spawn: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_NPC_ENTER_STORE',
          }),
        }),
        expect.objectContaining({
          id: 'district-01-upper-right-looper-01',
          navGraph: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            preferredTags: expect.arrayContaining(['apartment', 'east-side', 'upper-right']),
          }),
          spawn: expect.objectContaining({
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_EXPLORE_02',
          }),
        }),
      ])
    );

    expect(exteriorNavActors).toHaveLength(4);
    expect(
      exteriorNavActors.every(
        (actor) =>
          actor.navGraph?.layerName === 'NPCWalkPoints' &&
          actor.spawn?.layerName === 'NPCWalkPoints'
      )
    ).toBe(true);
    expect(
      exteriorNavActors.every(
        (actor) =>
          actor.navGraph?.nodeOverrides?.DISTRICT_01_NPC_ENTER_STORE?.target?.objectName ===
          'DATA_PACKET_STORE_ENTRANCE'
      )
    ).toBe(true);
    expect(
      exteriorNavActors.every(
        (actor) =>
          actor.navGraph?.nodeOverrides?.DISTRICT_01_NPC_ENTER_STORE?.transition
            ?.hideActorImmediately === true &&
          actor.navGraph?.nodeOverrides?.DISTRICT_01_NPC_ENTER_STORE?.transition?.exitEffect
            ?.sceneDoorId === 'district-01-exterior-charging-door-01'
      )
    ).toBe(true);
    expect(
      exteriorNavActors.every(
        (actor) =>
          actor.navGraph?.nodeOverrides?.DISTRICT_01_NPC_ENTER_APARTMENT?.transition?.effect ===
          null
      )
    ).toBe(true);

    expect(getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar)).toMatchObject({
      ambientObjective: expect.objectContaining({
        text: expect.stringContaining('clerk'),
      }),
      interactions: expect.objectContaining({
        DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE: expect.objectContaining({
          desktopPrompt: 'Press E to talk to the bazaar clerk',
          mobilePrompt: 'Tap Interact to talk to the bazaar clerk.',
        }),
      }),
      sceneActors: expect.arrayContaining([
        expect.objectContaining({
          id: 'packet-bazaar-clerk-01',
          spawn: expect.objectContaining({
            layerName: 'Interactables',
            objectName: 'DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE',
          }),
        }),
        expect.objectContaining({
          id: 'packet-bazaar-browser-01',
        }),
      ]),
    });
  });

  it('keeps exterior actor spawn and resume targets outside the known blocker geometry', () => {
    const exteriorActors = getDistrict01PreviewMap(
      DISTRICT_01_PREVIEW_LOCATION_IDS.exterior
    ).sceneActors;

    const blockedTargets = exteriorActors.flatMap((actor) => {
      const routeResumeTargets = (actor.route || []).map((point) => point.transition?.resumeTarget);
      const navResumeTargets = Object.values(actor.navGraph?.nodeOverrides || {}).map(
        (point) => point.transition?.resumeTarget
      );
      const targets = [actor.spawn, ...routeResumeTargets, ...navResumeTargets].filter(Boolean);

      return targets.flatMap((target, index) => {
        const resolvedTarget = resolveRoutePointPosition(target);

        if (!resolvedTarget) {
          return [];
        }

        return EXTERIOR_ROUTE_BLOCKERS.some((blocker) =>
          isPointInsideRouteBlocker(resolvedTarget, blocker)
        )
          ? [`${actor.id}:target-${index}`]
          : [];
      });
    });

    expect(blockedTargets).toEqual([]);
  });

  it('defines persistent exterior door visuals at the authored door placement markers', () => {
    expect(getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.exterior).sceneDoors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'district-01-exterior-learning-door-01',
          closedFrame: 0,
          target: expect.objectContaining({
            anchor: 'bottom-center',
            layerName: 'Collision',
            objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
          }),
        }),
        expect.objectContaining({
          id: 'district-01-exterior-charging-door-01',
          closedFrame: 0,
          target: expect.objectContaining({
            anchor: 'bottom-center',
            layerName: 'Collision',
            objectName: 'DATA_PACKET_STORE_DOOR_PLACEMENT',
          }),
        }),
      ])
    );
  });

  it('resolves the new interior scene ids to their authored Tiled maps', () => {
    expect(getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio)).toMatchObject({
      id: DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio,
      mapAssetPath: expect.stringMatching(/learning-path-building-interior\.tmj$/),
    });
    expect(
      getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice)
    ).toMatchObject({
      id: DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
      mapAssetPath: expect.stringMatching(/cluster-map-building-interior\.tmj$/),
    });
    expect(getDistrict01PreviewMap(DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar)).toMatchObject({
      id: DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar,
      mapAssetPath: expect.stringMatching(/data-packet-store-interior\.tmj$/),
    });
  });
});
