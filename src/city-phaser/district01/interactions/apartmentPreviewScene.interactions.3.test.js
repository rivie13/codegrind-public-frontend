import { describe, expect, it, vi } from 'vitest';

import {
  APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
  createScene,
} from './interactionTestHelpers';

describe('apartmentPreviewScene interactions 3', () => {
  it('builds the beginner post-path-choice apartment objective from the Sysadmin comm', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        entry: 'path-choice',
        guestPhoneContext: {
          selectedTrialTrack: 'beginner',
        },
        previewDeviceClass: 'desktop',
      }),
    });

    scene.isIntroSequenceComplete = true;
    scene.terminalCueContainer = { visible: true };

    expect(scene.buildObjectiveHudState()).toMatchObject({
      accentLabel: 'Incoming comm // Sysadmin',
      statusLabel: 'Learning route',
      title: 'Sysadmin Signal',
      targetPointId: null,
    });
    expect(scene.buildObjectiveHudState()?.text).toContain('sandbox rig down the block');
    expect(scene.buildObjectiveHudState()?.footer).toContain('Street Sandbox');
  });

  it('builds the interview-prep post-path-choice apartment objective from the Fixer comm', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        entry: 'path-choice',
        guestPhoneContext: {
          selectedTrialTrack: 'pro',
        },
        previewDeviceClass: 'desktop',
      }),
    });

    scene.isIntroSequenceComplete = true;
    scene.terminalCueContainer = { visible: true };

    expect(scene.buildObjectiveHudState()).toMatchObject({
      accentLabel: 'Incoming comm // Fixer',
      statusLabel: 'Broker route',
      title: 'Fixer Signal',
      targetPointId: null,
    });
    expect(scene.buildObjectiveHudState()?.text).toContain("Broker's Core");
    expect(scene.buildObjectiveHudState()?.footer).toContain('tap the first live line');
  });

  it('still builds the interview-prep post-path-choice objective before the terminal cue is visible', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        entry: 'path-choice',
        guestPhoneContext: {
          selectedTrialTrack: 'pro',
        },
        previewDeviceClass: 'desktop',
      }),
    });

    scene.isIntroSequenceComplete = true;
    scene.terminalCueContainer = { visible: false };

    expect(scene.buildObjectiveHudState()).toMatchObject({
      accentLabel: 'Incoming comm // Fixer',
      statusLabel: 'Broker route',
      title: 'Fixer Signal',
    });
    expect(scene.buildObjectiveHudState()?.text).toContain("Broker's Core");
  });

  it('builds the apartment walk-step objective in the left HUD slot with district location info', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'intro',
        apartmentShellId: 'apartment-intro-desktop',
        previewDeviceClass: 'desktop',
      }),
    });

    scene.isIntroSequenceComplete = true;
    scene.terminalCueContainer = { visible: true };

    expect(scene.buildObjectiveHudState()).toMatchObject({
      districtLocationLabel: 'District 01: Apartment',
      footer: 'Use WASD or the Arrow Keys to move. Press E when you reach the terminal.',
      hotkey: 'WASD',
      placement: 'top-left',
      presentation: 'compact-objective',
      targetPointId: 'safehouse-terminal',
    });
    expect(scene.buildObjectiveHudState()?.text).toBe('OBJ: Reach the safehouse terminal.');
  });

  it('clears the apartment terminal as the default world objective once hub state is active', () => {
    const scene = createScene({
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        apartmentShellId: 'apartment-hub-desktop',
        previewDeviceClass: 'desktop',
      }),
      tilemap: {
        getObjectLayer: vi.fn((layerName) =>
          layerName === 'Interactables'
            ? {
                objects: [
                  {
                    height: 16,
                    name: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
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

    expect(scene.buildPreviewWorldState().objectivePointId).toBeNull();
  });

  it('builds the exterior ambient objective even when no terminal cue is visible', () => {
    const scene = createScene({
      previewLocationId: 'exterior-seed',
    });

    scene.isIntroSequenceComplete = true;
    scene.terminalCueContainer = { visible: false };

    expect(scene.buildObjectiveHudState()).toMatchObject({
      districtLocationLabel: 'District 01: Exterior',
      footer:
        'Open the phone map to mark a stop, then press E at doors, field disks, or contact points.',
      hotkey: 'E',
      placement: 'top-left',
      presentation: 'compact-objective',
      statusLabel: 'Street route',
      title: 'Current Objective',
    });
    expect(scene.buildObjectiveHudState()?.text).toBe(
      'OBJ: Inspect the field disk or enter a building.'
    );
  });

  it('opens the apartment intro shell from the safehouse terminal when no route launch target exists', () => {
    const onLaunchProgram = vi.fn();
    const onShellRequestOpen = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 41,
          name: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'intro',
        apartmentShellId: 'apartment-intro-desktop',
        onLaunchProgram,
        onShellRequestOpen,
        previewDeviceClass: 'desktop',
      }),
    });

    scene.handleInteraction();

    expect(onLaunchProgram).not.toHaveBeenCalled();
    expect(onShellRequestOpen).toHaveBeenCalledWith({
      shellId: 'apartment-intro-desktop',
      terminalInstanceId: 'apartment-safehouse-terminal',
      terminalName: 'Apartment Safehouse Terminal',
      terminalZoneName: APARTMENT_SAFEHOUSE_TERMINAL_INTERACTION_NAME,
    });
  });

  it('launches the selected learning path directly from the learning-building terminal', () => {
    const onLaunchProgram = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 77,
          name: 'DISTRICT_01_LEARNING_PATH_BUILDING_TERMINAL_INTERACTION_ZONE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        guestPhoneContext: {
          selectedTrialLearningPath: 'javascript-path',
        },
        onLaunchProgram,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'learning-module-guide-01',
    });

    scene.handleInteraction();

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPath: '/learning/javascript-path',
        terminalName: 'Street Sandbox Terminal',
      })
    );
  });

  it('launches the cluster map directly from the broker terminal', () => {
    const onLaunchProgram = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 78,
          name: 'DISTRICT_01_CLUSTER_MAP_TERMINAL_INTERACTION_ZONE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        onLaunchProgram,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'array-fixer-office-01',
    });

    scene.handleInteraction();

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPath: '/games/clusters',
        terminalName: "Broker's Core Terminal",
      })
    );
  });

  it('launches the store directly from the bazaar terminal', () => {
    const onLaunchProgram = vi.fn();
    const scene = createScene({
      activeInteractionZone: {
        object: {
          id: 79,
          name: 'DISTRICT_01_DATA_PACKET_SHOP_INTERACTION_ZONE',
        },
      },
      getPreviewBridge: () => ({
        apartmentEntryState: 'hub',
        onLaunchProgram,
        previewDeviceClass: 'desktop',
      }),
      previewLocationId: 'packet-bazaar-interior-01',
    });

    scene.handleInteraction();

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        targetPath: '/store',
        terminalName: 'Packet Bazaar Terminal',
      })
    );
  });
});
