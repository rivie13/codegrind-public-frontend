const MOBILE_CONTROL_SIDE_STORAGE_KEY = 'cg-city-mobile-control-side';

export const normalizeMobileControlSide = (value) => (value === 'left' ? 'left' : 'right');

export const readMobileControlSide = () => {
  if (typeof window === 'undefined') return 'right';

  try {
    return normalizeMobileControlSide(
      window.localStorage?.getItem(MOBILE_CONTROL_SIDE_STORAGE_KEY)
    );
  } catch {
    return 'right';
  }
};

export const writeMobileControlSide = (value) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem(
      MOBILE_CONTROL_SIDE_STORAGE_KEY,
      normalizeMobileControlSide(value)
    );
  } catch {
    return;
  }
};

export default {
  normalizeMobileControlSide,
  readMobileControlSide,
  writeMobileControlSide,
};
