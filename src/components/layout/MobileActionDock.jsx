import { Box, Button, HStack, Text, usePrefersReducedMotion, useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import useResponsiveProfile from '../../hooks/useResponsiveProfile';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { keyframes } from '@emotion/react';
import {
  HOME_DEMO_BOOT_SEQUENCE_EVENT,
  readHomeDemoBootSequenceActive,
} from '../../utils/ui/homeDemoBootSequenceState';
import {
  CLUSTER_SHELL_VISIBILITY_EVENT,
  readClusterShellVisible,
  writeClusterShellVisible,
} from '../../utils/ui/clusterShellVisibility';
import {
  WORKSPACE_SHELL_VISIBILITY_EVENT,
  readWorkspaceShellVisible,
  writeWorkspaceShellVisible,
} from '../../utils/ui/workspaceShellVisibility';
import {
  TOWER_DEFENSE_SHELL_VISIBILITY_EVENT,
  readTowerDefenseShellVisible,
  writeTowerDefenseShellVisible,
} from '../../utils/ui/towerDefenseShellVisibility';
import {
  HOME_DEMO_SHELL_VISIBILITY_EVENT,
  readHomeDemoShellHidden,
  setHomeDemoShellHidden,
} from '../../utils/ui/homeDemoShellVisibility';
import {
  MOBILE_SHELL_VISIBILITY_EVENT,
  readMobileShellVisible,
  writeMobileShellVisible,
} from '../../utils/ui/mobileShellVisibility';
import {
  exitAppFullscreen,
  FULLSCREEN_INTENT_EVENT,
  isFullscreenActive,
  readFullscreenIntent,
  requestAppFullscreen,
} from '../../utils/mobile/fullscreenState';

const WINDOW_OUTSET =
  'inset 1px 1px 0 #ffffff, inset 2px 2px 0 #f6f2ee, inset -1px -1px 0 #404040, inset -2px -2px 0 #808080';
const WINDOW_INSET =
  'inset 1px 1px 0 #404040, inset 2px 2px 0 #808080, inset -1px -1px 0 #ffffff, inset -2px -2px 0 #f6f2ee';
const TITLE_BAR_BG = 'linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)';
const RETRO_PANEL_SURFACE = '#c0c0c0';
const RETRO_PANEL_BODY = '#d4d0c8';
const RETRO_PANEL_SHELL = '#efebe7';
const RETRO_TEXT = '#161616';
const RETRO_TEXT_MUTED = '#3a3a3a';
const ACTION_CONTEXT_LABELS = {
  fullscreen: 'display',
  recaptcha: 'privacy',
  'shell-nav': 'shell',
  home: 'start',
  profile: 'user',
  store: 'shop',
  upgrade: 'pro',
  install: 'setup',
};

const dockGlowPulse = keyframes`
  0% {
    box-shadow: ${WINDOW_OUTSET}, 2px 2px 0 rgba(64, 64, 64, 0.42);
  }
  50% {
    box-shadow: ${WINDOW_OUTSET}, 0 0 0 1px rgba(10, 44, 154, 0.24), 3px 3px 0 rgba(64, 64, 64, 0.48);
  }
  100% {
    box-shadow: ${WINDOW_OUTSET}, 2px 2px 0 rgba(64, 64, 64, 0.42);
  }
`;

const MobileActionDock = ({
  showRecaptchaToggle = false,
  isRecaptchaHidden = false,
  onToggleRecaptcha,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const toast = useToast();
  const isMobileDevice = useIsMobileDevice();
  const responsiveProfile = useResponsiveProfile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isCityRoute = /^\/city(\/|$)/.test(location.pathname);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(() => isFullscreenActive());
  const [fullscreenPreferred, setFullscreenPreferred] = useState(() => readFullscreenIntent());
  const [isDockExpanded, setIsDockExpanded] = useState(() => !isCityRoute);
  const [isTowerDefenseShellVisible, setIsTowerDefenseShellVisible] = useState(() =>
    readTowerDefenseShellVisible()
  );
  const [isWorkspaceShellVisible, setIsWorkspaceShellVisible] = useState(() =>
    readWorkspaceShellVisible()
  );
  const [isClusterShellVisible, setIsClusterShellVisible] = useState(() =>
    readClusterShellVisible()
  );
  const [isMobileShellVisible, setIsMobileShellVisible] = useState(() => readMobileShellVisible());
  const [isHomeDemoShellHidden, setIsHomeDemoShellHidden] = useState(() =>
    readHomeDemoShellHidden()
  );
  const [isHomeDemoBootSequenceActive, setIsHomeDemoBootSequenceActive] = useState(() =>
    readHomeDemoBootSequenceActive()
  );
  const {
    isAppInstalled,
    canPromptInstall,
    isIosMobileBrowser,
    isAndroidMobileBrowser,
    currentOrigin,
    promptInstall,
  } = usePwaInstallPrompt();
  const shouldShowInstallAction = !isAppInstalled;
  const isHomeRoute = location.pathname === '/';
  const isTowerDefenseRoute = /^\/games\/tower-defense(\/|$)/.test(location.pathname);
  const isClusterRoute = /^\/games\/clusters(\/|$)/.test(location.pathname);
  const isProblemWorkspaceRoute = /^\/problems\/[^/]+\/?$/.test(location.pathname);
  const isStoreRoute = /^\/store(\/|$)/.test(location.pathname);
  const isProfileRoute = /^\/profile(\/|$)/.test(location.pathname);
  const isUpgradeRoute = /^\/(upgrade|pricing)(\/|$)/.test(location.pathname);
  const normalizedTier = String(user?.membershipTier || '').toUpperCase();
  const shouldShowUpgradeActionByTier =
    normalizedTier.length === 0 || normalizedTier === 'FREE' || normalizedTier === 'TRIAL';
  const canShowProtectedQuickLinks = !loading && isAuthenticated;
  const shouldShowHomeAction = !isHomeRoute;
  const shouldShowProfileAction = canShowProtectedQuickLinks && !isProfileRoute;
  const shouldShowStoreAction = canShowProtectedQuickLinks && !isStoreRoute;
  const shouldShowUpgradeAction =
    canShowProtectedQuickLinks && !isUpgradeRoute && shouldShowUpgradeActionByTier;
  const shouldShowTowerDefenseNavAction = isTowerDefenseRoute;
  const shouldShowClusterNavAction = isClusterRoute;
  const shouldShowWorkspaceNavAction = isProblemWorkspaceRoute;
  const shouldShowHomeNavAction = isHomeRoute;
  const shouldShowAnyShellAction = true;
  const allowCityDock = !isCityRoute || responsiveProfile.isCityDockHandheldLayout;

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const syncFullscreenState = () => {
      setFullscreenEnabled(isFullscreenActive());
    };

    const syncFullscreenIntent = (event) => {
      const nextPreferred = event?.detail?.preferred;
      if (typeof nextPreferred === 'boolean') {
        setFullscreenPreferred(nextPreferred);
        return;
      }

      setFullscreenPreferred(readFullscreenIntent());
    };

    syncFullscreenState();
    syncFullscreenIntent();
    document.addEventListener('fullscreenchange', syncFullscreenState);
    window.addEventListener(FULLSCREEN_INTENT_EVENT, syncFullscreenIntent);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      window.removeEventListener(FULLSCREEN_INTENT_EVENT, syncFullscreenIntent);
    };
  }, []);

  useEffect(() => {
    if (!fullscreenEnabled) return;
    setIsDockExpanded(false);
  }, [fullscreenEnabled]);

  useEffect(() => {
    if (isCityRoute) {
      setIsDockExpanded(false);
    }
  }, [isCityRoute]);

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

    const syncClusterShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsClusterShellVisible(nextVisible);
        return;
      }

      setIsClusterShellVisible(readClusterShellVisible());
    };

    const syncWorkspaceShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsWorkspaceShellVisible(nextVisible);
        return;
      }

      setIsWorkspaceShellVisible(readWorkspaceShellVisible());
    };

    const syncMobileShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsMobileShellVisible(nextVisible);
        return;
      }

      setIsMobileShellVisible(readMobileShellVisible());
    };

    syncTowerDefenseShellVisibility();
    syncClusterShellVisibility();
    syncWorkspaceShellVisibility();
    syncMobileShellVisibility();

    const syncHomeDemoShellVisibility = (event) => {
      const nextHidden = event?.detail?.hidden;
      if (typeof nextHidden === 'boolean') {
        setIsHomeDemoShellHidden(nextHidden);
        return;
      }

      setIsHomeDemoShellHidden(readHomeDemoShellHidden());
    };

    window.addEventListener(TOWER_DEFENSE_SHELL_VISIBILITY_EVENT, syncTowerDefenseShellVisibility);
    window.addEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
    window.addEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
    window.addEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
    window.addEventListener(HOME_DEMO_SHELL_VISIBILITY_EVENT, syncHomeDemoShellVisibility);
    window.addEventListener('storage', syncTowerDefenseShellVisibility);
    window.addEventListener('storage', syncClusterShellVisibility);
    window.addEventListener('storage', syncWorkspaceShellVisibility);
    window.addEventListener('storage', syncMobileShellVisibility);

    syncHomeDemoShellVisibility();

    return () => {
      window.removeEventListener(
        TOWER_DEFENSE_SHELL_VISIBILITY_EVENT,
        syncTowerDefenseShellVisibility
      );
      window.removeEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
      window.removeEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
      window.removeEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
      window.removeEventListener(HOME_DEMO_SHELL_VISIBILITY_EVENT, syncHomeDemoShellVisibility);
      window.removeEventListener('storage', syncTowerDefenseShellVisibility);
      window.removeEventListener('storage', syncClusterShellVisibility);
      window.removeEventListener('storage', syncWorkspaceShellVisibility);
      window.removeEventListener('storage', syncMobileShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncHomeDemoBootSequenceState = (event) => {
      const nextActive = event?.detail?.active;
      if (typeof nextActive === 'boolean') {
        setIsHomeDemoBootSequenceActive(nextActive);
        return;
      }

      setIsHomeDemoBootSequenceActive(readHomeDemoBootSequenceActive());
    };

    syncHomeDemoBootSequenceState();
    window.addEventListener(HOME_DEMO_BOOT_SEQUENCE_EVENT, syncHomeDemoBootSequenceState);

    return () => {
      window.removeEventListener(HOME_DEMO_BOOT_SEQUENCE_EVENT, syncHomeDemoBootSequenceState);
    };
  }, []);

  const toggleDockExpansion = useCallback(() => {
    setIsDockExpanded((previous) => !previous);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const success = fullscreenEnabled ? await exitAppFullscreen() : await requestAppFullscreen();

    if (!success) {
      toast({
        title: 'Fullscreen unavailable',
        description: 'This browser blocked fullscreen for this page.',
        status: 'info',
        duration: 3200,
        isClosable: true,
        position: 'top',
      });
    }
  }, [fullscreenEnabled, toast]);

  const handleInstallClick = useCallback(async () => {
    if (canPromptInstall) {
      const result = await promptInstall();

      if (result?.outcome === 'accepted') {
        toast({
          title: 'Install started',
          description: 'After install, open CodeGrind from your home screen icon.',
          status: 'success',
          duration: 4000,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      toast({
        title: 'Install prompt dismissed',
        description:
          'Use your browser menu and choose Install app or Add to Home screen to install manually.',
        status: 'info',
        duration: 5600,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (isIosMobileBrowser) {
      toast({
        title: 'Install from Safari menu',
        description:
          'Open this page in Safari, tap Share, then choose Add to Home Screen. If you installed another CodeGrind icon from a different URL, remove that one first.',
        status: 'info',
        duration: 7000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    if (isAndroidMobileBrowser) {
      toast({
        title: 'Install from browser menu',
        description: `On Android Chrome tap menu (three dots), then choose Install app or Add to Home screen for ${currentOrigin}. Tunnel and production URLs are treated as separate installs.`,
        status: 'info',
        duration: 7600,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    toast({
      title: 'Install currently unavailable',
      description:
        'Open your browser menu and choose Install app or Add to Home Screen to pin CodeGrind.',
      status: 'info',
      duration: 5400,
      isClosable: true,
      position: 'top',
    });
  }, [
    canPromptInstall,
    currentOrigin,
    isAndroidMobileBrowser,
    isIosMobileBrowser,
    promptInstall,
    toast,
  ]);

  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleProfileClick = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleStoreClick = useCallback(() => {
    navigate('/store');
  }, [navigate]);

  const handleUpgradeClick = useCallback(() => {
    navigate('/upgrade');
  }, [navigate]);

  const handleTowerDefenseShellToggle = useCallback(() => {
    writeTowerDefenseShellVisible(!isTowerDefenseShellVisible);
  }, [isTowerDefenseShellVisible]);

  const handleHomeDemoShellToggle = useCallback(() => {
    setHomeDemoShellHidden(!isHomeDemoShellHidden);
  }, [isHomeDemoShellHidden]);

  const handleClusterShellToggle = useCallback(() => {
    writeClusterShellVisible(!isClusterShellVisible);
  }, [isClusterShellVisible]);

  const handleWorkspaceShellToggle = useCallback(() => {
    writeWorkspaceShellVisible(!isWorkspaceShellVisible);
  }, [isWorkspaceShellVisible]);

  const handleMobileShellToggle = useCallback(() => {
    const isCurrentRouteSpecificShellVisible = shouldShowTowerDefenseNavAction
      ? isTowerDefenseShellVisible
      : shouldShowClusterNavAction
        ? isClusterShellVisible
        : shouldShowWorkspaceNavAction
          ? isWorkspaceShellVisible
          : shouldShowHomeNavAction
            ? !isHomeDemoShellHidden
            : true;

    if (!isMobileShellVisible || !isCurrentRouteSpecificShellVisible) {
      if (!isMobileShellVisible) {
        writeMobileShellVisible(true);
      }

      if (shouldShowTowerDefenseNavAction && !isTowerDefenseShellVisible) {
        writeTowerDefenseShellVisible(true);
      }

      if (shouldShowClusterNavAction && !isClusterShellVisible) {
        writeClusterShellVisible(true);
      }

      if (shouldShowWorkspaceNavAction && !isWorkspaceShellVisible) {
        writeWorkspaceShellVisible(true);
      }

      if (shouldShowHomeNavAction && isHomeDemoShellHidden) {
        setHomeDemoShellHidden(false);
      }

      return;
    }

    if (shouldShowTowerDefenseNavAction) {
      handleTowerDefenseShellToggle();
      return;
    }

    if (shouldShowClusterNavAction) {
      handleClusterShellToggle();
      return;
    }

    if (shouldShowWorkspaceNavAction) {
      handleWorkspaceShellToggle();
      return;
    }

    if (shouldShowHomeNavAction) {
      handleHomeDemoShellToggle();
      return;
    }

    writeMobileShellVisible(false);
  }, [
    handleClusterShellToggle,
    handleHomeDemoShellToggle,
    handleTowerDefenseShellToggle,
    handleWorkspaceShellToggle,
    isClusterShellVisible,
    isHomeDemoShellHidden,
    isMobileShellVisible,
    isTowerDefenseShellVisible,
    isWorkspaceShellVisible,
    shouldShowClusterNavAction,
    shouldShowHomeNavAction,
    shouldShowTowerDefenseNavAction,
    shouldShowWorkspaceNavAction,
  ]);

  if (!isMobileDevice || !allowCityDock) return null;
  if (isHomeRoute && isHomeDemoBootSequenceActive) return null;

  const actionSize = fullscreenEnabled ? 'xs' : 'sm';
  const transitionDuration = prefersReducedMotion ? '0ms' : '360ms';
  const collapsedTransform = isDockExpanded
    ? 'translate3d(0, 10px, 0) scale(0.72) rotate(-180deg)'
    : 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
  const expandedTransform = isDockExpanded
    ? 'translate3d(0, 0, 0) scale(1)'
    : 'translate3d(0, 20px, 0) scale(0.9)';
  const collapsedAnimation = prefersReducedMotion
    ? undefined
    : isDockExpanded
      ? undefined
      : `${dockGlowPulse} 1800ms ease-in-out infinite`;
  const contextualActions = [
    {
      key: 'fullscreen',
      onClick: handleToggleFullscreen,
      colorScheme: 'cyan',
      variant: 'solid',
      label: fullscreenEnabled
        ? 'Exit Fullscreen'
        : fullscreenPreferred
          ? 'Return to Fullscreen'
          : 'Go Fullscreen',
      bg: undefined,
      borderColor: undefined,
      color: undefined,
      hoverBg: undefined,
    },
  ];

  if (showRecaptchaToggle && typeof onToggleRecaptcha === 'function') {
    contextualActions.push({
      key: 'recaptcha',
      onClick: onToggleRecaptcha,
      colorScheme: 'cyan',
      variant: 'outline',
      label: isRecaptchaHidden ? 'Show reCAPTCHA' : 'Hide reCAPTCHA',
      bg: 'rgba(4, 18, 28, 0.86)',
      borderColor: 'rgba(71, 231, 255, 0.8)',
      color: '#b8f5ff',
      hoverBg: 'rgba(8, 28, 42, 0.94)',
    });
  }

  if (shouldShowAnyShellAction) {
    const routeShellVisible = shouldShowTowerDefenseNavAction
      ? isTowerDefenseShellVisible
      : shouldShowClusterNavAction
        ? isClusterShellVisible
        : shouldShowWorkspaceNavAction
          ? isWorkspaceShellVisible
          : shouldShowHomeNavAction
            ? !isHomeDemoShellHidden
            : true;
    const shellNavVisible = isMobileShellVisible && routeShellVisible;
    contextualActions.push({
      key: 'shell-nav',
      onClick: handleMobileShellToggle,
      colorScheme: shellNavVisible ? 'gray' : 'cyan',
      variant: 'outline',
      label: shellNavVisible ? 'Hide Nav' : 'Show Nav',
      bg: 'rgba(4, 18, 28, 0.86)',
      borderColor: 'rgba(71, 231, 255, 0.8)',
      color: '#b8f5ff',
      hoverBg: 'rgba(8, 28, 42, 0.94)',
    });
  }

  if (shouldShowHomeAction) {
    contextualActions.push({
      key: 'home',
      onClick: handleHomeClick,
      colorScheme: 'green',
      variant: 'outline',
      label: 'Home',
      bg: 'rgba(9, 24, 14, 0.85)',
      borderColor: 'rgba(108, 240, 158, 0.8)',
      color: '#c6ffd9',
      hoverBg: 'rgba(13, 34, 20, 0.95)',
    });
  }

  if (shouldShowProfileAction) {
    contextualActions.push({
      key: 'profile',
      onClick: handleProfileClick,
      colorScheme: 'blue',
      variant: 'outline',
      label: 'Profile',
      bg: 'rgba(8, 18, 36, 0.86)',
      borderColor: 'rgba(114, 184, 255, 0.75)',
      color: '#d5ebff',
      hoverBg: 'rgba(11, 27, 53, 0.95)',
    });
  }

  if (shouldShowStoreAction) {
    contextualActions.push({
      key: 'store',
      onClick: handleStoreClick,
      colorScheme: 'orange',
      variant: 'outline',
      label: 'Store',
      bg: 'rgba(32, 17, 6, 0.86)',
      borderColor: 'rgba(255, 177, 102, 0.78)',
      color: '#ffe5ca',
      hoverBg: 'rgba(46, 24, 8, 0.95)',
    });
  }

  if (shouldShowUpgradeAction) {
    contextualActions.push({
      key: 'upgrade',
      onClick: handleUpgradeClick,
      colorScheme: 'pink',
      variant: 'outline',
      label: 'Upgrade',
      bg: 'rgba(38, 8, 26, 0.86)',
      borderColor: 'rgba(255, 130, 205, 0.78)',
      color: '#ffd8f1',
      hoverBg: 'rgba(52, 10, 35, 0.95)',
    });
  }

  if (shouldShowInstallAction) {
    contextualActions.push({
      key: 'install',
      onClick: handleInstallClick,
      colorScheme: 'teal',
      variant: 'outline',
      label: canPromptInstall ? 'Install App' : 'Install Guide',
      bg: 'rgba(4, 18, 28, 0.86)',
      borderColor: 'rgba(71, 231, 255, 0.8)',
      color: '#b8f5ff',
      hoverBg: 'rgba(8, 28, 42, 0.94)',
    });
  }

  return (
    <Box
      position="fixed"
      right="10px"
      bottom={
        fullscreenEnabled
          ? 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
          : 'calc(14px + env(safe-area-inset-bottom, 0px))'
      }
      zIndex={1700}
      pointerEvents="none"
      minW={fullscreenEnabled ? '160px' : '188px'}
    >
      <Box
        position="absolute"
        right="0"
        bottom="0"
        pointerEvents={isDockExpanded ? 'auto' : 'none'}
        borderRadius="0"
        border="1px solid #5a5a5a"
        bg={RETRO_PANEL_SURFACE}
        overflow="hidden"
        p="0"
        boxShadow={
          isDockExpanded
            ? `${WINDOW_OUTSET}, 3px 3px 0 rgba(64, 64, 64, 0.48)`
            : `${WINDOW_OUTSET}, 0 0 0 rgba(64, 64, 64, 0)`
        }
        minW={fullscreenEnabled ? '160px' : '188px'}
        opacity={isDockExpanded ? 1 : 0}
        transform={expandedTransform}
        transformOrigin="bottom right"
        transition={`opacity ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1), transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${transitionDuration} ease`}
      >
        <Box px={fullscreenEnabled ? 2.5 : 3} py={2} bg={TITLE_BAR_BG}>
          <HStack justify="space-between" align="center" spacing={2}>
            <Text
              color="white"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="0.64rem"
              fontWeight="700"
              letterSpacing="0.06em"
              textTransform="uppercase"
              noOfLines={1}
            >
              quick-actions.cpl
            </Text>
            <HStack spacing={2} flexShrink={0}>
              <Text
                color="rgba(255, 255, 255, 0.9)"
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize="0.62rem"
                textTransform="uppercase"
                whiteSpace="nowrap"
              >
                {fullscreenEnabled ? 'full screen' : 'shell ready'}
              </Text>
              <Button
                size="xs"
                onClick={toggleDockExpansion}
                minW="unset"
                h="20px"
                px={2}
                borderRadius="0"
                bg={RETRO_PANEL_SURFACE}
                color={RETRO_TEXT}
                boxShadow={WINDOW_OUTSET}
                fontFamily="var(--cg-font-retro-display)"
                fontSize="0.58rem"
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
                _hover={{ bg: RETRO_PANEL_SHELL }}
                _active={{
                  boxShadow: WINDOW_INSET,
                  bg: '#b7b4ac',
                  transform: 'translate(1px, 1px)',
                }}
              >
                Hide
              </Button>
            </HStack>
          </HStack>
        </Box>

        <Box
          px={fullscreenEnabled ? 2 : 2.5}
          py={fullscreenEnabled ? 2 : 2.5}
          bg={RETRO_PANEL_BODY}
        >
          <Box mb={2} px={2.5} py={1.5} bg={RETRO_PANEL_SHELL} boxShadow={WINDOW_INSET}>
            <Text
              color={RETRO_TEXT_MUTED}
              fontFamily="var(--cg-font-retro-terminal)"
              fontSize="0.68rem"
              lineHeight="1.4"
              textTransform="uppercase"
            >
              Mobile shell controls
            </Text>
          </Box>

          {contextualActions.map((action, index) => (
            <Button
              key={action.key}
              size={actionSize}
              onClick={action.onClick}
              width="100%"
              justifyContent="space-between"
              borderRadius="0"
              bg={RETRO_PANEL_SURFACE}
              color={RETRO_TEXT}
              border="1px solid rgba(75, 75, 75, 0.28)"
              borderLeft="4px solid"
              borderLeftColor={action.borderColor || 'rgba(10, 44, 154, 0.82)'}
              boxShadow={WINDOW_OUTSET}
              fontFamily="var(--cg-font-retro-display)"
              fontSize={fullscreenEnabled ? '0.66rem' : '0.72rem'}
              fontWeight="700"
              letterSpacing="0.04em"
              textTransform="uppercase"
              px={3}
              _hover={{ bg: RETRO_PANEL_SHELL }}
              _active={{ boxShadow: WINDOW_INSET, bg: '#b7b4ac', transform: 'translate(1px, 1px)' }}
              mb={index < contextualActions.length - 1 ? 1.5 : 0}
              opacity={isDockExpanded ? 1 : 0}
              transform={isDockExpanded ? 'translate3d(0, 0, 0)' : 'translate3d(0, 8px, 0)'}
              transition={
                prefersReducedMotion
                  ? undefined
                  : `opacity 220ms ease ${index * 35}ms, transform 280ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 35}ms`
              }
            >
              <Text as="span" noOfLines={1}>
                {action.label}
              </Text>
              <Text
                as="span"
                color={action.color || '#0a2c9a'}
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize="0.64rem"
                lineHeight="1"
                textTransform="uppercase"
                whiteSpace="nowrap"
              >
                {ACTION_CONTEXT_LABELS[action.key] || 'open'}
              </Text>
            </Button>
          ))}
        </Box>
      </Box>

      <Box
        position="relative"
        display="flex"
        justifyContent="flex-end"
        pointerEvents={isDockExpanded ? 'none' : 'auto'}
        opacity={isDockExpanded ? 0 : 1}
        transform={collapsedTransform}
        transformOrigin="bottom right"
        transition={`opacity ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1), transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1)`}
      >
        <Button
          aria-label="Open mobile quick actions"
          onClick={toggleDockExpansion}
          size="sm"
          minW={fullscreenEnabled ? '78px' : '92px'}
          h={fullscreenEnabled ? '34px' : '36px'}
          borderRadius="0"
          pointerEvents="auto"
          bg={RETRO_PANEL_SURFACE}
          color={RETRO_TEXT}
          border="1px solid #5a5a5a"
          boxShadow={WINDOW_OUTSET}
          animation={collapsedAnimation}
          fontFamily="var(--cg-font-retro-display)"
          fontSize={fullscreenEnabled ? '0.64rem' : '0.68rem'}
          fontWeight="700"
          letterSpacing="0.06em"
          textTransform="uppercase"
          _hover={{ bg: RETRO_PANEL_SHELL }}
          _active={{ boxShadow: WINDOW_INSET, bg: '#b7b4ac', transform: 'translate(1px, 1px)' }}
        >
          Actions
        </Button>
      </Box>
    </Box>
  );
};

export default MobileActionDock;
