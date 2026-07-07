import { describe, expect, it } from 'vitest';

import {
  buildBlockedGuestTrialNotice,
  canOpenDesktopPhoneMenu,
  getPortraitPhoneLockMessage,
  isDesktopPhoneShortcutKey,
  isPreviewPhoneMenuUnlocked,
  resolveDesktopPhoneShellRequest,
  resolveCityLaunchDestination,
  shouldDeferLandscapeLaunch,
  shouldDeferPhoneShellClose,
} from './cityPhaserPreviewHelpers';

describe('CityPhaserPreviewPage phone gating helpers', () => {
  it('keeps the mobile phone menu locked until movement is unlocked and the terminal zone is active', () => {
    expect(isPreviewPhoneMenuUnlocked(null)).toBe(false);
    expect(isPreviewPhoneMenuUnlocked({ movementUnlocked: true, terminalZoneActive: false })).toBe(
      false
    );
    expect(isPreviewPhoneMenuUnlocked({ movementUnlocked: false, terminalZoneActive: true })).toBe(
      false
    );
    expect(isPreviewPhoneMenuUnlocked({ movementUnlocked: true, terminalZoneActive: true })).toBe(
      true
    );
  });

  it('returns the correct portrait guidance before the phone unlock beat', () => {
    expect(
      getPortraitPhoneLockMessage({ movementUnlocked: false, terminalZoneActive: false })
    ).toMatch(/Turn back to landscape/i);
    expect(
      getPortraitPhoneLockMessage({ movementUnlocked: true, terminalZoneActive: false })
    ).toMatch(/safehouse terminal/i);
    expect(
      getPortraitPhoneLockMessage({ movementUnlocked: true, terminalZoneActive: true })
    ).toBeNull();
  });

  it('accepts both P and Escape as desktop phone shortcuts', () => {
    expect(isDesktopPhoneShortcutKey('p')).toBe(true);
    expect(isDesktopPhoneShortcutKey('P')).toBe(true);
    expect(isDesktopPhoneShortcutKey('Esc')).toBe(true);
    expect(isDesktopPhoneShortcutKey('Escape')).toBe(true);
    expect(isDesktopPhoneShortcutKey('Enter')).toBe(false);
  });

  it('keeps the desktop intro phone menu available before the terminal-zone beat and routes to the intro phone shell', () => {
    expect(
      canOpenDesktopPhoneMenu({
        resolvedApartmentState: 'intro',
      })
    ).toBe(true);

    expect(
      resolveDesktopPhoneShellRequest({
        previewInteractionState: null,
        resolvedApartmentState: 'intro',
      })
    ).toMatchObject({
      shellId: 'desktop-intro-phone-menu',
      terminalInstanceId: 'city-desktop-companion-phone',
      terminalName: 'Safehouse Field Device',
      terminalZoneName: null,
    });
  });

  it('keeps the desktop companion phone request for the post-intro city menu', () => {
    expect(
      resolveDesktopPhoneShellRequest({
        previewInteractionState: null,
        resolvedApartmentState: 'hub',
      })
    ).toMatchObject({
      shellId: 'desktop-phone-menu',
      terminalInstanceId: 'city-desktop-companion-phone',
      terminalName: 'Companion Phone',
    });
  });

  it('defers handheld phone close while portrait is active', () => {
    expect(
      shouldDeferPhoneShellClose({
        isMobileDevice: true,
        isPortraitViewport: true,
        request: { deviceClass: 'phone' },
      })
    ).toBe(true);

    expect(
      shouldDeferPhoneShellClose({
        isMobileDevice: true,
        isPortraitViewport: false,
        request: { deviceClass: 'phone' },
      })
    ).toBe(false);

    expect(
      shouldDeferPhoneShellClose({
        isMobileDevice: true,
        isPortraitViewport: true,
        request: { deviceClass: 'desktop' },
      })
    ).toBe(false);
  });

  it('defers required landscape launches while handheld portrait is active', () => {
    expect(
      shouldDeferLandscapeLaunch({
        isMobileDevice: true,
        isPortraitViewport: true,
        request: { programId: 'codegrind.exe', requireLandscape: true },
      })
    ).toBe(true);

    expect(
      shouldDeferLandscapeLaunch({
        isMobileDevice: true,
        isPortraitViewport: false,
        request: { programId: 'codegrind.exe', requireLandscape: true },
      })
    ).toBe(false);
  });

  it('prefers explicit launch targets for handheld tunnel handoffs', () => {
    expect(
      resolveCityLaunchDestination({
        programId: 'safehouse-tunnel.exe',
        targetLaunchRequest: {
          problemSlug: 'two-sum',
          type: 'tower-defense',
        },
        targetPath: '/games/tower-defense/two-sum',
      })
    ).toEqual({
      targetLaunchRequest: {
        problemSlug: 'two-sum',
        type: 'tower-defense',
      },
      targetPath: '/games/tower-defense/two-sum',
    });
  });

  it('builds opposite-route guest trial notice copy around the chosen building', () => {
    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'clusters',
        selectedTrialTrack: 'beginner',
      })
    ).toMatchObject({
      id: 'city-guest-trial-beginner-clusters',
      title: 'Guest trial stays on your chosen route',
    });

    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'clusters',
        selectedTrialTrack: 'beginner',
      })?.description
    ).toContain('Street Sandbox');
    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'clusters',
        selectedTrialTrack: 'beginner',
      })?.description
    ).toContain("Broker's Core");
  });

  it('builds store guest trial notice copy that points guests to sign in', () => {
    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'store',
        selectedTrialTrack: 'pro',
      })
    ).toMatchObject({
      id: 'city-guest-trial-store-pro',
      title: 'Sign in to enter the Packet Bazaar',
    });

    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'store',
        selectedTrialTrack: 'pro',
      })?.description
    ).toContain("Broker's Core");
    expect(
      buildBlockedGuestTrialNotice({
        routeSurface: 'store',
        selectedTrialTrack: 'pro',
      })?.description
    ).toContain('Packet Bazaar');
  });
});
