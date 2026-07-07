export const APARTMENT_CITY_ENTRY_STATE_PARAM = 'apartmentState';
export const APARTMENT_CITY_ENTRY_STATE_HUB = 'hub';
export const APARTMENT_CITY_ENTRY_STATE_INTRO = 'intro';
export const PATH_CHOICE_CITY_ENTRY = 'path-choice';

export const APARTMENT_HUB_SHELL_ID = 'apartment-hub-desktop';
export const APARTMENT_INTRO_SHELL_ID = 'apartment-intro-desktop';
export const APARTMENT_INTRO_PHONE_SHELL_ID = 'apartment-intro-phone';
export const DESKTOP_INTRO_PHONE_MENU_SHELL_ID = 'desktop-intro-phone-menu';
export const WORLD_PHONE_SHELL_ID = 'world-phone';
export const DESKTOP_PHONE_MENU_SHELL_ID = 'desktop-phone-menu';

const normalizeApartmentCityEntryState = (value) => {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === APARTMENT_CITY_ENTRY_STATE_HUB) return APARTMENT_CITY_ENTRY_STATE_HUB;
  if (normalized === APARTMENT_CITY_ENTRY_STATE_INTRO) return APARTMENT_CITY_ENTRY_STATE_INTRO;
  return null;
};

const normalizeDeviceClass = (value) => {
  if (typeof value !== 'string') {
    return 'desktop';
  }

  return value.trim().toLowerCase() === 'phone' ? 'phone' : 'desktop';
};

export const resolveApartmentCityEntryState = ({
  apartmentState = null,
  persistedApartmentState = null,
  hasChosenPath = false,
  hasCompletedDemo = false,
} = {}) => {
  const normalized = normalizeApartmentCityEntryState(apartmentState);
  if (normalized) {
    return normalized;
  }

  const persisted = normalizeApartmentCityEntryState(persistedApartmentState);
  if (persisted) {
    return persisted;
  }

  return hasCompletedDemo && hasChosenPath
    ? APARTMENT_CITY_ENTRY_STATE_HUB
    : APARTMENT_CITY_ENTRY_STATE_INTRO;
};

export const shouldPlayApartmentIntroSequence = (options = {}) =>
  resolveApartmentCityEntryState(options) === APARTMENT_CITY_ENTRY_STATE_INTRO;

export const shouldAutoOpenApartmentHub = ({
  apartmentState = null,
  entry = null,
  hasChosenPath = false,
  hasCompletedDemo = false,
  sceneId = null,
} = {}) => {
  if (sceneId !== 'apartment-room-01') {
    return false;
  }

  if (entry !== PATH_CHOICE_CITY_ENTRY) {
    return false;
  }

  return (
    resolveApartmentCityEntryState({
      apartmentState,
      hasChosenPath,
      hasCompletedDemo,
    }) === APARTMENT_CITY_ENTRY_STATE_HUB
  );
};

export const resolveApartmentShellId = (options = {}) => {
  const deviceClass = normalizeDeviceClass(options.deviceClass);
  const apartmentState = resolveApartmentCityEntryState(options);

  if (deviceClass === 'phone') {
    return apartmentState === APARTMENT_CITY_ENTRY_STATE_HUB
      ? WORLD_PHONE_SHELL_ID
      : APARTMENT_INTRO_PHONE_SHELL_ID;
  }

  return apartmentState === APARTMENT_CITY_ENTRY_STATE_HUB
    ? APARTMENT_HUB_SHELL_ID
    : APARTMENT_INTRO_SHELL_ID;
};
