import { Box } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SiteRouteTransitionContext } from '../contexts/SiteRouteTransitionContext';
import { trackGooglePageView } from '../services/analyticsService';
import AdBlockerWall from './guards/AdBlockerWall';
import FirefoxWall from './guards/FirefoxWall';
import CookieConsentBanner from './banners/CookieConsentBanner';
import Footer from './layout/Footer';
import MobileActionDock from './layout/MobileActionDock';
import Navigation from './layout/Navigation';
import PageContainer from './layout/PageContainer';
import RecaptchaRetroNotice from './layout/RecaptchaRetroNotice';
import SiteRouteTransitionOverlay from './layout/SiteRouteTransitionOverlay';
import StructuredData from './seo/StructuredData';
import useCompactLandscapeShellMode from '../hooks/useCompactLandscapeShellMode';
import useIsMobileDevice from '../hooks/useIsMobileDevice';
import {
  WORKSPACE_SHELL_VISIBILITY_EVENT,
  readWorkspaceShellVisible,
} from '../utils/ui/workspaceShellVisibility';
import {
  HOME_DEMO_SHELL_VISIBILITY_EVENT,
  readHomeDemoShellHidden,
} from '../utils/ui/homeDemoShellVisibility';
import {
  CLUSTER_SHELL_VISIBILITY_EVENT,
  readClusterShellVisible,
  writeClusterShellVisible,
} from '../utils/ui/clusterShellVisibility';
import {
  TOWER_DEFENSE_SHELL_VISIBILITY_EVENT,
  readTowerDefenseShellVisible,
  writeTowerDefenseShellVisible,
} from '../utils/ui/towerDefenseShellVisibility';
import {
  MOBILE_SHELL_VISIBILITY_EVENT,
  readMobileShellVisible,
  writeMobileShellVisible,
} from '../utils/ui/mobileShellVisibility';
import {
  isCityRoute as matchesCityRoute,
  shouldRenderSiteNavigation,
} from '../utils/navigation/cityNavigation';
import {
  captureCompactMobileShellBootstrap,
  hasCompactMobileShellQuery,
  stripCompactMobileShellQuery,
} from '../utils/navigation/mobileShellNavigation';
import { isRecaptchaConfigured } from '../services/recaptchaService';

const MOBILE_RECAPTCHA_PREF_KEY = 'codegrind_mobile_recaptcha_hidden';
const DESKTOP_RECAPTCHA_NOTICE_PREF_KEY = 'codegrind_desktop_recaptcha_notice_hidden';
const ROUTE_TRANSITION_EXIT_MS = 340;
const ROUTE_TRANSITION_ENTER_MS = 180;

const shouldSkipRouteTransition = (pathname = '') =>
  /^\/(city|games\/tower-defense)(\/|$)/.test(pathname);

