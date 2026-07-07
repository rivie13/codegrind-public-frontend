import apartmentIntroShellScenario from '../scenarios/apartmentIntroScenario';
import getAssetUrl from '../../utils/assets/assetUrl';
import BasePhoneShellController from './BasePhoneShellController';

const COMMAND_TYPING_INTERVAL_MS = 20;
const DOWNLOAD_STEP_DELAY_MS = 180;
const DOWNLOAD_STEPS = [11, 23, 37, 52, 68, 82, 93, 100];
const INTRO_PROGRAM_APP_ID = 'codegrind-exe';
const INTRO_TUNNEL_AUTO_OPEN_DELAY_MS = 280;
const TRACK_LABELS = {
  beginner: 'Beginner track',
  pro: 'Pro track',
};
const LEARNING_PATH_LABELS = {
  'cpp-path': 'C++ path',
  'java-path': 'Java path',
  'javascript-path': 'JavaScript path',
  'python-path': 'Python path',
};

const isIntroTunnelLocked = (snapshot) => {
  const status = snapshot?.introTunnel?.status;
  return Boolean(status && status !== 'hidden' && status !== 'complete');
};

const resolveTrackLabel = (selectedTrialTrack) => TRACK_LABELS[selectedTrialTrack] || 'Guest track';

const resolveLearningPathLabel = (selectedTrialLearningPath) =>
  LEARNING_PATH_LABELS[selectedTrialLearningPath] || 'Learning path';

export const buildObjectiveCopy = (previewHudState) => {
  if (!previewHudState?.text) {
    return {
      description: 'Open the full objective brief from the phone.',
      detail: 'Review what matters now, why it matters, and what to do next.',
      launchNote: 'Objective brief opened.',
    };
  }

  const accentCopy = previewHudState.accentLabel ? `${previewHudState.accentLabel}. ` : '';
  const footerCopy = previewHudState.footer ? ` ${previewHudState.footer}` : '';

  return {
    description: `${previewHudState.title || 'Objective'} is pinned here on the phone.`,
    detail: `${accentCopy}${previewHudState.text}${footerCopy}`.trim(),
    launchNote: previewHudState.footer || 'Objective brief opened. Follow the signal.',
  };
};

export const buildLearningPreviewCopy = (guestPhoneContext = {}) => {
  const selectedTrialLearningPath =
    typeof guestPhoneContext.selectedTrialLearningPath === 'string'
      ? guestPhoneContext.selectedTrialLearningPath
      : null;

  if (!selectedTrialLearningPath) {
    return {
      badge: 'Preview',
      detail: 'Preview the learning paths from the safehouse phone. Full access unlocks later.',
      launchNote: 'Learning preview opened.',
    };
  }

  const learningPathLabel = resolveLearningPathLabel(selectedTrialLearningPath);

  return {
    badge: 'Preview',
    detail: `${learningPathLabel} is ready for preview. Full access unlocks after the intro.`,
    launchNote: `${learningPathLabel} preview opened.`,
  };
};

export const buildClusterPreviewCopy = (guestPhoneContext = {}) => {
  const selectedTrialTrack =
    typeof guestPhoneContext.selectedTrialTrack === 'string'
      ? guestPhoneContext.selectedTrialTrack
      : null;

  if (!selectedTrialTrack) {
    return {
      badge: 'Preview',
      detail: 'Preview the cluster map from the safehouse phone. Full access unlocks later.',
      launchNote: 'Cluster preview opened.',
    };
  }

  const trackLabel = resolveTrackLabel(selectedTrialTrack);

  return {
    badge: 'Preview',
    detail: `${trackLabel} is ready for preview. Full cluster access unlocks after the intro.`,
    launchNote: `${trackLabel} cluster preview opened.`,
  };
};

