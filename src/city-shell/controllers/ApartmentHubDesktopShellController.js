import BaseDesktopShellController from './BaseDesktopShellController';

class ApartmentHubDesktopShellController extends BaseDesktopShellController {
  constructor(context = {}) {
    super({
      ...context,
      shellId: 'apartment-hub-desktop',
      terminalName: context.terminalName || 'Apartment Safehouse Terminal',
    });
  }

  createInitialSnapshot() {
    return {
      ...super.createInitialSnapshot(),
      desktopIcons: [],
      footerHint: 'Use Start to return to the room or head back to the main CodeGrind site.',
      launchNote:
        'Apartment hub is online. Open Start to leave the shell or jump back to the main site.',
      notifications: [
        {
          id: 'hub-online-notification',
          message: 'The apartment hub can now route directly back to the main CodeGrind site.',
          title: 'Hub online',
          tone: 'info',
        },
      ],
      openWindows: {
        browser: false,
        credits: false,
        terminal: false,
      },
      shellFamilyId: 'desktop',
      startMenuActions: [
        {
          id: 'return-to-site',
          label: 'Back to site',
          sprite: 'browser',
        },
      ],
      startMenuDescription:
        'Exit the shell and return to the apartment, or jump back to the main CodeGrind site.',
      subtitle: 'Apartment Hub Shell // Safehouse controls online',
      title: 'Safehouse Desktop',
      wallpaper: {
        accent: '#000080',
        gradient:
          'radial-gradient(circle at 18% 16%, rgba(248, 244, 233, 0.12), transparent 20%), linear-gradient(180deg, #506b78 0%, #394e5c 55%, #243340 100%)',
        label: 'Safehouse Hub CRT',
      },
    };
  }

  activateStartMenuAction(actionId) {
    if (actionId !== 'return-to-site') {
      return;
    }

    if (typeof this.context.onReturnToSite === 'function') {
      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        launchNote: 'Routing back to the main CodeGrind site.',
      }));
      this.context.onReturnToSite({
        shellId: 'apartment-hub-desktop',
        terminalInstanceId: this.getSnapshot().terminalInstanceId,
      });
      return;
    }

    this.setSnapshot((previousSnapshot) => ({
      ...previousSnapshot,
      launchNote: 'Back to site is reserved for the apartment hub host.',
    }));
    this.pushNotification({
      message: 'This shell host has not wired the site return route yet.',
      title: 'Route unavailable',
      tone: 'warning',
    });
  }
}

export default ApartmentHubDesktopShellController;
