import {
  MOBILE_MAX_WIDTH,
  TOUCH_GUARD_MAX_WIDTH,
  buildResponsiveProfile,
} from './responsiveProfile';

export { MOBILE_MAX_WIDTH, TOUCH_GUARD_MAX_WIDTH } from './responsiveProfile';

export const detectMobileDevice = ({
  win = typeof window === 'undefined' ? null : window,
  nav = typeof navigator === 'undefined' ? null : navigator,
} = {}) => {
  return buildResponsiveProfile({ win, nav }).isHandheldLayout;
};
