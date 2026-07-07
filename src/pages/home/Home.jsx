import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CityCodegrindLaunchExperience from '../../components/city/CityCodegrindLaunchExperience';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import HomeActionBar from './HomeActionBar';
import HomeBackgroundEffects from './HomeBackgroundEffects';
import HomeHeroSection from './HomeHeroSection';
import HomeShowcaseSection from './HomeShowcaseSection';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';
import { getGuestXpSummaryFromTotalXp } from '../../hooks/guest/useGuestProgress';
import { normalizeSelectedPlayerCharacterId } from '../../player-character/playerCharacterPresets';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import useHasHydrated from '../../hooks/useHasHydrated';
import {
  clearPendingAppLaunch,
  readPendingAppLaunch,
} from '../../utils/navigation/pendingAppLaunch';
import getAssetUrl from '../../utils/assets/assetUrl';
import { writeHomeDemoBootSequenceActive } from '../../utils/ui/homeDemoBootSequenceState';
import { setHomeDemoShellHidden } from '../../utils/ui/homeDemoShellVisibility';
import { readStorage, writeStorage } from '../../utils/web/storage';
import { restoreFullscreenFromIntent } from '../../utils/mobile/fullscreenState';
import phaserInstanceManager from '../../utils/phaser/PhaserInstanceManager';
import { api } from '../../services/api';
import {
  prebootPhaserInstance,
  preloadPhaserBackground,
} from '../../utils/phaser/PhaserBackgroundPreloader';

const MotionBox = motion(Box);
const HomepageTDDemo = lazy(() => import('./HomepageTDDemo'));
const AuthForms = lazy(() => import('../../components/auth/AuthForms'));
const PathChoiceModal = lazy(() => import('../../components/home/PathChoiceModal'));
const PlayerCharacterSelectModal = lazy(
  () => import('../../components/home/PlayerCharacterSelectModal')
);
const DemoTypeSelectModal = lazy(() => import('../../components/home/DemoTypeSelectModal'));
const NAVBAR_HEIGHT_PX = 50;
const BOOT_SCROLL_LOCK_FAILSAFE_MS = 8000;
const HOME_DEMO_BOOT_COMPLETE_EVENT = 'home-demo-boot-sequence-complete';
const HOME_DEMO_AUTO_LAUNCH_STATE_KEY = 'autoLaunchHomeDemo';
const HOME_DEMO_SHELL_THEME_STATE_KEY = 'homeDemoShellTheme';
const CITY_HOME_DEMO_BOOT_PREP_DELAY_MS = 900;
const GUEST_PROGRESS_STORAGE_KEY = 'codegrind_guest_progress';

const readStoredSelectedPlayerCharacterId = () => {
  try {
    const rawProgress = readStorage('localStorage', GUEST_PROGRESS_STORAGE_KEY);
    if (!rawProgress) return null;

    const parsedProgress = JSON.parse(rawProgress);
    return normalizeSelectedPlayerCharacterId(parsedProgress?.selectedPlayerCharacterId);
  } catch {
    return null;
  }
};

const setHomeDemoBootSequenceActive = (active) => {
  if (typeof window === 'undefined') return;

  const previousActive = Boolean(window._homeDemoBootSequenceActive);
  writeHomeDemoBootSequenceActive(active);

  if (previousActive && !active) {
    window.dispatchEvent(new CustomEvent(HOME_DEMO_BOOT_COMPLETE_EVENT));
  }
};

