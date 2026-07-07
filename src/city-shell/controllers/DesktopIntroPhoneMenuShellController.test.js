import { describe, expect, it } from 'vitest';

import { DESKTOP_INTRO_PHONE_MENU_SHELL_ID } from '../../utils/navigation/apartmentEntryState';
import DesktopIntroPhoneMenuShellController from './DesktopIntroPhoneMenuShellController';

describe('DesktopIntroPhoneMenuShellController', () => {
  it('mounts a menu-only desktop intro phone shell without mobile anomaly apps', () => {
    const controller = new DesktopIntroPhoneMenuShellController({
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    const snapshot = controller.getSnapshot();
    const phoneAppIds = snapshot.phoneApps.map((app) => app.id);

    expect(snapshot.deviceClass).toBe('desktop');
    expect(snapshot.shellId).toBe(DESKTOP_INTRO_PHONE_MENU_SHELL_ID);
    expect(snapshot.title).toBe('Safehouse Field Device');
    expect(snapshot.phoneHardwareFrameSrc).toContain('/White/front.png');
    expect(snapshot.phoneDecorativeShortcuts).toEqual([]);
    expect(snapshot.phoneHomeNotifications).toEqual([]);
    expect(snapshot.footerHint).not.toMatch(/desktop shell|field menu/i);
    expect(snapshot.launchNote).not.toMatch(/desktop shell|objective, progress, and settings/i);
    expect(snapshot.phoneHomeHint).not.toMatch(/desktop shell|stay available here/i);
    expect(snapshot.launchNote).toMatch(/signal/i);
    expect(phoneAppIds).toContain('objective');
    expect(phoneAppIds).toContain('settings');
    expect(phoneAppIds).toContain('resume');
    expect(snapshot.phoneApps.find((app) => app.id === 'profile')?.disabled).toBe(true);
    expect(snapshot.phoneApps.find((app) => app.id === 'travel')?.disabled).toBe(true);
    expect(phoneAppIds).not.toContain('crawlnet-browser');
    expect(phoneAppIds).not.toContain('tunnel');
    expect(phoneAppIds).not.toContain('codegrind-exe');

    controller.destroy();
  });

  it('does not reintroduce mobile intro anomaly apps or activate hidden desktop menu entries', () => {
    const controller = new DesktopIntroPhoneMenuShellController({
      terminalZoneName: 'Terminal_Interaction_Point',
    });

    controller.activatePhoneApp('crawlnet-browser');
    let snapshot = controller.getSnapshot();

    expect(snapshot.activePhoneAppId).toBeNull();

    const rebuiltPhoneAppIds = controller
      .rebuildPhoneApps(snapshot, {
        isProgramReady: true,
        isTunnelUnlocked: true,
      })
      .map((app) => app.id);

    expect(rebuiltPhoneAppIds).not.toContain('crawlnet-browser');
    expect(rebuiltPhoneAppIds).not.toContain('tunnel');
    expect(rebuiltPhoneAppIds).not.toContain('codegrind-exe');

    controller.destroy();
  });
});
