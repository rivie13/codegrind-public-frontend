const FULLSCREEN_INTENT_STORAGE_KEY = 'codegrind-fullscreen-intent';
export const FULLSCREEN_INTENT_EVENT = 'codegrind-fullscreen-intent-change';

export const isFullscreenActive = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  return Boolean(document.fullscreenElement);
};

export const readFullscreenIntent = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(FULLSCREEN_INTENT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const writeFullscreenIntent = (preferred) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextPreferred = Boolean(preferred);

  try {
    if (nextPreferred) {
      window.sessionStorage.setItem(FULLSCREEN_INTENT_STORAGE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(FULLSCREEN_INTENT_STORAGE_KEY);
    }
  } catch {
    // Best effort only.
  }

  window.dispatchEvent(
    new CustomEvent(FULLSCREEN_INTENT_EVENT, {
      detail: {
        preferred: nextPreferred,
      },
    })
  );
};

const requestFullscreenWithFallback = async (element) => {
  if (!element?.requestFullscreen) {
    return false;
  }

  try {
    await element.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    try {
      await element.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }
};

export const requestAppFullscreen = async ({ persistIntent = true } = {}) => {
  if (typeof document === 'undefined') {
    return false;
  }

  const targetElement = document.documentElement;
  if (!targetElement) {
    return false;
  }

  const success = isFullscreenActive() ? true : await requestFullscreenWithFallback(targetElement);

  if (success && persistIntent) {
    writeFullscreenIntent(true);
  }

  return success;
};

export const exitAppFullscreen = async ({ persistIntent = true } = {}) => {
  if (typeof document === 'undefined' || typeof document.exitFullscreen !== 'function') {
    return false;
  }

  if (!isFullscreenActive()) {
    if (persistIntent) {
      writeFullscreenIntent(false);
    }

    return true;
  }

  try {
    await document.exitFullscreen();

    if (persistIntent) {
      writeFullscreenIntent(false);
    }

    return true;
  } catch {
    return false;
  }
};

export const restoreFullscreenFromIntent = async () => {
  if (!readFullscreenIntent()) {
    return false;
  }

  return requestAppFullscreen({ persistIntent: true });
};
