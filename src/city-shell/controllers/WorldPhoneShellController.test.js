import { describe, expect, it, vi } from 'vitest';

import WorldPhoneShellController from './WorldPhoneShellController';

describe('WorldPhoneShellController', () => {
  it('surfaces a tunnel app in valid terminal zones and launches the linked target', () => {
    const onLaunchProgram = vi.fn();
    const controller = new WorldPhoneShellController({
      onLaunchProgram,
      terminalZoneName: 'Terminal_Interaction_Point',
      tunnelLaunchRequest: {
        programId: 'city-tunnel.exe',
        targetLaunchRequest: {
          problemSlug: 'contains-duplicate',
          source: 'world-phone-terminal',
          type: 'tower-defense',
        },
        targetPath: '/games/tower-defense/contains-duplicate',
      },
    });

    const snapshot = controller.getSnapshot();

    expect(snapshot.phoneApps.find((app) => app.id === 'tunnel')).toMatchObject({
      action: 'launch-program',
      dockOrder: 2,
      label: 'Tunnel',
    });

    controller.activatePhoneApp('tunnel');

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'tunnel',
        programId: 'city-tunnel.exe',
        targetPath: '/games/tower-defense/contains-duplicate',
        targetLaunchRequest: expect.objectContaining({
          problemSlug: 'contains-duplicate',
        }),
      })
    );

    controller.destroy();
  });

  it('reuses the intro-family phone home contract while routing leave-world apps through warnings', () => {
    const onLaunchProgram = vi.fn();
    const controller = new WorldPhoneShellController({
      guestPhoneContext: {
        isAuthenticated: true,
        selectedTrialLearningPath: 'javascript-path',
      },
      onLaunchProgram,
    });

    const snapshot = controller.getSnapshot();
    const leaderboardsApp = snapshot.phoneApps.find((app) => app.id === 'leaderboards');
    const profileApp = snapshot.phoneApps.find((app) => app.id === 'profile');

    expect(snapshot.phoneDecorativeShortcuts).toEqual([]);
    expect(snapshot.phoneMode).toBe('hub');
    expect(snapshot.phoneHardwareFrameSrc).toContain('/Model_02/Black/front.png');
    expect(snapshot.phoneApps.find((app) => app.id === 'objective')).toMatchObject({
      label: 'Objective',
      windowTitle: 'Objective Brief',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')?.label).toBe('Game Map');
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')?.disabled).toBeUndefined();
    expect(snapshot.phoneApps.find((app) => app.id === 'clusters')).toMatchObject({
      label: 'Clusters',
      windowTitle: 'Clusters Progress',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'learning')).toMatchObject({
      label: 'Learning',
      windowTitle: 'Learning Preview',
    });
    expect(leaderboardsApp).toMatchObject({
      badge: 'Leave',
      label: 'Leaderboards',
      windowTitle: 'Leaderboards',
    });
    expect(leaderboardsApp.actions[0]).toMatchObject({
      label: 'Open Leaderboards',
      targetPath: '/leaderboards',
      type: 'launch-program',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'settings')?.label).toBe('Game Settings');
    expect(snapshot.phoneApps.find((app) => app.id === 'settings')).toMatchObject({
      dockOrder: 1,
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'resume')?.label).toBe('Back to Game');
    expect(snapshot.phoneApps.find((app) => app.id === 'resume')).toMatchObject({
      dockOrder: 3,
    });
    expect(profileApp).toMatchObject({
      badge: 'Leave',
      label: 'Profile',
      windowTitle: 'Profile',
    });
    expect(profileApp.actions[0]).toMatchObject({
      label: 'Open Profile',
      targetPath: '/profile',
      type: 'launch-program',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'learning')?.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetPath: '/learning/javascript-path',
          type: 'launch-program',
        }),
      ])
    );
    expect(snapshot.phoneApps.find((app) => app.id === 'clusters')?.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetPath: '/games/clusters',
          type: 'launch-program',
        }),
      ])
    );

    controller.activatePhoneApp('profile');
    expect(onLaunchProgram).not.toHaveBeenCalled();

    controller.runPhoneAction(profileApp.actions[0]);

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'profile',
        programId: 'Profile',
        targetPath: '/profile',
      })
    );

    controller.destroy();
  });

  it('surfaces route and progress summaries on learning and cluster preview cards', () => {
    const controller = new WorldPhoneShellController({
      guestPhoneContext: {
        isAuthenticated: false,
        progressSummary: {
          clusterFreeProblemsRemaining: 1,
          clusterTrialProblemLimit: 3,
          clusterTrialSolvedCount: 2,
          clustersBrowsedCount: 2,
          learningNodesCompletedCount: 4,
          learningNodesStartedCount: 5,
          learningTrialProblemLimit: 4,
          learningTrialProblemsRemaining: 1,
          learningTrialSolvedCount: 3,
          problemsAttemptedCount: 5,
          problemsSolvedCount: 3,
        },
        selectedTrialLearningPath: 'python-path',
        selectedTrialTrack: 'pro',
      },
      previewWorldState: {
        locationLabel: 'Apartment Safehouse',
      },
    });

    const snapshot = controller.getSnapshot();
    const learningApp = snapshot.phoneApps.find((app) => app.id === 'learning');
    const clustersApp = snapshot.phoneApps.find((app) => app.id === 'clusters');

    expect(learningApp.detail).toContain('Apartment Safehouse');
    expect(learningApp.detail).toContain('Module 0 preview shows 3 of 4 trial problems cleared');
    expect(learningApp.cards[0].body).toContain('Python path is the active learning route');
    expect(learningApp.cards[2].body).toContain('4 learning nodes completed');

    expect(clustersApp.detail).toContain('Cluster preview shows 2 of 3 trial breaches cleared');
    expect(clustersApp.cards[0].body).toContain('Pro track governs the cluster handoff');
    expect(clustersApp.cards[2].body).toContain('2 clusters browsed and 2 trial breaches cleared');

    controller.destroy();
  });

  it('surfaces recovered collectibles with archive counts, image data, and field notes', () => {
    const controller = new WorldPhoneShellController({
      ownedCityCollectibleSlugs: ['city.collectible.district-01.ada.v1'],
      previewWorldState: {
        locationId: 'exterior-seed',
        locationLabel: 'District 01 Exterior',
      },
    });

    const collectiblesApp = controller
      .getSnapshot()
      .phoneApps.find((app) => app.id === 'collectibles');

    expect(collectiblesApp).toMatchObject({
      badge: '1/1',
      label: 'Collectibles',
      windowTitle: 'Collectibles Archive',
    });
    expect(collectiblesApp.cards[0].title).toBe('District 01 Archive');
    expect(collectiblesApp.cards[0].body).toContain('You have recovered 1 collectible');
    expect(collectiblesApp.cards[1]).toMatchObject({
      eyebrow: 'Recovered portrait',
      imageAlt: 'Ada collectible portrait',
      title: 'Ada',
    });
    expect(collectiblesApp.cards[1].imageSrc).toContain('Ada_Collectible_Pic.jpg');
    expect(collectiblesApp.cards[1].body).toContain('Analytical Engine');

    controller.destroy();
  });

  it('routes guest profile launches to Site Home with a sign-in warning', () => {
    const onLaunchProgram = vi.fn();
    const controller = new WorldPhoneShellController({
      guestPhoneContext: {
        isAuthenticated: false,
      },
      onLaunchProgram,
    });

    const snapshot = controller.getSnapshot();
    const profileApp = snapshot.phoneApps.find((app) => app.id === 'profile');

    expect(profileApp.badge).toBe('Sign in');
    expect(profileApp.cards[1].body).toContain(
      'sends you to Site Home instead of the profile dashboard'
    );
    expect(profileApp.actions[0]).toMatchObject({
      label: 'Go to Site Home',
      targetPath: '/',
      type: 'launch-program',
    });

    controller.activatePhoneApp('profile');
    controller.runPhoneAction(profileApp.actions[0]);

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'profile',
        programId: 'Home',
        targetPath: '/',
      })
    );

    controller.destroy();
  });

  it('stores live world state on the snapshot and reflects waypoint taps immediately', () => {
    const onSetWaypoint = vi.fn();
    const controller = new WorldPhoneShellController({
      onSetWaypoint,
      previewHudState: {
        footer: 'Head for the safehouse terminal.',
        statusLabel: 'Objective',
        targetPointId: 'safehouse-terminal',
        text: 'The terminal just caught a stray signal.',
        title: 'Stray Signal',
      },
      previewWorldState: {
        activeWaypointId: null,
        locationId: 'district-01-apartment-safehouse',
        locationLabel: 'Apartment Safehouse',
        markers: [
          {
            id: 'safehouse-terminal',
            label: 'Safehouse Terminal',
            shortLabel: 'TERM',
            xPercent: 44,
            yPercent: 33,
          },
          {
            id: 'learning-path',
            label: 'Learning Path',
            shortLabel: 'LEARN',
            targetPath: '/learning',
            xPercent: 12,
            yPercent: 71,
          },
        ],
        objectivePointId: 'safehouse-terminal',
        player: {
          xPercent: 50,
          yPercent: 62,
        },
      },
    });

    expect(controller.getSnapshot().phoneObjectiveState).toMatchObject({
      targetPointId: 'safehouse-terminal',
      title: 'Stray Signal',
    });
    expect(controller.getSnapshot().phoneWorldState).toMatchObject({
      locationLabel: 'Apartment Safehouse',
      objectivePointId: 'safehouse-terminal',
    });

    controller.runPhoneAction({
      id: 'pin-learning-path',
      type: 'set-waypoint',
      waypoint: {
        pointId: 'learning-path',
      },
    });

    expect(onSetWaypoint).toHaveBeenCalledWith({ pointId: 'learning-path' });
    expect(controller.getSnapshot().activeWaypointId).toBe('learning-path');
    expect(controller.getSnapshot().phoneWorldState).toMatchObject({
      activeWaypointId: 'learning-path',
    });

    controller.destroy();
  });

  it('honors an explicit null objective target instead of falling back to the scene default', () => {
    const controller = new WorldPhoneShellController({
      previewHudState: {
        footer: 'First objective: Visit the Street Sandbox and start the first real learning run.',
        targetPointId: null,
        text: 'The Sysadmin sent you toward the Street Sandbox.',
        title: 'Sysadmin Signal',
      },
      previewWorldState: {
        locationLabel: 'Apartment Safehouse',
        markers: [
          {
            id: 'safehouse-terminal',
            label: 'Safehouse Terminal',
            shortLabel: 'TERM',
            xPercent: 44,
            yPercent: 33,
          },
        ],
        objectivePointId: 'safehouse-terminal',
      },
    });

    expect(controller.getSnapshot().phoneObjectiveState).toMatchObject({
      targetLabel: null,
      targetPointId: null,
      title: 'Sysadmin Signal',
    });

    controller.destroy();
  });

  it('builds an objective toggle that clears the active waypoint when already pinned', () => {
    const controller = new WorldPhoneShellController({
      previewHudState: {
        targetPointId: 'safehouse-terminal',
        text: 'The safehouse terminal is still holding the stray transmission open.',
        title: 'Stray Signal',
      },
      previewWorldState: {
        activeWaypointId: 'safehouse-terminal',
        markers: [
          {
            id: 'safehouse-terminal',
            label: 'Safehouse Terminal',
            shortLabel: 'TERM',
            xPercent: 44,
            yPercent: 33,
          },
        ],
        objectivePointId: 'safehouse-terminal',
      },
    });

    expect(
      controller.getSnapshot().phoneApps.find((app) => app.id === 'objective')?.actions
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Unpin Objective',
          waypoint: {
            pointId: null,
          },
        }),
      ])
    );

    controller.destroy();
  });
});
