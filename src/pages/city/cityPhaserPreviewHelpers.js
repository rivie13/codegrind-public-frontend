import {
  APARTMENT_CITY_ENTRY_STATE_HUB,
  APARTMENT_CITY_ENTRY_STATE_INTRO,
  DESKTOP_INTRO_PHONE_MENU_SHELL_ID,
  DESKTOP_PHONE_MENU_SHELL_ID,
} from '../../utils/navigation/apartmentEntryState';

const GUEST_TRIAL_ROUTE_NAMES = Object.freeze({
  beginner: 'Street Sandbox',
  pro: "Broker's Core",
});

const BLOCKED_ROUTE_SURFACE_NAMES = Object.freeze({
  clusters: "Broker's Core",
  learning: 'Street Sandbox',
  store: 'Packet Bazaar',
});

const normalizePreviewRouteSurface = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return Object.prototype.hasOwnProperty.call(BLOCKED_ROUTE_SURFACE_NAMES, normalized)
    ? normalized
    : null;
};

const normalizeGuestTrialTrack = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return Object.prototype.hasOwnProperty.call(GUEST_TRIAL_ROUTE_NAMES, normalized)
    ? normalized
    : null;
};

export const resolveCityLaunchDestination = (launchRequest) => {
  const explicitTargetPath =
    typeof launchRequest?.targetPath === 'string' ? launchRequest.targetPath.trim() : '';

  if (explicitTargetPath) {
    return {
      targetLaunchRequest: launchRequest?.targetLaunchRequest || null,
      targetPath: explicitTargetPath,
    };
  }

  const normalizedProgramId = String(launchRequest?.programId || '')
    .trim()
    .toLowerCase();

  if (normalizedProgramId === 'codegrind.exe') {
    return {
      targetPath: '/',
      targetLaunchRequest: {
        shellTheme: 'retro-desktop',
        source: 'city-apartment-intro',
        type: 'home-demo',
      },
    };
  }

  return {
    targetPath: '/',
    targetLaunchRequest: null,
  };
};

export const isPreviewPhoneMenuUnlocked = (previewInteractionState) =>
  Boolean(previewInteractionState?.movementUnlocked && previewInteractionState?.terminalZoneActive);

export const isDesktopPhoneShortcutKey = (rawKey) => {
  const key = String(rawKey || '')
    .trim()
    .toLowerCase();

  return key === 'p' || key === 'escape' || key === 'esc';
};

export const canOpenDesktopPhoneMenu = ({ resolvedApartmentState }) =>
  resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_INTRO ||
  resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_HUB;

export const resolveDesktopPhoneShellRequest = ({
  previewInteractionState,
  resolvedApartmentState,
}) => {
  if (!canOpenDesktopPhoneMenu({ resolvedApartmentState })) {
    return null;
  }

  if (resolvedApartmentState === APARTMENT_CITY_ENTRY_STATE_INTRO) {
    return {
      requestSource: 'desktop-phone-menu',
      shellId: DESKTOP_INTRO_PHONE_MENU_SHELL_ID,
      terminalInstanceId: 'city-desktop-companion-phone',
      terminalName: 'Safehouse Field Device',
      terminalZoneName: previewInteractionState?.terminalZoneName || null,
    };
  }

  return {
    requestSource: 'desktop-phone-menu',
    shellId: DESKTOP_PHONE_MENU_SHELL_ID,
    terminalInstanceId: 'city-desktop-companion-phone',
    terminalName: 'Companion Phone',
  };
};

export const shouldDeferPhoneShellClose = ({ isMobileDevice, isPortraitViewport, request }) =>
  Boolean(isMobileDevice && isPortraitViewport && request?.deviceClass === 'phone');

export const shouldDeferLandscapeLaunch = ({ isMobileDevice, isPortraitViewport, request }) =>
  Boolean(isMobileDevice && isPortraitViewport && request?.requireLandscape);

export const getPortraitPhoneLockMessage = (previewInteractionState) => {
  if (isPreviewPhoneMenuUnlocked(previewInteractionState)) {
    return null;
  }

  if (previewInteractionState?.movementUnlocked) {
    return 'Turn back to landscape and move to the safehouse terminal. The phone unlocks when the signal tells you to bring it up.';
  }

  return 'Turn back to landscape. The field device stays locked until the intro reaches the beat that tells you to bring up your phone.';
};

export const buildBlockedGuestTrialNotice = ({ routeSurface, selectedTrialTrack }) => {
  const normalizedSurface = normalizePreviewRouteSurface(routeSurface);

  if (!normalizedSurface) {
    return null;
  }

  const normalizedTrack = normalizeGuestTrialTrack(selectedTrialTrack);
  const chosenRouteLabel = normalizedTrack
    ? GUEST_TRIAL_ROUTE_NAMES[normalizedTrack]
    : 'your chosen path building';

  if (normalizedSurface === 'store') {
    return {
      description: `Guest trial only opens ${chosenRouteLabel} right now. Sign in to access the Packet Bazaar.`,
      id: `city-guest-trial-store-${normalizedTrack || 'guest'}`,
      title: 'Sign in to enter the Packet Bazaar',
    };
  }

  return {
    description: `This guest run is limited to ${chosenRouteLabel}. Sign in to access ${BLOCKED_ROUTE_SURFACE_NAMES[normalizedSurface]} and the Packet Bazaar.`,
    id: `city-guest-trial-${normalizedTrack || 'guest'}-${normalizedSurface}`,
    title: 'Guest trial stays on your chosen route',
  };
};
