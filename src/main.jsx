import './utils/web/installMinimalDomShim';
import { ColorModeScript } from '@chakra-ui/react';
import React from 'react';
import './styles.css';
import { shouldHydrateRoot } from './utils/boot/rootRenderMode';
import { configure as configurePremiumCore } from '@rivie13/premium-core/config';
import api from './services/api';
import visualSettingsManager from './utils/game/VisualSettingsManager';
import audioManager from './utils/audio/AudioManager';
import { getTowerByType } from './game-engine-v2';
import logger from './utils/core/logger';

// Configure proprietary package with host-injected dependencies
configurePremiumCore({
  api,
  visualSettingsManager,
  audioManager,
  getTowerByType,
  logger,
});

const bootStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
console.log('[CodeGrind Boot] Script loaded, initializing...');

const APP_READY_EVENT = 'codegrind:app-ready';
const APP_READY_ATTRIBUTE = 'data-codegrind-app-ready';

const shouldUseServiceWorker = () => {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  return import.meta.env.PROD && !isLocalHost;
};

const unregisterServiceWorkers = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(registrations.map((registration) => registration.unregister()));
  } catch {
    // Ignore service worker cleanup failures in local/dev boot.
  }
};

const registerOnlineOnlyServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (!shouldUseServiceWorker()) {
    await unregisterServiceWorkers();
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    await registration.update();
  } catch {
    // Keep boot resilient if the service worker cannot register.
  }
};

const dismissSpaLoadingShell = () => {
  const loadingShell = document.getElementById('spa-loading-shell');
  if (!loadingShell) return;

  loadingShell.classList.add('is-hidden');
  window.setTimeout(() => {
    loadingShell.remove();
  }, 250);
};

const waitForAppReady = () => {
  if (typeof document === 'undefined') return Promise.resolve();

  if (document.body?.getAttribute(APP_READY_ATTRIBUTE) === 'true') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let finished = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(APP_READY_EVENT, handleReady);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const handleReady = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(finish);
      });
    };

    const timeoutId = window.setTimeout(finish, 2600);

    window.addEventListener(APP_READY_EVENT, handleReady, { once: true });
  });
};

if (typeof document !== 'undefined') {
  void (async () => {
    const importsStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    void registerOnlineOnlyServiceWorker();

    const [{ createRoot, hydrateRoot }, { default: App }] = await Promise.all([
      import('react-dom/client'),
      import('./App'),
    ]);
    const importsEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log(
      `[CodeGrind Boot] React and App chunk imports took ${(importsEnd - importsStart).toFixed(2)}ms`
    );

    // Only use StrictMode in development.
    const isProduction = import.meta.env.PROD;
    const appWrapper = isProduction ? (
      <>
        <ColorModeScript initialColorMode="dark" />
        <App />
      </>
    ) : (
      <React.StrictMode>
        <>
          <ColorModeScript initialColorMode="dark" />
          <App />
        </>
      </React.StrictMode>
    );

    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const shouldHydrate = shouldHydrateRoot({
      hasPrerenderedMarkup: rootElement.hasChildNodes(),
      pathname: window.location.pathname,
    });
    const renderStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (shouldHydrate) {
      hydrateRoot(rootElement, appWrapper);
      const renderEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      console.log(
        `[CodeGrind Boot] hydrateRoot call took ${(renderEnd - renderStart).toFixed(2)}ms`
      );

      const appReadyStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      await waitForAppReady();
      const appReadyEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      console.log(
        `[CodeGrind Boot] waitForAppReady (app-ready signal) took ${(appReadyEnd - appReadyStart).toFixed(2)}ms`
      );
      dismissSpaLoadingShell();
    } else {
      if (rootElement.hasChildNodes()) {
        rootElement.replaceChildren();
      }

      createRoot(rootElement).render(appWrapper);
      const renderEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      console.log(
        `[CodeGrind Boot] createRoot render call took ${(renderEnd - renderStart).toFixed(2)}ms`
      );

      const appReadyStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      await waitForAppReady();
      const appReadyEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      console.log(
        `[CodeGrind Boot] waitForAppReady (app-ready signal) took ${(appReadyEnd - appReadyStart).toFixed(2)}ms`
      );
      dismissSpaLoadingShell();
    }
    const totalBoot = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log(
      `[CodeGrind Boot] Total startup time to app-ready: ${(totalBoot - bootStart).toFixed(2)}ms`
    );
  })();
}