const buildIntroPhoneApps = ({
  guestPhoneContext,
  isProgramReady,
  isSignalFeedReady,
  isTunnelUnlocked,
  previewHudState,
}) => {
  const objectiveCopy = buildObjectiveCopy(previewHudState);
  const learningCopy = buildLearningPreviewCopy(guestPhoneContext);
  const clusterCopy = buildClusterPreviewCopy(guestPhoneContext);

  return [
    {
      id: 'crawlnet-browser',
      iconLabel: 'WEB',
      label: 'Web',
      badge: isSignalFeedReady ? 'Ping' : 'Wait',
      description: isSignalFeedReady
        ? 'Open CrawlNet and inspect the safehouse feed before the crooked listing slips away.'
        : 'The web ping will land here once the safehouse signal is strong enough.',
      detail: 'The crooked listing is hiding in the sponsored feed. Open it before it slips away.',
      disabled: !isSignalFeedReady,
      dockOrder: 0,
      launchNote: 'CrawlNet is opening the local sponsored feed. Watch for the crooked listing.',
      showOnHome: false,
      windowTitle: 'CrawlNet Browser',
    },
    ...(isProgramReady
      ? [
          {
            id: INTRO_PROGRAM_APP_ID,
            iconLabel: 'CG',
            label: 'codegrind.exe',
            action: 'launch-program',
            badge: 'Run',
            description:
              'The downloaded program is glitching on the phone home screen and wants to take over the runtime.',
            detail: 'The icon is unstable and pushing against the rest of the phone home.',
            launchNote:
              'codegrind.exe is waking up. Rotate to landscape if the handoff needs the wider screen.',
            launchRequest: {
              requireLandscape: true,
              source: 'city-apartment-intro-phone',
            },
            programId: 'codegrind.exe',
          },
        ]
      : []),
    {
      id: 'learning',
      iconLabel: 'LP',
      label: 'Learning',
      badge: learningCopy.badge,
      description: 'Preview the learning paths from the safehouse phone.',
      detail: learningCopy.detail,
      launchNote: learningCopy.launchNote,
      windowTitle: 'Learning Preview',
    },
    {
      id: 'clusters',
      iconLabel: 'CL',
      label: 'Clusters',
      badge: clusterCopy.badge,
      description: 'Preview cluster progress from the safehouse phone.',
      detail: clusterCopy.detail,
      launchNote: clusterCopy.launchNote,
      windowTitle: 'Cluster Preview',
    },
    {
      id: 'profile',
      iconLabel: 'ME',
      label: 'Profile',
      badge: 'Locked',
      description: 'Profile access is on the line, but it is still locked.',
      detail: 'The profile icon stays dark until the safehouse sequence clears.',
      disabled: true,
      launchNote: 'Profile is still locked.',
      windowTitle: 'Profile',
    },
    {
      id: 'travel',
      iconLabel: 'MAP',
      label: 'Game Map',
      badge: 'Locked',
      description: 'The city map is here, but the route is still locked.',
      detail: 'Finish the safehouse sequence before the wider map opens.',
      disabled: true,
      launchNote: 'Game Map is still locked.',
      windowTitle: 'Game Map',
    },
    {
      id: 'objective',
      iconLabel: 'OBJ',
      label: 'Objective',
      badge: 'Now',
      description: objectiveCopy.description,
      detail: objectiveCopy.detail,
      launchNote: objectiveCopy.launchNote,
      windowTitle: 'Objective Brief',
    },
    {
      id: 'settings',
      iconLabel: 'CFG',
      label: 'Game Settings',
      badge: 'Audio',
      description: 'Adjust audio and controls from the phone.',
      detail: 'Tune the device now. The rest can wait.',
      dockOrder: 1,
      launchNote: 'Game Settings opened. Audio and control preferences belong on the field device.',
      windowTitle: 'Game Settings',
    },
    ...(isTunnelUnlocked
      ? [
          {
            id: 'tunnel',
            iconLabel: 'TNL',
            label: 'Tunnel',
            badge: 'Ready',
            description:
              'The crooked listing opened a tunnel. Rotate to landscape for a clearer read.',
            detail: 'The line is live. Hold steady and step through.',
            dockOrder: 2,
            launchNote: 'Tunnel primed. Rotate to landscape to continue.',
            showOnHome: false,
          },
        ]
      : []),
    {
      id: 'resume',
      label: 'Back to Game',
      action: 'close-shell',
      badge: 'Resume',
      disabled: isTunnelUnlocked && !isProgramReady,
      description: 'Put the phone away and return to the safehouse from the same spot in the game.',
      detail: 'Stow the phone when you are ready to move again.',
      dockOrder: 3,
      launchNote: 'Phone stowed. Back to the game view.',
      showOnHome: false,
    },
  ];
};

