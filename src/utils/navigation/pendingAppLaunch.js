const PENDING_APP_LAUNCH_KEY = 'codegrind-pending-app-launch';

export const writePendingAppLaunch = (request) => {
  if (typeof window === 'undefined' || !request) {
    return;
  }

  try {
    window.sessionStorage.setItem(PENDING_APP_LAUNCH_KEY, JSON.stringify(request));
  } catch {
    // Best effort only.
  }
};

export const readPendingAppLaunch = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(PENDING_APP_LAUNCH_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const clearPendingAppLaunch = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(PENDING_APP_LAUNCH_KEY);
  } catch {
    // Best effort only.
  }
};
