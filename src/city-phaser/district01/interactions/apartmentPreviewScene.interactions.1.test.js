import { describe, expect, it, vi } from 'vitest';

import {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  createScene,
} from './interactionTestHelpers';

describe('apartmentPreviewScene interactions 1', () => {
  it('creates the player from the selected preset atlas and compact foot hitbox', () => {
    const body = {
      debugShowVelocity: false,
      setOffset: vi.fn(),
      setSize: vi.fn(),
    };
    const sprite = {
      body,
      setCollideWorldBounds: vi.fn(),
      setDepth: vi.fn(),
      setOrigin: vi.fn(),
    };

    sprite.setOrigin.mockReturnValue(sprite);
    sprite.setDepth.mockReturnValue(sprite);
    sprite.setCollideWorldBounds.mockReturnValue(sprite);

    const scene = createScene({
      playerTextureKeys: {
        atlas: 'city-phaser:player-character:atlas:selectable_character_06',
      },
    });

    scene.physics = {
      add: {
        sprite: vi.fn(() => sprite),
      },
    };
    scene.resolveSpawnTargetPosition = vi.fn(() => ({ x: 128, y: 256 }));
    scene.shouldShowCollisionDebug = vi.fn(() => false);

    scene.createPlayer();

    expect(scene.physics.add.sprite).toHaveBeenCalledWith(
      128,
      256,
      'city-phaser:player-character:atlas:selectable_character_06'
    );
    expect(body.setSize).toHaveBeenCalledWith(10, 10);
    expect(body.setOffset).toHaveBeenCalledWith(3, 22);
    expect(scene.applyIdleFrame).toHaveBeenCalledOnce();
  });

  it('supports side-center anchors for side-entry doorway targets', () => {
    const scene = createScene();
    const doorway = {
      height: 50,
      width: 30,
      x: 512,
      y: 225,
    };

    expect(scene.getObjectAnchorPosition(doorway, 'left-center')).toEqual({
      x: 512,
      y: 250,
    });
    expect(scene.getObjectAnchorPosition(doorway, 'right-center')).toEqual({
      x: 542,
      y: 250,
    });
  });

  it('treats authored door placement markers as transition targets instead of blocking colliders', () => {
    const collisionBoundary = {
      height: 20,
      name: 'DATA_PACKET_STORE_BOUNDARY',
      width: 40,
      x: 200,
      y: 100,
    };
    const doorPlacement = {
      height: 28,
      name: 'DATA_PACKET_STORE_DOOR_PLACEMENT',
      width: 30,
      x: 240,
      y: 146,
    };
    const createCollisionBody = vi.fn((collisionRectangle) => collisionRectangle);
    const scene = createScene({
      previewLocationId: 'exterior-seed',
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Collision'
            ? {
                objects: [collisionBoundary, doorPlacement],
              }
            : { objects: [] }
        ),
      },
    });

    scene.createCollisionBody = createCollisionBody;
    scene.shouldShowCollisionDebug = vi.fn(() => false);

    scene.createCollisionGeometry();

    expect(scene.shouldSkipCollisionObject(doorPlacement)).toBe(true);
    expect(createCollisionBody).toHaveBeenCalledTimes(1);
    expect(scene.resolvedCollisionRectangles).toEqual([
      {
        height: 20,
        width: 40,
        x: 200,
        y: 100,
      },
    ]);
  });

  it('restarts into the exterior seed from the apartment exit in hub state', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 12,
          name: 'ApartmentExit',
        },
      },
    });

    scene.handleInteraction();

    expect(scene.scene.restart).toHaveBeenCalledWith({
      locationId: 'exterior-seed',
      skipIntroSequence: true,
      spawn: {
        anchor: 'object-origin',
        layerName: 'Spawns',
        objectName: 'PLAYER_APARTMENT_SPAWN',
        offsetX: 0,
        offsetY: 0,
      },
    });
  });

  it('keeps the apartment exit walk horizontal toward the left doorway edge', () => {
    const apartmentExit = {
      height: 45,
      name: 'ApartmentExit',
      width: 73,
      x: 6,
      y: 273.333333333333,
    };
    const scene = createScene({
      player: {
        setVelocity: vi.fn(),
        x: 42,
        y: 310,
      },
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Exits' ? { objects: [apartmentExit] } : { objects: [] }
        ),
      },
    });

    expect(
      scene.resolveTransitionWalkPosition(scene.previewMapConfig.interactions.ApartmentExit)
    ).toEqual({
      x: 6,
      y: 310,
    });
  });

  it('blocks the apartment exit before hub state', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 12,
          name: 'ApartmentExit',
        },
      },
      getPreviewBridge: () => ({ apartmentEntryState: 'intro' }),
    });

    scene.handleInteraction();

    expect(scene.scene.restart).not.toHaveBeenCalled();
    expect(scene.getInteractionDetails('ApartmentExit')).toEqual({
      desktopPrompt: 'Finish checking the signal first',
      mobilePrompt: null,
    });
  });

  it('keeps the apartment terminal prompt generic during intro state', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'intro',
        apartmentShellId: 'apartment-intro-desktop',
        previewDeviceClass: 'desktop',
      }),
    });

    expect(scene.getInteractionDetails(APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME)).toEqual({
      desktopPrompt: 'Press E to interact',
      mobilePrompt: 'Tap Interact to interact.',
    });
  });

  it('hides the apartment terminal interaction entirely once hub state is active', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        apartmentShellId: 'apartment-hub-desktop',
        previewDeviceClass: 'desktop',
      }),
      player: {
        body: {
          height: 8,
          width: 8,
          x: 0,
          y: 0,
        },
        setVelocity: vi.fn(),
      },
    });

    scene.interactionZoneEntries = [
      {
        object: {
          height: 12,
          name: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
          width: 12,
          x: 0,
          y: 0,
        },
      },
    ];

    expect(scene.getActiveInteractionZone()).toBeNull();
  });

  it('restarts back into the apartment from the exterior apartment entrance', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 46,
          name: 'PLAYER_APARTMENT_BUILDING_ENTRANCE',
        },
      },
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).toHaveBeenCalledWith({
      locationId: 'apartment-room-01',
      skipIntroSequence: true,
      spawn: {
        anchor: 'top-center',
        layerName: 'Exits',
        objectName: 'ApartmentExit',
        offsetX: 0,
        offsetY: -12,
      },
    });
  });

  it('locks side-entry exterior transitions to the player door lane', () => {
    const apartmentEntrance = {
      height: 50.6666666666667,
      name: 'PLAYER_APARTMENT_BUILDING_ENTRANCE',
      width: 30,
      x: 512,
      y: 225.333333333333,
    };
    const clusterEntrance = {
      height: 47.5,
      name: 'CLUSTER_MAP_BUILDING_ENTRANCE',
      width: 31.5,
      x: 240.5,
      y: 271.5,
    };
    const scene = createScene({
      player: {
        setVelocity: vi.fn(),
        x: 520,
        y: 230,
      },
      previewLocationId: 'exterior-seed',
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Interactables'
            ? {
                objects: [apartmentEntrance, clusterEntrance],
              }
            : { objects: [] }
        ),
      },
    });

    expect(
      scene.resolveTransitionWalkPosition(
        scene.previewMapConfig.interactions.PLAYER_APARTMENT_BUILDING_ENTRANCE
      )
    ).toEqual({
      x: 542,
      y: 230,
    });

    scene.player = {
      setVelocity: vi.fn(),
      x: 268,
      y: 340,
    };

    expect(
      scene.resolveTransitionWalkPosition(
        scene.previewMapConfig.interactions.CLUSTER_MAP_BUILDING_ENTRANCE
      )
    ).toEqual({
      x: 240.5,
      y: 319,
    });
  });
});
