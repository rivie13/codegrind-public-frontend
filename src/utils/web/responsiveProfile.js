import { hasCompactMobileShellBootstrap } from '../navigation/mobileShellNavigation';

export const MOBILE_MAX_WIDTH = 1024;
export const TOUCH_GUARD_MAX_WIDTH = 900;
export const HANDHELD_SINGLE_PANEL_MAX_WIDTH = 960;
export const PHONE_EDITOR_MAX_WIDTH = 900;
export const HANDHELD_LANDSCAPE_LAYOUT_MAX_HEIGHT = 900;
export const HANDHELD_COMPACT_LANDSCAPE_MAX_HEIGHT = 600;
export const SHELL_COMPACT_LANDSCAPE_MAX_HEIGHT = 760;
export const CITY_DOCK_MAX_WIDTH = 767;

const MOBILE_USER_AGENT_PATTERN =
  /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i;
const IPAD_USER_AGENT_PATTERN = /ipad/i;
const DESKTOP_IPAD_USER_AGENT_PATTERN = /macintosh/i;
const DESKTOP_CLASS_USER_AGENT_PATTERN = /windows nt|x11|linux x86_64|cros/i;

export const getMatchMediaResult = (win, query) => {
  if (typeof win?.matchMedia !== 'function') return false;

  try {
    return win.matchMedia(query).matches;
  } catch {
    return false;
  }
};

const getViewportNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const detectLandscapeViewport = (win, width, height) => {
  const orientationType = win?.screen?.orientation?.type;
  if (typeof orientationType === 'string') {
    if (orientationType.includes('landscape')) return true;
    if (orientationType.includes('portrait')) return false;
  }

  const mediaLandscape = getMatchMediaResult(win, '(orientation: landscape)');
  if (mediaLandscape) return true;
  if (width > 0 && height > 0) return width >= height;

  return false;
};

export const detectStandaloneDisplayMode = ({
  win = typeof window === 'undefined' ? null : window,
  nav = typeof navigator === 'undefined' ? null : navigator,
} = {}) => {
  if (!win && !nav) return false;

  const displayModeStandalone = getMatchMediaResult(win, '(display-mode: standalone)');
  const navigatorStandalone =
    typeof nav?.standalone === 'boolean' ? Boolean(nav.standalone) : false;

  return displayModeStandalone || navigatorStandalone;
};

export const createResponsiveProfile = (overrides = {}) => ({
  width: 0,
  height: 0,
  shortestViewportEdge: 0,
  isLandscapeViewport: false,
  isPortraitViewport: false,
  isNarrowViewport: false,
  isTouchGuardWidth: false,
  isCompactTouchViewport: false,
  hasCoarsePointer: false,
  hasFinePointer: false,
  hasNoHover: false,
  touchPoints: 0,
  hasTouchApi: false,
  isTouchCapable: false,
  isTouchPrimaryInput: false,
  userAgentDataMobile: false,
  userAgentMobile: false,
  looksLikeIpadDesktopUa: false,
  isDesktopClassUserAgent: false,
  isStandaloneDisplayMode: false,
  isHandheldDevice: false,
  isHandheldLayout: false,
  isMobileDevice: false,
  isHandheldLandscapeLayout: false,
  isHandheldCompactLandscape: false,
  isHandheldSinglePanelLayout: false,
  isPhoneEditorMode: false,
  isProblemWorkspaceHandheldLayout: false,
  isCompactLandscapeShellMode: false,
  isCityDockHandheldLayout: false,
  ...overrides,
});

