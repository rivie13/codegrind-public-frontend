/**
 * Tower Defense Game V2 - With Slottable UI Layout
 *
 * Uses the new canvas-based GameEngine with a flexible UI layout system.
 * REUSES: All existing UI components (CodeEditorPanel, TowerSelector, etc.)
 *
 * Access at: /games/tower-defense
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text, useToast } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import GuestSignupWall from '../../../components/guest/GuestSignupWall';
import PageContainer from '../../../components/layout/PageContainer';
import BottomBannerAd from '../../../components/ads/BottomBannerAd';
import TopBannerAd from '../../../components/ads/TopBannerAd';
import adSlots from '../../../config/adSlots';
import useCompactLandscapeShellMode from '../../../hooks/useCompactLandscapeShellMode';

import LearningPathTowerDefenseOnboarding from '../../../components/learningPath/LearningPathTowerDefenseOnboarding';
import LearningWaveOverlay from '../../../components/learningPath/LearningWaveOverlay';
import TowerDefenseOnboardingOverlay from '../../../components/towerDefense/onboarding/TowerDefenseOnboardingOverlay';
import EnemyRevealOverlay from '../../../components/towerDefense/ui/overlays/EnemyRevealOverlay';
import InvalidPlacementOverlay from '../../../components/towerDefense/ui/overlays/InvalidPlacementOverlay';
import useLearningWaveOverlays from '../../../hooks/learning/useLearningWaveOverlays';
import useEnemyRevealOverlay from '../../../hooks/towerDefense/useEnemyRevealOverlay';
import audioManager from '../../../utils/audio/AudioManager';
import AudioService from '../../../utils/audio/AudioService';
import TowerDefenseV2Modals from './TowerDefenseV2Modals';
import useTowerDefenseV2PageState from './useTowerDefenseV2PageState';
import { PANEL_TYPES } from '../../../components/towerDefense/ui/layout/panelTypes';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../../contexts/GuestProgressProvider';
import { trackUserContentEvent } from '../../../services/userContentEventService';
import {
  normalizeClusterNavigation,
  TD_CLUSTER_NAVIGATION_STORAGE_KEY,
} from '../../../utils/navigation/clusterNavigation';
import { resolveTowerDefensePageShellLayout } from './pageShellLayout';
import { TOWER_TYPES } from '../../../components/towerDefense/data/towerTypes';

const TD_OPEN_SETTINGS_PENDING_KEY = 'td-open-settings-menu';
const TOWER_UNLOCK_CALLOUT_DURATION_MS = 8400;

const normalizeTowerType = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const formatTowerLabel = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2');

const getTowerUnlockTargetSelector = (towerType) => {
  switch (normalizeTowerType(towerType)) {
    case 'FUNCTION':
      return "[data-tutorial='tower-function']";
    case 'OBJECT':
      return "[data-tutorial='tower-object']";
    case 'VARIABLE':
      return "[data-tutorial='tower-variable']";
    case 'IFCONDITION':
    case 'CONDITIONAL':
      return "[data-tutorial='tower-conditional']";
    case 'FORLOOP':
    case 'LOOP':
      return "[data-tutorial='tower-for-loop']";
    case 'WHILELOOP':
      return "[data-tutorial='tower-while-loop']";
    case 'ARRAY':
      return "[data-tutorial='tower-array']";
    case 'BURSTTURRET':
      return "[data-tutorial='tower-burst-turret']";
    case 'BLASTTURRET':
      return "[data-tutorial='tower-blast-turret']";
    default:
      return "[data-tutorial='tower-selector']";
  }
};

const getTowerUnlockCalloutCopy = (towerType) => {
  const normalized = normalizeTowerType(towerType);
  const towerConfig = Object.values(TOWER_TYPES).find(
    (t) => normalizeTowerType(t.type) === normalized
  );
  const displayName = towerConfig?.displayName || formatTowerLabel(towerType);

  switch (normalized) {
    case 'VARIABLE':
      return {
        title: 'VARIABLE TOWER UNLOCKED',
        message:
          'Variables let you store values and reuse them. This tower is great when you need to name data before you compute with it.',
        subtext:
          'Use it when you want to hold a number, store a name, or keep track of values you will use later in the solution.',
      };
    case 'IFCONDITION':
    case 'CONDITIONAL':
      return {
        title: 'CONDITIONAL TOWER UNLOCKED',
        message:
          'Conditionals choose between paths. This tower helps when your code needs to do one thing in one case and a different thing in another.',
        subtext: 'Play it when the prompt includes words like if, else, choose, compare, or check.',
      };
    case 'FORLOOP':
    case 'LOOP':
      return {
        title: 'FOR LOOP TOWER UNLOCKED',
        message:
          'Loops repeat actions across data. This tower is strongest when the problem asks you to process many items in sequence.',
        subtext: 'Use it when you need to iterate through a list, range, or repeated set of steps.',
      };
    case 'FUNCTION':
      return {
        title: 'BOILERPLATE CORE UNLOCKED',
        message:
          'Boilerplate Cores package logic into reusable blocks. This tower fits problems where you want named behavior you can call more than once.',
        subtext: 'Use it when you are organizing solution steps into clean, reusable chunks.',
      };
    case 'OBJECT':
      return {
        title: 'BOILERPLATE INSTANCE UNLOCKED',
        message:
          'Boilerplate Instances group related data and behavior. This tower is useful when a problem models entities with properties.',
        subtext: 'Use it when you need structured state instead of loose standalone values.',
      };
    default:
      return {
        title: `${displayName.toUpperCase()} UNLOCKED`,
        message: `New tactical option online: ${displayName}. Add this module when its programming concept matches what the mission is asking you to solve.`,
        subtext:
          'If the objective needs this concept, place the tower to reinforce the same idea in both code and defense.',
      };
  }
};

const toRectSnapshot = (rect) => {
  if (!rect) return null;

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
};

const getVisibleTargetElement = (selector) => {
  if (!selector || typeof document === 'undefined') return null;

  const candidates = Array.from(document.querySelectorAll(selector));
  if (!candidates.length) return null;

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    const style = window.getComputedStyle(candidate);
    const isVisible =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 1 &&
      rect.height > 1;

    if (isVisible) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
};

/**
 * Main Test Page Component
 */
