import { describe, expect, it, vi } from 'vitest';

import { createScene } from './interactionTestHelpers';

describe('apartmentPreviewScene interactions 4', () => {
  it('opens a collectible inspect modal before claiming through the preview bridge', async () => {
    const onCollectibleClaim = vi.fn().mockResolvedValue({
      collectible: { id: 'district-01-ada', owned: true },
      ok: true,
    });
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 91,
          name: 'DISTRICT_01_COLLECTABLE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        getOwnedCollectibleSlugs: () => [],
        guestPhoneContext: {
          isAuthenticated: true,
        },
        onCollectibleClaim,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'exterior-seed',
    });

    scene.syncCollectibleDisplayVisibility = vi.fn();
    scene.syncInteractionContext = vi.fn();
    scene.syncObjectiveHudState = vi.fn();
    scene.syncPreviewWorldState = vi.fn();

    scene.handleInteraction();

    expect(onCollectibleClaim).not.toHaveBeenCalled();
    expect(scene.activeCollectibleModal).toMatchObject({
      collectibleId: 'district-01-ada',
      title: 'Ada',
    });
    expect(scene.setPreviewCollectibleModalState).toHaveBeenCalledWith(
      expect.objectContaining({
        collectibleId: 'district-01-ada',
        title: 'Ada',
      })
    );

    await scene.handlePreviewCollectibleCollectRequest({ collectibleId: 'district-01-ada' });

    expect(onCollectibleClaim).toHaveBeenCalledWith({
      collectibleId: 'district-01-ada',
      displayName: 'Ada',
      interactionName: 'DISTRICT_01_COLLECTABLE',
    });
    expect(scene.syncCollectibleDisplayVisibility).toHaveBeenCalled();
    expect(scene.syncPreviewWorldState).toHaveBeenCalledWith(true);
    expect(scene.syncInteractionContext).toHaveBeenCalled();
    expect(scene.syncObjectiveHudState).toHaveBeenCalled();
    expect(scene.activeCollectibleModal).toBeNull();
  });

  it('includes district collectible counts in preview world state', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        getOwnedCollectibleSlugs: () => ['city.collectible.district-01.ada.v1'],
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'exterior-seed',
      previewMapConfig: {
        defaultObjectivePointId: null,
        label: 'District 01 Exterior',
      },
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Interactables'
            ? {
                objects: [
                  {
                    height: 16,
                    name: 'PLAYER_APARTMENT_BUILDING_ENTRANCE',
                    width: 16,
                    x: 32,
                    y: 48,
                  },
                ],
              }
            : { objects: [] }
        ),
        heightInPixels: 240,
        widthInPixels: 320,
      },
    });

    scene.player = { x: 64, y: 96 };

    expect(scene.buildPreviewWorldState().districtCollectibles).toEqual({
      collectedCount: 1,
      districtId: 'district-01',
      districtLabel: 'District 01',
      remainingCount: 0,
      totalCount: 1,
    });
  });

  it('hides authored collectible map art after the collectible is owned', () => {
    const removeTileAt = vi.fn();
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        getOwnedCollectibleSlugs: () => ['city.collectible.district-01.ada.v1'],
        previewDeviceClass: 'desktop',
      }),
    });

    scene.collectibleDisplayEntries = [
      {
        collectibleConfig: {
          storeSlug: 'city.collectible.district-01.ada.v1',
        },
        display: {
          setVisible: vi.fn(),
        },
        mapTileEntries: [
          {
            isRemoved: false,
            layer: {
              putTileAt: vi.fn(),
              removeTileAt,
            },
            tileIndex: 5731,
            tileX: 38,
            tileY: 2,
          },
        ],
        shadow: {
          setVisible: vi.fn(),
        },
      },
    ];

    scene.syncCollectibleDisplayVisibility();

    expect(scene.collectibleDisplayEntries[0].display.setVisible).toHaveBeenCalledWith(false);
    expect(scene.collectibleDisplayEntries[0].shadow.setVisible).toHaveBeenCalledWith(false);
    expect(removeTileAt).toHaveBeenCalledWith(38, 2);
    expect(scene.collectibleDisplayEntries[0].mapTileEntries[0].isRemoved).toBe(true);
  });

  it('creates synthetic interaction zones for configured exterior actors', () => {
    const scene = createScene({
      previewLocationId: 'exterior-seed',
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Interactables'
            ? {
                objects: [
                  {
                    height: 50,
                    id: 46,
                    name: 'PLAYER_APARTMENT_BUILDING_ENTRANCE',
                    width: 30,
                    x: 512,
                    y: 225,
                  },
                ],
              }
            : { objects: [] }
        ),
      },
    });

    scene.createCollectibleDisplays = vi.fn();
    scene.createDialogueDisplays = vi.fn();
    scene.createStaticZone = vi.fn((zoneObject) => ({ zoneObject }));
    scene.shouldShowCollisionDebug = vi.fn(() => false);

    scene.createInteractionZones();

    expect(scene.interactionZoneEntries.map((zoneEntry) => zoneEntry.object.name)).toContain(
      'DISTRICT_01_LOCKDOWN_COP'
    );
  });

  it('shows and clears the lockdown cop dialogue', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 'configured:DISTRICT_01_LOCKDOWN_COP',
          name: 'DISTRICT_01_LOCKDOWN_COP',
        },
      },
      previewLocationId: 'exterior-seed',
    });

    scene.isIntroSequenceComplete = true;

    scene.handleInteraction();

    expect(scene.buildObjectiveHudState()).toMatchObject({
      accentLabel: 'Port Meridian Police',
      nextActionLabel: 'Continue',
      statusLabel: 'Checkpoint',
      title: 'District 01 Lockdown',
    });

    scene.handlePreviewHudAdvance();

    expect(scene.activeSceneDialogue).toBeNull();
  });

  it('exposes mobile prompts for non-window interactions that define them', () => {
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 'configured:DISTRICT_01_LOCKDOWN_COP',
          name: 'DISTRICT_01_LOCKDOWN_COP',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        previewDeviceClass: 'phone',
      }),
      previewLocationId: 'exterior-seed',
    });

    expect(scene.buildInteractionContext().mobileInteractionPrompt).toBe(
      'Tap Interact to ask the officer about the lockdown.'
    );
  });

  it('hydrates exterior map marker routes from the guest path context', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          selectedTrialLearningPath: 'javascript-path',
        },
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'exterior-seed',
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Interactables'
            ? {
                objects: [
                  { height: 16, name: 'LEARNING_PATH_BUILDING_ENTRANCE', width: 16, x: 64, y: 96 },
                  { height: 16, name: 'CLUSTER_MAP_BUILDING_ENTRANCE', width: 16, x: 144, y: 176 },
                ],
              }
            : { objects: [] }
        ),
      },
    });

    const learningPoint = scene.resolveMapPoint(scene.getMapPointConfig('learning-path'));
    const clusterPoint = scene.resolveMapPoint(scene.getMapPointConfig('cluster-map'));

    expect(learningPoint).toMatchObject({
      targetPath: '/learning/javascript-path',
    });
    expect(clusterPoint).toMatchObject({
      targetPath: '/games/clusters',
    });
  });
});
