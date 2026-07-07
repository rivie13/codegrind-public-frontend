import { describe, expect, it, vi } from 'vitest';

import { createScene } from './interactionTestHelpers';

describe('apartmentPreviewScene interactions 2', () => {
  it('uses a reachable approach point for the exterior learning doorway while reserving a deeper snap point', () => {
    const learningDoorPlacement = {
      height: 32,
      name: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
      width: 32,
      x: 100,
      y: 140,
    };
    const scene = createScene({
      player: {
        setVelocity: vi.fn(),
        x: 116,
        y: 220,
      },
      previewLocationId: 'exterior-seed',
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Collision' ? { objects: [learningDoorPlacement] } : { objects: [] }
        ),
      },
    });
    const interactionConfig = scene.previewMapConfig.interactions.LEARNING_PATH_BUILDING_ENTRANCE;

    expect(interactionConfig.transitionEffect.playerSnapTarget).toEqual({
      anchor: 'bottom-center',
      layerName: 'Collision',
      objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
      offsetX: 0,
      offsetY: -6,
    });
    expect(scene.resolveTransitionWalkPosition(interactionConfig)).toEqual({
      x: 116,
      y: 182,
    });
  });

  it('restarts into the learning studio from the exterior learning entrance', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 45,
          name: 'LEARNING_PATH_BUILDING_ENTRANCE',
        },
      },
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).toHaveBeenCalledWith({
      locationId: 'learning-module-guide-01',
      skipIntroSequence: true,
      spawn: {
        anchor: 'object-origin',
        layerName: 'Spawns',
        objectName: 'DISTRICT_01_LEARNING_PATH_BUILDING_PLAYER_SPAWN',
        offsetX: 0,
        offsetY: 0,
      },
    });
  });

  it('restarts into the cluster office from the exterior cluster entrance', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 44,
          name: 'CLUSTER_MAP_BUILDING_ENTRANCE',
        },
      },
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).toHaveBeenCalledWith({
      locationId: 'array-fixer-office-01',
      skipIntroSequence: true,
      spawn: {
        anchor: 'object-origin',
        layerName: 'Spawns',
        objectName: 'PlayerSpawn',
        offsetX: 0,
        offsetY: 0,
      },
    });
  });

  it('keeps guests on their chosen route when they try the opposite path building', () => {
    const onBlockedInteraction = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 44,
          name: 'CLUSTER_MAP_BUILDING_ENTRANCE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialLearningPath: 'python-path',
          selectedTrialTrack: 'beginner',
        },
        onBlockedInteraction,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).not.toHaveBeenCalled();
    expect(onBlockedInteraction).toHaveBeenCalledWith({
      interactionName: 'CLUSTER_MAP_BUILDING_ENTRANCE',
      locationId: 'exterior-seed',
      restrictionCode: 'track-route-locked',
      routeSurface: 'clusters',
      selectedTrialLearningPath: 'python-path',
      selectedTrialTrack: 'beginner',
    });
    expect(scene.getInteractionDetails('CLUSTER_MAP_BUILDING_ENTRANCE')).toEqual({
      desktopPrompt: 'Press E for guest trial route info',
      mobilePrompt: 'Tap Interact for guest trial route info.',
    });
  });

  it('restarts into the packet bazaar from the exterior store entrance', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 43,
          name: 'DATA_PACKET_STORE_ENTRANCE',
        },
      },
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).toHaveBeenCalledWith({
      locationId: 'packet-bazaar-interior-01',
      skipIntroSequence: true,
      spawn: {
        anchor: 'object-origin',
        layerName: 'Spawns',
        objectName: 'PlayerSpawn',
        offsetX: 0,
        offsetY: 0,
      },
    });
  });

  it('keeps the Packet Bazaar locked for guests and shows store access info', () => {
    const onBlockedInteraction = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 43,
          name: 'DATA_PACKET_STORE_ENTRANCE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          isAuthenticated: false,
          selectedTrialTrack: 'pro',
        },
        onBlockedInteraction,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'exterior-seed',
    });

    scene.handleInteraction();

    expect(scene.scene.restart).not.toHaveBeenCalled();
    expect(onBlockedInteraction).toHaveBeenCalledWith({
      interactionName: 'DATA_PACKET_STORE_ENTRANCE',
      locationId: 'exterior-seed',
      restrictionCode: 'store-signin-required',
      routeSurface: 'store',
      selectedTrialLearningPath: null,
      selectedTrialTrack: 'pro',
    });
    expect(scene.getInteractionDetails('DATA_PACKET_STORE_ENTRANCE')).toEqual({
      desktopPrompt: 'Press E for store access info',
      mobilePrompt: 'Tap Interact for store access info.',
    });
  });

  it('locks controls and queues a walk-up before starting the shared door beat', () => {
    const playDoorTransitionEffect = vi.fn(() => true);
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 46,
          name: 'DATA_PACKET_STORE_ENTRANCE',
        },
      },
      player: {
        x: 80,
        y: 220,
        setVelocity: vi.fn(),
      },
      previewLocationId: 'exterior-seed',
    });

    scene.resolveSpawnTargetPosition = vi.fn((target) => {
      if (target?.objectName === 'DATA_PACKET_STORE_DOOR_PLACEMENT') {
        return {
          x: 120 + Number(target?.offsetX || 0),
          y: 156 + Number(target?.offsetY || 0),
        };
      }

      return null;
    });
    scene.playDoorTransitionEffect = playDoorTransitionEffect;

    scene.handleInteraction();

    expect(scene.controlsLocked).toBe(true);
    expect(scene.playerDoorApproachState).toMatchObject({
      targetPosition: {
        x: 120,
        y: 166,
      },
    });
    expect(playDoorTransitionEffect).not.toHaveBeenCalled();
    expect(scene.scene.restart).not.toHaveBeenCalled();
  });

  it('starts the shared door beat once the queued walk-up reaches the doorway', () => {
    const alignActorWithDoorTransition = vi.fn();
    const onComplete = vi.fn();
    const playDoorTransitionEffect = vi.fn(() => true);
    const scene = createScene({
      player: {
        setVelocity: vi.fn(),
        x: 118,
        y: 151,
      },
      previewLocationId: 'exterior-seed',
    });

    scene.alignActorWithDoorTransition = alignActorWithDoorTransition;
    scene.playDoorTransitionEffect = playDoorTransitionEffect;
    scene.syncInteractionContext = vi.fn();
    scene.playerDoorApproachState = {
      arrivalDistance: 6,
      onArrive: () => {
        scene.startPlayerSceneTransitionBeat(
          scene.previewMapConfig.interactions.DATA_PACKET_STORE_ENTRANCE,
          onComplete
        );
      },
      speed: 110,
      targetPosition: {
        x: 120,
        y: 150,
      },
    };

    scene.updatePlayerDoorApproach();

    expect(scene.playerDoorApproachState).toBeNull();
    expect(alignActorWithDoorTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          textureKey: 'city-preview-door:district-01-charging-store-door-01:sheet',
        }),
      }),
      scene.player
    );
    expect(playDoorTransitionEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          textureKey: 'city-preview-door:district-01-charging-store-door-01:sheet',
        }),
      }),
      expect.objectContaining({
        actor: scene.player,
        onComplete,
      })
    );
  });

  it('starts the door beat immediately when the player is already pressed against the doorway', () => {
    const playDoorTransitionEffect = vi.fn(() => true);
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 46,
          name: 'DATA_PACKET_STORE_ENTRANCE',
        },
      },
      player: {
        x: 120,
        y: 156,
        setVelocity: vi.fn(),
      },
      previewLocationId: 'exterior-seed',
    });

    scene.resolveSpawnTargetPosition = vi.fn((target) => {
      if (target?.objectName === 'DATA_PACKET_STORE_DOOR_PLACEMENT') {
        return {
          x: 120 + Number(target?.offsetX || 0),
          y: 156 + Number(target?.offsetY || 0),
        };
      }

      return null;
    });
    scene.playDoorTransitionEffect = playDoorTransitionEffect;

    scene.handleInteraction();

    expect(scene.playerDoorApproachState).toBeNull();
    expect(playDoorTransitionEffect).toHaveBeenCalledOnce();
  });

  it('resolves top-center spawn anchors from authored exit objects', () => {
    const apartmentExit = {
      height: 45,
      name: 'ApartmentExit',
      width: 73,
      x: 284,
      y: 408,
    };
    const scene = createScene({
      previewLocationId: 'exterior-seed',
      previewSpawnTarget: {
        anchor: 'top-center',
        layerName: 'Exits',
        objectName: 'ApartmentExit',
        offsetY: -12,
      },
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Exits' ? { objects: [apartmentExit] } : { objects: [] }
        ),
      },
    });

    expect(scene.resolveSpawnTargetPosition()).toEqual({
      x: 320.5,
      y: 396,
    });
  });
});
