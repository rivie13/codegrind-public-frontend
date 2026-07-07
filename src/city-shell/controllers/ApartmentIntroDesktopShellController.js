import apartmentIntroShellScenario from '../scenarios/apartmentIntroScenario';
import BaseDesktopShellController from './BaseDesktopShellController';

const COMMAND_TYPING_INTERVAL_MS = 20;
const DOWNLOAD_STEP_DELAY_MS = 180;
const DOWNLOAD_STEPS = [11, 23, 37, 52, 68, 82, 93, 100];

function selectDesktopIcon(desktopIcons, selectedId) {
  return desktopIcons.map((icon) => ({
    ...icon,
    isSelected: icon.id === selectedId,
  }));
}

class ApartmentIntroDesktopShellController extends BaseDesktopShellController {
  constructor(context = {}) {
    super({
      ...context,
      shellId: apartmentIntroShellScenario.shellId,
      terminalName: context.terminalName || apartmentIntroShellScenario.terminalName,
    });
  }

  createInitialSnapshot() {
    return {
      ...super.createInitialSnapshot(),
      activeFeedItemId: null,
      anomalousFeedItemId: apartmentIntroShellScenario.anomalousFeedItemId,
      browser: {
        ...apartmentIntroShellScenario.browser,
        hasOpened: false,
        nextPopupIndex: 0,
        popups: [],
      },
      desktopAds: apartmentIntroShellScenario.desktopAds,
      desktopIcons: [
        {
          ...apartmentIntroShellScenario.browserIcon,
          clickable: true,
          isSelected: false,
          status: 'open',
          visible: true,
        },
        {
          ...apartmentIntroShellScenario.downloadsIcon,
          clickable: true,
          isSelected: false,
          status: 'empty',
          visible: true,
        },
        {
          ...apartmentIntroShellScenario.creditsIcon,
          clickable: true,
          isSelected: false,
          status: 'open',
          visible: true,
        },
        {
          ...apartmentIntroShellScenario.generatedIcon,
          clickable: false,
          isSelected: false,
          status: 'locked',
          visible: false,
        },
      ],
      feedItems: apartmentIntroShellScenario.feedItems,
      footerHint:
        'Open CrawlNet, inspect the feed, dismiss the ad spam, and surface codegrind.exe.',
      launchNote: apartmentIntroShellScenario.initialLaunchNote,
      notifications: [
        {
          id: 'boot-notification',
          message: 'Desktop online. CrawlNet is pinned and waiting for the apartment feed crawl.',
          title: 'Shell online',
          tone: 'info',
        },
      ],
      openWindows: {
        browser: false,
        credits: false,
        terminal: false,
      },
      shellFamilyId: 'desktop',
      storyBeat: 'desktop',
      subtitle: apartmentIntroShellScenario.desktopSubtitle,
      terminal: {
        awaitingConfirmation: false,
        command: apartmentIntroShellScenario.command,
        isOpen: false,
        logs: ['Boot relay online. One listing is blinking out of rhythm.'],
        progress: 0,
        refusalCount: 0,
        status: 'idle',
        typedCommand: '',
      },
      title: apartmentIntroShellScenario.desktopTitle,
      wallpaper: apartmentIntroShellScenario.wallpaper,
    };
  }

