const ORIENTATION_VALUES = {
  portrait: 'portrait',
  landscape: 'landscape',
};

const getOrientationController = () => {
  if (typeof window === 'undefined') return null;
  if (typeof window.screen === 'undefined') return null;
  return window.screen.orientation || null;
};

export const canLockScreenOrientation = () => {
  const orientationController = getOrientationController();
  return Boolean(orientationController && typeof orientationController.lock === 'function');
};

export const requestScreenOrientation = async (mode) => {
  const orientationController = getOrientationController();
  if (!orientationController || typeof orientationController.lock !== 'function') return false;

  const targetMode =
    mode === ORIENTATION_VALUES.landscape
      ? ORIENTATION_VALUES.landscape
      : ORIENTATION_VALUES.portrait;

  try {
    await orientationController.lock(targetMode);
    return true;
  } catch {
    return false;
  }
};

export const releaseScreenOrientation = async () => {
  const orientationController = getOrientationController();
  if (!orientationController || typeof orientationController.unlock !== 'function') return false;

  try {
    orientationController.unlock();
    return true;
  } catch {
    return false;
  }
};
