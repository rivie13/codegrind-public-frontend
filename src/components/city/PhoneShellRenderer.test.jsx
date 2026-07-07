import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PhoneShellRenderer from './PhoneShellRenderer';
import { resolveHandheldPhoneShellLayout } from './phoneShellLayout';

const normalizePhoneStatusDatePart = (value) =>
  String(value || '')
    .replace(/\./g, '')
    .toLocaleUpperCase();

const buildExpectedStatusDateLabel = (date) => {
  const weekday = normalizePhoneStatusDatePart(
    new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
  );
  const day = new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(date);
  const month = normalizePhoneStatusDatePart(
    new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date)
  );

  return `${weekday} ${day} ${month}`;
};

const setViewport = ({ height, width }) => {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  });
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

const buildSnapshot = (overrides = {}) => ({
  activeFeedItemId: 'anomaly-retrograde',
  activePhoneAppId: null,
  anomalousFeedItemId: 'anomaly-retrograde',
  deviceClass: 'phone',
  feedItems: [
    {
      id: 'gig-grid',
      category: 'Noise',
      headline: 'BOOTCAMP BLITZ // Learn code by sunrise',
      body: 'Stack nine crash courses before sunrise.',
    },
    {
      id: 'anomaly-retrograde',
      category: 'Signal',
      headline: 'PATCH // codegrind.exe available',
      body: 'DO yOU WanT tO LEaRN tO CoDE? dOWNloaD cODEgRIND.EXE, tHE aPP tHAt TeACHeS yOU eVERYtHINg yOU nEED tO KnOW.',
    },
  ],
  footerHint: 'Follow the crooked signal from the safehouse phone.',
  launchNote: 'Safehouse line open. Stay ready for the crooked signal.',
  notifications: [
    {
      id: 'intro-phone-notification',
      message: 'Crooked signal detected on the safehouse line.',
      title: 'Signal detected',
      tone: 'info',
    },
  ],
  phoneApps: [
    {
      id: 'crawlnet-browser',
      iconLabel: 'WEB',
      label: 'Web',
      badge: 'Ping',
      description:
        'Open CrawlNet and inspect the safehouse feed before the crooked listing slips away.',
      detail: 'CrawlNet keeps the manipulative feed contained inside a dedicated web app.',
      dockOrder: 0,
      showOnHome: false,
      windowTitle: 'CrawlNet Browser',
    },
    {
      id: 'learning',
      iconLabel: 'LP',
      label: 'Learning',
      badge: 'Preview',
      description: 'Preview where the learning path map lives.',
      detail: 'Learning path preview stays read-only during the intro.',
    },
    {
      id: 'clusters',
      iconLabel: 'CL',
      label: 'Clusters',
      badge: 'Preview',
      description: 'Preview where the cluster map lives.',
      detail: 'Cluster preview stays read-only during the intro.',
    },
    {
      id: 'profile',
      iconLabel: 'ME',
      label: 'Profile',
      badge: 'Locked',
      description: 'Profile unlocks after the intro.',
      detail: 'Profile routing is visible here but stays locked during the intro.',
      disabled: true,
    },
    {
      id: 'travel',
      iconLabel: 'MAP',
      label: 'Game Map',
      badge: 'Locked',
      description: 'Game Map unlocks after the intro.',
      detail: 'The intro keeps the game map locked.',
      disabled: true,
    },
    {
      id: 'objective',
      iconLabel: 'OBJ',
      label: 'Objective',
      badge: 'Now',
      description: 'Open the full objective brief from the phone.',
      detail: 'Review what matters now, why it matters, and what to do next.',
    },
    {
      id: 'settings',
      iconLabel: 'CFG',
      label: 'Game Settings',
      badge: 'Audio',
      description: 'Adjust audio and controls from the phone.',
      detail: 'Audio and control preferences live here.',
      dockOrder: 1,
      windowTitle: 'Game Settings',
    },
    {
      id: 'resume',
      label: 'Back to Game',
      action: 'close-shell',
      badge: 'Resume',
      description: 'Put the phone away and return to the safehouse.',
      detail: 'The intro phone stays up until the player explicitly stows it.',
      dockOrder: 3,
      showOnHome: false,
    },
  ],
  phoneDecorativeShortcuts: [],
  phoneHomeHint:
    'Open the web notification to inspect the feed, then tunnel back into landscape when ready.',
  phoneHomeNotifications: [
    {
      id: 'intro-web-ping',
      actionLabel: 'Open web',
      appId: 'crawlnet-browser',
      message: 'CrawlNet caught a crooked listing that skipped the normal sales pitch.',
      title: 'Web anomaly ping',
    },
  ],
  phoneHomeTitle: 'Safehouse Phone OS',
  introTunnel: {
    logs: ['Crooked listing confirmed. Tunnel relay armed.'],
    progress: 0,
    refusalCount: 0,
    status: 'hidden',
    typedCommand: '',
  },
  phoneMode: 'intro',
  phoneGameSettings: {
    controlSide: 'right',
    hudEnabled: true,
    musicEnabled: true,
    musicVolume: 0.42,
    routeGuideEnabled: true,
  },
  phoneView: 'home',
  shellFamilyId: 'phone',
  signalFeedReady: true,
  subtitle: 'Safehouse Phone // Crooked signal',
  title: 'Safehouse Field Device',
  ...overrides,
});