export const buildResponsiveProfile = ({
  win = typeof window === 'undefined' ? null : window,
  nav = typeof navigator === 'undefined' ? null : navigator,
} = {}) => {
  if (!win || !nav) return createResponsiveProfile();

  const width = getViewportNumber(win.innerWidth);
  const height = getViewportNumber(win.innerHeight);
  const shortestViewportEdge =
    width > 0 && height > 0 ? Math.min(width, height) : width > 0 ? width : height;
  const isNarrowViewport =
    getMatchMediaResult(win, `(max-width: ${MOBILE_MAX_WIDTH}px)`) ||
    (width > 0 && width <= MOBILE_MAX_WIDTH);
  const isTouchGuardWidth =
    getMatchMediaResult(win, `(max-width: ${TOUCH_GUARD_MAX_WIDTH}px)`) ||
    (width > 0 && width <= TOUCH_GUARD_MAX_WIDTH);
  const isCompactTouchViewport =
    shortestViewportEdge > 0 && shortestViewportEdge <= TOUCH_GUARD_MAX_WIDTH;
  const isLandscapeViewport = detectLandscapeViewport(win, width, height);

  const hasCoarsePointer = getMatchMediaResult(win, '(pointer: coarse)');
  const hasFinePointer = getMatchMediaResult(win, '(pointer: fine)');
  const hasNoHover = getMatchMediaResult(win, '(hover: none)');
  const touchPoints = Number(nav.maxTouchPoints) || 0;
  const hasTouchApi = 'ontouchstart' in win;
  const isTouchCapable = hasCoarsePointer || touchPoints > 0 || hasTouchApi;
  const isTouchPrimaryInput =
    (hasCoarsePointer && hasNoHover) ||
    (touchPoints > 1 && !hasFinePointer) ||
    (hasTouchApi && !hasFinePointer);

  const userAgentDataMobile = Boolean(nav.userAgentData?.mobile);
  const userAgent = String(nav.userAgent || '');
  const looksLikeIpadDesktopUa = DESKTOP_IPAD_USER_AGENT_PATTERN.test(userAgent) && touchPoints > 1;
  const userAgentMobile =
    MOBILE_USER_AGENT_PATTERN.test(userAgent) ||
    IPAD_USER_AGENT_PATTERN.test(userAgent) ||
    looksLikeIpadDesktopUa;
  const isDesktopClassUserAgent =
    !looksLikeIpadDesktopUa && DESKTOP_CLASS_USER_AGENT_PATTERN.test(userAgent);
  const nonDesktopTouchFallback =
    !isDesktopClassUserAgent && isTouchPrimaryInput && isCompactTouchViewport;
  const hasCompactMobileShellAuthBootstrap = hasCompactMobileShellBootstrap({
    search: win.location?.search || '',
    win,
  });
  const isHandheldDevice =
    userAgentDataMobile ||
    userAgentMobile ||
    nonDesktopTouchFallback ||
    hasCompactMobileShellAuthBootstrap;
  const isHandheldLandscapeLayout =
    isHandheldDevice &&
    isLandscapeViewport &&
    (getMatchMediaResult(win, `(max-height: ${HANDHELD_LANDSCAPE_LAYOUT_MAX_HEIGHT}px)`) ||
      (height > 0 && height <= HANDHELD_LANDSCAPE_LAYOUT_MAX_HEIGHT));
  const isHandheldCompactLandscape =
    isHandheldDevice &&
    isLandscapeViewport &&
    (getMatchMediaResult(win, `(max-height: ${HANDHELD_COMPACT_LANDSCAPE_MAX_HEIGHT}px)`) ||
      (height > 0 && height <= HANDHELD_COMPACT_LANDSCAPE_MAX_HEIGHT));
  const isHandheldSinglePanelLayout =
    isHandheldDevice &&
    (getMatchMediaResult(win, `(max-width: ${HANDHELD_SINGLE_PANEL_MAX_WIDTH}px)`) ||
      (width > 0 && width <= HANDHELD_SINGLE_PANEL_MAX_WIDTH) ||
      isHandheldLandscapeLayout);
  const isPhoneEditorMode =
    isHandheldDevice &&
    (getMatchMediaResult(win, `(max-width: ${PHONE_EDITOR_MAX_WIDTH}px)`) ||
      (width > 0 && width <= PHONE_EDITOR_MAX_WIDTH) ||
      isHandheldCompactLandscape);
  const isProblemWorkspaceHandheldLayout =
    isHandheldDevice && (isNarrowViewport || isHandheldLandscapeLayout);
  const isCompactLandscapeShellMode =
    isHandheldDevice &&
    isLandscapeViewport &&
    (getMatchMediaResult(win, `(max-height: ${SHELL_COMPACT_LANDSCAPE_MAX_HEIGHT}px)`) ||
      (height > 0 && height <= SHELL_COMPACT_LANDSCAPE_MAX_HEIGHT));
  const isCityDockHandheldLayout =
    isHandheldDevice &&
    (getMatchMediaResult(win, `(max-width: ${CITY_DOCK_MAX_WIDTH}px)`) ||
      (width > 0 && width <= CITY_DOCK_MAX_WIDTH) ||
      isTouchPrimaryInput);
  const isStandaloneDisplayMode = detectStandaloneDisplayMode({ win, nav });

  return createResponsiveProfile({
    width,
    height,
    shortestViewportEdge,
    isLandscapeViewport,
    isPortraitViewport: !isLandscapeViewport,
    isNarrowViewport,
    isTouchGuardWidth,
    isCompactTouchViewport,
    hasCoarsePointer,
    hasFinePointer,
    hasNoHover,
    touchPoints,
    hasTouchApi,
    isTouchCapable,
    isTouchPrimaryInput,
    userAgentDataMobile,
    userAgentMobile,
    looksLikeIpadDesktopUa,
    isDesktopClassUserAgent,
    isStandaloneDisplayMode,
    isHandheldDevice,
    isHandheldLayout: isHandheldDevice,
    isMobileDevice: isHandheldDevice,
    isHandheldLandscapeLayout,
    isHandheldCompactLandscape,
    isHandheldSinglePanelLayout,
    isPhoneEditorMode,
    isProblemWorkspaceHandheldLayout,
    isCompactLandscapeShellMode,
    isCityDockHandheldLayout,
  });
};

export const RESPONSIVE_MEDIA_QUERIES = [
  `(max-width: ${MOBILE_MAX_WIDTH}px)`,
  `(max-width: ${TOUCH_GUARD_MAX_WIDTH}px)`,
  `(max-width: ${HANDHELD_SINGLE_PANEL_MAX_WIDTH}px)`,
  `(max-width: ${PHONE_EDITOR_MAX_WIDTH}px)`,
  `(max-width: ${CITY_DOCK_MAX_WIDTH}px)`,
  `(max-height: ${HANDHELD_LANDSCAPE_LAYOUT_MAX_HEIGHT}px)`,
  `(max-height: ${HANDHELD_COMPACT_LANDSCAPE_MAX_HEIGHT}px)`,
  `(max-height: ${SHELL_COMPACT_LANDSCAPE_MAX_HEIGHT}px)`,
  '(display-mode: standalone)',
  '(orientation: landscape)',
  '(pointer: coarse)',
  '(pointer: fine)',
  '(hover: none)',
];
