import { useCallback, useEffect, useState } from 'react';

const detectIosMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(String(navigator.userAgent || ''));
};

const detectAndroidMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(String(navigator.userAgent || ''));
};

const detectMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod|android|mobile/i.test(String(navigator.userAgent || ''));
};

const detectStandaloneDisplayMode = () => {
  if (typeof window === 'undefined') return false;

  const displayModeStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const navigatorStandalone =
    typeof navigator !== 'undefined' && typeof navigator.standalone === 'boolean'
      ? navigator.standalone
      : false;

  return Boolean(displayModeStandalone || navigatorStandalone);
};

const getSnapshot = () => ({
  deferredInstallPrompt: null,
  isAppInstalled: detectStandaloneDisplayMode(),
  isIosMobileBrowser: detectIosMobileBrowser(),
  isAndroidMobileBrowser: detectAndroidMobileBrowser(),
  isMobileBrowser: detectMobileBrowser(),
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
});

let installPromptSnapshot = getSnapshot();
let installPromptInitialized = false;
const installPromptListeners = new Set();

const notifyInstallPromptListeners = () => {
  installPromptListeners.forEach((listener) => {
    listener(installPromptSnapshot);
  });
};

const updateInstallPromptSnapshot = (partial) => {
  installPromptSnapshot = {
    ...installPromptSnapshot,
    ...partial,
  };
  notifyInstallPromptListeners();
};

const syncStandaloneInstallState = () => {
  const nextInstalled = detectStandaloneDisplayMode();
  if (installPromptSnapshot.isAppInstalled !== nextInstalled) {
    updateInstallPromptSnapshot({ isAppInstalled: nextInstalled });
  }
};

const ensureInstallPromptInitialized = () => {
  if (installPromptInitialized || typeof window === 'undefined') return;
  installPromptInitialized = true;

  const handleBeforeInstallPrompt = (event) => {
    event.preventDefault();
    updateInstallPromptSnapshot({ deferredInstallPrompt: event });
  };

  const handleAppInstalled = () => {
    updateInstallPromptSnapshot({
      deferredInstallPrompt: null,
      isAppInstalled: true,
    });
  };

  const handleWindowFocus = () => {
    syncStandaloneInstallState();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible') return;
    syncStandaloneInstallState();
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('resize', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  syncStandaloneInstallState();
};

export const usePwaInstallPrompt = () => {
  const [snapshot, setSnapshot] = useState(() => installPromptSnapshot);

  useEffect(() => {
    ensureInstallPromptInitialized();

    const listener = (nextSnapshot) => {
      setSnapshot(nextSnapshot);
    };

    installPromptListeners.add(listener);
    listener(installPromptSnapshot);

    return () => {
      installPromptListeners.delete(listener);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const promptEvent = installPromptSnapshot.deferredInstallPrompt;

    if (!promptEvent) {
      return { supported: false, outcome: null, manualInstallRequired: true };
    }

    updateInstallPromptSnapshot({ deferredInstallPrompt: null });

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice?.outcome === 'accepted') {
        updateInstallPromptSnapshot({ isAppInstalled: true });
      }

      return {
        supported: true,
        outcome: choice?.outcome || null,
        manualInstallRequired: choice?.outcome !== 'accepted',
      };
    } catch {
      return { supported: true, outcome: null, manualInstallRequired: true };
    }
  }, []);

  const canPromptInstall = Boolean(snapshot.deferredInstallPrompt);
  const canManualInstall =
    !snapshot.isAppInstalled &&
    !canPromptInstall &&
    (snapshot.isIosMobileBrowser || snapshot.isAndroidMobileBrowser || snapshot.isMobileBrowser);
  const canInstallCTA = !snapshot.isAppInstalled && (canPromptInstall || canManualInstall);

  return {
    ...snapshot,
    canPromptInstall,
    canManualInstall,
    canInstallCTA,
    promptInstall,
  };
};

if (typeof window !== 'undefined') {
  ensureInstallPromptInitialized();
}