export default function TowerDefenseV2Test({
  isDemo = false,
  demoTitleSlug = null,
  learningPathTitleSlug = null,
  learningPathSlug = null,
  learningPathOnboarding = false,
  learningTowerConfig = null,
  learningPathMeta = null,
  learningIsCapstone = false,
  embedded = false,
  embeddedBootSequenceActive = false,
  embeddedShellTheme = 'retro-desktop',
  allowEmbeddedHandheldPageScroll = false,
  onEmbeddedVictory = null,
  onEmbeddedLearningXp = null,
  onEmbeddedReady = null,
  onEmbeddedChatFocusChange = null,
  demoLaunchStartTime = null,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCompactLandscapeShellMode = useCompactLandscapeShellMode();
  const shouldAllowHandheldPageScroll =
    allowEmbeddedHandheldPageScroll || (!embedded && isCompactLandscapeShellMode);
  const { isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const guestSolveKeyRef = useRef(null);
  const guestSolveRecordedForWinRef = useRef(false);
  const trackedSurfaceKeyRef = useRef(null);
  const trackedProblemStartedKeyRef = useRef(null);
  const trackedProblemSolvedKeyRef = useRef(null);
  const clusterNavigation = useMemo(
    () => normalizeClusterNavigation(location.state?.clusterNavigation),
    [location.state?.clusterNavigation]
  );

  useEffect(() => {
    if (location.state?.clusterNavigation) return;

    const storedState = sessionStorage.getItem(TD_CLUSTER_NAVIGATION_STORAGE_KEY);
    if (!storedState) return;

    sessionStorage.removeItem(TD_CLUSTER_NAVIGATION_STORAGE_KEY);

    try {
      const parsedState = JSON.parse(storedState);
      const restoredClusterNavigation = normalizeClusterNavigation(parsedState?.clusterNavigation);
      if (!restoredClusterNavigation) return;

      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: {
          ...(location.state || {}),
          clusterNavigation: restoredClusterNavigation,
        },
      });
    } catch {
      // Ignore malformed stored state.
    }
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (location.state?.towerDefenseUiIntent !== 'open-settings') return;

    try {
      sessionStorage.setItem(TD_OPEN_SETTINGS_PENDING_KEY, '1');
    } catch {
      // Ignore storage access errors.
    }

    const dispatchTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('td-open-settings-menu'));
    }, 0);

    const restState = { ...(location.state || {}) };
    delete restState.towerDefenseUiIntent;
    const nextState = Object.keys(restState).length > 0 ? restState : null;

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: nextState,
    });

    return () => {
      window.clearTimeout(dispatchTimer);
    };
  }, [location.pathname, location.search, location.state, navigate]);

  // Signal to parent that the game component has mounted (chunks loaded, rendering)
  useEffect(() => {
    if (embedded && onEmbeddedReady) {
      onEmbeddedReady();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (embedded) return;
    if (!learningPathTitleSlug || learningPathOnboarding) return;
    const settings = audioManager.getSettings?.();
    if (settings?.musicEnabled === false) return;
    AudioService.initialize().then(() => {
      AudioService.playBackgroundMusic('random');
    });
  }, [embedded, learningPathOnboarding, learningPathTitleSlug]);
  // Treat embedded mode as isDemo — both should skip backend calls like
  // rate-limit checks and submission sync in the code editor.
  const effectiveIsDemo = isDemo || embedded;

  const {
    layout,
    language,
    gameState,
    codeSubmitted,
    code,
    gridCols,
    gridRows,
    codeSubmissionSuccess,
    playerLevel,
    initialCodeGenerated,
    functionTowerPlaced,
    objectTowerPlaced,
    isMultiProblemTower,
    problemTabs,
    activeProblemIndex,
    leftPanel,
    rightPanel,
    setLeftPanel,
    setRightPanel,
    lastTerminalCommand,
    learningPathOnboardingActive,
    setLearningPathOnboardingActive,
    verifyAttemptInProgress,
    problem,
    learningPathData,
    learningNodeId,
    showAdModal,
    setShowAdModal,
    showExecutionAdModal,
    setShowExecutionAdModal,
    executionAdOptions,
    executionRateLimit,
    selectedExecutionAd,
    selectedExecutionAdType,
    setSelectedExecutionAdType,
    isApplyingExecutionCredit,
    selectedTower,
    selectedTowerType,
    clearSelectedTower,
    handleExecutionAdComplete,
    handleWatchAdForRefinement,
    gameStats,
    showSuccessModal,
    setShowSuccessModal,
    handleEnterEndlessMode,
    learningNextNode,
    handleContinueLearning,
    handleReturnToMap,
    problemError,
  } = useTowerDefenseV2PageState({
    isDemo: effectiveIsDemo,
    demoTitleSlug,
    learningPathTitleSlug,
    learningPathSlug,
    learningPathOnboarding,
    learningTowerConfig,
    learningPathMeta,
    learningIsCapstone,
    embeddedShellTheme,
    allowEmbeddedHandheldPageScroll: shouldAllowHandheldPageScroll,
    desktopShellSizingMode: embedded ? 'embedded' : 'standalone',
    onEmbeddedVictory,
    onEmbeddedLearningXp,
    demoLaunchStartTime,
  });

  const toast = useToast();
  const isLearningMode = Boolean(learningPathTitleSlug || learningPathOnboarding);
  const [isGuestSignupWallOpen, setIsGuestSignupWallOpen] = useState(false);
  const [proOnboardingDismissed, setProOnboardingDismissed] = useState(false);
  const shouldBlockHomepageOnboarding =
    embedded && learningPathOnboarding && Boolean(embeddedBootSequenceActive);
  const isGuestProTrack = !isAuthenticated && guestCtx?.progress?.pathChoice === 'pro';
  const shouldShowProOnboarding = !learningPathOnboarding && !isLearningMode && isGuestProTrack;
  const proOnboardingActive = shouldShowProOnboarding && !proOnboardingDismissed;
  const isSinglePanelMobileLayout = !rightPanel;
  const pageShellLayout = useMemo(
    () => resolveTowerDefensePageShellLayout({ isCompactLandscapeShellMode }),
    [isCompactLandscapeShellMode]
  );

  useEffect(() => {
    if (!embedded || typeof onEmbeddedChatFocusChange !== 'function') return;

    const isNonGameSinglePanelFocus =
      isSinglePanelMobileLayout && Boolean(leftPanel) && leftPanel !== PANEL_TYPES.GAME;
    onEmbeddedChatFocusChange(isNonGameSinglePanelFocus);
  }, [embedded, isSinglePanelMobileLayout, leftPanel, onEmbeddedChatFocusChange]);

  useEffect(() => {
    if (!embedded || typeof onEmbeddedChatFocusChange !== 'function') return undefined;

    return () => {
      onEmbeddedChatFocusChange(false);
    };
  }, [embedded, onEmbeddedChatFocusChange]);

  useEffect(() => {
    setProOnboardingDismissed(false);
  }, [shouldShowProOnboarding, problem?.titleSlug]);

  useEffect(() => {
    if (embedded || isDemo || !isAuthenticated) return;

    const surface = isLearningMode ? 'learning_td' : 'tower_defense';
    const area = isLearningMode ? 'learning' : 'interview';
    const problemSlug = problem?.titleSlug || learningPathTitleSlug || demoTitleSlug || null;
    const pathId = learningPathMeta?.pathId || learningPathSlug || null;
    const nodeId = learningPathMeta?.nodeId || null;
    const clusterId = clusterNavigation?.clusterId || null;
    const entrySource = isLearningMode ? 'learning_map' : clusterId ? 'cluster_detail' : 'direct';

    if (!problemSlug && !pathId) return;

    const key = `${surface}:${problemSlug || ''}:${pathId || ''}:${nodeId || ''}:${clusterId || ''}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area,
      surface,
      entrySource,
      ...(problemSlug ? { problemSlug } : {}),
      ...(pathId ? { pathId } : {}),
      ...(nodeId ? { nodeId } : {}),
      ...(clusterId ? { clusterId } : {}),
    });
  }, [
    clusterNavigation?.clusterId,
    demoTitleSlug,
    embedded,
    isAuthenticated,
    isDemo,
    isLearningMode,
    learningPathMeta?.nodeId,
    learningPathMeta?.pathId,
    learningPathSlug,
    learningPathTitleSlug,
    problem?.titleSlug,
  ]);

  useEffect(() => {
    if (embedded || isDemo || !isAuthenticated || isLearningMode) return;
    if (!codeSubmitted || !problem?.titleSlug) return;

    const key = String(problem.titleSlug);
    if (trackedProblemStartedKeyRef.current === key) return;

    trackedProblemStartedKeyRef.current = key;
    void trackUserContentEvent('user_problem_started', {
      area: 'interview',
      surface: 'tower_defense',
      entrySource: clusterNavigation?.clusterId ? 'cluster_detail' : 'direct',
      problemSlug: key,
      ...(clusterNavigation?.clusterId ? { clusterId: clusterNavigation.clusterId } : {}),
    });
  }, [
    clusterNavigation?.clusterId,
    codeSubmitted,
    embedded,
    isAuthenticated,
    isDemo,
    isLearningMode,
    problem?.titleSlug,
  ]);

  useEffect(() => {
    if (embedded || isDemo || !isAuthenticated || isLearningMode) return;
    if (gameState?.status !== 'level-complete' || codeSubmissionSuccess !== true) return;
    if (!problem?.titleSlug) return;

    const key = String(problem.titleSlug);
    if (trackedProblemSolvedKeyRef.current === key) return;

    trackedProblemSolvedKeyRef.current = key;
    void trackUserContentEvent('user_problem_solved', {
      area: 'interview',
      surface: 'tower_defense',
      entrySource: clusterNavigation?.clusterId ? 'cluster_detail' : 'direct',
      problemSlug: key,
      ...(clusterNavigation?.clusterId ? { clusterId: clusterNavigation.clusterId } : {}),
    });
  }, [
    clusterNavigation?.clusterId,
    codeSubmissionSuccess,
    embedded,
    gameState?.status,
    isAuthenticated,
    isDemo,
    isLearningMode,
    problem?.titleSlug,
  ]);

  useEffect(() => {
    if (!problemError) return;
    if (typeof toast.isActive === 'function' && toast.isActive('td-problem-load-failed')) {
      return;
    }

    toast({
      id: 'td-problem-load-failed',
      title: 'Problem unavailable',
      description: 'We could not load this tower defense problem right now. Please try again.',
      status: 'warning',
      duration: 3200,
      isClosable: true,
      position: 'top',
    });
  }, [problemError, toast]);

  useEffect(() => {
    if (embedded || isDemo || isAuthenticated) return;
    if (!guestCtx) return;

    const currentStatus = gameState?.status;
    const problemSlug = problem?.titleSlug;
    const isSolvedWin =
      currentStatus === 'level-complete' && codeSubmissionSuccess === true && Boolean(problemSlug);

    if (!isSolvedWin) {
      guestSolveKeyRef.current = null;
      guestSolveRecordedForWinRef.current = false;
      return;
    }

    if (guestSolveRecordedForWinRef.current) return;
    guestSolveRecordedForWinRef.current = true;

    if (guestSolveKeyRef.current === problemSlug) return;
    guestSolveKeyRef.current = problemSlug;

    guestCtx.recordProblemAttempt?.(problemSlug);
    guestCtx.recordProblemSolved?.(problemSlug, {
      difficulty: problem?.difficulty || 'easy',
      source: isLearningMode ? 'learning-tower-defense' : 'tower-defense',
    });
  }, [
    codeSubmissionSuccess,
    embedded,
    gameState?.status,
    guestCtx,
    isAuthenticated,
    isDemo,
    isLearningMode,
    problem?.difficulty,
    problem?.titleSlug,
  ]);
  const suppressHomeHelloUnlockToast =
    embedded && learningPathOnboarding && learningPathTitleSlug === 'lp-m0-td-hello-print';
  const { activeOverlay, dismissOverlay } = useLearningWaveOverlays({
    learningPathData,
    learningNodeId,
    gameState,
    allowEmbeddedHandheldPageScroll: shouldAllowHandheldPageScroll,
  });
  const { activeEnemyReveal, dismissEnemyReveal } = useEnemyRevealOverlay({
    gameState,
    playerLevel,
    disabled: learningPathOnboarding,
  });
  const towerUnlockCalloutRef = useRef(null);
  const moduleOneToastUntilRef = useRef(0);
  const moduleOneToastTimerRef = useRef(null);
  const [towerUnlockCalloutQueue, setTowerUnlockCalloutQueue] = useState([]);
  const [activeTowerUnlockCallout, setActiveTowerUnlockCallout] = useState(null);
  const [towerUnlockTargetRect, setTowerUnlockTargetRect] = useState(null);

  useEffect(() => {
    if (!isMultiProblemTower) return;
    if (!learningPathMeta?.nodeId || learningPathMeta.nodeId !== 'py-m1-tower') return;
    const storageKey = `td_multi_problem_onboarding_seen_${learningPathMeta.nodeId}_v2`;
    try {
      if (localStorage.getItem(storageKey)) return;
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore storage errors.
    }

    moduleOneToastUntilRef.current = Date.now() + 7600;
    if (moduleOneToastTimerRef.current) {
      clearTimeout(moduleOneToastTimerRef.current);
    }
    moduleOneToastTimerRef.current = setTimeout(() => {
      moduleOneToastUntilRef.current = 0;
      moduleOneToastTimerRef.current = null;
    }, 7600);

    toast({
      title: 'Module 1: Multi-problem tower defense',
      description:
        'You have multiple problems on a single map. Solve all tabs to finish. Code your towers or place towers to generate AI code, and use the AI assistant if you get stuck.',
      status: 'info',
      duration: 7000,
      isClosable: true,
      position: 'top',
      render: ({ onClose }) => (
        <Box
          bg="rgba(5, 10, 20, 0.95)"
          border="1px solid rgba(0, 255, 140, 0.45)"
          borderRadius="12px"
          p={4}
          color="white"
          boxShadow="0 0 18px rgba(0, 255, 140, 0.3)"
          maxW="360px"
        >
          <Text fontFamily="'Orbitron', sans-serif" fontSize="sm" color="#00ff8c" mb={2}>
            Module 1: Multi-problem tower defense
          </Text>
          <Text fontSize="sm" color="gray.200">
            Use the tabs on the editor/problem slots to see the different problems and your
            different solutions. You have multiple problems on one map. Solve every tab to finish.
            You can write code to generate towers or place towers to get AI-generated code. If you
            get stuck, use the AI assistant. When you verify your solution before final wave, we
            will check both problems automatically for you.
          </Text>
          <Text
            mt={3}
            fontSize="xs"
            color="#00ccff"
            cursor="pointer"
            onClick={() => {
              moduleOneToastUntilRef.current = 0;
              if (moduleOneToastTimerRef.current) {
                clearTimeout(moduleOneToastTimerRef.current);
                moduleOneToastTimerRef.current = null;
              }
              onClose();
            }}
          >
            Got it
          </Text>
        </Box>
      ),
    });
  }, [isMultiProblemTower, learningPathMeta?.nodeId, toast]);

  useEffect(() => {
    if (!isLearningMode) return;
    if (suppressHomeHelloUnlockToast) return;
    if (!learningPathData || !learningNodeId) return;

    const onboardingId = String(learningTowerConfig?.onboardingId || '');
    const isModuleZeroUnlock =
      onboardingId.startsWith('lp-m0-') || String(learningNodeId).toLowerCase().includes('m0-');
    if (isModuleZeroUnlock) return;

    const allowedTowers = Array.isArray(learningTowerConfig?.allowedTowers)
      ? learningTowerConfig.allowedTowers.filter(Boolean)
      : [];
    if (!allowedTowers.length) return;

    const modules = Array.isArray(learningPathData?.modules) ? learningPathData.modules : [];
    const orderedNodes = modules.flatMap((module) =>
      Array.isArray(module?.nodes)
        ? module.nodes.map((node) => ({ ...node, moduleId: module.moduleId }))
        : []
    );

    const currentIndex = orderedNodes.findIndex((node) => node.nodeId === learningNodeId);
    if (currentIndex === -1) return;

    let previousAllowed = [];
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const allowed = orderedNodes[i]?.content?.towerConfig?.allowedTowers;
      if (Array.isArray(allowed) && allowed.length) {
        previousAllowed = allowed;
        break;
      }
    }

    const previousSet = new Set(previousAllowed.map(normalizeTowerType));
    const newlyUnlocked = allowedTowers.filter(
      (tower) => !previousSet.has(normalizeTowerType(tower))
    );
    if (!newlyUnlocked.length) return;

    const calloutKey = `${learningNodeId}:${newlyUnlocked.map(normalizeTowerType).join('|')}`;
    if (towerUnlockCalloutRef.current === calloutKey) return;
    towerUnlockCalloutRef.current = calloutKey;

    const nextCallouts = newlyUnlocked.map((tower, index) => {
      const copy = getTowerUnlockCalloutCopy(tower);
      return {
        id: `unlock-${learningNodeId}-${normalizeTowerType(tower)}-${index}`,
        kind: 'callout',
        title: copy.title,
        message: copy.message,
        subtext: copy.subtext,
        placement: 'right',
        targetSelector: getTowerUnlockTargetSelector(tower),
      };
    });

    const focusAndQueueCallouts = () => {
      setLeftPanel?.(PANEL_TYPES.GAME);
      setTowerUnlockCalloutQueue((currentQueue) => [...currentQueue, ...nextCallouts]);
    };

    const delayMs = Math.max(0, moduleOneToastUntilRef.current - Date.now());

    if (delayMs > 0) {
      const timeoutId = setTimeout(focusAndQueueCallouts, delayMs);
      return () => clearTimeout(timeoutId);
    }

    focusAndQueueCallouts();
    return undefined;
  }, [
    isLearningMode,
    suppressHomeHelloUnlockToast,
    learningPathData,
    learningNodeId,
    learningTowerConfig?.allowedTowers,
    learningTowerConfig?.onboardingId,
    setLeftPanel,
  ]);

  useEffect(() => {
    if (activeTowerUnlockCallout || !towerUnlockCalloutQueue.length) return;

    const [nextCallout, ...remainingCallouts] = towerUnlockCalloutQueue;
    setActiveTowerUnlockCallout(nextCallout);
    setTowerUnlockCalloutQueue(remainingCallouts);
  }, [activeTowerUnlockCallout, towerUnlockCalloutQueue]);

  useEffect(() => {
    if (!activeTowerUnlockCallout?.targetSelector) {
      setTowerUnlockTargetRect(null);
      return undefined;
    }

    const updateTargetRect = () => {
      const targetElement = getVisibleTargetElement(activeTowerUnlockCallout.targetSelector);
      setTowerUnlockTargetRect(
        targetElement ? toRectSnapshot(targetElement.getBoundingClientRect()) : null
      );
    };

    updateTargetRect();
    const intervalId = window.setInterval(updateTargetRect, 250);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [activeTowerUnlockCallout]);

  useEffect(() => {
    if (!activeTowerUnlockCallout) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActiveTowerUnlockCallout(null);
    }, TOWER_UNLOCK_CALLOUT_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeTowerUnlockCallout]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleSnippetEvent = (event) => {
      const detail = event?.detail || {};
      if (detail.status === 'cleared') {
        toast.close('td-mobile-snippet-ready');
        return;
      }
      if (detail.status !== 'pending') return;

      const editorVisible = leftPanel === PANEL_TYPES.EDITOR || rightPanel === PANEL_TYPES.EDITOR;
      if (editorVisible) return;
      if (typeof toast.isActive === 'function' && toast.isActive('td-mobile-snippet-ready')) {
        return;
      }

      const tabLabel =
        problemTabs?.[activeProblemIndex]?.title || `Problem ${activeProblemIndex + 1}`;
      toast({
        id: 'td-mobile-snippet-ready',
        title: 'Snippet generated',
        description: `Snippet added to ${tabLabel}. Open the Editor to review.`,
        status: 'info',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    };

    window.addEventListener('td-snippet-review', handleSnippetEvent);
    return () => {
      window.removeEventListener('td-snippet-review', handleSnippetEvent);
    };
  }, [activeProblemIndex, leftPanel, problemTabs, rightPanel, toast]);

  // console.log(
  //   `[TowerDefenseV2Page] RENDER TICK. isDemo=${isDemo}, problem=${!!problem}, problemError=${!!problemError}, problemLoading=${!problem && !problemError}`
  // );

  const gameContent = (
    <>
      <TowerDefenseV2Modals
        showAdModal={showAdModal}
        onCloseAdModal={() => setShowAdModal(false)}
        onWatchAdComplete={handleWatchAdForRefinement}
        showExecutionAdModal={showExecutionAdModal}
        onCloseExecutionAdModal={() => setShowExecutionAdModal(false)}
        onExecutionAdComplete={handleExecutionAdComplete}
        executionAdOptions={executionAdOptions}
        executionRateLimit={executionRateLimit}
        selectedExecutionAd={selectedExecutionAd}
        selectedExecutionAdType={selectedExecutionAdType}
        onExecutionAdTypeChange={setSelectedExecutionAdType}
        isApplyingExecutionCredit={isApplyingExecutionCredit}
        gameStats={gameStats}
        showSuccessModal={showSuccessModal}
        onCloseSuccessModal={() => setShowSuccessModal(false)}
        problem={problem}
        onEnterEndlessMode={handleEnterEndlessMode}
        isLearningMode={isLearningMode}
        learningNextNode={learningNextNode}
        onContinueLearning={() => {
          setShowSuccessModal(false);
          handleContinueLearning?.();
        }}
        onReturnToMap={() => {
          setShowSuccessModal(false);
          handleReturnToMap?.();
        }}
        clusterNavigation={clusterNavigation}
        onGuestSignupWallRequested={() => {
          setShowSuccessModal(false);
          setIsGuestSignupWallOpen(true);
        }}
      />

      <GuestSignupWall
        isOpen={isGuestSignupWallOpen}
        onClose={() => setIsGuestSignupWallOpen(false)}
        activitySummary={guestCtx?.activitySummary}
        trialTrack={isLearningMode ? 'beginner' : 'pro'}
      />

      {learningPathOnboarding ? (
        <>
          {layout}
          <LearningPathTowerDefenseOnboarding
            isActive={learningPathOnboardingActive && !shouldBlockHomepageOnboarding}
            onComplete={() => setLearningPathOnboardingActive(false)}
            gameState={gameState}
            code={code}
            gridCols={gridCols}
            gridRows={gridRows}
            codeSubmitted={codeSubmitted}
            verifyAttemptInProgress={verifyAttemptInProgress}
            initialCodeGenerated={initialCodeGenerated}
            functionTowerPlaced={functionTowerPlaced}
            objectTowerPlaced={objectTowerPlaced}
            selectedTower={selectedTower}
            selectedTowerType={selectedTowerType}
            language={language}
            surfaceVariant={embedded ? 'homepage' : 'learning'}
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            setLeftPanel={setLeftPanel}
            setRightPanel={setRightPanel}
            onClearSelectedTower={clearSelectedTower}
            lastTerminalCommand={lastTerminalCommand}
            onboardingId={learningTowerConfig?.onboardingId || null}
            conceptIntro={learningTowerConfig?.conceptIntro || null}
          />
        </>
      ) : shouldShowProOnboarding ? (
        <>
          {layout}
          <LearningPathTowerDefenseOnboarding
            isActive={proOnboardingActive && !activeEnemyReveal}
            onComplete={() => setProOnboardingDismissed(true)}
            gameState={gameState}
            code={code}
            gridCols={gridCols}
            gridRows={gridRows}
            codeSubmitted={codeSubmitted}
            verifyAttemptInProgress={verifyAttemptInProgress}
            initialCodeGenerated={initialCodeGenerated}
            functionTowerPlaced={functionTowerPlaced}
            objectTowerPlaced={objectTowerPlaced}
            selectedTower={selectedTower}
            selectedTowerType={selectedTowerType}
            language={language}
            surfaceVariant="pro"
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            setLeftPanel={setLeftPanel}
            setRightPanel={setRightPanel}
            onClearSelectedTower={clearSelectedTower}
            lastTerminalCommand={lastTerminalCommand}
            onboardingId={null}
            conceptIntro={null}
          />
        </>
      ) : isLearningMode ? (
        <>
          {layout}
          <LearningWaveOverlay overlay={activeOverlay} onDismiss={dismissOverlay} />
        </>
      ) : (
        layout
      )}

      {/* Enemy reveal overlay — shown in ALL game modes */}
      <EnemyRevealOverlay
        reveal={activeEnemyReveal}
        onDismiss={dismissEnemyReveal}
        preferMobileLayout={isSinglePanelMobileLayout}
      />

      <InvalidPlacementOverlay />

      {activeTowerUnlockCallout && typeof document !== 'undefined'
        ? createPortal(
            <TowerDefenseOnboardingOverlay
              step={activeTowerUnlockCallout}
              targetRect={towerUnlockTargetRect}
              onCompleteStep={() => setActiveTowerUnlockCallout(null)}
            />,
            document.body
          )
        : null}
    </>
  );

  if (embedded) {
    return gameContent;
  }

  const topBanner = (
    <Box
      width="100%"
      maxWidth="728px"
      mx="auto"
      mt={pageShellLayout.topBannerWrapper.mt}
      mb={pageShellLayout.topBannerWrapper.mb}
    >
      <TopBannerAd
        slotId={adSlots.gamesLanding.top}
        adHeight={pageShellLayout.bannerHeight}
        wrapperMb={pageShellLayout.topBannerProps.wrapperMb}
      />
    </Box>
  );

  const bottomBanner = (
    <Box
      width="100%"
      maxWidth="728px"
      mx="auto"
      mt={pageShellLayout.bottomBannerWrapper.mt}
      mb={pageShellLayout.bottomBannerWrapper.mb}
      pb={pageShellLayout.bottomBannerWrapper.pb}
    >
      <BottomBannerAd
        slotId={adSlots.gamesLanding.bottom}
        adHeight={pageShellLayout.bannerHeight}
        wrapperMt={pageShellLayout.bottomBannerProps.wrapperMt}
        wrapperMb={pageShellLayout.bottomBannerProps.wrapperMb}
      />
    </Box>
  );

  const middleStage = pageShellLayout.middleStage ? (
    <Box
      flex={pageShellLayout.middleStage.flex}
      minH={pageShellLayout.middleStage.minH}
      display={pageShellLayout.middleStage.display}
      flexDirection={pageShellLayout.middleStage.flexDirection}
      sx={pageShellLayout.middleStage.cssVars}
    >
      {gameContent}
    </Box>
  ) : (
    gameContent
  );

  return (
    <PageContainer>
      {pageShellLayout.pageFrame ? (
        <Flex direction="column" minH={pageShellLayout.pageFrame.minH}>
          {topBanner}
          {middleStage}
          {bottomBanner}
        </Flex>
      ) : (
        <>
          {topBanner}
          {middleStage}
          {bottomBanner}
        </>
      )}
    </PageContainer>
  );
}