describe('PhoneShellRenderer', () => {
  it('computes a viewport-cover layout for handheld portrait and landscape shells', () => {
    const portraitLayout = resolveHandheldPhoneShellLayout({
      height: 844,
      shouldRotateLandscapePhone: false,
      width: 390,
    });

    expect(portraitLayout.shellHeight).toBe('844px');
    expect(Number.parseInt(portraitLayout.shellWidth, 10)).toBeGreaterThanOrEqual(390);

    const landscapeLayout = resolveHandheldPhoneShellLayout({
      height: 390,
      shouldRotateLandscapePhone: true,
      width: 844,
    });

    expect(landscapeLayout.shellWidth).toBe('844px');
    expect(Number.parseInt(landscapeLayout.shellHeight, 10)).toBeGreaterThanOrEqual(390);
  });

  it('renders the intro phone as a home screen with a web notification instead of a signal-feed app tile', () => {
    setViewport({ width: 430, height: 932 });

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot()}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getAllByText('Safehouse Phone OS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web anomaly ping').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Game Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Objective').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Back to Game').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Close phone')).not.toBeInTheDocument();
    expect(screen.queryByText('Signal Feed')).not.toBeInTheDocument();
  });

  it('shows live local date, time, and device battery when the browser exposes them', async () => {
    vi.useFakeTimers();
    const currentDate = new Date(2026, 4, 20, 13, 41, 0);
    const batteryManager = {
      addEventListener: vi.fn(),
      level: 0.47,
      removeEventListener: vi.fn(),
    };
    const originalGetBattery = window.navigator.getBattery;

    Object.defineProperty(window.navigator, 'getBattery', {
      configurable: true,
      value: vi.fn().mockResolvedValue(batteryManager),
    });
    vi.setSystemTime(currentDate);

    try {
      setViewport({ width: 430, height: 932 });

      render(
        <ChakraProvider>
          <PhoneShellRenderer
            snapshot={buildSnapshot({
              phoneHomeTitle: 'Port Meridian OS',
              phoneMode: 'menu',
            })}
            onAppActivate={vi.fn()}
            onClose={vi.fn()}
            onConfirmTerminalChoice={vi.fn()}
            onFeedItemSelect={vi.fn()}
            onHome={vi.fn()}
            shellTransitionPhase="open"
            onTunnelReady={vi.fn()}
          />
        </ChakraProvider>
      );

      const expectedTimeLabel = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(currentDate);
      const expectedDateLabel = buildExpectedStatusDateLabel(currentDate);

      expect(screen.getAllByText(expectedTimeLabel).length).toBeGreaterThan(0);
      expect(screen.getByText(expectedDateLabel)).toBeInTheDocument();

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('47%')).toBeInTheDocument();
      expect(window.navigator.getBattery).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();

      if (originalGetBattery === undefined) {
        Reflect.deleteProperty(window.navigator, 'getBattery');
      } else {
        Object.defineProperty(window.navigator, 'getBattery', {
          configurable: true,
          value: originalGetBattery,
        });
      }
    }
  });

  it('renders the signal feed inside the web app window with a home return control', () => {
    setViewport({ width: 430, height: 932 });
    const onFeedItemSelect = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({ phoneView: 'app', activePhoneAppId: 'crawlnet-browser' })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={onFeedItemSelect}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getAllByText('CrawlNet Browser').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Safehouse Phone OS').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByText('Signal Feed')).toBeInTheDocument();
    expect(screen.getByText('PATCH // codegrind.exe available')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /PATCH \/\/ codegrind\.exe available/i }));

    expect(onFeedItemSelect).toHaveBeenCalledWith('anomaly-retrograde');
  });

  it('rotates the phone shell into landscape when the handheld viewport rotates', () => {
    setViewport({ width: 932, height: 430 });

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot()}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(document.querySelector('[data-city-phone-shell="true"]')).toHaveAttribute(
      'data-phone-shell-orientation',
      'landscape'
    );
    expect(document.querySelector('[data-phone-screen-surface="true"]')).toHaveAttribute(
      'data-phone-screen-orientation',
      'landscape'
    );
    expect(document.querySelector('[data-phone-home-layout="landscape"]')).not.toBeNull();
    expect(document.querySelector('[data-phone-dock-layout="landscape"]')).not.toBeNull();
    expect(document.querySelector('[data-phone-home-layout="landscape"]')).toHaveStyle({
      overflowY: 'auto',
    });
    expect(
      document.querySelector(
        '[data-phone-dock-layout="landscape"] [data-phone-home-app="settings"]'
      )
    ).not.toBeNull();
    expect(document.querySelectorAll('[data-phone-home-app="settings"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-phone-home-app="resume"]')).toHaveLength(1);
  });

  it('makes the desktop phone home scrollable for compact desktop overlays', () => {
    setViewport({ width: 860, height: 520 });

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            deviceClass: 'desktop',
            phoneMode: 'intro',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    const homeLayout = document.querySelector('[data-phone-home-layout="portrait"]');

    expect(homeLayout).not.toBeNull();
    expect(homeLayout).toHaveStyle({ overflowY: 'auto' });
  });

  it('keeps the handheld hub app grid scrollable above the dock when the field shell exposes many apps', () => {
    setViewport({ width: 430, height: 932 });

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            phoneHomeHint: 'Choose an app or stow the phone and get moving.',
            phoneHomeNotifications: [
              {
                id: 'world-phone-objective-notification',
                actionLabel: 'Open objective',
                appId: 'objective',
                message: 'Objective, map, progress, and settings are one tap away.',
                title: 'Field device ready',
              },
            ],
            phoneHomeTitle: 'Port Meridian OS',
            phoneMode: 'hub',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    const homeGrid = document.querySelector('[data-phone-home-grid="true"]');

    expect(homeGrid).not.toBeNull();
    expect(homeGrid).toHaveStyle({ overflowY: 'auto' });
    expect(screen.getAllByText('Objective').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-phone-home-app="settings"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-phone-home-app="resume"]')).toHaveLength(1);
  });

  it('shows the intro tunnel guard in portrait and opens the readable terminal only in landscape', () => {
    const onTunnelReady = vi.fn();

    setViewport({ width: 430, height: 932 });
    const { rerender } = render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'tunnel',
            introTunnel: {
              logs: ['Crooked listing confirmed. Tunnel relay armed.'],
              progress: 0,
              refusalCount: 0,
              status: 'pending-landscape',
              typedCommand: '',
            },
            phoneApps: [
              {
                id: 'tunnel',
                iconLabel: 'TNL',
                label: 'Tunnel',
                badge: 'Ready',
                description: 'Tunnel armed.',
                detail: 'Rotate to landscape.',
              },
            ],
            phoneView: 'app',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={onTunnelReady}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/Rotate to landscape/i)).toBeInTheDocument();
    expect(onTunnelReady).not.toHaveBeenCalled();

    setViewport({ width: 932, height: 430 });
    rerender(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'tunnel',
            introTunnel: {
              logs: ['Crooked listing confirmed. Tunnel relay armed.'],
              progress: 0,
              refusalCount: 0,
              status: 'pending-landscape',
              typedCommand: '',
            },
            phoneApps: [
              {
                id: 'tunnel',
                iconLabel: 'TNL',
                label: 'Tunnel',
                badge: 'Ready',
                description: 'Tunnel armed.',
                detail: 'Rotate to landscape.',
              },
            ],
            phoneView: 'app',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={onTunnelReady}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/Injected command/i)).toBeInTheDocument();
    expect(onTunnelReady).toHaveBeenCalled();
  });

  it('renders live game settings controls inside the phone shell and forwards updates', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneMusicToggle = vi.fn();
    const onPhoneTrackSelect = vi.fn();
    const onPhoneMusicVolumeChange = vi.fn();
    const onPhoneControlSideChange = vi.fn();
    const onPhoneHudToggle = vi.fn();
    const onPhoneRouteGuideToggle = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'settings',
            phoneView: 'app',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneControlSideChange={onPhoneControlSideChange}
          onPhoneHudToggle={onPhoneHudToggle}
          onPhoneTrackSelect={onPhoneTrackSelect}
          onPhoneMusicToggle={onPhoneMusicToggle}
          onPhoneMusicVolumeChange={onPhoneMusicVolumeChange}
          onPhoneRouteGuideToggle={onPhoneRouteGuideToggle}
          phoneAvailableTracks={[
            {
              id: 'midnight-run',
              title: 'Midnight Run',
              artist: 'CodeGrind FM',
            },
            {
              id: 'signal-breach',
              title: 'Signal Breach',
              artist: 'Port Meridian',
            },
          ]}
          phoneCurrentTrack={{
            id: 'midnight-run',
            title: 'Midnight Run',
            artist: 'CodeGrind FM',
          }}
          phoneGameSettings={{
            controlSide: 'right',
            hudEnabled: true,
            musicEnabled: true,
            musicVolume: 0.42,
            routeGuideEnabled: true,
          }}
          phoneSelectedTrackId="midnight-run"
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Music On/i }));
    expect(onPhoneMusicToggle).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Play Signal Breach' }));
    expect(onPhoneTrackSelect).toHaveBeenCalledWith('signal-breach');

    fireEvent.click(screen.getByRole('button', { name: 'D-pad Left' }));
    expect(onPhoneControlSideChange).toHaveBeenCalledWith('left');

    fireEvent.click(screen.getByRole('button', { name: /HUD On/i }));
    expect(onPhoneHudToggle).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Route Guide On/i }));
    expect(onPhoneRouteGuideToggle).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Phone music volume' }), {
      key: 'ArrowRight',
    });
    expect(onPhoneMusicVolumeChange).toHaveBeenCalled();
    expect(screen.getByText('Current Song')).toBeInTheDocument();
    expect(screen.getAllByText('Midnight Run').length).toBeGreaterThan(0);
    expect(screen.getByText(/Keyboard Help/i)).toBeInTheDocument();
    expect(screen.getByText(/browser shortcut extensions/i)).toBeInTheDocument();
  });

  it('renders in-phone app cards with action buttons and forwards the selected action', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneAction = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'clusters',
            phoneApps: [
              {
                id: 'clusters',
                label: 'Clusters',
                badge: 'Preview',
                cards: [
                  {
                    title: 'Clusters',
                    body: 'See what you have cleared and what still needs work.',
                  },
                  {
                    title: 'Field Device Ready',
                    body: 'City handset linked.',
                  },
                ],
                actions: [
                  {
                    id: 'open-games-landing',
                    label: 'Open Games',
                    type: 'launch-program',
                    targetPath: '/games',
                  },
                ],
              },
            ],
            phoneView: 'app',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneAction={onPhoneAction}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(
      screen.getByText('See what you have cleared and what still needs work.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Games' }));
    expect(onPhoneAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'open-games-landing',
        targetPath: '/games',
        type: 'launch-program',
      })
    );
  });

  it('renders collectible archive cards with the recovered image and field note', () => {
    setViewport({ width: 430, height: 932 });

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'collectibles',
            phoneApps: [
              {
                id: 'collectibles',
                label: 'Collectibles',
                badge: '1/1',
                cards: [
                  {
                    title: 'District 01 Archive',
                    eyebrow: 'Recovered collectibles',
                    body: 'District 01 has 1 collectible in the current archive. You have recovered 1 collectible so far.',
                  },
                  {
                    title: 'Ada',
                    eyebrow: 'Recovered portrait',
                    body: "Ada Lovelace wrote the first published algorithm intended for Charles Babbage's Analytical Engine and recognized that a machine could manipulate symbols as well as numbers.",
                    footer:
                      'English mathematician and early computing visionary, often regarded as the first computer programmer.',
                    imageAlt: 'Ada collectible portrait',
                    imageSrc: '/city-v2/tiled/Collectibles/Ada_Collectible_Pic.jpg',
                  },
                ],
                windowTitle: 'Collectibles Archive',
              },
            ],
            phoneView: 'app',
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Collectibles Archive')).toBeInTheDocument();
    expect(screen.getByText('Recovered portrait')).toBeInTheDocument();
    expect(
      screen.getByText(/Ada Lovelace wrote the first published algorithm intended/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ada collectible portrait' })).toBeInTheDocument();
    expect(
      screen.getByText(/English mathematician and early computing visionary/i)
    ).toBeInTheDocument();
  });

  it('renders the objective window with a real waypoint action', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneAction = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'objective',
            phoneApps: [
              {
                id: 'objective',
                label: 'Objective',
                windowTitle: 'Objective Brief',
              },
            ],
            phoneObjectiveState: {
              footer: 'Reach the terminal and answer the signal.',
              statusLabel: 'Objective',
              targetPointId: 'safehouse-terminal',
              text: 'The safehouse terminal is still holding the stray transmission open.',
              title: 'Stray Signal',
            },
            phoneView: 'app',
            phoneWorldState: {
              activeWaypointId: null,
              locationLabel: 'Apartment Safehouse',
              markers: [
                {
                  id: 'safehouse-terminal',
                  label: 'Safehouse Terminal',
                  shortLabel: 'TERM',
                  xPercent: 45,
                  yPercent: 32,
                },
              ],
              objectivePointId: 'safehouse-terminal',
            },
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneAction={onPhoneAction}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Stray Signal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pin Objective' }));
    expect(onPhoneAction).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'objective',
        type: 'set-waypoint',
        waypoint: {
          pointId: 'safehouse-terminal',
        },
      })
    );
  });

  it('lets the objective window clear an already pinned objective', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneAction = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'objective',
            activeWaypointId: 'safehouse-terminal',
            phoneApps: [
              {
                id: 'objective',
                label: 'Objective',
                windowTitle: 'Objective Brief',
              },
            ],
            phoneObjectiveState: {
              footer: 'Reach the terminal and answer the signal.',
              statusLabel: 'Objective',
              targetPointId: 'safehouse-terminal',
              text: 'The safehouse terminal is still holding the stray transmission open.',
              title: 'Stray Signal',
            },
            phoneView: 'app',
            phoneWorldState: {
              activeWaypointId: 'safehouse-terminal',
              locationLabel: 'Apartment Safehouse',
              markers: [
                {
                  id: 'safehouse-terminal',
                  label: 'Safehouse Terminal',
                  shortLabel: 'TERM',
                  xPercent: 45,
                  yPercent: 32,
                },
              ],
              objectivePointId: 'safehouse-terminal',
            },
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneAction={onPhoneAction}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Unpin Objective' }));
    expect(onPhoneAction).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'objective',
        type: 'set-waypoint',
        waypoint: {
          pointId: null,
        },
      })
    );
  });

  it('renders the live district map window and forwards waypoint pins from map markers', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneAction = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'travel',
            phoneApps: [
              {
                id: 'travel',
                label: 'Game Map',
                windowTitle: 'District Map',
              },
            ],
            phoneView: 'app',
            phoneWorldState: {
              activeWaypointId: null,
              locationLabel: 'District 01 Exterior',
              markers: [
                {
                  id: 'learning-path',
                  kind: 'learning',
                  label: 'Learning Path',
                  shortLabel: 'LEARN',
                  targetPath: '/learning/javascript-path',
                  xPercent: 10,
                  yPercent: 28,
                },
                {
                  id: 'cluster-map',
                  kind: 'clusters',
                  label: 'Cluster Map',
                  shortLabel: 'CLUST',
                  targetPath: '/games/clusters',
                  xPercent: 61,
                  yPercent: 58,
                },
              ],
              objectivePointId: null,
              player: {
                xPercent: 48,
                yPercent: 74,
              },
            },
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneAction={onPhoneAction}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('District 01 Exterior')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pin Learning Path' }));
    expect(onPhoneAction).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'travel',
        id: 'pin-learning-path',
        type: 'set-waypoint',
        waypoint: {
          pointId: 'learning-path',
        },
      })
    );
  });

  it('lets the map clear an already pinned waypoint', () => {
    setViewport({ width: 430, height: 932 });
    const onPhoneAction = vi.fn();

    render(
      <ChakraProvider>
        <PhoneShellRenderer
          snapshot={buildSnapshot({
            activePhoneAppId: 'travel',
            activeWaypointId: 'learning-path',
            phoneApps: [
              {
                id: 'travel',
                label: 'Game Map',
                windowTitle: 'District Map',
              },
            ],
            phoneView: 'app',
            phoneWorldState: {
              activeWaypointId: 'learning-path',
              locationLabel: 'District 01 Exterior',
              markers: [
                {
                  id: 'learning-path',
                  kind: 'learning',
                  label: 'Learning Path',
                  shortLabel: 'LEARN',
                  targetPath: '/learning/javascript-path',
                  xPercent: 10,
                  yPercent: 28,
                },
              ],
              objectivePointId: null,
              player: {
                xPercent: 48,
                yPercent: 74,
              },
            },
          })}
          onAppActivate={vi.fn()}
          onClose={vi.fn()}
          onConfirmTerminalChoice={vi.fn()}
          onFeedItemSelect={vi.fn()}
          onHome={vi.fn()}
          onPhoneAction={onPhoneAction}
          shellTransitionPhase="open"
          onTunnelReady={vi.fn()}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Unpin Learning Path' }));
    expect(onPhoneAction).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'travel',
        id: 'pin-learning-path',
        type: 'set-waypoint',
        waypoint: {
          pointId: null,
        },
      })
    );
  });
});
