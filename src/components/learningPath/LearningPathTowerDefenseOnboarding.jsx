import { Box, Text } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import audioManager from '../../utils/audio/AudioManager';
import AudioService from '../../utils/audio/AudioService';
import useGhostText from '../../hooks/monaco/useGhostText';
import { buildResponsiveProfile } from '../../utils/web/responsiveProfile';
import { PANEL_TYPES } from '../towerDefense/ui/layout/panelTypes';
import useTowerDefenseOnboardingController from '../towerDefense/onboarding/useTowerDefenseOnboardingController';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';
import { writeTowerDefenseShellVisible } from '../../utils/ui/towerDefenseShellVisibility';
import {
  HOMEPAGE_DEMO_ONBOARDING_COMPLETE_KEY,
  PRO_TRIAL_ONBOARDING_COMPLETE_KEY,
  TD_FOUNDATION_ONBOARDING_COMPLETE_KEY,
  TD_JACK_IN_CALLOUT_SEEN_KEY,
} from '../towerDefense/onboarding/onboardingStorageKeys';
import {
  getHomepageDemoOnboardingScript,
  getLearningPathOnboardingScript,
  getProTrialOnboardingScript,
} from '../towerDefense/onboarding/towerDefenseOnboardingScripts';
import {
  resolveInlineOnboardingSurface,
  TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT,
  TD_ONBOARDING_STEP_CHANGE_EVENT,
} from '../towerDefense/onboarding/inlineOnboardingEvents';
import TowerDefenseOnboardingOverlay from '../towerDefense/onboarding/TowerDefenseOnboardingOverlay';
import UniverseRulesOverlay from '../towerDefense/onboarding/UniverseRulesOverlay';

const ONBOARDING_STYLES = `
body.td-onboarding-lock-active {
  pointer-events: none !important;
}

body.td-onboarding-lock-active [data-td-onboarding-target-kind],
body.td-onboarding-lock-active [data-td-onboarding-scrollable],
body.td-onboarding-lock-active [data-td-onboarding-portal],
body.td-onboarding-lock-active [data-tutorial='game-grid'],
body.td-onboarding-lock-active [data-tutorial^='tower-'],
body.td-onboarding-lock-active [data-learning='terminal-input'],
body.td-onboarding-lock-active .chakra-modal__content-container,
body.td-onboarding-lock-active #chakra-toast-portal,
body.td-onboarding-lock-active .monaco-editor,
body.td-onboarding-lock-active .monaco-editor * {
  pointer-events: auto !important;
}

body.td-onboarding-lock-active .Resizer,
body.td-onboarding-lock-active .split-pane-resizer,
body.td-onboarding-lock-active [role="separator"] {
  pointer-events: none !important;
}

/* Ghost text glow — pulses Monaco inline-completion decorations */
@keyframes td-ghost-glow {
  0%, 100% { text-shadow: 0 0 3px rgba(10,60,166,0.16); }
  50%      { text-shadow: 0 0 10px rgba(10,60,166,0.42), 0 0 18px rgba(10,60,166,0.18); filter: brightness(1.08); }
}
body[data-td-onboarding="write-code"] .monaco-editor .ghost-text-decoration,
body[data-td-onboarding="write-code"] .monaco-editor .ghost-text,
body[data-td-onboarding="write-code"] .monaco-editor .suggest-preview-text {
  animation: td-ghost-glow 2s ease-in-out infinite !important;
}

@keyframes td-button-target-pulse {
  0%, 100% {
    transform: translateZ(0) scale(1);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 2px rgba(0,255,140,0.88),
      0 0 14px rgba(0,255,140,0.35);
    filter: brightness(1);
  }
  35% {
    transform: translate3d(0, -2px, 0) scale(1.045);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 3px rgba(0,255,140,1),
      0 0 22px rgba(0,255,140,0.55);
    filter: brightness(1.08);
  }
  70% {
    transform: translate3d(0, 1px, 0) scale(0.995);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 2px rgba(0,255,140,0.92),
      0 0 16px rgba(0,255,140,0.42);
    filter: brightness(1.02);
  }
}

[data-td-onboarding-target-kind="button"] {
  position: relative;
  z-index: 3;
  transform-origin: center;
  animation: td-button-target-pulse 1.25s cubic-bezier(0.34, 1.56, 0.64, 1) infinite !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease;
}

[data-td-onboarding-target-kind="button"]:disabled,
[data-td-onboarding-target-kind="button"][aria-disabled="true"] {
  opacity: 1 !important;
}

@keyframes td-tower-target-pulse {
  0%, 100% {
    transform: translateZ(0) scale(1);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 2px rgba(0,255,140,0.84),
      0 0 12px rgba(0,255,140,0.3);
    filter: brightness(1);
  }
  50% {
    transform: translateZ(0) scale(1.01);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 2px rgba(0,255,140,1),
      0 0 16px rgba(0,255,140,0.45);
    filter: brightness(1.04);
  }
}

[data-td-onboarding-target-kind="tower"] {
  position: relative;
  z-index: 3;
  animation: td-tower-target-pulse 1.4s ease-in-out infinite !important;
  outline: 2px solid rgba(0,255,140,0.88) !important;
}

[data-td-onboarding-target-kind="tower"]::before {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 0;
  border: 1px solid rgba(255,255,255,0.82);
  pointer-events: none;
}

@keyframes td-taskbar-target-pulse {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.76),
      inset -1px -1px 0 rgba(104,104,104,0.3),
      0 0 0 3px rgba(0,255,140,0.52),
      0 0 0 6px rgba(255,255,255,0.12),
      0 0 18px rgba(0,255,140,0.3);
    filter: brightness(1);
  }
  40% {
    transform: translate3d(0, -3px, 0) scale(1.01);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.82),
      inset -1px -1px 0 rgba(104,104,104,0.34),
      0 0 0 3px rgba(0,255,140,0.85),
      0 0 0 7px rgba(255,255,255,0.18),
      0 0 24px rgba(0,255,140,0.5);
    filter: brightness(1.05);
  }
  75% {
    transform: translate3d(0, 1px, 0) scale(0.998);
    box-shadow:
      inset 1px 1px 0 rgba(255,255,255,0.78),
      inset -1px -1px 0 rgba(104,104,104,0.32),
      0 0 0 3px rgba(0,255,140,0.65),
      0 0 0 6px rgba(255,255,255,0.14),
      0 0 20px rgba(0,255,140,0.38);
    filter: brightness(1.02);
  }
}

[data-td-onboarding-target-kind="taskbar"] {
  position: relative;
  z-index: 3;
  transform-origin: center bottom;
  animation: td-taskbar-target-pulse 1.45s cubic-bezier(0.34, 1.56, 0.64, 1) infinite !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease;
}
`;

const TD_MOBILE_OPEN_LOADOUT_EVENT = 'td-mobile-open-loadout';
const TD_MOBILE_LOADOUT_OPENED_EVENT = 'td-mobile-loadout-opened';
const TD_MOBILE_COLLAPSE_UI_EVENT = 'td-mobile-collapse-ui';
const TD_MOBILE_OPEN_TOWER_DETAILS_EVENT = 'td-mobile-open-tower-details';
const TD_MOBILE_LOADOUT_RETRY_INTERVAL_MS = 130;
const TD_MOBILE_LOADOUT_MAX_RETRIES = 9;
const TD_MOBILE_TARGET_SCROLL_RETRY_INTERVAL_MS = 220;
const TD_MOBILE_TARGET_SCROLL_MAX_RETRIES = 10;
const TD_MOBILE_CALLOUT_SAFE_TOP_PX = 126;
const TD_MOBILE_CALLOUT_SAFE_BOTTOM_PX = 18;
const TD_DESKTOP_INSPECT_ADVANCE_DELAY_MS = 600;
const TD_MOBILE_INSPECT_ADVANCE_DELAY_MS = 1200;
const TD_DESKTOP_SLOT_SWITCH_ADVANCE_DELAY_MS = 2800;
const TD_MOBILE_SLOT_SWITCH_ADVANCE_DELAY_MS = TD_DESKTOP_SLOT_SWITCH_ADVANCE_DELAY_MS + 900;
const TD_FUNCTION_INSPECT_STEP_ID = 'inspect-function-tower';
const TD_SLOT_SWITCH_STEP_ID = 'interwave-slot-switch-assign';