class ApartmentIntroPhoneShellController extends BasePhoneShellController {
  constructor(context = {}) {
    super({
      ...context,
      deviceClass: context.deviceClass || 'phone',
      shellId: context.shellId || 'apartment-intro-phone',
      terminalName: context.terminalName || apartmentIntroShellScenario.terminalName,
    });
  }

  createInitialSnapshot() {
    const isSignalFeedReady = Boolean(this.context.terminalZoneName);
    const phoneApps = buildIntroPhoneApps({
      guestPhoneContext: this.context.guestPhoneContext,
      isProgramReady: false,
      isSignalFeedReady,
      isTunnelUnlocked: false,
      previewHudState: this.context.previewHudState,
    });
    const signalFeedApp = phoneApps.find((app) => app.id === 'crawlnet-browser');
    const activeFeedItemId = isSignalFeedReady
      ? apartmentIntroShellScenario.anomalousFeedItemId
      : null;

    return {
      ...super.createInitialSnapshot(),
      activeFeedItemId,
      anomalousFeedItemId: apartmentIntroShellScenario.anomalousFeedItemId,
      footerHint: isSignalFeedReady
        ? 'Follow the crooked signal from the safehouse phone. The tunnel wakes when the listing opens it.'
        : 'Stay near the safehouse signal. The tunnel will wake when the line is ready.',
      feedItems: apartmentIntroShellScenario.feedItems,
      launchNote:
        (isSignalFeedReady ? signalFeedApp?.launchNote : null) ||
        'Safehouse line open. Stay ready for the crooked signal.',
      introTunnel: {
        logs: ['Tunnel relay idle. Waiting for the crooked listing to arm the line.'],
        progress: 0,
        refusalCount: 0,
        status: 'hidden',
        typedCommand: '',
      },
      notifications: [
        {
          id: 'intro-phone-notification',
          message: 'Crooked signal detected on the safehouse line.',
          title: 'Signal detected',
          tone: 'info',
        },
      ],
      phoneHardwareFrameSrc: getAssetUrl(
        '/city-v2/tiled/device-shell-art/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/Black/front.png'
      ),
      phoneHomeHint: isSignalFeedReady
        ? 'Open Web when it pings. Objective and Game Settings are ready while Game Map and Profile stay locked.'
        : 'Stay near the safehouse signal and wait for the web ping.',
      phoneHomeNotifications: isSignalFeedReady
        ? [
            {
              id: 'intro-web-ping',
              actionLabel: 'Open web',
              appId: 'crawlnet-browser',
              message:
                'CrawlNet caught a crooked listing that skipped the normal sales pitch. Open the web app before it slips away.',
              title: 'Web anomaly ping',
            },
          ]
        : [],
      phoneDecorativeShortcuts: [],
      phoneHomeTitle: 'Safehouse Phone OS',
      phoneApps,
      signalFeedReady: isSignalFeedReady,
      phoneMode: 'intro',
      shellFamilyId: 'phone',
      subtitle: 'Safehouse Phone // Crooked signal',
      title: 'Safehouse Field Device',
    };
  }