const Root = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomeRoute = location.pathname === '/';
  const isCityRoute = matchesCityRoute(location.pathname);
  const isTowerDefenseRoute = /^\/games\/tower-defense(\/|$)/.test(location.pathname);
  const isClusterRoute = /^\/games\/clusters(\/|$)/.test(location.pathname);
  const isProblemWorkspaceRoute = /^\/problems\/[^/]+\/?$/.test(location.pathname);
  const isMobileDevice = useIsMobileDevice();
  const requestedCompactMobileShell = hasCompactMobileShellQuery(location.search);
  const shouldUseMobileClusterImmersiveLayout = isMobileDevice && isClusterRoute;
  const isCompactLandscapeShellMode = useCompactLandscapeShellMode();
  const [isTowerDefenseShellVisible, setIsTowerDefenseShellVisible] = useState(() =>
    readTowerDefenseShellVisible()
  );
  const [isProblemWorkspaceShellVisible, setIsProblemWorkspaceShellVisible] = useState(() =>
    readWorkspaceShellVisible()
  );
  const [isClusterShellVisible, setIsClusterShellVisible] = useState(() =>
    readClusterShellVisible()
  );
  const [isMobileShellVisible, setIsMobileShellVisible] = useState(() =>
    isCityRoute && isMobileDevice
      ? false
      : requestedCompactMobileShell
        ? false
        : readMobileShellVisible()
  );
  const [isHomeDemoShellHidden, setIsHomeDemoShellHidden] = useState(() =>
    readHomeDemoShellHidden()
  );
  const [isMobileRecaptchaHidden, setIsMobileRecaptchaHidden] = useState(false);
  const [isDesktopRecaptchaNoticeHidden, setIsDesktopRecaptchaNoticeHidden] = useState(false);
  const [routeTransition, setRouteTransition] = useState(null);
  const isFirstRender = useRef(true);
  const routeTransitionTimersRef = useRef({
    navigate: null,
    clear: null,
  });
  const recaptchaConfigured = isRecaptchaConfigured();
  const shouldHideTowerDefenseShell =
    isMobileDevice && isTowerDefenseRoute && !isTowerDefenseShellVisible;
  const shouldHideProblemWorkspaceShell =
    isMobileDevice && isProblemWorkspaceRoute && !isProblemWorkspaceShellVisible;
  const shouldHideClusterShell = isMobileDevice && isClusterRoute && !isClusterShellVisible;
  const shouldHideMobileShell = isMobileDevice && !isMobileShellVisible;
  const shouldHideHomeDemoShell = isHomeRoute && isHomeDemoShellHidden;
  const shouldHideGlobalShell =
    shouldHideMobileShell ||
    shouldHideTowerDefenseShell ||
    shouldHideProblemWorkspaceShell ||
    shouldHideClusterShell ||
    shouldHideHomeDemoShell;
  const shouldRenderGlobalShell = !shouldHideGlobalShell;
  const shouldRenderNavigation = shouldRenderSiteNavigation({
    pathname: location.pathname,
    isGlobalShellVisible: shouldRenderGlobalShell,
  });
  const shouldDisableFooterOffset =
    isCityRoute ||
    shouldHideGlobalShell ||
    shouldUseMobileClusterImmersiveLayout ||
    (isHomeRoute && !isCompactLandscapeShellMode);
  const shouldRenderRecaptchaNotice =
    recaptchaConfigured &&
    !isCityRoute &&
    !shouldHideGlobalShell &&
    !shouldUseMobileClusterImmersiveLayout;
  const shouldRenderMobileActionDock =
    (!isCityRoute || isMobileDevice) &&
    (!shouldHideGlobalShell || (isMobileDevice && !isCityRoute));

  const clearRouteTransitionTimers = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (routeTransitionTimersRef.current.navigate) {
      window.clearTimeout(routeTransitionTimersRef.current.navigate);
      routeTransitionTimersRef.current.navigate = null;
    }

    if (routeTransitionTimersRef.current.clear) {
      window.clearTimeout(routeTransitionTimersRef.current.clear);
      routeTransitionTimersRef.current.clear = null;
    }
  }, []);

  useEffect(() => {
    if (!requestedCompactMobileShell) {
      return;
    }

    captureCompactMobileShellBootstrap();
    setIsMobileShellVisible(false);
    writeMobileShellVisible(false);

    navigate(
      {
        pathname: location.pathname,
        search: stripCompactMobileShellQuery(location.search),
        hash: location.hash,
      },
      {
        replace: true,
        state: location.state,
      }
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    requestedCompactMobileShell,
  ]);

  const startRouteTransition = useCallback(
    (targetHref, options = {}) => {
      if (typeof window === 'undefined' || typeof targetHref !== 'string') {
        navigate(targetHref, options);
        return;
      }

      let resolvedTarget;

      try {
        resolvedTarget = new URL(targetHref, window.location.origin);
      } catch {
        navigate(targetHref, options);
        return;
      }

      if (resolvedTarget.origin !== window.location.origin) {
        window.location.assign(resolvedTarget.href);
        return;
      }

      const resolvedHref = `${resolvedTarget.pathname}${resolvedTarget.search}${resolvedTarget.hash}`;
      const currentHref = `${location.pathname}${location.search}${location.hash}`;

      if (
        shouldSkipRouteTransition(resolvedTarget.pathname) ||
        currentHref === resolvedHref ||
        `${location.pathname}${location.search}` ===
          `${resolvedTarget.pathname}${resolvedTarget.search}`
      ) {
        navigate(resolvedHref, options);
        return;
      }

      clearRouteTransitionTimers();
      setRouteTransition({
        href: resolvedHref,
        pathname: resolvedTarget.pathname,
        phase: 'exit',
      });

      routeTransitionTimersRef.current.navigate = window.setTimeout(() => {
        navigate(resolvedHref, options);
      }, ROUTE_TRANSITION_EXIT_MS);
    },
    [clearRouteTransitionTimers, location.pathname, location.search, location.hash, navigate]
  );

  const handleShellNavigationClick = useCallback(
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const eventTarget = event.target;

      if (!(eventTarget instanceof Element)) {
        return;
      }

      const anchor = eventTarget.closest('a[href]');

      if (!anchor) {
        return;
      }

      if (
        anchor.dataset.routeTransitionSkip === 'true' ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const hrefAttribute = anchor.getAttribute('href');

      if (
        !hrefAttribute ||
        hrefAttribute.startsWith('#') ||
        hrefAttribute.startsWith('mailto:') ||
        hrefAttribute.startsWith('tel:')
      ) {
        return;
      }

      let resolvedTarget;

      try {
        resolvedTarget = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (resolvedTarget.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      startRouteTransition(
        `${resolvedTarget.pathname}${resolvedTarget.search}${resolvedTarget.hash}`
      );
    },
    [startRouteTransition]
  );

  const routeTransitionContextValue = useMemo(
    () => ({ startRouteTransition }),
    [startRouteTransition]
  );

  useEffect(() => {
    if (!isTowerDefenseRoute) {
      setIsTowerDefenseShellVisible(false);
      writeTowerDefenseShellVisible(false);
    }
  }, [isTowerDefenseRoute]);

  useEffect(() => {
    if (!isClusterRoute) {
      setIsClusterShellVisible(true);
      writeClusterShellVisible(true);
    }
  }, [isClusterRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncTowerDefenseShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsTowerDefenseShellVisible(nextVisible);
        return;
      }

      setIsTowerDefenseShellVisible(readTowerDefenseShellVisible());
    };

    window.addEventListener(TOWER_DEFENSE_SHELL_VISIBILITY_EVENT, syncTowerDefenseShellVisibility);
    window.addEventListener('storage', syncTowerDefenseShellVisibility);

    return () => {
      window.removeEventListener(
        TOWER_DEFENSE_SHELL_VISIBILITY_EVENT,
        syncTowerDefenseShellVisibility
      );
      window.removeEventListener('storage', syncTowerDefenseShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncMobileShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;

      if (typeof nextVisible === 'boolean') {
        setIsMobileShellVisible(nextVisible);
        return;
      }

      setIsMobileShellVisible(readMobileShellVisible());
    };

    if (isCityRoute && isMobileDevice) {
      setIsMobileShellVisible(false);
    } else {
      syncMobileShellVisibility();
    }

    window.addEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
    window.addEventListener('storage', syncMobileShellVisibility);

    return () => {
      window.removeEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
      window.removeEventListener('storage', syncMobileShellVisibility);
    };
  }, [isCityRoute, isMobileDevice]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncClusterShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsClusterShellVisible(nextVisible);
        return;
      }

      setIsClusterShellVisible(readClusterShellVisible());
    };

    window.addEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
    window.addEventListener('storage', syncClusterShellVisibility);

    return () => {
      window.removeEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
      window.removeEventListener('storage', syncClusterShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncWorkspaceShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsProblemWorkspaceShellVisible(nextVisible);
        return;
      }

      setIsProblemWorkspaceShellVisible(readWorkspaceShellVisible());
    };

    window.addEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
    window.addEventListener('storage', syncWorkspaceShellVisibility);

    return () => {
      window.removeEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
      window.removeEventListener('storage', syncWorkspaceShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncHomeDemoShellVisibility = (event) => {
      const nextHidden = event?.detail?.hidden;
      if (typeof nextHidden === 'boolean') {
        setIsHomeDemoShellHidden(nextHidden);
        return;
      }

      setIsHomeDemoShellHidden(readHomeDemoShellHidden());
    };

    syncHomeDemoShellVisibility();
    window.addEventListener(HOME_DEMO_SHELL_VISIBILITY_EVENT, syncHomeDemoShellVisibility);

    return () => {
      window.removeEventListener(HOME_DEMO_SHELL_VISIBILITY_EVENT, syncHomeDemoShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackGooglePageView({
      path: `${location.pathname}${location.search}`,
      title: document.title,
      location: window.location.href,
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const persistedPreference = window.localStorage.getItem(MOBILE_RECAPTCHA_PREF_KEY);
    setIsMobileRecaptchaHidden(persistedPreference === 'true');

    const persistedDesktopPreference = window.localStorage.getItem(
      DESKTOP_RECAPTCHA_NOTICE_PREF_KEY
    );
    setIsDesktopRecaptchaNoticeHidden(persistedDesktopPreference === 'true');
  }, []);

  useEffect(() => {
    const shouldHideBadge = isMobileDevice && isMobileRecaptchaHidden;
    document.body?.setAttribute('data-mobile-recaptcha-hidden', shouldHideBadge ? 'true' : 'false');
  }, [isMobileDevice, isMobileRecaptchaHidden]);

  useEffect(() => {
    if (!routeTransition) {
      return;
    }

    const currentHref = `${location.pathname}${location.search}${location.hash}`;

    if (routeTransition.phase !== 'exit' || currentHref !== routeTransition.href) {
      return;
    }

    clearRouteTransitionTimers();
    setRouteTransition((previousValue) =>
      previousValue
        ? {
            ...previousValue,
            phase: 'enter',
          }
        : previousValue
    );

    routeTransitionTimersRef.current.clear = window.setTimeout(() => {
      setRouteTransition(null);
      routeTransitionTimersRef.current.clear = null;
    }, ROUTE_TRANSITION_ENTER_MS);
  }, [
    clearRouteTransitionTimers,
    location.pathname,
    location.search,
    location.hash,
    routeTransition,
  ]);

  useEffect(() => () => clearRouteTransitionTimers(), [clearRouteTransitionTimers]);

  const handleToggleMobileRecaptchaBadge = () => {
    setIsMobileRecaptchaHidden((previousValue) => {
      const nextValue = !previousValue;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MOBILE_RECAPTCHA_PREF_KEY, nextValue ? 'true' : 'false');
      }
      return nextValue;
    });
  };

  const handleDismissDesktopRecaptchaNotice = () => {
    setIsDesktopRecaptchaNoticeHidden(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DESKTOP_RECAPTCHA_NOTICE_PREF_KEY, 'true');
    }
  };

  return (
    <SiteRouteTransitionContext.Provider value={routeTransitionContextValue}>
      <Box
        width="100%"
        className="cg-site-shell"
        bg="transparent"
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        minHeight={shouldUseMobileClusterImmersiveLayout ? '100dvh' : '100vh'}
        height={shouldUseMobileClusterImmersiveLayout ? '100dvh' : 'auto'}
        sx={{ minHeight: '100dvh' }}
        overflow={shouldUseMobileClusterImmersiveLayout ? 'hidden' : 'visible'}
        onClick={handleShellNavigationClick}
      >
        <Helmet>
          <title>CodeGrind - Coding Platform Featuring Code Breach Tower Defense Game</title>
          <meta
            name="description"
            content="CodeGrind is a coding platform for learning and interview prep featuring Code Breach, its first live tower defense coding game. Solve real coding problems, follow learning paths, practice DSA, and verify AI output."
          />
          <meta
            name="keywords"
            content="codegrind, code breach, tower defense coding game, learn to code, coding interview practice, leetcode alternative, dsa practice, gamified coding practice, beginner coding practice, python coding practice, javascript coding challenges, java dsa practice, interview prep, learning paths"
          />
          <meta name="robots" content="index, follow" />
          <meta name="googlebot" content="index, follow" />
          <meta
            property="og:title"
            content="CodeGrind - Coding Platform Featuring Code Breach Tower Defense Game"
          />
          <meta
            property="og:description"
            content="CodeGrind is a coding platform featuring Code Breach, its first live tower defense coding game, plus learning paths, DSA practice, and AI you can verify."
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://codegrind.online" />
          <meta property="og:image" content="https://codegrind.online/logo.svg" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="CodeGrind - Coding Platform Featuring Code Breach Tower Defense Game"
          />
          <meta
            name="twitter:description"
            content="CodeGrind is a coding platform featuring Code Breach, its first live tower defense coding game, plus learning paths, DSA practice, and AI you can verify."
          />
          <meta name="twitter:image" content="https://codegrind.online/logo.svg" />
          <meta
            name="google-adsense-account"
            content={import.meta.env.VITE_GOOGLE_ADSENSE_ID || 'ca-pub-7733001105026476'}
          />
        </Helmet>
        <StructuredData />
        {shouldRenderNavigation && <Navigation />}
        <PageContainer
          disableFooterOffset={shouldDisableFooterOffset}
          disableTopOffset={shouldHideGlobalShell || isCityRoute}
        >
          <Outlet />
        </PageContainer>
        {shouldRenderMobileActionDock && (
          <MobileActionDock
            showRecaptchaToggle={isMobileDevice && recaptchaConfigured}
            isRecaptchaHidden={isMobileRecaptchaHidden}
            onToggleRecaptcha={handleToggleMobileRecaptchaBadge}
          />
        )}
        {shouldRenderRecaptchaNotice && (
          <RecaptchaRetroNotice
            enabled={shouldRenderRecaptchaNotice}
            isHidden={isMobileDevice ? isMobileRecaptchaHidden : isDesktopRecaptchaNoticeHidden}
            onDismiss={isMobileDevice ? undefined : handleDismissDesktopRecaptchaNotice}
          />
        )}
        {shouldRenderGlobalShell && !isCityRoute && !shouldUseMobileClusterImmersiveLayout && (
          <Footer />
        )}
        <FirefoxWall />
        {!isCityRoute && !shouldHideGlobalShell && <CookieConsentBanner />}
        {!isCityRoute && <AdBlockerWall />}
      </Box>
      {routeTransition ? (
        <SiteRouteTransitionOverlay
          pathname={routeTransition.pathname}
          phase={routeTransition.phase}
        />
      ) : null}
    </SiteRouteTransitionContext.Provider>
  );
};

export default Root;