const Home = () => {
  const hasHydrated = useHasHydrated();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingAppLaunch, setPendingAppLaunch] = useState(() => readPendingAppLaunch());
  const autoLaunchHomeDemo = Boolean(
    location.state?.[HOME_DEMO_AUTO_LAUNCH_STATE_KEY] || pendingAppLaunch?.type === 'home-demo'
  );
  const requestedHomeDemoShellTheme =
    location.state?.[HOME_DEMO_SHELL_THEME_STATE_KEY] ||
    pendingAppLaunch?.shellTheme ||
    'retro-desktop';
  const [showBackground, setShowBackground] = useState(false);
  const [showPathChoice, setShowPathChoice] = useState(false);
  const [showPlayerCharacterSelect, setShowPlayerCharacterSelect] = useState(false);
  const [showDemoTypeSelect, setShowDemoTypeSelect] = useState(false);
  const [isQuickDemo, setIsQuickDemo] = useState(false);
  const [pathChoiceDemoSummary, setPathChoiceDemoSummary] = useState(null);
  const [hasScrolledPastDemo, setHasScrolledPastDemo] = useState(false);
  const [isDemoBootComplete, setIsDemoBootComplete] = useState(false);
  const [bootLockTimedOut, setBootLockTimedOut] = useState(false);
  const [isHomeDemoNonGameFocusActive, setIsHomeDemoNonGameFocusActive] = useState(false);
  const [demoShellTheme, setDemoShellTheme] = useState(requestedHomeDemoShellTheme);
  const [phaserPreviewLaunchSourceRect, setPhaserPreviewLaunchSourceRect] = useState(null);
  const [pendingCityLaunchTargetPath, setPendingCityLaunchTargetPath] = useState(null);
  const [pendingPlayerCharacterId, setPendingPlayerCharacterId] = useState(null);
  const [isPreloadingForNavigate, setIsPreloadingForNavigate] = useState(false);
  const [pendingPlayerCharacterLaunchSourceRect, setPendingPlayerCharacterLaunchSourceRect] =
    useState(null);
  const isMobileDevice = useIsMobileDevice();
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > window.innerHeight;
  });
  const { isAuthenticated, refreshAuth, user } = useAuth();
  const guest = useGuestProgressCtx();
  const funnel = useGuestFunnel();
  const [revealPhase, setRevealPhase] = useState(() =>
    autoLaunchHomeDemo ? 'launching' : 'prelaunch'
  );
  const [demoBootPrepDelayMs] = useState(() =>
    autoLaunchHomeDemo && requestedHomeDemoShellTheme === 'retro-desktop'
      ? CITY_HOME_DEMO_BOOT_PREP_DELAY_MS
      : 0
  );
  const showDemoSection = revealPhase !== 'prelaunch';
  const isRetroDesktopTakeover = demoShellTheme === 'retro-desktop' && showDemoSection;
  const showCompactHero =
    !isRetroDesktopTakeover &&
    (revealPhase === 'active' || revealPhase === 'settled') &&
    isDemoBootComplete;
  const showOverlayHero =
    !isRetroDesktopTakeover && (revealPhase === 'prelaunch' || revealPhase === 'launching');
  const showBelowFold =
    !isRetroDesktopTakeover &&
    (revealPhase === 'prelaunch' || (revealPhase === 'settled' && isDemoBootComplete));
  const demoSectionRef = useRef(null);
  const demoLaunchStartTimeRef = useRef(null);
  const mountTimeRef = useRef(Date.now());
  const typingAudioRef = useRef(null);
  const allowEmbeddedHandheldPageScroll = isMobileDevice && isRetroDesktopTakeover;

  useEffect(() => {
    const audio = new Audio(getAssetUrl('/audio/freesound_community-keyboard-typing-5997.mp3'));
    audio.loop = true;
    audio.volume = 0.34;
    audio.preload = 'auto';
    typingAudioRef.current = audio;
    return () => {
      audio.pause();
      typingAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const latency = performance.now();
    funnel.homepageReached({ hydrationLatencyMs: String(Math.round(latency)) });
  }, [funnel]);

  useEffect(() => {
    // Pre-fetch the home demo problem data immediately on landing to bypass cold start & network latency
    api.learningProblems.getById('lp-m0-td-hello-print').catch(() => {});

    // Prefetch modal chunks to ensure transitions are instantaneous without Suspense fallback delays
    import('../../components/home/PlayerCharacterSelectModal').catch(() => {});
    import('../../components/home/DemoTypeSelectModal').catch(() => {});
  }, []);

  // Auth modal triggered by navigation state (e.g. after email verification)
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();
  const canStayInPortraitDemo =
    isMobileDevice && !isLandscapeViewport && isHomeDemoNonGameFocusActive;
  const canLaunchDemo = !isMobileDevice || isLandscapeViewport || canStayInPortraitDemo;
  const requiresLandscapeForDemo = isMobileDevice && !isLandscapeViewport && !canStayInPortraitDemo;

  const beginDemoLaunch = useCallback(
    ({ playTypingAudio = false, shellTheme = 'retro-desktop', skipBootSequence = false } = {}) => {
      if (playTypingAudio && typingAudioRef.current) {
        typingAudioRef.current.currentTime = 0;
        typingAudioRef.current.play().catch(() => {});
      }

      setDemoShellTheme(shellTheme);
      setIsDemoBootComplete(skipBootSequence);
      setBootLockTimedOut(false);
      setIsHomeDemoNonGameFocusActive(false);
      setHomeDemoBootSequenceActive(!skipBootSequence);
      setRevealPhase((currentPhase) => {
        if (currentPhase !== 'prelaunch') return currentPhase;
        return skipBootSequence ? 'active' : 'launching';
      });
    },
    []
  );

  useEffect(() => {
    if (showDemoSection) return;
    setIsHomeDemoNonGameFocusActive(false);
  }, [showDemoSection]);

  useEffect(() => {
    if (location.state?.openSignIn && !isAuthenticated) {
      onAuthOpen();
      // Clear state so refresh doesn't re-open
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isAuthenticated, onAuthOpen, navigate, location.pathname]);

  useEffect(() => {
    if (!autoLaunchHomeDemo) {
      if (typeof window !== 'undefined') {
        window.__codegrindQuickDemoActive = false;
      }
      return;
    }

    if (typeof window !== 'undefined') {
      window.__codegrindQuickDemoActive = true;
    }
    try {
      phaserInstanceManager.pauseGame();
    } catch {
      // Ignore
    }

    demoLaunchStartTimeRef.current = performance.now();
    funnel.demoLoadingStarted('quick', { timeToDemoClickMs: '0' });

    beginDemoLaunch({
      playTypingAudio: true,
      shellTheme: requestedHomeDemoShellTheme,
    });

    if (pendingAppLaunch) {
      clearPendingAppLaunch();
      setPendingAppLaunch(null);
    }

    if (location.state?.[HOME_DEMO_AUTO_LAUNCH_STATE_KEY] || location.state?.homeDemoLaunchSource) {
      const nextState = { ...(location.state || {}) };
      delete nextState[HOME_DEMO_AUTO_LAUNCH_STATE_KEY];
      delete nextState[HOME_DEMO_SHELL_THEME_STATE_KEY];
      delete nextState.homeDemoLaunchSource;

      navigate(location.pathname, {
        replace: true,
        state: Object.keys(nextState).length ? nextState : {},
      });
    }
  }, [
    autoLaunchHomeDemo,
    beginDemoLaunch,
    funnel,
    location.pathname,
    location.state,
    navigate,
    pendingAppLaunch,
    requestedHomeDemoShellTheme,
  ]);

  useEffect(() => {
    const shouldHideHomeShell = isMobileDevice
      ? revealPhase !== 'prelaunch'
      : isRetroDesktopTakeover;
    setHomeDemoShellHidden(shouldHideHomeShell);
  }, [isMobileDevice, isRetroDesktopTakeover, revealPhase]);

  useEffect(
    () => () => {
      setHomeDemoShellHidden(false);
      setHomeDemoBootSequenceActive(false);
    },
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateOrientation = () => {
      setIsLandscapeViewport(window.innerWidth > window.innerHeight);
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  /** Called by the embedded TD demo when the player wins the Hello World level */
  const handleDemoVictory = useCallback(
    (stats = null) => {
      const demoCompletionPromise = funnel.demoCompleted();

      const demoPreview =
        !isAuthenticated && guest?.getDemoRewardPreview ? guest.getDemoRewardPreview() : null;

      if (!isAuthenticated) {
        if (guest) {
          // Keep guest progression in context state so cluster unlocks update immediately.
          guest.markDemoCompleted();
          guest.recordProblemAttempt('hello-world');
          guest.recordProblemSolved('hello-world', {
            difficulty: 'easy',
            source: 'homepage-demo',
          });
        } else {
          // Fallback for contexts where provider is absent (storybook/tests).
          try {
            const raw = localStorage.getItem('codegrind_guest_progress');
            const blob = raw ? JSON.parse(raw) : {};
            const attempted = Array.isArray(blob.problemsAttempted) ? blob.problemsAttempted : [];
            const solved = Array.isArray(blob.problemsSolved) ? blob.problemsSolved : [];
            if (!attempted.includes('hello-world')) attempted.push('hello-world');
            if (!solved.includes('hello-world')) solved.push('hello-world');
            blob.demoCompleted = true;
            blob.demoCompletedAt = blob.demoCompletedAt || new Date().toISOString();
            blob.problemsAttempted = attempted;
            blob.problemsSolved = solved;
            localStorage.setItem('codegrind_guest_progress', JSON.stringify(blob));
          } catch {
            // best effort
          }
        }
      }

      const lives = Number.isFinite(Number(stats?.finalLives)) ? Number(stats.finalLives) : null;
      const timeLabel = typeof stats?.formattedTime === 'string' ? stats.formattedTime : null;
      const demoHighlights = [
        'Validated your code against live judge test cases.',
        timeLabel
          ? `Cleared the onboarding waves in ${timeLabel}${lives !== null ? ` with ${lives} lives remaining` : ''}.`
          : 'Cleared the onboarding waves and protected your base.',
        'Unlocked trial access to both tracks: Beginner Learning Path and Pro Clusters.',
      ];

      const statsXpPayload = stats?.xp || null;
      const statsAwards = Array.isArray(statsXpPayload?.awards) ? statsXpPayload.awards : [];
      const statsXpGained = statsAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
      const currentSummary = statsXpPayload?.summary || null;
      const previousSummary = currentSummary
        ? getGuestXpSummaryFromTotalXp(Math.max(0, Number(currentSummary.xp || 0) - statsXpGained))
        : null;

      setPathChoiceDemoSummary((prev) => ({
        xpGained: isAuthenticated
          ? statsXpGained || prev?.xpGained || 0
          : demoPreview?.totalXp || 0,
        xpSummary: isAuthenticated ? currentSummary || prev?.xpSummary || null : null,
        previousXpSummary: isAuthenticated
          ? previousSummary || prev?.previousXpSummary || null
          : null,
        dataPackets: stats?.dataPackets || prev?.dataPackets || null,
        unlockedAchievements: demoPreview?.unlockedAchievements || [],
        highlights: demoHighlights,
      }));

      if (isAuthenticated && typeof refreshAuth === 'function') {
        refreshAuth().catch(() => {});
      }

      if (!isAuthenticated) {
        Promise.resolve(demoCompletionPromise)
          .then((payload) => {
            const earnedDataPackets = Number(payload?.guestProgress?.dataPacketsEarned);
            if (!Number.isFinite(earnedDataPackets) || earnedDataPackets < 0) return;

            setPathChoiceDemoSummary((prev) => ({
              ...(prev || {}),
              dataPackets: {
                amount: Math.floor(earnedDataPackets),
                reason: 'guest_demo_session_total',
              },
            }));
          })
          .catch(() => {
            // Best effort only; the modal can render without a DP badge if needed.
          });
      }

      // Brief delay so the victory terminal output is visible before modal
      setTimeout(() => setShowPathChoice(true), 2500);
    },
    [funnel, guest, isAuthenticated, refreshAuth]
  );

  const handleDemoReady = useCallback(() => {
    let latency = null;
    if (demoLaunchStartTimeRef.current !== null) {
      latency = Math.round(performance.now() - demoLaunchStartTimeRef.current);
    }
    funnel.demoStarted('quick', latency !== null ? { durationMs: String(latency) } : {});
  }, [funnel]);

  const handleDemoBootStateChange = useCallback((isBootComplete) => {
    setIsDemoBootComplete(isBootComplete);
    setHomeDemoBootSequenceActive(!isBootComplete);
  }, []);

  const persistSelectedPlayerCharacter = useCallback(
    (selectedPlayerCharacterId) => {
      const normalizedPlayerCharacterId =
        normalizeSelectedPlayerCharacterId(selectedPlayerCharacterId);
      if (!normalizedPlayerCharacterId) return;

      if (guest?.recordSelectedPlayerCharacter) {
        guest.recordSelectedPlayerCharacter(normalizedPlayerCharacterId);
        return;
      }

      try {
        const rawProgress = readStorage('localStorage', GUEST_PROGRESS_STORAGE_KEY);
        const parsedProgress = rawProgress ? JSON.parse(rawProgress) : {};
        writeStorage(
          'localStorage',
          GUEST_PROGRESS_STORAGE_KEY,
          JSON.stringify({
            ...parsedProgress,
            selectedPlayerCharacterId: normalizedPlayerCharacterId,
          })
        );
      } catch {
        // Best effort only.
      }
    },
    [guest]
  );

  const handlePlayerCharacterModalClose = useCallback(() => {
    setShowPlayerCharacterSelect(false);
    setPendingPlayerCharacterLaunchSourceRect(null);
    setPendingPlayerCharacterId(
      guest?.selectedPlayerCharacterId || readStoredSelectedPlayerCharacterId()
    );
  }, [guest?.selectedPlayerCharacterId]);

  const handleLaunchCityTarget = useCallback(
    async (targetPath, sourceRect = null) => {
      if (!targetPath) {
        return;
      }

      await restoreFullscreenFromIntent();

      if (import.meta.env.DEV) {
        navigate(targetPath);
        return;
      }

      setPhaserPreviewLaunchSourceRect(sourceRect);
      setPendingCityLaunchTargetPath(targetPath);
    },
    [navigate]
  );

  const handlePlayerCharacterConfirm = useCallback(
    async (selectedPlayerCharacterId) => {
      const normalizedPlayerCharacterId =
        normalizeSelectedPlayerCharacterId(selectedPlayerCharacterId);
      if (!normalizedPlayerCharacterId) {
        return;
      }

      persistSelectedPlayerCharacter(normalizedPlayerCharacterId);
      setShowPlayerCharacterSelect(false);
      setPendingPlayerCharacterId(normalizedPlayerCharacterId);

      setShowDemoTypeSelect(true);
    },
    [persistSelectedPlayerCharacter]
  );

  const handleDemoTypeSelectClose = useCallback(() => {
    setShowDemoTypeSelect(false);
    setPendingPlayerCharacterLaunchSourceRect(null);
  }, []);

  const handleSelectQuickDemo = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.__codegrindQuickDemoActive = true;
    }
    try {
      phaserInstanceManager.pauseGame();
    } catch (err) {
      console.warn('[Home] Failed to pause Phaser background instance:', err);
    }
    setShowDemoTypeSelect(false);
    setPendingPlayerCharacterLaunchSourceRect(null);

    // Wait for any in-flight preload to finish before starting Phaser preboot.
    setIsPreloadingForNavigate(true);
    await preloadPhaserBackground();
    setIsPreloadingForNavigate(false);

    setIsQuickDemo(true);
    demoLaunchStartTimeRef.current = performance.now();
    const timeToDemoClickMs = Date.now() - mountTimeRef.current;
    funnel.demoLoadingStarted('quick', { timeToDemoClickMs: String(timeToDemoClickMs) });
    beginDemoLaunch({ playTypingAudio: false, shellTheme: demoShellTheme, skipBootSequence: true });

    // Kick off the heavy Phaser preboot now that the user has committed to quick demo.
    // This warms up the Phaser engine and loads apartment scene modules in the
    // background while the demo terminal boots.
    prebootPhaserInstance().catch((err) => {
      console.warn('[Home] Quick demo Phaser preboot error:', err);
    });
  }, [beginDemoLaunch, demoShellTheme, funnel]);

  const handleSelectFullExperience = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.__codegrindQuickDemoActive = false;
    }

    setShowDemoTypeSelect(false);
    setPendingPlayerCharacterLaunchSourceRect(null);

    // Wait for any in-flight preload to finish before navigating, so the
    // city page never races against partially-loaded assets.
    // prebootPhaserInstance was already started during handleBeginDemo but we
    // await it here as a completion barrier before navigating.
    setIsPreloadingForNavigate(true);
    await preloadPhaserBackground();
    await prebootPhaserInstance();
    setIsPreloadingForNavigate(false);

    const timeToDemoClickMs = Date.now() - mountTimeRef.current;
    funnel.demoLoadingStarted('full', { timeToDemoClickMs: String(timeToDemoClickMs) });
    await handleLaunchCityTarget('/city', pendingPlayerCharacterLaunchSourceRect);
  }, [funnel, handleLaunchCityTarget, pendingPlayerCharacterLaunchSourceRect]);

  const handleBeginDemo = useCallback(
    (event) => {
      if (!canLaunchDemo || requiresLandscapeForDemo) {
        return;
      }

      preloadPhaserBackground().catch((err) => {
        console.warn('[Home] Background preload error:', err);
      });

      // Start Phaser scene preboot while user is selecting character + demo type.
      // This avoids the ~20s scene bootstrap delay when user clicks "Full Experience".
      prebootPhaserInstance().catch((err) => {
        console.warn('[Home] Phaser preboot error:', err);
      });

      funnel.beginDemoClicked({ source: 'hero' });

      const triggerRect = event?.currentTarget?.getBoundingClientRect?.();

      setPendingPlayerCharacterLaunchSourceRect(
        triggerRect
          ? {
              height: triggerRect.height,
              left: triggerRect.left,
              top: triggerRect.top,
              width: triggerRect.width,
            }
          : null
      );
      setPendingPlayerCharacterId(
        guest?.selectedPlayerCharacterId || readStoredSelectedPlayerCharacterId()
      );
      setShowPlayerCharacterSelect(true);
    },
    [canLaunchDemo, funnel, guest?.selectedPlayerCharacterId, requiresLandscapeForDemo]
  );

  const handleEmbeddedChatFocusChange = useCallback((isNonGameFocusActive) => {
    setIsHomeDemoNonGameFocusActive(Boolean(isNonGameFocusActive));
  }, []);

  const handleDemoLearningXp = useCallback(
    (payload = null) => {
      const xpPayload = payload?.xp || payload || null;
      const dataPacketsPayload = payload?.dataPackets || null;
      const awards = Array.isArray(xpPayload?.awards) ? xpPayload.awards : [];
      const xpGained = awards.reduce((sum, award) => sum + (award?.amount || 0), 0);
      const currentSummary = xpPayload?.summary || null;
      const previousSummary = currentSummary
        ? getGuestXpSummaryFromTotalXp(Math.max(0, Number(currentSummary.xp || 0) - xpGained))
        : null;

      setPathChoiceDemoSummary((prev) => ({
        xpGained,
        xpSummary: currentSummary,
        previousXpSummary: previousSummary,
        dataPackets: dataPacketsPayload,
        unlockedAchievements: prev?.unlockedAchievements || [],
        highlights: prev?.highlights || [],
      }));

      if (isAuthenticated && typeof refreshAuth === 'function') {
        refreshAuth().catch(() => {
          // Best effort only; the modal can still render from the XP payload.
        });
      }
    },
    [isAuthenticated, refreshAuth]
  );

  useEffect(() => {
    if (!hasHydrated) return undefined;

    const bgTimer = setTimeout(() => {
      setShowBackground(true);
    }, 200);

    return () => {
      clearTimeout(bgTimer);
    };
  }, [hasHydrated]);

  useEffect(() => {
    if (revealPhase !== 'launching') return undefined;

    const activateTimer = window.setTimeout(() => {
      setRevealPhase('active');
    }, 950);

    return () => {
      window.clearTimeout(activateTimer);
    };
  }, [revealPhase]);

  useEffect(() => {
    if (revealPhase !== 'active') return undefined;

    const settleTimer = window.setTimeout(() => {
      setRevealPhase('settled');
    }, 900);

    return () => {
      window.clearTimeout(settleTimer);
    };
  }, [revealPhase]);

  useEffect(() => {
    const shouldTrackBootLockTimeout =
      showDemoSection && !isMobileDevice && !isDemoBootComplete && !bootLockTimedOut;

    if (!shouldTrackBootLockTimeout) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setBootLockTimedOut(true);
    }, BOOT_SCROLL_LOCK_FAILSAFE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bootLockTimedOut, isDemoBootComplete, isMobileDevice, showDemoSection]);

  useEffect(() => {
    if (!showDemoSection || isMobileDevice || typeof window === 'undefined') {
      setHasScrolledPastDemo(false);
      return undefined;
    }

    const target = demoSectionRef.current;
    if (!target) {
      setHasScrolledPastDemo(false);
      return undefined;
    }

    const updateScrolledPastDemo = () => {
      const rect = target.getBoundingClientRect();
      const passed = rect.bottom <= NAVBAR_HEIGHT_PX + 8;
      setHasScrolledPastDemo(passed);
    };

    updateScrolledPastDemo();
    const observer = new IntersectionObserver(
      () => {
        updateScrolledPastDemo();
      },
      {
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    observer.observe(target);

    // Capture scroll from nested scroll containers too.
    window.addEventListener('scroll', updateScrolledPastDemo, true);
    window.addEventListener('resize', updateScrolledPastDemo);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateScrolledPastDemo, true);
      window.removeEventListener('resize', updateScrolledPastDemo);
    };
  }, [isMobileDevice, showDemoSection]);

  const isBootScrollLocked =
    showDemoSection && !isMobileDevice && !isDemoBootComplete && !bootLockTimedOut;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscroll = documentElement.style.overscrollBehavior;

    if (isBootScrollLocked) {
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      documentElement.style.overflow = 'hidden';
      documentElement.style.overscrollBehavior = 'none';
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isBootScrollLocked]);

  const handleContinueDemo = useCallback(() => {
    demoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const showContinueDemoCue =
    showDemoSection &&
    showBelowFold &&
    !isRetroDesktopTakeover &&
    isDemoBootComplete &&
    !isMobileDevice &&
    hasScrolledPastDemo;

  return (
    <PageTemplate showCityReturnBanner={!isRetroDesktopTakeover}>
      <PageSeo
        title="CodeGrind | Coding Platform Featuring Code Breach for Interview Prep"
        description="CodeGrind is a coding platform for learning and interview prep featuring Code Breach, its first live tower defense coding game, plus real coding problems, AI verification, and guided practice."
        path="/"
        keywords="codegrind, code breach, tower defense coding game, coding games, learn to code, coding interview practice, original coding challenges, gamified coding"
      />
      {/* SEO content — always in the DOM so crawlers index the page body. Visually hidden. */}
      <Box
        as="section"
        aria-hidden="true"
        position="absolute"
        width="1px"
        height="1px"
        overflow="hidden"
        style={{ clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        <h1>CodeGrind — Coding Platform Featuring Code Breach</h1>
        <p>
          CodeGrind is a coding platform for learning and interview prep. Code Breach is the first
          live featured game: a tower defense mode where real coding problems drive the action in
          Python, JavaScript, and Java.
        </p>
        <p>
          Start with guided lessons, solve real problems inside an actual game, use AI as a tool
          instead of a crutch, and verify what it gives you. Unlock interview prep clusters after
          completing the beginner learning path.
        </p>
        <p>
          Features: gamified coding challenges, tower defense coding game, AI code verification,
          learning path missions, interview preparation, coding leaderboards, achievements, and
          multiplayer practice modes.
        </p>
      </Box>
      {/* Content layout */}
      <Box
        width="100%"
        position="relative"
        height={isRetroDesktopTakeover && !allowEmbeddedHandheldPageScroll ? '100dvh' : 'auto'}
        display="flex"
        flexDirection={{ base: 'column', lg: 'row' }}
        sx={{
          '--home-retro-desktop': '#008080',
          '--home-retro-desktop-dark': '#0b6b72',
          '--home-retro-surface': '#c0c0c0',
          '--home-retro-surface-strong': '#d4d0c8',
          '--home-retro-surface-muted': '#b7b4ac',
          '--home-retro-surface-shell': '#efebe7',
          '--home-retro-border-light': '#ffffff',
          '--home-retro-border-lighter': '#f6f2ee',
          '--home-retro-border-mid': '#808080',
          '--home-retro-border-dark': '#404040',
          '--home-retro-title-start': '#0a2c9a',
          '--home-retro-title-end': '#1084d0',
          '--home-retro-text': '#141414',
          '--home-retro-text-muted': '#383838',
          '--home-retro-accent-green': '#0f6f17',
          '--home-retro-accent-amber': '#6f5600',
          '--home-retro-accent-red': '#8f1f1f',
        }}
      >
        {/* Main content - now scrollable */}
        <Box
          flex="1"
          position="relative"
          borderRadius={isRetroDesktopTakeover ? '0' : 'lg'}
          overflow={
            isRetroDesktopTakeover && !allowEmbeddedHandheldPageScroll ? 'hidden' : 'visible'
          }
          bg={
            isRetroDesktopTakeover
              ? '#09070d'
              : 'linear-gradient(180deg, var(--home-retro-desktop) 0%, var(--home-retro-desktop-dark) 100%)'
          }
          boxShadow="none"
          display="flex"
          flexDirection="column"
          minH={
            isRetroDesktopTakeover && !allowEmbeddedHandheldPageScroll
              ? '100dvh'
              : showDemoSection
                ? 'auto'
                : 'calc(100vh - 50px)'
          }
        >
          <HomeBackgroundEffects showBackground={showBackground && !isRetroDesktopTakeover} />

          {/* Scrollable content container */}
          <Box
            width="100%"
            flex="1"
            position="relative"
            zIndex="1"
            overflow={
              isRetroDesktopTakeover && !allowEmbeddedHandheldPageScroll ? 'hidden' : 'visible'
            }
            sx={{
              '@media (min-width: 62em)': isRetroDesktopTakeover
                ? undefined
                : {
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0, 255, 255, 0.3)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: 'rgba(0, 255, 255, 0.5)',
                    },
                  },
            }}
          >
            {showOverlayHero ? (
              <HomeHeroSection
                variant="overlay"
                revealPhase={revealPhase}
                canBegin={hasHydrated && canLaunchDemo}
                requiresLandscapeForDemo={requiresLandscapeForDemo}
                onBeginDemo={handleBeginDemo}
                onSignIn={onAuthOpen}
                isAuthenticated={isAuthenticated}
                user={user}
              />
            ) : null}

            {showDemoSection &&
              (hasHydrated ? (
                <Box
                  ref={demoSectionRef}
                  position="relative"
                  minH={
                    isRetroDesktopTakeover && !allowEmbeddedHandheldPageScroll
                      ? '100dvh'
                      : undefined
                  }
                >
                  <Box
                    opacity={requiresLandscapeForDemo ? 0.35 : 1}
                    filter={requiresLandscapeForDemo ? 'blur(2px)' : 'none'}
                    pointerEvents={requiresLandscapeForDemo ? 'none' : 'auto'}
                    transition="opacity 0.2s ease"
                  >
                    <Suspense fallback={null}>
                      <HomepageTDDemo
                        bootPrepDelayMs={demoBootPrepDelayMs}
                        revealPhase={revealPhase}
                        embeddedShellTheme={demoShellTheme}
                        allowEmbeddedHandheldPageScroll={allowEmbeddedHandheldPageScroll}
                        skipBootSequence={isQuickDemo}
                        onReady={handleDemoReady}
                        onVictory={handleDemoVictory}
                        onLearningXp={handleDemoLearningXp}
                        onBootStateChange={handleDemoBootStateChange}
                        onEmbeddedChatFocusChange={handleEmbeddedChatFocusChange}
                        preinitTypingAudio={typingAudioRef}
                        demoLaunchStartTime={demoLaunchStartTimeRef.current}
                      />
                    </Suspense>
                  </Box>

                  {requiresLandscapeForDemo ? (
                    <Box
                      position="absolute"
                      inset="0"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      px={{ base: 5, md: 8 }}
                      py={{ base: 3, md: 4 }}
                      pointerEvents="auto"
                    >
                      <Box className="cg-panel-window" overflow="hidden" maxW="560px">
                        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                          <Text
                            color="#f5f7ff"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize={{ base: 'xs', md: 'sm' }}
                            fontWeight="700"
                            letterSpacing="0.08em"
                            textTransform="uppercase"
                          >
                            orientation-check.exe
                          </Text>
                        </Box>
                        <Box p={{ base: 4, md: 5 }} bg="#d4d0c8">
                          <Box
                            bg="#efebe7"
                            border="1px solid #7f7f7f"
                            boxShadow="var(--cg-window-inset)"
                            p={{ base: 4, md: 5 }}
                          >
                            <Text
                              fontSize={{ base: 'md', md: 'lg' }}
                              fontWeight="700"
                              color="#7a2800"
                              fontFamily="var(--cg-font-retro-display)"
                              mb={2}
                              textTransform="uppercase"
                              letterSpacing="0.08em"
                            >
                              Rotate To Landscape To Continue Demo
                            </Text>
                            <Text
                              color="#1f2430"
                              fontSize={{ base: 'sm', md: 'md' }}
                              lineHeight="1.7"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              Game view stays landscape-only for control stability. Switch to
                              Editor, Problem, or Chat to keep working in portrait.
                            </Text>
                            <Text
                              color="#0a2c9a"
                              fontSize={{ base: 'xs', md: 'sm' }}
                              lineHeight="1.6"
                              mt={3}
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              Rotate sideways to resume without losing your current progress.
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              ) : (
                <Box px={{ base: 5, md: 8 }} pb={{ base: 3, md: 4 }}>
                  <Box className="cg-panel-window" overflow="hidden">
                    <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                      <Text
                        color="#f5f7ff"
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize={{ base: 'xs', md: 'sm' }}
                        fontWeight="700"
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                      >
                        demo-loader.exe
                      </Text>
                    </Box>
                    <Box p={{ base: 4, md: 5 }} bg="#d4d0c8">
                      <Box
                        bg="#efebe7"
                        border="1px solid #7f7f7f"
                        boxShadow="var(--cg-window-inset)"
                        p={{ base: 4, md: 5 }}
                      >
                        <Text
                          fontSize={{ base: 'md', md: 'lg' }}
                          fontWeight="700"
                          color="#0a2c9a"
                          fontFamily="var(--cg-font-retro-display)"
                          mb={2}
                          textTransform="uppercase"
                          letterSpacing="0.08em"
                        >
                          Code Breach Demo
                        </Text>
                        <Text
                          color="#1f2430"
                          fontSize={{ base: 'sm', md: 'md' }}
                          lineHeight="1.7"
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          The live onboarding mission loads after the page becomes interactive. You
                          will solve a real intro problem, defend your base, and then choose between
                          the beginner learning path and interview prep clusters.
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}

            {showCompactHero ? (
              <HomeHeroSection
                variant="compact"
                revealPhase={revealPhase}
                canBegin={hasHydrated && canLaunchDemo}
                requiresLandscapeForDemo={requiresLandscapeForDemo}
                onBeginDemo={handleBeginDemo}
                isAuthenticated={isAuthenticated}
                user={user}
              />
            ) : null}

            {/* CTA + showcase are rendered immediately after the hero on the hydrated route. */}
            {/* Below-fold CTA + showcase render immediately beneath the hero content. */}
            <AnimatePresence>
              {showBelowFold && (
                <MotionBox
                  key="below-fold"
                  {...(hasHydrated
                    ? {
                        initial: { opacity: 0, y: 30 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.6, ease: 'easeOut' },
                      }
                    : {})}
                >
                  <HomeActionBar />
                  <HomeShowcaseSection />
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {pendingCityLaunchTargetPath ? (
          <CityCodegrindLaunchExperience
            overlayPosition="fixed"
            overlayZIndex={1400}
            sourceRect={phaserPreviewLaunchSourceRect}
            targetPath={pendingCityLaunchTargetPath}
            windowTitle="city.exe"
            windowStatusLabel="run"
            statusLabel="safehouse runtime / phaser transition engaged"
            progressLabel="Page handoff progress"
            headline="booting the city safehouse"
            description="Please wait while CodeGrind swaps pages, restores the retro desktop runtime, and prepares the live apartment safehouse."
            subheadline="the apartment safehouse will open after the city route finishes booting"
            terminalRows={[
              {
                token: 'Save',
                text: 'Persist the safehouse handoff before the page swap starts',
              },
              {
                token: 'Restore',
                text: 'Mount the retro desktop runtime shell on the incoming page',
              },
              {
                token: 'Boot',
                text: 'Queue the live safehouse runtime after hydration finishes',
              },
            ]}
          />
        ) : null}
      </Box>

      <AnimatePresence>
        {showContinueDemoCue ? (
          <MotionBox
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            position="fixed"
            left="50%"
            top={`${NAVBAR_HEIGHT_PX + 12}px`}
            transform="translateX(-50%)"
            zIndex={1100}
            pointerEvents="none"
          >
            <Button
              onClick={handleContinueDemo}
              pointerEvents="auto"
              variant="ghost"
              borderRadius="md"
              px={4}
              py={4}
              border="1px solid rgba(0, 255, 255, 0.45)"
              bg="rgba(8, 14, 26, 0.86)"
              color="#72F4FF"
              fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
              fontSize={{ base: '11px', md: '12px' }}
              letterSpacing="0.08em"
              textTransform="uppercase"
              _hover={{
                bg: 'rgba(8, 18, 34, 0.94)',
                borderColor: 'rgba(0, 255, 255, 0.68)',
                color: '#C8FFFF',
                boxShadow: '0 0 18px rgba(0, 255, 255, 0.24)',
              }}
              _active={{
                bg: 'rgba(6, 12, 24, 0.98)',
              }}
            >
              <HStack spacing={2}>
                <Text as="span" fontSize={{ base: '13px', md: '14px' }} lineHeight={1}>
                  ↑
                </Text>
                <Text as="span">Continue demo above</Text>
              </HStack>
            </Button>
          </MotionBox>
        ) : null}
      </AnimatePresence>

      {hasHydrated ? (
        <>
          <Suspense fallback={null}>
            <PlayerCharacterSelectModal
              isOpen={showPlayerCharacterSelect}
              onClose={handlePlayerCharacterModalClose}
              onConfirm={handlePlayerCharacterConfirm}
              onSelectCharacter={setPendingPlayerCharacterId}
              selectedPlayerCharacterId={pendingPlayerCharacterId}
            />
          </Suspense>

          <Suspense fallback={null}>
            <DemoTypeSelectModal
              isOpen={showDemoTypeSelect}
              onClose={handleDemoTypeSelectClose}
              onSelectQuickDemo={handleSelectQuickDemo}
              onSelectFullExperience={handleSelectFullExperience}
            />
          </Suspense>

          <Suspense fallback={null}>
            {/* Path choice modal — shown after homepage demo is won */}
            <PathChoiceModal
              isOpen={showPathChoice}
              onClose={() => setShowPathChoice(false)}
              onLaunchCityTarget={handleLaunchCityTarget}
              demoSummary={pathChoiceDemoSummary}
              selectedTrack={guest?.selectedTrialTrack || null}
              selectedLearningPath={guest?.selectedTrialLearningPath || null}
            />
          </Suspense>

          <Suspense fallback={null}>
            {/* Auth modal — auto-opens when arriving from email verification */}
            <Modal isOpen={isAuthOpen} onClose={onAuthClose} size="lg" isCentered>
              <ModalOverlay backdropFilter="blur(4px)" bg="rgba(40, 52, 68, 0.28)" />
              <ModalContent
                className="cg-panel-window"
                bg="#d4d0c8"
                borderRadius="0"
                color="#1f2430"
                overflow="hidden"
              >
                <ModalHeader
                  className="cg-titlebar"
                  py={2}
                  px={4}
                  color="#f5f7ff"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Sign In to Continue
                </ModalHeader>
                <ModalCloseButton
                  color="#f5f7ff"
                  top={2}
                  right={3}
                  borderRadius="0"
                  _hover={{ bg: 'rgba(255,255,255,0.12)' }}
                  _active={{ bg: 'rgba(0,0,0,0.12)' }}
                />
                <ModalBody pb={6} bg="#d4d0c8">
                  <Box
                    bg="#efebe7"
                    border="1px solid #7f7f7f"
                    boxShadow="var(--cg-window-inset)"
                    p={{ base: 4, md: 5 }}
                  >
                    <Text
                      color="#1f2430"
                      mb={4}
                      fontSize="sm"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      Your email is verified! Sign in to access your dashboard.
                    </Text>
                    <AuthForms defaultIsLogin />
                  </Box>
                </ModalBody>
              </ModalContent>
            </Modal>
          </Suspense>
        </>
      ) : null}

      {/* Preload spinner — shown while awaiting Phaser warmup to finish
          before navigating to city or starting quick demo. */}
      {isPreloadingForNavigate && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex="99999"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          bg="rgba(0, 0, 0, 0.6)"
          gap={4}
        >
          <Spinner size="xl" color="#f5f7ff" thickness="3px" />
          <Text color="#f5f7ff" fontFamily="var(--cg-font-retro-display)" fontSize="sm">
            Finishing Phaser engine preload…
          </Text>
        </Box>
      )}
    </PageTemplate>
  );
};

export default Home;