  rebuildPhoneApps(snapshot, { isProgramReady, isTunnelUnlocked }) {
    return buildIntroPhoneApps({
      guestPhoneContext: this.context.guestPhoneContext,
      isProgramReady,
      isSignalFeedReady: Boolean(this.context.terminalZoneName),
      isTunnelUnlocked,
      previewHudState: this.context.previewHudState,
    }).map((app) => {
      if (app.id === 'resume' && isIntroTunnelLocked(snapshot)) {
        return {
          ...app,
          disabled: true,
        };
      }

      return app;
    });
  }

  activatePhoneApp(appId) {
    const currentSnapshot = this.getSnapshot();

    if (isIntroTunnelLocked(currentSnapshot) && appId !== 'tunnel') {
      return;
    }

    if (appId === 'tunnel') {
      const tunnelApp = currentSnapshot.phoneApps.find((app) => app.id === 'tunnel');
      if (!tunnelApp || tunnelApp.disabled) {
        return;
      }

      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        activePhoneAppId: 'tunnel',
        launchNote:
          previousSnapshot.introTunnel.status === 'pending-landscape'
            ? 'Tunnel relay opening. Rotate to landscape for the readable terminal.'
            : tunnelApp.launchNote || previousSnapshot.launchNote,
        phoneView: 'app',
      }));
      return;
    }

    super.activatePhoneApp(appId);
  }

  returnToPhoneHome() {
    const currentSnapshot = this.getSnapshot();
    if (isIntroTunnelLocked(currentSnapshot)) {
      return;
    }

    super.returnToPhoneHome();
  }

  enterTunnelTerminal() {
    const currentSnapshot = this.getSnapshot();
    if (currentSnapshot.introTunnel.status !== 'pending-landscape') {
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      introTunnel: {
        ...previousSnapshot.introTunnel,
        logs: [
          'Crooked listing confirmed. Tunnel relay armed.',
          'Opening shadow relay...',
          'Injecting remote command...',
        ],
        status: 'typing',
        typedCommand: '',
      },
      launchNote:
        'The tunnel terminal is typing the command. You will have to answer the prompt yourself.',
    }));

    this.typeTunnelCommand(1);
  }

  typeTunnelCommand(characterCount) {
    const command = apartmentIntroShellScenario.command;

    if (characterCount > command.length) {
      this.setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        introTunnel: {
          ...currentSnapshot.introTunnel,
          logs: [...currentSnapshot.introTunnel.logs, apartmentIntroShellScenario.confirmPrompt],
          status: 'awaiting-confirmation',
          typedCommand: command,
        },
        launchNote: 'The tunnel wants a yes. Any refusal gets bounced back with canned contempt.',
      }));
      return;
    }

    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      introTunnel: {
        ...currentSnapshot.introTunnel,
        typedCommand: command.slice(0, characterCount),
      },
    }));

    this.queueTimeout(() => {
      this.typeTunnelCommand(characterCount + 1);
    }, COMMAND_TYPING_INTERVAL_MS);
  }

  respondToTunnelConfirmation(choice) {
    const currentSnapshot = this.getSnapshot();
    if (currentSnapshot.introTunnel.status !== 'awaiting-confirmation') {
      return;
    }

    if (choice !== 'yes') {
      const nextRefusalCount = currentSnapshot.introTunnel.refusalCount + 1;
      const refusalMessage =
        apartmentIntroShellScenario.refusalMessages[
          (nextRefusalCount - 1) % apartmentIntroShellScenario.refusalMessages.length
        ];

      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        introTunnel: {
          ...previousSnapshot.introTunnel,
          logs: [...previousSnapshot.introTunnel.logs, refusalMessage],
          refusalCount: nextRefusalCount,
        },
        launchNote: 'No is not a real branch here. The tunnel only respects yes.',
      }));
      return;
    }

    this.startTunnelDownload();
  }

  startTunnelDownload() {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      introTunnel: {
        ...currentSnapshot.introTunnel,
        logs: [
          ...currentSnapshot.introTunnel.logs,
          'Operator consent acquired.',
          'Pulling codegrind.exe payload...',
        ],
        progress: 0,
        status: 'downloading',
      },
      launchNote: 'codegrind.exe is downloading through the handheld tunnel.',
    }));

    this.advanceTunnelDownload(0);
  }

  advanceTunnelDownload(stepIndex) {
    const progress = DOWNLOAD_STEPS[stepIndex];
    if (typeof progress !== 'number') {
      this.completeTunnelDownload();
      return;
    }

    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      introTunnel: {
        ...currentSnapshot.introTunnel,
        progress,
      },
    }));

    if (progress >= 100) {
      this.completeTunnelDownload();
      return;
    }

    this.queueTimeout(() => {
      this.advanceTunnelDownload(stepIndex + 1);
    }, DOWNLOAD_STEP_DELAY_MS);
  }

  completeTunnelDownload() {
    this.setSnapshot((currentSnapshot) => {
      const nextSnapshot = {
        ...currentSnapshot,
        activeFeedItemId: null,
        activePhoneAppId: null,
        introTunnel: {
          ...currentSnapshot.introTunnel,
          logs: [
            ...currentSnapshot.introTunnel.logs,
            'Package unpacked.',
            'codegrind.exe pinned to phone home.',
          ],
          progress: 100,
          status: 'complete',
        },
        launchNote:
          'The tunnel collapses. codegrind.exe is glitching on the phone home screen and wants to be opened.',
        phoneHomeHint:
          'codegrind.exe is now on the phone home screen. Tap it to continue the anomaly handoff.',
        phoneHomeNotifications: [
          {
            id: 'intro-program-ready',
            actionLabel: 'Run',
            appId: INTRO_PROGRAM_APP_ID,
            message:
              'The anomaly dropped codegrind.exe straight onto the phone desktop. It is pulsing for attention.',
            title: 'Program landed',
          },
        ],
        phoneView: 'home',
      };

      return {
        ...nextSnapshot,
        phoneApps: this.rebuildPhoneApps(nextSnapshot, {
          isProgramReady: true,
          isTunnelUnlocked: true,
        }),
      };
    });
  }

  selectFeedItem(itemId) {
    const selectedItem = apartmentIntroShellScenario.feedItems.find((item) => item.id === itemId);
    if (!selectedItem) {
      return;
    }

    this.setSnapshot((currentSnapshot) => {
      if (itemId !== apartmentIntroShellScenario.anomalousFeedItemId) {
        return {
          ...currentSnapshot,
          activeFeedItemId: itemId,
          launchNote:
            'That listing is synthetic noise. The crooked signal is the one tearing through the feed.',
        };
      }

      const nextSnapshot = {
        ...currentSnapshot,
        activeFeedItemId: itemId,
        activePhoneAppId: null,
        introTunnel: {
          ...currentSnapshot.introTunnel,
          logs: ['Crooked listing confirmed. Tunnel relay armed.'],
          progress: 0,
          refusalCount: 0,
          status: 'pending-landscape',
          typedCommand: '',
        },
        launchNote: 'Crooked listing confirmed. Web is closing and the tunnel is taking over.',
        phoneHomeNotifications: [
          {
            id: 'intro-tunnel-ping',
            actionLabel: 'Tunnel',
            appId: 'tunnel',
            message:
              'The crooked listing opened a tunnel back to the safehouse terminal. It will auto-arm from the phone home screen.',
            title: 'Tunnel armed',
          },
        ],
        phoneView: 'home',
      };

      return {
        ...nextSnapshot,
        phoneApps: this.rebuildPhoneApps(nextSnapshot, {
          isProgramReady: false,
          isTunnelUnlocked: true,
        }),
      };
    });

    this.queueTimeout(() => {
      this.activatePhoneApp('tunnel');
    }, INTRO_TUNNEL_AUTO_OPEN_DELAY_MS);
  }
}

export default ApartmentIntroPhoneShellController;
