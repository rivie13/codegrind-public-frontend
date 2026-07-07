import getAssetUrl from '../../utils/assets/assetUrl';
import { DESKTOP_INTRO_PHONE_MENU_SHELL_ID } from '../../utils/navigation/apartmentEntryState';
import ApartmentIntroPhoneShellController from './ApartmentIntroPhoneShellController';

const DESKTOP_INTRO_PHONE_FRAME_SRC = getAssetUrl(
  '/city-v2/tiled/device-shell-art/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/White/front.png'
);

const DESKTOP_INTRO_PHONE_HIDDEN_APP_IDS = new Set(['codegrind-exe', 'crawlnet-browser', 'tunnel']);

const patchDesktopIntroPhoneApp = (app) => {
  if (!app || DESKTOP_INTRO_PHONE_HIDDEN_APP_IDS.has(app.id)) {
    return null;
  }

  switch (app.id) {
    case 'resume':
      return {
        ...app,
        detail: 'Stow the handset and return to the safehouse.',
      };
    default:
      return app;
  }
};

const buildDesktopIntroPhoneApps = (phoneApps = []) =>
  phoneApps.map(patchDesktopIntroPhoneApp).filter(Boolean);

const patchDesktopIntroSnapshot = (snapshot) => {
  const phoneApps = buildDesktopIntroPhoneApps(snapshot.phoneApps);

  return {
    ...snapshot,
    activeFeedItemId: null,
    activePhoneAppId: phoneApps.some((app) => app.id === snapshot.activePhoneAppId)
      ? snapshot.activePhoneAppId
      : null,
    anomalousFeedItemId: null,
    feedItems: [],
    footerHint: 'Keep the handset close. The safehouse signal is still moving.',
    launchNote: 'Safehouse link established. Stay ready for the next signal.',
    notifications: [
      {
        id: 'desktop-intro-phone-notification',
        message: 'Safehouse handset linked.',
        title: 'Field device ready',
        tone: 'info',
      },
    ],
    phoneHardwareFrameSrc: DESKTOP_INTRO_PHONE_FRAME_SRC,
    phoneHomeHint:
      'Check your objective, review your progress, or tune the device while you wait on the signal.',
    phoneHomeNotifications: [],
    phoneApps,
    signalFeedReady: false,
    subtitle: 'Safehouse Phone // Signal standby',
    title: 'Safehouse Field Device',
  };
};

class DesktopIntroPhoneMenuShellController extends ApartmentIntroPhoneShellController {
  constructor(context = {}) {
    super({
      ...context,
      deviceClass: 'desktop',
      shellId: context.shellId || DESKTOP_INTRO_PHONE_MENU_SHELL_ID,
      terminalName: context.terminalName || 'Companion Phone',
    });
  }

  createInitialSnapshot() {
    return patchDesktopIntroSnapshot(super.createInitialSnapshot());
  }

  rebuildPhoneApps(snapshot, options) {
    return buildDesktopIntroPhoneApps(super.rebuildPhoneApps(snapshot, options));
  }

  activatePhoneApp(appId) {
    if (DESKTOP_INTRO_PHONE_HIDDEN_APP_IDS.has(appId)) {
      return;
    }

    super.activatePhoneApp(appId);
  }
}

export default DesktopIntroPhoneMenuShellController;
