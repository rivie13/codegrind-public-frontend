import { describe, expect, it } from 'vitest';

import {
  DISTRICT_01_PREVIEW_LOCATION_IDS,
  getDistrict01PreviewInteraction,
  getDistrict01PreviewMap,
} from './district01PreviewMapsTestHelpers';

describe('district01PreviewMaps 1', () => {
  it('defaults the preview runtime to the apartment seed map', () => {
    expect(getDistrict01PreviewMap().id).toBe(DISTRICT_01_PREVIEW_LOCATION_IDS.apartment);
    expect(getDistrict01PreviewMap().mapAssetPath).toMatch(/apartment-seed\.tmj$/);
  });

  it('maps the apartment exit to the exterior apartment spawn', () => {
    expect(
      getDistrict01PreviewInteraction(DISTRICT_01_PREVIEW_LOCATION_IDS.apartment, 'ApartmentExit')
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      targetSpawn: {
        layerName: 'Spawns',
        objectName: 'PLAYER_APARTMENT_SPAWN',
      },
      transitionWalkAxis: 'horizontal',
      transitionWalkTarget: {
        anchor: 'left-center',
        layerName: 'Exits',
        objectName: 'ApartmentExit',
      },
    });
    expect(
      getDistrict01PreviewInteraction(DISTRICT_01_PREVIEW_LOCATION_IDS.apartment, 'ApartmentExit')
        ?.transitionEffect
    ).toBeUndefined();
  });

  it('maps the exterior apartment entrance back to the apartment exit anchor', () => {
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'PLAYER_APARTMENT_BUILDING_ENTRANCE'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.apartment,
      targetSpawn: {
        anchor: 'top-center',
        layerName: 'Exits',
        objectName: 'ApartmentExit',
        offsetY: -12,
      },
      transitionWalkAxis: 'horizontal',
      transitionWalkTarget: {
        anchor: 'right-center',
        layerName: 'Interactables',
        objectName: 'PLAYER_APARTMENT_BUILDING_ENTRANCE',
      },
    });
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'PLAYER_APARTMENT_BUILDING_ENTRANCE'
      )?.transitionEffect
    ).toBeUndefined();
  });

  it('maps the exterior building entrances into the authored district interiors', () => {
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'LEARNING_PATH_BUILDING_ENTRANCE'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio,
      targetSpawn: {
        layerName: 'Spawns',
        objectName: 'DISTRICT_01_LEARNING_PATH_BUILDING_PLAYER_SPAWN',
      },
      transitionWalkTarget: {
        anchor: 'bottom-center',
        layerName: 'Collision',
        objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
        offsetY: 10,
      },
      transitionEffect: {
        appearance: {
          frameConfig: {
            frameHeight: 32,
            frameWidth: 32,
          },
          frameCount: 4,
          textureKey: 'city-preview-door:district-01-learning-door-01:sheet',
        },
        overlayTarget: {
          anchor: 'bottom-center',
          layerName: 'Collision',
          objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
        },
        playerSnapTarget: {
          anchor: 'bottom-center',
          layerName: 'Collision',
          objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
          offsetY: -6,
        },
        sceneDoorId: 'district-01-exterior-learning-door-01',
      },
    });

    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'CLUSTER_MAP_BUILDING_ENTRANCE'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
      targetSpawn: {
        layerName: 'Spawns',
        objectName: 'PlayerSpawn',
      },
      transitionWalkAxis: 'horizontal',
      transitionWalkTarget: {
        anchor: 'left-center',
        layerName: 'Interactables',
        objectName: 'CLUSTER_MAP_BUILDING_ENTRANCE',
      },
    });
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'CLUSTER_MAP_BUILDING_ENTRANCE'
      )?.transitionEffect
    ).toBeUndefined();

    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
        'DATA_PACKET_STORE_ENTRANCE'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar,
      targetSpawn: {
        layerName: 'Spawns',
        objectName: 'PlayerSpawn',
      },
      transitionEffect: {
        appearance: {
          textureKey: 'city-preview-door:district-01-charging-store-door-01:sheet',
        },
        overlayTarget: {
          anchor: 'bottom-center',
          layerName: 'Collision',
          objectName: 'DATA_PACKET_STORE_DOOR_PLACEMENT',
        },
        playerSnapTarget: {
          anchor: 'bottom-center',
          layerName: 'Collision',
          objectName: 'DATA_PACKET_STORE_DOOR_PLACEMENT',
        },
        sceneDoorId: 'district-01-exterior-charging-door-01',
      },
    });
  });

  it('maps the new interiors back to their exterior entrance anchors', () => {
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.learningStudio,
        'DISTRICT_01_LEARNING_PATH_BUILDING_EXIT_01'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      targetSpawn: {
        anchor: 'bottom-center',
        layerName: 'Collision',
        objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
        offsetY: 12,
      },
      transitionEffect: {
        appearance: {
          textureKey: 'city-preview-door:district-01-learning-door-01:sheet',
        },
        facing: 'down',
      },
    });

    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
        'DISTRICT_01_CLUSTER_MAP_BUILDING_EXIT'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      targetSpawn: {
        anchor: 'bottom-center',
        layerName: 'Interactables',
        objectName: 'CLUSTER_MAP_BUILDING_ENTRANCE',
        offsetY: 12,
      },
    });
    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.clusterMapOffice,
        'DISTRICT_01_CLUSTER_MAP_BUILDING_EXIT'
      )?.transitionEffect
    ).toBeUndefined();

    expect(
      getDistrict01PreviewInteraction(
        DISTRICT_01_PREVIEW_LOCATION_IDS.packetBazaar,
        'DISTRICT_01_DATA_PACKET_SHOP_EXIT'
      )
    ).toMatchObject({
      kind: 'transition',
      targetLocationId: DISTRICT_01_PREVIEW_LOCATION_IDS.exterior,
      targetSpawn: {
        anchor: 'bottom-center',
        layerName: 'Collision',
        objectName: 'DATA_PACKET_STORE_DOOR_PLACEMENT',
        offsetY: 12,
      },
      transitionEffect: {
        appearance: {
          textureKey: 'city-preview-door:district-01-charging-store-door-01:sheet',
        },
        facing: 'down',
      },
    });
  });
});
