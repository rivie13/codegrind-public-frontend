import BaseDeviceShellController from './BaseDeviceShellController';

class BaseDesktopShellController extends BaseDeviceShellController {
  createInitialSnapshot() {
    return {
      ...super.createInitialSnapshot(),
      browser: {
        popups: [],
      },
      desktopIcons: [],
      footerHint: 'Return to the room when you are done with this shell.',
      launchNote: '',
      notifications: [],
      openWindows: {
        browser: false,
        credits: false,
        terminal: false,
      },
      shellFamilyId: 'desktop',
      startMenuActions: [],
      startMenuDescription: 'Exit the shell and return to the apartment.',
      startMenuTitle: 'Safehouse controls',
      terminal: {
        logs: [],
        progress: 0,
        status: 'idle',
        typedCommand: '',
      },
      wallpaper: {
        accent: '#6ee7f9',
        gradient: 'linear-gradient(135deg, #050913 0%, #111827 100%)',
        label: 'Default shell wallpaper',
      },
    };
  }

  createNotification({ message, title, tone = 'info' }) {
    return {
      id: `notification-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      message,
      title,
      tone,
    };
  }

  pushNotification(notificationInput) {
    const notification = this.createNotification(notificationInput);

    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      notifications: [notification, ...currentSnapshot.notifications].slice(0, 4),
    }));

    return notification;
  }

  setWindowState(windowId, isOpen) {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      openWindows: {
        ...currentSnapshot.openWindows,
        [windowId]: isOpen,
      },
    }));
  }

  updateDesktopIcon(iconId, iconUpdater) {
    this.setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      desktopIcons: currentSnapshot.desktopIcons.map((icon) => {
        if (icon.id !== iconId) {
          return icon;
        }

        return typeof iconUpdater === 'function' ? iconUpdater(icon) : { ...icon, ...iconUpdater };
      }),
    }));
  }
}

export default BaseDesktopShellController;