const isSlotSwitchStepId = (id) => String(id || '').startsWith('interwave-slot-switch');
const TD_START_WAVE_STEP_ID = 'start-wave';
const TD_LIFE_LOSS_STEP_ID = 'life-loss-warning';

const shouldOpenMobileLoadoutForStep = (step) => {
  return false;
};

const shouldCollapseMobileUiForStep = (step) => {
  if (!step) return false;

  const stepId = String(step.id || '');
  const targetSelector = String(step.targetSelector || '');

  return (
    stepId === TD_LIFE_LOSS_STEP_ID ||
    stepId === 'place-function-tower' ||
    stepId === 'interwave-place-non-code' ||
    targetSelector.includes("[data-tutorial='game-grid']") ||
    targetSelector.includes('[data-tutorial="game-grid"]') ||
    targetSelector.includes("[data-tutorial='lives-display']") ||
    targetSelector.includes('[data-tutorial="lives-display"]')
  );
};

const isPanelSwitcherTargetSelector = (targetSelector) =>
  typeof targetSelector === 'string' &&
  (targetSelector.includes("[data-tutorial-role='panel-switcher']") ||
    targetSelector.includes('[data-tutorial-role="panel-switcher"]') ||
    targetSelector.includes("[data-tutorial='slot-switch-taskbar']") ||
    targetSelector.includes('[data-tutorial="slot-switch-taskbar"]') ||
    targetSelector.includes("[data-tutorial='slot-side-badges']") ||
    targetSelector.includes('[data-tutorial="slot-side-badges"]'));

const detectMobileSinglePanelLayout = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const getVisibleTargetElement = (selector) => {
  const candidates = Array.from(document.querySelectorAll(selector));
  if (!candidates.length) return null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const scoredCandidates = candidates
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const visibleWidth = Math.max(
        0,
        Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
      );
      const visibleHeight = Math.max(
        0,
        Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
      );
      const visibleArea = visibleWidth * visibleHeight;

      return {
        element,
        rect,
        visibleArea,
        isRenderable:
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden' &&
          computedStyle.opacity !== '0' &&
          rect.width > 1 &&
          rect.height > 1,
      };
    })
    .filter((candidate) => candidate.isRenderable)
    .sort(
      (leftCandidate, rightCandidate) => rightCandidate.visibleArea - leftCandidate.visibleArea
    );

  return scoredCandidates[0]?.element ?? candidates[0] ?? null;
};

const getOnboardingTargetKind = (element) => {
  if (!element) return false;

  const tagName = String(element.tagName || '').toLowerCase();
  if (tagName === 'button') return 'button';

  const role = String(element.getAttribute?.('role') || '').toLowerCase();
  if (role === 'button') return 'button';

  const tutorialRole = String(element.getAttribute?.('data-tutorial-role') || '').toLowerCase();
  if (tutorialRole === 'panel-switcher') return 'button';

  const tutorialId = String(element.getAttribute?.('data-tutorial') || '').toLowerCase();
  if (tutorialId === 'slot-switch-taskbar') return 'taskbar';
  if (tutorialId.startsWith('tower-')) return 'tower';

  return 'target';
};

