import { describe, expect, it, vi } from 'vitest';

import ApartmentIntroPhoneShellController from './ApartmentIntroPhoneShellController';

describe('ApartmentIntroPhoneShellController', () => {
  it('starts on the phone home screen and exposes a web notification only at the signal-ready terminal beat', () => {
    const controller = new ApartmentIntroPhoneShellController({
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    const snapshot = controller.getSnapshot();

    expect(snapshot.phoneView).toBe('home');
    expect(snapshot.activePhoneAppId).toBeNull();
    expect(snapshot.signalFeedReady).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'crawlnet-browser')?.disabled).toBe(false);
    expect(snapshot.phoneApps.find((app) => app.id === 'anomaly-log')).toBeUndefined();
    expect(snapshot.phoneApps.find((app) => app.id === 'objective')?.label).toBe('Objective');
    expect(snapshot.phoneApps.find((app) => app.id === 'settings')).toMatchObject({
      dockOrder: 1,
      label: 'Game Settings',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')).toMatchObject({
      disabled: true,
      label: 'Game Map',
    });
    expect(snapshot.phoneApps.find((app) => app.id === 'profile')?.disabled).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'tunnel')).toBeUndefined();
    expect(snapshot.phoneApps.find((app) => app.id === 'resume')?.action).toBe('close-shell');
    expect(snapshot.phoneApps.find((app) => app.id === 'resume')).toMatchObject({
      badge: 'Resume',
      label: 'Back to Game',
    });
    expect(snapshot.phoneHomeNotifications[0]).toMatchObject({
      appId: 'crawlnet-browser',
      title: 'Web anomaly ping',
    });

    controller.destroy();
  });

  it('keeps the web app locked and the phone desktop quiet before the terminal signal is ready', () => {
    const controller = new ApartmentIntroPhoneShellController();

    const snapshot = controller.getSnapshot();

    expect(snapshot.phoneView).toBe('home');
    expect(snapshot.signalFeedReady).toBe(false);
    expect(snapshot.phoneApps.find((app) => app.id === 'crawlnet-browser')?.disabled).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')?.disabled).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'profile')?.disabled).toBe(true);
    expect(snapshot.phoneHomeNotifications).toEqual([]);

    controller.destroy();
  });

  it('preserves the intro phone contract when mounted as a desktop overlay', () => {
    const controller = new ApartmentIntroPhoneShellController({
      deviceClass: 'desktop',
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    const snapshot = controller.getSnapshot();

    expect(snapshot.deviceClass).toBe('desktop');
    expect(snapshot.phoneMode).toBe('intro');
    expect(snapshot.phoneDecorativeShortcuts).toEqual([]);
    expect(snapshot.phoneApps.find((app) => app.id === 'profile')?.disabled).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')?.disabled).toBe(true);

    controller.destroy();
  });

  it('routes the anomalous feed selection into the tunnel handoff step', () => {
    vi.useFakeTimers();
    const controller = new ApartmentIntroPhoneShellController({
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    controller.activatePhoneApp('crawlnet-browser');
    controller.selectFeedItem('anomaly-retrograde');

    let snapshot = controller.getSnapshot();

    expect(snapshot.activeFeedItemId).toBe('anomaly-retrograde');
    expect(snapshot.phoneView).toBe('home');
    expect(snapshot.activePhoneAppId).toBeNull();
    expect(snapshot.phoneApps.find((app) => app.id === 'tunnel')).toBeTruthy();
    expect(snapshot.introTunnel.status).toBe('pending-landscape');

    vi.advanceTimersByTime(300);
    snapshot = controller.getSnapshot();

    expect(snapshot.activePhoneAppId).toBe('tunnel');
    expect(snapshot.phoneView).toBe('app');
    expect(snapshot.launchNote).toMatch(/Rotate to landscape|Tunnel relay opening/i);

    controller.destroy();
    vi.useRealTimers();
  });

  it('locks the intro tunnel until the player answers yes and finishes the download', () => {
    vi.useFakeTimers();
    const onLaunchProgram = vi.fn();
    const controller = new ApartmentIntroPhoneShellController({
      onLaunchProgram,
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    controller.activatePhoneApp('crawlnet-browser');
    controller.selectFeedItem('anomaly-retrograde');
    vi.advanceTimersByTime(300);

    controller.enterTunnelTerminal();
    vi.advanceTimersByTime(2000);

    let snapshot = controller.getSnapshot();

    expect(snapshot.introTunnel.status).toBe('awaiting-confirmation');
    expect(snapshot.phoneApps.find((app) => app.id === 'resume')?.disabled).toBe(true);

    controller.respondToTunnelConfirmation('no');
    snapshot = controller.getSnapshot();
    expect(snapshot.introTunnel.logs.at(-1)).toMatch(
      /syntax error|access denied|command not found|user error/i
    );

    controller.respondToTunnelConfirmation('yes');
    vi.advanceTimersByTime(1600);
    snapshot = controller.getSnapshot();

    expect(snapshot.introTunnel.status).toBe('complete');
    expect(snapshot.phoneView).toBe('home');
    expect(snapshot.phoneApps.find((app) => app.id === 'codegrind-exe')).toBeTruthy();

    controller.activatePhoneApp('codegrind-exe');

    expect(onLaunchProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'codegrind-exe',
        programId: 'codegrind.exe',
        requireLandscape: true,
      })
    );

    controller.destroy();
    vi.useRealTimers();
  });
});