  openBrowserWindow() {
    const currentSnapshot = this.getSnapshot();
    const shouldBootstrapPopups = !currentSnapshot.browser.hasOpened;

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      desktopIcons: selectDesktopIcon(
        previousSnapshot.desktopIcons,
        apartmentIntroShellScenario.browserIcon.id
      ),
      launchNote:
        'CrawlNet is open. Scroll the feed, close the ad popups, and find the listing that looks wrong.',
      openWindows: {
        ...previousSnapshot.openWindows,
        browser: true,
      },
      storyBeat: previousSnapshot.storyBeat === 'desktop' ? 'browser' : previousSnapshot.storyBeat,
      browser: {
        ...previousSnapshot.browser,
        hasOpened: true,
      },
    }));

    if (shouldBootstrapPopups) {
      this.spawnNextBrowserPopup();
      this.queueTimeout(() => this.spawnNextBrowserPopup(), 1800);
      return;
    }

    if (currentSnapshot.browser.popups.length === 0) {
      this.queueTimeout(() => this.spawnNextBrowserPopup(), 450);
    }
  }

  closeBrowserWindow() {
    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      activeFeedItemId: null,
      desktopIcons: selectDesktopIcon(previousSnapshot.desktopIcons, null),
      launchNote:
        'Back on the desktop. Re-open CrawlNet when you are ready to scan the feed again.',
      openWindows: {
        ...previousSnapshot.openWindows,
        browser: false,
      },
      browser: {
        ...previousSnapshot.browser,
        popups: [],
      },
    }));
  }

  openCreditsWindow() {
    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      desktopIcons: selectDesktopIcon(
        previousSnapshot.desktopIcons,
        apartmentIntroShellScenario.creditsIcon.id
      ),
      launchNote:
        'Project credits are grouped by creator so every artist, font author, and sound designer appears once.',
      openWindows: {
        ...previousSnapshot.openWindows,
        credits: true,
      },
    }));

    this.pushNotification({
      message: 'Port Meridian and shell attributions are mirrored here and on the About page.',
      title: 'Project credits',
      tone: 'info',
    });
  }

  closeCreditsWindow() {
    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      desktopIcons: selectDesktopIcon(previousSnapshot.desktopIcons, null),
      launchNote: 'Back on the desktop. Credits stay available from the Credits icon at any time.',
      openWindows: {
        ...previousSnapshot.openWindows,
        credits: false,
      },
    }));
  }

  spawnNextBrowserPopup() {
    const currentSnapshot = this.getSnapshot();
    if (!currentSnapshot.openWindows.browser || currentSnapshot.browser.popups.length >= 2) {
      return;
    }

    const nextPopup =
      apartmentIntroShellScenario.browserPopups[currentSnapshot.browser.nextPopupIndex];
    if (!nextPopup) {
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      browser: {
        ...previousSnapshot.browser,
        nextPopupIndex: previousSnapshot.browser.nextPopupIndex + 1,
        popups: [...previousSnapshot.browser.popups, nextPopup],
      },
    }));
  }

  dismissBrowserPopup(popupId) {
    const currentSnapshot = this.getSnapshot();
    if (!currentSnapshot.browser.popups.some((popup) => popup.id === popupId)) {
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      browser: {
        ...previousSnapshot.browser,
        popups: previousSnapshot.browser.popups.filter((popup) => popup.id !== popupId),
      },
    }));

    if (currentSnapshot.browser.nextPopupIndex < apartmentIntroShellScenario.browserPopups.length) {
      this.queueTimeout(() => this.spawnNextBrowserPopup(), 650);
    }
  }

  appendTerminalLog(entry) {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      terminal: {
        ...currentSnapshot.terminal,
        logs: [...currentSnapshot.terminal.logs, entry],
      },
    }));
  }

  selectFeedItem(itemId) {
    const selectedItem = apartmentIntroShellScenario.feedItems.find((item) => item.id === itemId);
    if (!selectedItem) {
      return;
    }

    const currentSnapshot = this.getSnapshot();
    if (!currentSnapshot.openWindows.browser) {
      return;
    }

    if (itemId !== apartmentIntroShellScenario.anomalousFeedItemId) {
      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        activeFeedItemId: itemId,
        launchNote:
          'That listing is bait. Close the popups and keep digging for the broken signal.',
      }));
      this.pushNotification({
        message: 'Most of the feed is synthetic noise. The broken listing is the real lead.',
        title: 'Noise floor',
        tone: 'warning',
      });
      return;
    }

    if (currentSnapshot.terminal.isOpen) {
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      activeFeedItemId: itemId,
      launchNote: 'The anomalous listing is opening a relay terminal.',
      openWindows: {
        ...previousSnapshot.openWindows,
        terminal: true,
      },
      storyBeat: 'terminal',
      terminal: {
        ...previousSnapshot.terminal,
        isOpen: true,
        logs: [
          ...previousSnapshot.terminal.logs,
          'Opening shadow relay...',
          'Injecting remote command...',
        ],
        status: 'typing',
        typedCommand: '',
      },
    }));
    this.pushNotification({
      message: 'The broken listing hijacked a local terminal window.',
      title: 'Anomalous ad selected',
      tone: 'info',
    });
    this.typeCommand(1);
  }

  typeCommand(characterCount) {
    const command = apartmentIntroShellScenario.command;
    if (characterCount > command.length) {
      this.setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        launchNote: 'The terminal wants one answer: yes.',
        terminal: {
          ...currentSnapshot.terminal,
          awaitingConfirmation: true,
          logs: [...currentSnapshot.terminal.logs, apartmentIntroShellScenario.confirmPrompt],
          status: 'awaiting-confirmation',
          typedCommand: command,
        },
      }));
      return;
    }

    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      terminal: {
        ...currentSnapshot.terminal,
        typedCommand: command.slice(0, characterCount),
      },
    }));

    this.queueTimeout(() => {
      this.typeCommand(characterCount + 1);
    }, COMMAND_TYPING_INTERVAL_MS);
  }

  respondToConfirmation(choice) {
    const currentSnapshot = this.getSnapshot();
    if (currentSnapshot.terminal.status !== 'awaiting-confirmation') {
      return;
    }

    if (choice !== 'yes') {
      const nextRefusalCount = currentSnapshot.terminal.refusalCount + 1;
      const refusalMessage =
        apartmentIntroShellScenario.refusalMessages[
          (nextRefusalCount - 1) % apartmentIntroShellScenario.refusalMessages.length
        ];

      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        launchNote: 'The terminal rejects anything but yes.',
        terminal: {
          ...previousSnapshot.terminal,
          logs: [...previousSnapshot.terminal.logs, refusalMessage],
          refusalCount: nextRefusalCount,
        },
      }));
      this.pushNotification({
        message: refusalMessage,
        title: 'Refusal rejected',
        tone: 'warning',
      });
      return;
    }

    this.startDownload();
  }

  startDownload() {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      launchNote: 'codegrind.exe is downloading into the safehouse desktop.',
      storyBeat: 'download',
      terminal: {
        ...currentSnapshot.terminal,
        awaitingConfirmation: false,
        logs: [
          ...currentSnapshot.terminal.logs,
          'Operator consent acquired.',
          'Pulling codegrind.exe payload...',
        ],
        progress: 0,
        status: 'downloading',
      },
    }));
    this.pushNotification({
      message: 'codegrind.exe is unpacking onto the desktop surface.',
      title: 'Download started',
      tone: 'info',
    });
    this.advanceDownload(0);
  }

  advanceDownload(stepIndex) {
    const progress = DOWNLOAD_STEPS[stepIndex];
    if (typeof progress !== 'number') {
      this.completeDownload();
      return;
    }

    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      terminal: {
        ...currentSnapshot.terminal,
        progress,
      },
    }));

    if (progress >= 100) {
      this.completeDownload();
      return;
    }

    this.queueTimeout(() => {
      this.advanceDownload(stepIndex + 1);
    }, DOWNLOAD_STEP_DELAY_MS);
  }

  completeDownload() {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      activeFeedItemId: null,
      desktopIcons: selectDesktopIcon(
        currentSnapshot.desktopIcons.map((icon) =>
          icon.id === apartmentIntroShellScenario.generatedIcon.id
            ? {
                ...icon,
                clickable: true,
                status: 'beckoning',
                visible: true,
              }
            : icon
        ),
        apartmentIntroShellScenario.generatedIcon.id
      ),
      browser: {
        ...currentSnapshot.browser,
        popups: [],
      },
      launchNote:
        'The feed collapses. codegrind.exe is glitching on the desktop and wants your attention.',
      openWindows: {
        ...currentSnapshot.openWindows,
        browser: false,
        terminal: false,
      },
      storyBeat: 'icon-ready',
      terminal: {
        ...currentSnapshot.terminal,
        logs: [
          ...currentSnapshot.terminal.logs,
          'Package unpacked.',
          'codegrind.exe pinned to desktop.',
        ],
        progress: 100,
        status: 'complete',
      },
    }));
    this.pushNotification({
      message:
        'The browser and relay terminal dropped away. codegrind.exe is now pulsing on the desktop.',
      title: 'Desktop icon beckoning',
      tone: 'success',
    });
  }

  activateDesktopIcon(iconId) {
    if (iconId === apartmentIntroShellScenario.browserIcon.id) {
      this.openBrowserWindow();
      return;
    }

    if (iconId === apartmentIntroShellScenario.downloadsIcon.id) {
      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        desktopIcons: selectDesktopIcon(previousSnapshot.desktopIcons, iconId),
        launchNote: 'Downloads is empty until the relay package lands from the feed.',
      }));
      this.pushNotification({
        message: 'No payload yet. The downloads folder wakes up after the anomalous listing runs.',
        title: 'Downloads empty',
        tone: 'warning',
      });
      return;
    }

    if (iconId === apartmentIntroShellScenario.creditsIcon.id) {
      this.openCreditsWindow();
      return;
    }

    if (iconId !== apartmentIntroShellScenario.generatedIcon.id) {
      return;
    }

    const currentSnapshot = this.getSnapshot();
    const programIcon = currentSnapshot.desktopIcons.find((icon) => icon.id === iconId);
    if (!programIcon?.clickable) {
      return;
    }

    if (typeof this.context.onLaunchProgram === 'function') {
      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        desktopIcons: selectDesktopIcon(
          previousSnapshot.desktopIcons.map((icon) =>
            icon.id === iconId
              ? {
                  ...icon,
                  caption: 'Boot sequence',
                  clickable: false,
                  status: 'launching',
                }
              : icon
          ),
          iconId
        ),
        launchNote: 'codegrind.exe is taking over the display and pushing deeper into the runtime.',
        storyBeat: 'launch',
      }));
      this.context.onLaunchProgram({
        iconId,
        programId: programIcon.label || apartmentIntroShellScenario.generatedIcon.label,
        shellId: apartmentIntroShellScenario.shellId,
      });
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      desktopIcons: selectDesktopIcon(
        previousSnapshot.desktopIcons.map((icon) =>
          icon.id === iconId && icon.status === 'beckoning'
            ? {
                ...icon,
                status: 'ready',
              }
            : icon
        ),
        iconId
      ),
      launchNote: 'The icon flickers, then settles back into place.',
    }));
    this.pushNotification({
      message: 'The new icon reacts, but the line is not stable enough to open yet.',
      title: 'Signal unstable',
      tone: 'info',
    });
  }
}

export default ApartmentIntroDesktopShellController;