const findScrollableAncestor = (element) => {
  if (!element || !element.parentElement) return null;
  let current = element.parentElement;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
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

const areRectSnapshotsEqual = (leftRect, rightRect) => {
  if (!leftRect && !rightRect) return true;
  if (!leftRect || !rightRect) return false;

  const tolerance = 0.5;
  return (
    Math.abs(leftRect.top - rightRect.top) <= tolerance &&
    Math.abs(leftRect.right - rightRect.right) <= tolerance &&
    Math.abs(leftRect.bottom - rightRect.bottom) <= tolerance &&
    Math.abs(leftRect.left - rightRect.left) <= tolerance &&
    Math.abs(leftRect.width - rightRect.width) <= tolerance &&
    Math.abs(leftRect.height - rightRect.height) <= tolerance
  );
};

const isTargetCenteredInSafeViewport = (element) => {
  if (!element || typeof window === 'undefined') return false;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const safeTop = detectMobileSinglePanelLayout() ? TD_MOBILE_CALLOUT_SAFE_TOP_PX : 72;
  const safeBottom = detectMobileSinglePanelLayout() ? TD_MOBILE_CALLOUT_SAFE_BOTTOM_PX : 48;
  const safeBottomEdge = viewportHeight - safeBottom;

  if (rect.width <= 1 || rect.height <= 1) return false;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const centerVisible =
    centerX >= 0 && centerX <= viewportWidth && centerY >= safeTop && centerY <= safeBottomEdge;
  const intersectsSafeZone = rect.bottom > safeTop && rect.top < safeBottomEdge;

  return centerVisible && intersectsSafeZone;
};

const shouldAutoScrollTargetIntoView = (step, isMobileSinglePanelLayout) => {
  if (!step?.targetSelector) return false;

  if (isMobileSinglePanelLayout) {
    return true;
  }

  const stepId = String(step.id || '');
  const targetSelector = String(step.targetSelector || '');

  return (
    stepId === TD_SLOT_SWITCH_STEP_ID ||
    stepId === TD_START_WAVE_STEP_ID ||
    isSlotSwitchStepId(stepId) ||
    targetSelector.includes("[data-tutorial='slot-switch-taskbar']") ||
    targetSelector.includes('[data-tutorial="slot-switch-taskbar"]') ||
    targetSelector.includes("[data-tutorial='slot-side-badges']") ||
    targetSelector.includes('[data-tutorial="slot-side-badges"]') ||
    targetSelector.includes("[data-tutorial='game-start-wave-button']") ||
    targetSelector.includes('[data-tutorial="game-start-wave-button"]')
  );
};

const getSelectedTutorialTowerType = () => {
  if (typeof document === 'undefined') return null;

  const selectedTower = document.querySelector("[data-tutorial^='tower-'][data-selected='true']");
  const tutorialTarget = selectedTower?.getAttribute('data-tutorial');

  if (!tutorialTarget?.startsWith('tower-')) {
    return null;
  }

  return tutorialTarget.replace('tower-', '').toUpperCase();
};

const isFunctionTowerSelectedForInspection = (tower) =>
  String(tower?.type || tower?.towerType || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') === 'FUNCTION';

const isModuleZeroFullOnboarding = (onboardingId) =>
  typeof onboardingId === 'string' &&
  onboardingId.startsWith('lp-m0-') &&
  !onboardingId.endsWith('-brief');

/* ── Component ────────────────────────────────────────────────────────── */
const LearningPathTowerDefenseOnboarding = ({
  isActive,
  onComplete,
  gameState,
  codeSubmitted = false,
  verifyAttemptInProgress = false,
  initialCodeGenerated,
  functionTowerPlaced,
  objectTowerPlaced,
  selectedTower = null,
  selectedTowerType: propSelectedTowerType = null,
  language = 'python',
  code,
  onboardingId,
  conceptIntro,
  surfaceVariant = 'learning',
  leftPanel = null,
  rightPanel = null,
  setLeftPanel,
  setRightPanel,
  onClearSelectedTower,
  gridCols = 16,
  gridRows = 12,
  lastTerminalCommand = '',
}) => {
  const script = useMemo(() => {
    if (surfaceVariant === 'homepage') {
      return getHomepageDemoOnboardingScript(language);
    }

    if (surfaceVariant === 'pro') {
      return getProTrialOnboardingScript();
    }

    return getLearningPathOnboardingScript({
      onboardingId,
      conceptIntro,
      language,
      surfaceVariant,
    });
  }, [conceptIntro, language, onboardingId, surfaceVariant]);

  const storageKey = useMemo(() => {
    if (surfaceVariant === 'homepage') {
      return HOMEPAGE_DEMO_ONBOARDING_COMPLETE_KEY;
    }

    if (surfaceVariant === 'pro') {
      return PRO_TRIAL_ONBOARDING_COMPLETE_KEY;
    }

    return null;
  }, [surfaceVariant]);
  const musicRequestedRef = useRef(false);
  const [showGhostHint, setShowGhostHint] = useState(false);
  const [laserState, setLaserState] = useState(null);
  const [functionTowerLaserCompleted, setFunctionTowerLaserCompleted] = useState(false);
  const [logTowerLaserCompleted, setLogTowerLaserCompleted] = useState(false);
  const [onboardingDelayPassed, setOnboardingDelayPassed] = useState(false);

  useEffect(() => {
    if (functionTowerPlaced) {
      const timer = setTimeout(() => {
        setOnboardingDelayPassed(true);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setOnboardingDelayPassed(false);
    }
  }, [functionTowerPlaced]);
  const [editorCode, setEditorCode] = useState('');
  const [selectedTowerType, setSelectedTowerType] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [lifeLossCount, setLifeLossCount] = useState(0);
  const [slotSwitchInteractionCount, setSlotSwitchInteractionCount] = useState(0);
  const [slotSwitchLayoutChanged, setSlotSwitchLayoutChanged] = useState(false);
  const [slotSwitchBaselinePanels, setSlotSwitchBaselinePanels] = useState(null);
  const [towerInspectionRangeShown, setTowerInspectionRangeShown] = useState(false);
  const [towerInspectionDetailsOpened, setTowerInspectionDetailsOpened] = useState(false);
  const [towerInspectionAdvanceReady, setTowerInspectionAdvanceReady] = useState(false);
  const [slotSwitchAdvanceReady, setSlotSwitchAdvanceReady] = useState(false);
  const [slotSwitchSideClicked, setSlotSwitchSideClicked] = useState(false);
  const [isHomepageDemoVisible, setIsHomepageDemoVisible] = useState(true);
  const [isMobileSinglePanelLayout, setIsMobileSinglePanelLayout] = useState(() =>
    detectMobileSinglePanelLayout()
  );
  const [mobileDockExpanded, setMobileDockExpanded] = useState(false);
  const [orientationResumeTick, setOrientationResumeTick] = useState(0);
  const [terminalResponseSubmitted, setTerminalResponseSubmitted] = useState(false);
  const previousLivesRef = useRef(null);
  const previousLandscapeViewportRef = useRef(
    typeof window === 'undefined' ? true : window.innerWidth > window.innerHeight
  );
  const jackInStepShownRef = useRef(false);
  const jackInClickedRef = useRef(false);
  const lastPanelFocusStepIdRef = useRef(null);
  const lastLoadoutOpenStepIdRef = useRef(null);
  const lastTowerSelectorResetStepIdRef = useRef(null);
  const lastUiCollapseStepIdRef = useRef(null);
  const lastAutoScrolledStepIdRef = useRef(null);
  const towerInspectionAdvanceTimerRef = useRef(null);
  const slotSwitchAdvanceTimerRef = useRef(null);
  const isHomepageSurface = surfaceVariant === 'homepage';

  useEffect(() => {
    if (isActive) return;

    lastPanelFocusStepIdRef.current = null;
    lastLoadoutOpenStepIdRef.current = null;
    lastTowerSelectorResetStepIdRef.current = null;
    lastUiCollapseStepIdRef.current = null;
    lastAutoScrolledStepIdRef.current = null;
    setSlotSwitchInteractionCount(0);
    setSlotSwitchLayoutChanged(false);
    setSlotSwitchBaselinePanels(null);
    setSlotSwitchAdvanceReady(false);
    setSlotSwitchSideClicked(false);
    setTowerInspectionRangeShown(false);
    setTowerInspectionDetailsOpened(false);
    setTowerInspectionAdvanceReady(false);
    setFunctionTowerLaserCompleted(false);
    setLogTowerLaserCompleted(false);
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (towerInspectionAdvanceTimerRef.current) {
        window.clearTimeout(towerInspectionAdvanceTimerRef.current);
      }

      if (slotSwitchAdvanceTimerRef.current) {
        window.clearTimeout(slotSwitchAdvanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setEditorCode('');
      return undefined;
    }

    if (typeof code === 'string') {
      setEditorCode(code);
      return undefined;
    }

    const updateEditorCode = () => {
      const editor = window.__tdMonacoEditor;
      const nextCode = editor?.getValue?.() || '';
      setEditorCode((currentCode) => (currentCode === nextCode ? currentCode : nextCode));
    };

    updateEditorCode();
    const intervalId = window.setInterval(updateEditorCode, 300);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [code, isActive]);

  useEffect(() => {
    if (!isActive) {
      setSelectedTowerType(null);
      return undefined;
    }

    const updateSelectedTowerType = () => {
      const nextSelectedTowerType = getSelectedTutorialTowerType();
      setSelectedTowerType((currentSelectedTowerType) => {
        if (currentSelectedTowerType === nextSelectedTowerType) {
          return currentSelectedTowerType;
        }

        return nextSelectedTowerType;
      });
    };

    updateSelectedTowerType();
    const intervalId = window.setInterval(updateSelectedTowerType, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setTerminalResponseSubmitted(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (terminalResponseSubmitted) return;

    const trimmed = String(lastTerminalCommand || '')
      .trim()
      .toLowerCase();
    if (trimmed === 'yes' || trimmed === 'y') {
      setTerminalResponseSubmitted(true);
    }
  }, [isActive, lastTerminalCommand, terminalResponseSubmitted]);

  useEffect(() => {
    if (!isActive) {
      previousLivesRef.current = null;
      setLifeLossCount(0);
      return;
    }

    const currentLives = typeof gameState?.lives === 'number' ? gameState.lives : null;
    if (!Number.isFinite(currentLives)) {
      return;
    }

    const previousLives = previousLivesRef.current;
    previousLivesRef.current = currentLives;

    if (!Number.isFinite(previousLives)) {
      return;
    }

    if (currentLives < previousLives) {
      setLifeLossCount((currentCount) => currentCount + (previousLives - currentLives));
    }
  }, [gameState?.lives, isActive]);

  useEffect(() => {
    if (!isActive || !isHomepageSurface || typeof document === 'undefined') {
      setIsHomepageDemoVisible(true);
      return undefined;
    }

    const root = document.querySelector("[data-tutorial='homepage-demo-root']");
    if (!root) {
      setIsHomepageDemoVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry?.intersectionRatio ?? 0;
        const isVisible = Boolean(entry?.isIntersecting) && ratio >= 0.2;
        setIsHomepageDemoVisible(isVisible);
      },
      {
        threshold: [0, 0.2, 0.4, 0.6],
      }
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [isActive, isHomepageSurface]);

  const shouldShowOnboardingUI = isActive && (!isHomepageSurface || isHomepageDemoVisible);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateLayoutMode = () => {
      const responsiveProfile = buildResponsiveProfile();
      const nextIsLandscapeViewport = responsiveProfile.isLandscapeViewport;
      const resumedIntoLandscape =
        responsiveProfile.isHandheldLayout &&
        !previousLandscapeViewportRef.current &&
        nextIsLandscapeViewport;

      previousLandscapeViewportRef.current = nextIsLandscapeViewport;
      setIsMobileSinglePanelLayout(responsiveProfile.isHandheldSinglePanelLayout);

      if (!resumedIntoLandscape) {
        return;
      }

      lastPanelFocusStepIdRef.current = null;
      lastLoadoutOpenStepIdRef.current = null;
      lastUiCollapseStepIdRef.current = null;
      lastAutoScrolledStepIdRef.current = null;
      setOrientationResumeTick((currentValue) => currentValue + 1);
    };

    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    window.addEventListener('orientationchange', updateLayoutMode);

    return () => {
      window.removeEventListener('resize', updateLayoutMode);
      window.removeEventListener('orientationchange', updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setMobileDockExpanded(false);
      return undefined;
    }

    const updateDockExpanded = () => {
      if (typeof document === 'undefined') return;
      const isExpanded = Boolean(document.querySelector("[data-tutorial='mobile-tower-dock']"));
      setMobileDockExpanded((current) => (current === isExpanded ? current : isExpanded));
    };

    updateDockExpanded();
    const intervalId = window.setInterval(updateDockExpanded, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive]);

  const onboardingContext = useMemo(
    () => ({
      gameState,
      initialCodeGenerated,
      functionTowerPlaced,
      onboardingDelayPassed,
      objectTowerPlaced,
      functionTowerLaserCompleted,
      logTowerLaserCompleted,
      surfaceVariant,
      language,
      selectedTowerType:
        (propSelectedTowerType ? String(propSelectedTowerType).toUpperCase() : null) ||
        selectedTowerType,
      selectedTower,
      editorCode,
      isMobileSinglePanelLayout,
      conceptIntro,
      slotSwitchInteractionCount,
      slotSwitchLayoutChanged,
      slotSwitchAdvanceReady,
      slotSwitchSideClicked,
      towerInspectionRangeShown,
      towerInspectionDetailsOpened,
      towerInspectionAdvanceReady,
      terminalResponseSubmitted,
      codeSubmitted: Boolean(codeSubmitted),
      verifyAttemptInProgress: Boolean(verifyAttemptInProgress),
      lifeLossCount,
      livesRemaining: typeof gameState?.lives === 'number' ? gameState.lives : null,
      mobileDockExpanded,
    }),
    [
      codeSubmitted,
      conceptIntro,
      editorCode,
      functionTowerPlaced,
      onboardingDelayPassed,
      functionTowerLaserCompleted,
      logTowerLaserCompleted,
      surfaceVariant,
      gameState,
      initialCodeGenerated,
      isMobileSinglePanelLayout,
      language,
      lifeLossCount,
      objectTowerPlaced,
      selectedTower,
      slotSwitchInteractionCount,
      slotSwitchLayoutChanged,
      slotSwitchAdvanceReady,
      slotSwitchSideClicked,
      towerInspectionDetailsOpened,
      towerInspectionAdvanceReady,
      towerInspectionRangeShown,
      verifyAttemptInProgress,
      selectedTowerType,
      propSelectedTowerType,
      mobileDockExpanded,
      terminalResponseSubmitted,
    ]
  );

  const handleOnboardingComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        if (surfaceVariant === 'homepage') {
          window.localStorage.setItem(HOMEPAGE_DEMO_ONBOARDING_COMPLETE_KEY, '1');
          window.localStorage.setItem(TD_FOUNDATION_ONBOARDING_COMPLETE_KEY, '1');
        }

        if (surfaceVariant === 'learning' && isModuleZeroFullOnboarding(onboardingId)) {
          window.localStorage.setItem(TD_FOUNDATION_ONBOARDING_COMPLETE_KEY, '1');
        }
      } catch {
        // Ignore storage failures.
      }
    }

    onComplete?.();
  }, [onComplete, onboardingId, surfaceVariant]);

  const funnel = useGuestFunnel();

  const { activeStep, completeStep } = useTowerDefenseOnboardingController({
    isActive,
    steps: script.steps,
    context: onboardingContext,
    storageKey,
    version: script.version,
    onComplete: handleOnboardingComplete,
    onStepReached: useCallback(
      (stepId) => {
        if (surfaceVariant === 'homepage') {
          funnel.tutorialStepReached(stepId);
        }
      },
      [funnel, surfaceVariant]
    ),
    onStepCompleted: useCallback(
      (stepId) => {
        if (surfaceVariant === 'homepage') {
          funnel.tutorialStepCompleted(stepId);
        }
      },
      [funnel, surfaceVariant]
    ),
  });

  useEffect(() => {
    if (!shouldShowOnboardingUI || !activeStep) {
      document.body.classList.remove('td-onboarding-lock-active');
      return;
    }

    document.body.classList.add('td-onboarding-lock-active');
    return () => {
      document.body.classList.remove('td-onboarding-lock-active');
    };
  }, [activeStep, shouldShowOnboardingUI]);

  /* Capture-phase click lock — bulletproof backup for the CSS pointer-events lock.
     Catches all click events in capture phase (before React's delegation on #root),
     checks the target against the allowlist using closest(), and blocks non-allowed
     clicks entirely via stopImmediatePropagation. */
  useEffect(() => {
    if (!shouldShowOnboardingUI || !activeStep) return;

    const allowedSelector = [
      '[data-td-onboarding-target-kind]',
      '[data-td-onboarding-scrollable]',
      '[data-td-onboarding-portal]',
      `[data-tutorial='game-grid']`,
      `[data-tutorial^='tower-']`,
      `[data-learning='terminal-input']`,
      '.chakra-modal__content-container',
      '#chakra-toast-portal',
      '.monaco-editor',
    ].join(',');

    const handleCaptureClick = (e) => {
      if (e.target.closest(allowedSelector)) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
    };

    document.addEventListener('click', handleCaptureClick, true);

    return () => {
      document.removeEventListener('click', handleCaptureClick, true);
    };
  }, [activeStep, shouldShowOnboardingUI]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTowerPlacedEvent = (event) => {
      const { towerType, position } = event?.detail || {};
      const normalizedTowerType = String(towerType)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      console.log('[DEBUG] handleTowerPlacedEvent received:', {
        towerType,
        normalizedTowerType,
        position,
        surfaceVariant,
      });

      if (surfaceVariant !== 'homepage') return;

      if (normalizedTowerType === 'FUNCTION' || normalizedTowerType === 'LOG') {
        // Ensure the editor panel is visible so getBoundingClientRect
        // returns the correct on-screen position, not the hidden off-screen box.
        setRightPanel?.(PANEL_TYPES.EDITOR);
        const checkElements = (attempts = 0) => {
          const canvasEl = document.querySelector("[data-tutorial='game-grid']");
          const editorEl = document.querySelector("[data-tutorial='code-editor']");
          console.log(`[DEBUG] checkElements (attempt ${attempts}):`, {
            canvasEl: !!canvasEl,
            editorEl: !!editorEl,
          });

          if (canvasEl && editorEl) {
            const canvasRect = canvasEl.getBoundingClientRect();
            const editorRect = editorEl.getBoundingClientRect();

            // The editor panel starts in a hidden offscreen box (left:-9999, w:1)
            // when not assigned to a visible slot. setRightPanel(PANEL_TYPES.EDITOR)
            // above queues a React re-render but hasn't committed yet on this tick.
            // Reject offscreen coordinates and keep retrying until the editor lands
            // in its on-screen position in the RIGHT container slot.
            if (editorRect.left < 0 || editorRect.width <= 5) {
              if (attempts < 60) {
                console.log('[DEBUG] Editor still offscreen, retrying...', {
                  left: editorRect.left,
                  width: editorRect.width,
                });
                setTimeout(() => checkElements(attempts + 1), 50);
              } else {
                console.error('[ERROR] Editor panel never reached on-screen position after 3s');
              }
              return;
            }

            const colWidth = canvasRect.width / gridCols;
            const rowHeight = canvasRect.height / gridRows;

            let fromX, fromY, toX, toY;

            if (normalizedTowerType === 'FUNCTION') {
              // Grid (from) to Editor (to)
              fromX = canvasRect.left + (position.col + 0.5) * colWidth;
              fromY = canvasRect.top + (position.row + 0.5) * rowHeight;
              toX = editorRect.left;
              toY = editorRect.top + editorRect.height / 2;
            } else {
              // Editor (from) to Grid (to) for LOG
              fromX = editorRect.left;
              fromY = editorRect.top + editorRect.height / 2;
              toX = canvasRect.left + (position.col + 0.5) * colWidth;
              toY = canvasRect.top + (position.row + 0.5) * rowHeight;
            }

            console.log('[DEBUG] Laser coordinates computed:', {
              from: { x: fromX, y: fromY },
              to: { x: toX, y: toY },
            });

            setLaserState({
              from: { x: fromX, y: fromY },
              to: { x: toX, y: toY },
              color: '#00ff8c',
            });

            audioManager.playSoundEffect?.('laser');

            setTimeout(() => {
              if (normalizedTowerType === 'FUNCTION') {
                console.log('[DEBUG] Dispatching td-laser-hit');
                window.dispatchEvent(new CustomEvent('td-laser-hit'));
                setFunctionTowerLaserCompleted(true);
              } else if (normalizedTowerType === 'LOG') {
                setLogTowerLaserCompleted(true);
              }
              setLaserState(null);
            }, 1500);
          } else if (attempts < 60) {
            setTimeout(() => checkElements(attempts + 1), 50);
          } else {
            console.error('[ERROR] Onboarding laser elements not found after 3 seconds');
          }
        };

        checkElements();
      }
    };

    document.addEventListener('tower-placed', handleTowerPlacedEvent);
    return () => {
      document.removeEventListener('tower-placed', handleTowerPlacedEvent);
    };
  }, [surfaceVariant, gridCols, gridRows]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleCompleteRequest = (event) => {
      const stepId = String(event?.detail?.stepId || '');
      if (!stepId) return;

      completeStep(stepId);
    };

    window.addEventListener(TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT, handleCompleteRequest);

    return () => {
      window.removeEventListener(TD_ONBOARDING_REQUEST_STEP_COMPLETE_EVENT, handleCompleteRequest);
    };
  }, [completeStep]);

  useEffect(() => {
    if (activeStep?.id === TD_FUNCTION_INSPECT_STEP_ID) {
      return;
    }

    if (towerInspectionAdvanceTimerRef.current) {
      window.clearTimeout(towerInspectionAdvanceTimerRef.current);
      towerInspectionAdvanceTimerRef.current = null;
    }

    setTowerInspectionRangeShown(false);
    setTowerInspectionDetailsOpened(false);
    setTowerInspectionAdvanceReady(false);
  }, [activeStep?.id]);

  useEffect(() => {
    if (isSlotSwitchStepId(activeStep?.id)) {
      return;
    }

    if (slotSwitchAdvanceTimerRef.current) {
      window.clearTimeout(slotSwitchAdvanceTimerRef.current);
      slotSwitchAdvanceTimerRef.current = null;
    }

    setSlotSwitchInteractionCount(0);
    setSlotSwitchLayoutChanged(false);
    setSlotSwitchBaselinePanels(null);
    setSlotSwitchAdvanceReady(false);
    setSlotSwitchSideClicked(false);
  }, [activeStep?.id]);

  useEffect(() => {
    if (!isActive || activeStep?.id !== TD_FUNCTION_INSPECT_STEP_ID) {
      return;
    }

    const functionTowerSelected = isFunctionTowerSelectedForInspection(selectedTower);

    setTowerInspectionRangeShown(functionTowerSelected);

    if (towerInspectionAdvanceTimerRef.current) {
      window.clearTimeout(towerInspectionAdvanceTimerRef.current);
      towerInspectionAdvanceTimerRef.current = null;
    }

    setTowerInspectionAdvanceReady(false);

    if (!functionTowerSelected || isMobileSinglePanelLayout) {
      return;
    }

    towerInspectionAdvanceTimerRef.current = window.setTimeout(() => {
      setTowerInspectionAdvanceReady(true);
      towerInspectionAdvanceTimerRef.current = null;
    }, TD_DESKTOP_INSPECT_ADVANCE_DELAY_MS);
  }, [activeStep?.id, isActive, isMobileSinglePanelLayout, selectedTower]);

  useEffect(() => {
    if (
      !isActive ||
      activeStep?.id !== TD_FUNCTION_INSPECT_STEP_ID ||
      typeof window === 'undefined'
    ) {
      return undefined;
    }

    const handleTowerDetailsOpened = () => {
      setTowerInspectionDetailsOpened(true);

      if (towerInspectionAdvanceTimerRef.current) {
        window.clearTimeout(towerInspectionAdvanceTimerRef.current);
        towerInspectionAdvanceTimerRef.current = null;
      }

      if (!isMobileSinglePanelLayout) {
        setTowerInspectionAdvanceReady(true);
        return;
      }

      setTowerInspectionAdvanceReady(false);
      towerInspectionAdvanceTimerRef.current = window.setTimeout(() => {
        setTowerInspectionAdvanceReady(true);
        towerInspectionAdvanceTimerRef.current = null;
      }, TD_MOBILE_INSPECT_ADVANCE_DELAY_MS);
    };

    window.addEventListener(TD_MOBILE_OPEN_TOWER_DETAILS_EVENT, handleTowerDetailsOpened);

    return () => {
      window.removeEventListener(TD_MOBILE_OPEN_TOWER_DETAILS_EVENT, handleTowerDetailsOpened);
    };
  }, [activeStep?.id, isActive, isMobileSinglePanelLayout]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      !isSlotSwitchStepId(activeStep?.id) ||
      typeof document === 'undefined'
    ) {
      return undefined;
    }

    const handleSlotSwitchClick = (event) => {
      const button = event.target?.closest?.("[data-tutorial-role='panel-switcher']");
      if (!button) return;

      setSlotSwitchInteractionCount((currentValue) => currentValue + 1);
    };

    document.addEventListener('click', handleSlotSwitchClick, true);

    return () => {
      document.removeEventListener('click', handleSlotSwitchClick, true);
    };
  }, [activeStep?.id, shouldShowOnboardingUI]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      !isSlotSwitchStepId(activeStep?.id) ||
      typeof document === 'undefined'
    ) {
      return undefined;
    }

    const handleSideBadgeClick = (event) => {
      const badge = event.target?.closest?.("[data-tutorial-role='side-badge']");
      if (!badge) return;

      setSlotSwitchSideClicked(true);
    };

    document.addEventListener('click', handleSideBadgeClick, true);

    return () => {
      document.removeEventListener('click', handleSideBadgeClick, true);
    };
  }, [activeStep?.id, shouldShowOnboardingUI]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const nextStepId = shouldShowOnboardingUI ? String(activeStep?.id || '') : '';
    const inlineStep =
      shouldShowOnboardingUI && activeStep?.kind !== 'concept-card' ? activeStep || null : null;
    const inlineSurface = inlineStep
      ? resolveInlineOnboardingSurface(inlineStep, {
          leftPanel,
          rightPanel,
        })
      : null;
    const inlineStepDetail = inlineSurface && inlineStep ? { ...inlineStep } : null;

    if (typeof document !== 'undefined') {
      if (nextStepId) {
        document.body.dataset.tdOnboardingStepId = nextStepId;
      } else {
        document.body.removeAttribute('data-td-onboarding-step-id');
      }
    }

    window.__tdInlineOnboardingStepDetail = {
      surface: inlineSurface,
      step: inlineStepDetail,
    };

    window.dispatchEvent(
      new CustomEvent(TD_ONBOARDING_STEP_CHANGE_EVENT, {
        detail: {
          isActive: Boolean(shouldShowOnboardingUI),
          stepId: nextStepId,
          surface: inlineSurface,
          step: inlineStepDetail,
        },
      })
    );

    return undefined;
  }, [
    activeStep,
    activeStep?.id,
    leftPanel,
    orientationResumeTick,
    rightPanel,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (!isActive) return;
    if (script.steps.length > 0) return;

    handleOnboardingComplete();
  }, [handleOnboardingComplete, isActive, script.steps.length]);

  useEffect(() => {
    if (!isActive) {
      jackInStepShownRef.current = false;
      jackInClickedRef.current = false;
      return;
    }

    if (activeStep?.id === 'jack-in') {
      jackInStepShownRef.current = true;
      return;
    }

    jackInClickedRef.current = false;
  }, [activeStep?.id, isActive]);

  useEffect(() => {
    if (!isActive) return undefined;
    if (activeStep?.id !== 'jack-in') return undefined;

    const jackInButton = document.querySelector("[data-tutorial='jack-in-button']");
    if (!jackInButton) return undefined;

    const handleJackInClick = () => {
      jackInClickedRef.current = true;
    };

    jackInButton.addEventListener('click', handleJackInClick);

    return () => {
      jackInButton.removeEventListener('click', handleJackInClick);
    };
  }, [activeStep?.id, isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (!jackInStepShownRef.current) return;
    if (!jackInClickedRef.current) return;
    if (gameState?.status === 'prehack') return;
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(TD_JACK_IN_CALLOUT_SEEN_KEY, '1');
      jackInStepShownRef.current = false;
      jackInClickedRef.current = false;
    } catch {
      // Ignore storage failures.
    }
  }, [gameState?.status, isActive]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || !activeStep?.highlightKey) {
      document.body.removeAttribute('data-td-onboarding');
      return;
    }

    document.body.dataset.tdOnboarding = activeStep.highlightKey;

    return () => {
      document.body.removeAttribute('data-td-onboarding');
    };
  }, [activeStep?.highlightKey, shouldShowOnboardingUI]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || !activeStep?.panelFocus) return;

    const activeStepId = String(activeStep?.id || '');
    if (lastPanelFocusStepIdRef.current === activeStepId) return;

    if (isMobileSinglePanelLayout) {
      const focusedPanel = activeStep.panelFocus.leftPanel || activeStep.panelFocus.rightPanel;
      if (focusedPanel) {
        setLeftPanel?.(focusedPanel);
        setRightPanel?.(null);
        lastPanelFocusStepIdRef.current = activeStepId;
      }
      return;
    }

    if (activeStep.panelFocus.leftPanel) {
      setLeftPanel?.(activeStep.panelFocus.leftPanel);
    }
    if (activeStep.panelFocus.rightPanel) {
      setRightPanel?.(activeStep.panelFocus.rightPanel);
    }
    lastPanelFocusStepIdRef.current = activeStepId;
  }, [
    activeStep?.id,
    activeStep?.panelFocus,
    isMobileSinglePanelLayout,
    orientationResumeTick,
    setLeftPanel,
    setRightPanel,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      activeStep?.id !== TD_SLOT_SWITCH_STEP_ID ||
      slotSwitchBaselinePanels ||
      typeof window === 'undefined'
    ) {
      return undefined;
    }

    setSlotSwitchLayoutChanged(false);
    setSlotSwitchAdvanceReady(false);

    const captureBaselineTimerId = window.setTimeout(() => {
      setSlotSwitchBaselinePanels(
        (currentBaseline) =>
          currentBaseline || {
            leftPanel: leftPanel || null,
            rightPanel: rightPanel || null,
          }
      );
    }, 0);

    return () => {
      window.clearTimeout(captureBaselineTimerId);
    };
  }, [activeStep?.id, leftPanel, rightPanel, shouldShowOnboardingUI, slotSwitchBaselinePanels]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      activeStep?.id !== TD_SLOT_SWITCH_STEP_ID ||
      !slotSwitchBaselinePanels ||
      typeof window === 'undefined'
    ) {
      return undefined;
    }

    const hasLayoutChanged =
      slotSwitchBaselinePanels.leftPanel !== (leftPanel || null) ||
      slotSwitchBaselinePanels.rightPanel !== (rightPanel || null);

    setSlotSwitchLayoutChanged(hasLayoutChanged);

    if (slotSwitchAdvanceTimerRef.current) {
      window.clearTimeout(slotSwitchAdvanceTimerRef.current);
      slotSwitchAdvanceTimerRef.current = null;
    }

    setSlotSwitchAdvanceReady(false);

    if (!hasLayoutChanged) {
      return undefined;
    }

    const delayMs = isMobileSinglePanelLayout
      ? TD_MOBILE_SLOT_SWITCH_ADVANCE_DELAY_MS
      : TD_DESKTOP_SLOT_SWITCH_ADVANCE_DELAY_MS;

    slotSwitchAdvanceTimerRef.current = window.setTimeout(() => {
      setSlotSwitchAdvanceReady(true);
      slotSwitchAdvanceTimerRef.current = null;
    }, delayMs);

    return () => {
      if (slotSwitchAdvanceTimerRef.current) {
        window.clearTimeout(slotSwitchAdvanceTimerRef.current);
        slotSwitchAdvanceTimerRef.current = null;
      }
    };
  }, [
    activeStep?.id,
    isMobileSinglePanelLayout,
    leftPanel,
    rightPanel,
    shouldShowOnboardingUI,
    slotSwitchBaselinePanels,
  ]);

  useEffect(() => {
    if (activeStep?.id === 'interwave-tools') {
      return;
    }

    lastTowerSelectorResetStepIdRef.current = null;
  }, [activeStep?.id]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      activeStep?.id !== 'interwave-tools' ||
      !selectedTower ||
      !onClearSelectedTower
    ) {
      return;
    }

    if (lastTowerSelectorResetStepIdRef.current === activeStep.id) {
      return;
    }

    lastTowerSelectorResetStepIdRef.current = activeStep.id;
    onClearSelectedTower();
  }, [activeStep?.id, onClearSelectedTower, selectedTower, shouldShowOnboardingUI]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || !isMobileSinglePanelLayout) return;
    if (typeof window === 'undefined') return;

    const activeStepId = String(activeStep?.id || '');
    if (lastLoadoutOpenStepIdRef.current === activeStepId) return;

    const isTowerSelectionBeat = shouldOpenMobileLoadoutForStep(activeStep);

    if (!isTowerSelectionBeat) return;

    const focusPanel = activeStep?.panelFocus?.leftPanel || activeStep?.panelFocus?.rightPanel;
    if (focusPanel !== PANEL_TYPES.GAME) return;

    lastLoadoutOpenStepIdRef.current = activeStepId;

    const source = `onboarding:${activeStep?.id || 'tower-beat'}`;
    const requestId = `${source}:${Date.now()}`;
    let retryCount = 0;
    let retryTimerId = null;
    let settled = false;

    const clearRetryTimer = () => {
      if (retryTimerId) {
        window.clearTimeout(retryTimerId);
        retryTimerId = null;
      }
    };

    const handleOpened = (event) => {
      const openedRequestId = event?.detail?.requestId;
      const openedSource = event?.detail?.source;
      if (openedRequestId !== requestId && openedSource !== source) return;
      settled = true;
      clearRetryTimer();
    };

    const dispatchOpenRequest = () => {
      if (settled) return;

      window.dispatchEvent(
        new CustomEvent(TD_MOBILE_OPEN_LOADOUT_EVENT, {
          detail: {
            palette: 'towers',
            source,
            requestId,
          },
        })
      );

      retryCount += 1;
      if (retryCount >= TD_MOBILE_LOADOUT_MAX_RETRIES) {
        return;
      }

      clearRetryTimer();
      retryTimerId = window.setTimeout(dispatchOpenRequest, TD_MOBILE_LOADOUT_RETRY_INTERVAL_MS);
    };

    window.addEventListener(TD_MOBILE_LOADOUT_OPENED_EVENT, handleOpened);
    dispatchOpenRequest();

    return () => {
      settled = true;
      clearRetryTimer();
      window.removeEventListener(TD_MOBILE_LOADOUT_OPENED_EVENT, handleOpened);
    };
  }, [
    activeStep,
    activeStep?.id,
    activeStep?.panelFocus?.leftPanel,
    activeStep?.panelFocus?.rightPanel,
    activeStep?.targetSelector,
    isMobileSinglePanelLayout,
    orientationResumeTick,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || !isMobileSinglePanelLayout || typeof window === 'undefined') {
      return;
    }

    const activeStepId = String(activeStep?.id || '');
    if (!activeStepId || lastUiCollapseStepIdRef.current === activeStepId) {
      return;
    }

    const focusPanel = activeStep?.panelFocus?.leftPanel || activeStep?.panelFocus?.rightPanel;
    if (focusPanel !== PANEL_TYPES.GAME) {
      return;
    }

    if (!shouldCollapseMobileUiForStep(activeStep)) {
      return;
    }

    lastUiCollapseStepIdRef.current = activeStepId;
    writeTowerDefenseShellVisible(false);
    window.dispatchEvent(
      new CustomEvent(TD_MOBILE_COLLAPSE_UI_EVENT, {
        detail: {
          closeLoadout: true,
          hideHud: true,
          hideShell: true,
          source: `onboarding:${activeStepId}`,
        },
      })
    );
  }, [
    activeStep,
    activeStep?.id,
    activeStep?.panelFocus?.leftPanel,
    activeStep?.panelFocus?.rightPanel,
    isMobileSinglePanelLayout,
    orientationResumeTick,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || !isMobileSinglePanelLayout || typeof window === 'undefined') {
      return;
    }

    const activeStepId = String(activeStep?.id || '');
    const targetSelector = String(activeStep?.targetSelector || '');
    const isSlotSwitchStep =
      isSlotSwitchStepId(activeStepId) || isPanelSwitcherTargetSelector(targetSelector);

    if (!isSlotSwitchStep) return;

    writeTowerDefenseShellVisible(true);
  }, [
    activeStep?.id,
    activeStep?.targetSelector,
    isMobileSinglePanelLayout,
    orientationResumeTick,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (!shouldShowOnboardingUI || typeof window === 'undefined') {
      return undefined;
    }

    if (!shouldAutoScrollTargetIntoView(activeStep, isMobileSinglePanelLayout)) {
      return undefined;
    }

    const stepId = String(activeStep?.id || '');
    const targetSelector = String(activeStep?.targetSelector || '');

    if (!stepId || !targetSelector) {
      return undefined;
    }

    if (lastAutoScrolledStepIdRef.current === stepId) {
      return undefined;
    }

    let attempts = 0;
    let retryTimerId = null;
    let cancelled = false;

    const clearRetryTimer = () => {
      if (retryTimerId) {
        window.clearTimeout(retryTimerId);
        retryTimerId = null;
      }
    };

    const bringTargetIntoView = () => {
      if (cancelled) return;

      const target = getVisibleTargetElement(targetSelector);
      if (!target) {
        attempts += 1;
        if (attempts < TD_MOBILE_TARGET_SCROLL_MAX_RETRIES) {
          retryTimerId = window.setTimeout(
            bringTargetIntoView,
            TD_MOBILE_TARGET_SCROLL_RETRY_INTERVAL_MS
          );
        }
        return;
      }

      if (isTargetCenteredInSafeViewport(target)) {
        lastAutoScrolledStepIdRef.current = stepId;
        clearRetryTimer();
        return;
      }

      target.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: attempts === 0 ? 'auto' : 'smooth',
      });

      attempts += 1;
      if (attempts < TD_MOBILE_TARGET_SCROLL_MAX_RETRIES) {
        retryTimerId = window.setTimeout(
          bringTargetIntoView,
          TD_MOBILE_TARGET_SCROLL_RETRY_INTERVAL_MS
        );
      } else {
        lastAutoScrolledStepIdRef.current = stepId;
      }
    };

    bringTargetIntoView();

    return () => {
      cancelled = true;
      clearRetryTimer();
    };
  }, [
    activeStep,
    activeStep?.id,
    activeStep?.targetSelector,
    isMobileSinglePanelLayout,
    orientationResumeTick,
    shouldShowOnboardingUI,
  ]);

  useEffect(() => {
    if (!isActive) {
      musicRequestedRef.current = false;
      return;
    }
    if (typeof window !== 'undefined' && window._musicStarted) {
      musicRequestedRef.current = true;
      return;
    }
    if (musicRequestedRef.current) return;
    const settings = audioManager.getSettings?.();
    if (settings?.musicEnabled === false) return;
    musicRequestedRef.current = true;
    AudioService.initialize().then(() => AudioService.playBackgroundMusic('random'));
  }, [isActive]);

  useGhostText({
    enabled:
      shouldShowOnboardingUI && activeStep?.id === 'write-code' && !isMobileSinglePanelLayout,
    solution: script.config.answer,
    language,
  });

  useEffect(() => {
    if (!shouldShowOnboardingUI || activeStep?.id !== 'write-code' || isMobileSinglePanelLayout) {
      setShowGhostHint(false);
      return;
    }
    const key = 'codegrind_ghost_hint_shown';
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setShowGhostHint(true);
    const timer = setTimeout(() => setShowGhostHint(false), 7000);
    return () => clearTimeout(timer);
  }, [activeStep?.id, isMobileSinglePanelLayout, shouldShowOnboardingUI]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const cleanupTargetMarker = (element) => {
      if (!element) return;
      element.removeAttribute('data-td-onboarding-target-kind');
    };

    const cleanupScrollableMarker = (element) => {
      if (!element) return;
      element.removeAttribute('data-td-onboarding-scrollable');
    };

    if (
      !shouldShowOnboardingUI ||
      !activeStep?.targetSelector ||
      activeStep.kind === 'concept-card'
    ) {
      return undefined;
    }

    let cancelled = false;
    let retryTimerId = null;
    let markedTarget = null;
    let markedTargetKind = null;
    let markedScrollable = null;
    let attempts = 0;

    const clearRetryTimer = () => {
      if (retryTimerId) {
        window.clearTimeout(retryTimerId);
        retryTimerId = null;
      }
    };

    const syncTargetMarker = () => {
      if (cancelled) return;

      const target = getVisibleTargetElement(activeStep.targetSelector);
      const targetKind = getOnboardingTargetKind(target);

      if (markedTarget && (markedTarget !== target || markedTargetKind !== targetKind)) {
        cleanupTargetMarker(markedTarget);
        markedTarget = null;
        markedTargetKind = null;
      }

      if (markedScrollable) {
        cleanupScrollableMarker(markedScrollable);
        markedScrollable = null;
      }

      if (target && targetKind) {
        target.setAttribute('data-td-onboarding-target-kind', targetKind);
        markedTarget = target;
        markedTargetKind = targetKind;

        // Mark the nearest scrollable ancestor so scrolling works for steps
        // that require it (e.g. mission-objective with requireScrollProgress).
        const scrollable = findScrollableAncestor(target);
        if (scrollable) {
          scrollable.setAttribute('data-td-onboarding-scrollable', '');
          markedScrollable = scrollable;
        }
        return;
      }

      attempts += 1;
      if (attempts < TD_MOBILE_TARGET_SCROLL_MAX_RETRIES) {
        clearRetryTimer();
        retryTimerId = window.setTimeout(
          syncTargetMarker,
          TD_MOBILE_TARGET_SCROLL_RETRY_INTERVAL_MS
        );
      }
    };

    syncTargetMarker();

    return () => {
      cancelled = true;
      clearRetryTimer();
      cleanupTargetMarker(markedTarget);
      cleanupScrollableMarker(markedScrollable);
    };
  }, [activeStep?.id, activeStep?.kind, activeStep?.targetSelector, shouldShowOnboardingUI]);

  useEffect(() => {
    if (
      !shouldShowOnboardingUI ||
      !activeStep?.targetSelector ||
      activeStep.kind === 'concept-card'
    ) {
      setTargetRect(null);
      return undefined;
    }

    const updateTargetRect = () => {
      let nextRect = null;

      // Special case: for the inspect-function-tower step, compute the rect
      // from the placed FUNCTION tower's grid position instead of a DOM query.
      // Placed towers are canvas-drawn objects and have no individual DOM element.
      if (activeStep.id === TD_FUNCTION_INSPECT_STEP_ID) {
        const towers = gameState?.towers;
        if (Array.isArray(towers) && towers.length > 0) {
          const functionTower = towers.find(
            (t) => String(t.type || '').toUpperCase() === 'FUNCTION' && t.position
          );
          if (functionTower) {
            const canvasEl = document.querySelector("[data-tutorial='game-grid']");
            if (canvasEl) {
              const canvasRect = canvasEl.getBoundingClientRect();
              const colWidth = canvasRect.width / gridCols;
              const rowHeight = canvasRect.height / gridRows;
              const { row, col } = functionTower.position;

              nextRect = toRectSnapshot({
                top: canvasRect.top + row * rowHeight,
                right: canvasRect.left + (col + 1) * colWidth,
                bottom: canvasRect.top + (row + 1) * rowHeight,
                left: canvasRect.left + col * colWidth,
                width: colWidth,
                height: rowHeight,
                x: canvasRect.left + col * colWidth,
                y: canvasRect.top + row * rowHeight,
              });
            }
          }
        }
      } else {
        const target = getVisibleTargetElement(activeStep.targetSelector);
        nextRect = target ? toRectSnapshot(target.getBoundingClientRect()) : null;
      }

      setTargetRect((currentRect) =>
        areRectSnapshotsEqual(currentRect, nextRect) ? currentRect : nextRect
      );
    };

    updateTargetRect();
    const intervalMs = isMobileSinglePanelLayout ? 650 : 250;
    const intervalId = window.setInterval(updateTargetRect, intervalMs);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [activeStep, isMobileSinglePanelLayout, shouldShowOnboardingUI]);

  if (!shouldShowOnboardingUI || !activeStep) return null;

  const overlayContent = (
    <div data-td-onboarding-portal="true">
      <style>{ONBOARDING_STYLES}</style>

      {activeStep.kind !== 'universe-rules' &&
      activeStep.id !== 'mission-objective' &&
      (activeStep.id !== 'towers-make-code' || onboardingDelayPassed) ? (
        <TowerDefenseOnboardingOverlay
          step={activeStep}
          targetRect={targetRect}
          onCompleteStep={completeStep}
        />
      ) : null}

      {activeStep.kind === 'universe-rules' ? (
        <UniverseRulesOverlay
          isActive={true}
          onAcknowledge={() => {
            completeStep(activeStep.id);
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem('guest_universe_rules_acknowledged_v1', 'true');
              } catch (err) {
                console.error('Failed to save universe rules acknowledgment', err);
              }
            }
          }}
        />
      ) : null}

      <AnimatePresence>
        {showGhostHint && (
          <motion.div
            key="ghost-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            onClick={() => setShowGhostHint(false)}
            style={{
              position: 'fixed',
              top: '72px',
              right: '24px',
              zIndex: 10001,
              cursor: 'pointer',
            }}
          ></motion.div>
        )}
      </AnimatePresence>

      {laserState && (
        <svg
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        >
          <defs>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Thick dynamic glow base */}
          <motion.path
            d={`M ${laserState.from.x} ${laserState.from.y} C ${(laserState.from.x + laserState.to.x) / 2} ${laserState.from.y}, ${(laserState.from.x + laserState.to.x) / 2} ${laserState.to.y}, ${laserState.to.x} ${laserState.to.y}`}
            fill="none"
            stroke={laserState.color || '#00ff8c'}
            strokeWidth="16"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: [0.3, 0.3, 0] }}
            transition={{
              pathLength: { duration: 0.45, ease: 'easeOut' },
              opacity: { duration: 1.5, times: [0, 0.7, 1], ease: 'linear' },
            }}
          />
          {/* Medium dynamic glow core */}
          <motion.path
            d={`M ${laserState.from.x} ${laserState.from.y} C ${(laserState.from.x + laserState.to.x) / 2} ${laserState.from.y}, ${(laserState.from.x + laserState.to.x) / 2} ${laserState.to.y}, ${laserState.to.x} ${laserState.to.y}`}
            fill="none"
            stroke={laserState.color || '#00ff8c'}
            strokeWidth="8"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0, opacity: 0.75 }}
            animate={{ pathLength: 1, opacity: [0.75, 0.75, 0] }}
            transition={{
              pathLength: { duration: 0.45, ease: 'easeOut' },
              opacity: { duration: 1.5, times: [0, 0.7, 1], ease: 'linear' },
            }}
          />
          {/* Bright white core */}
          <motion.path
            d={`M ${laserState.from.x} ${laserState.from.y} C ${(laserState.from.x + laserState.to.x) / 2} ${laserState.from.y}, ${(laserState.from.x + laserState.to.x) / 2} ${laserState.to.y}, ${laserState.to.x} ${laserState.to.y}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{
              pathLength: { duration: 0.45, ease: 'easeOut' },
              opacity: { duration: 1.5, times: [0, 0.7, 1], ease: 'linear' },
            }}
          />
        </svg>
      )}
    </div>
  );

  if (typeof document === 'undefined') {
    return overlayContent;
  }

  return createPortal(overlayContent, document.body);
};

export default LearningPathTowerDefenseOnboarding;
