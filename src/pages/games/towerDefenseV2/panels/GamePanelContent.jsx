import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';

import TowerSelector from '../../../../components/towerDefense/TowerSelector';
import DeployableSelector from '../../../../components/towerDefense/ui/DeployableSelector';
import useGuestFunnel from '../../../../hooks/guest/useGuestFunnel';
import { TowerUpgradePanel } from '../../../../components/towerDefense/ui';
import GameBoard from '../../../../components/towerDefense/ui/board/GameBoard';
import CodeExecutionRateLimitBadge from '../../../../components/limits/CodeExecutionRateLimitBadge';
import MobileTowerDefenseDock from './MobileTowerDefenseDock';
import { resolveCanvasFitScale, resolveMobileCanvasViewportHeight } from './gamePanelSizing';
import visualSettingsManager from '../../../../utils/game/VisualSettingsManager';
import { TOWER_TYPES } from '../../../../components/towerDefense/data/towerTypes';
import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
  isRequiredCoreTower,
} from '../../../../utils/towerDefense/coreTowerRequirements';
import { writeTowerDefenseShellVisible } from '../../../../utils/ui/towerDefenseShellVisibility';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';
import '../../../../components/towerDefense/ui/board/CanvasGlitch.css';
import { DEPLOYABLE_TYPES } from '../../../../game-engine-v2';
import { TARGETING_MODES } from '../../../../game-engine-v2/constants';

const TD_MOBILE_OPEN_LOADOUT_EVENT = 'td-mobile-open-loadout';
const TD_MOBILE_LOADOUT_OPENED_EVENT = 'td-mobile-loadout-opened';
const TD_MOBILE_COLLAPSE_UI_EVENT = 'td-mobile-collapse-ui';
const TD_MOBILE_OPEN_TOWER_DETAILS_EVENT = 'td-mobile-open-tower-details';
const TD_ONBOARDING_STEP_CHANGE_EVENT = 'td-onboarding-step-change';
const MOBILE_HUD_FOCUS_STEP_IDS = new Set(['jack-in', 'start-wave', 'verify-solution']);

const createRetroWindowsButtonSx = (pressed = false) => ({
  backgroundImage: `url(${pressed ? RETRO_WINDOW_BUTTON_PRESSED_ASSET : RETRO_WINDOW_BUTTON_ASSET})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  backgroundColor: '#d4d0c8',
  color: '#1f2128',
  borderRadius: '0',
  border: '1px solid rgba(31, 33, 40, 0.35)',
  boxShadow: 'none',
  px: 3,
  py: 1.5,
  minH: '30px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  _hover: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
  },
  _active: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
  },
  _disabled: {
    opacity: 0.52,
    cursor: 'not-allowed',
    filter: 'grayscale(0.18)',
  },
});

export default function GamePanelContent({
  isGameOver,
  isVictory,
  gameState,
  initialLives,
  formattedTime,
  codeSubmissionSuccess,
  onResetGame,
  onNavigateToList,
  navigateToListLabel,
  canvasRefCallback,
  canvasWidth,
  canvasHeight,
  isTowerPlacementMode,
  onCanvasClick,
  onCanvasMouseMove,
  onCanvasMouseLeave,
  showJackInButton,
  showStartWaveButton,
  onJackIn,
  onStartWave,
  autoStartCountdown,
  autoStartWaves = false,
  hardcoreMode = false,
  initialCodeGenerated,
  functionTowerPlaced,
  objectTowerPlaced,
  coreTowerRequirements = { function: true, object: true },
  selectedTowerType,
  selectedDeployableType,
  placementModeKind,
  selectedTower,
  onUpgradeSelectedTower,
  onSpecialUpgradeSelectedTower,
  onSetSelectedTowerTargeting,
  onSellSelectedTower,
  onClearSelectedTower,
  onSelectTowerType,
  onSelectDeployableType,
  placementPalette,
  onPlacementPaletteChange,
  onCancelPlacement,
  allowedTowerTypes = null,
  towerUnlockGates = {},
  deployableUnlockGates = {},
  isSpecialUpgradeUnlocked,
  _gameSettings,
  _onGameSettingsChange,
  _canEditGameSettings,
  _difficultyMinimums,
  towerSelectorEnabled = true,
  deployableMenuEnabled = true,
  _upgradeMenuEnabled = true,
  isMapLoading = false,
  canAdjustPath = false,
  isAdjustingPath = false,
  onShortenPath,
  onLengthenPath,
  pathActionCosts = { shorten: 0, lengthen: 0 },
  // Verification controls (shown in game canvas before final wave)
  shouldShowVerificationControls = false,
  onRunCode,
  onRunOutput,
  onSubmitSolution,
  verificationActionCosts = { runTests: 0, stdout: 0, stderr: 0 },
  isExecuting = false,
  codeSubmitted = false,
  isLearningMode = false,
  terminalOutput = '',
  isDemo: _isDemo = false,
  isHomepageDemo = false,
  shellTheme = 'default',
  slotSwitcherControl = null,
  slotChrome = null,
  isMobileSlotLayout = false,
  isMobileChatFocus = false,
}) {
  const funnel = useGuestFunnel();
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const hudFontFamily = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', monospace";
  const retroSurfaceProps = isRetroDesktopTheme
    ? {
        bg: '#d4d0c8',
        borderRadius: '0',
        border: '2px solid #232730',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
      }
    : null;
  const [visualSettings, setVisualSettings] = useState(() => visualSettingsManager.getSettings());
  const [isMobileSelectorOpen, setIsMobileSelectorOpen] = useState(!isMobileSlotLayout);
  const [isMobileHudMenuVisible, setIsMobileHudMenuVisible] = useState(true);
  const [isMobileActionDockExpanded, setIsMobileActionDockExpanded] = useState(false);
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > window.innerHeight;
  });
  const [activeOnboardingStepId, setActiveOnboardingStepId] = useState(() => {
    if (typeof document === 'undefined') return '';
    return document.body.dataset.tdOnboardingStepId || '';
  });
  const [canvasViewportSize, setCanvasViewportSize] = useState({ width: 0, height: 0 });
  const canvasViewportRef = useRef(null);
  const missingCoreTowerLabels = useMemo(
    () =>
      getMissingCoreTowerLabels(coreTowerRequirements, {
        functionTowerPlaced,
        objectTowerPlaced,
      }),
    [coreTowerRequirements, functionTowerPlaced, objectTowerPlaced]
  );
  const coreTowerLabelText = useMemo(
    () => formatCoreTowerList(missingCoreTowerLabels),
    [missingCoreTowerLabels]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnboardingStepChange = (event) => {
      setActiveOnboardingStepId(String(event?.detail?.stepId || ''));
    };

    window.addEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleOnboardingStepChange);

    return () => {
      window.removeEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleOnboardingStepChange);
    };
  }, []);

  useEffect(() => {
    const handleSettingsChange = () => {
      setVisualSettings(visualSettingsManager.getSettings());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('td-settings-changed', handleSettingsChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('td-settings-changed', handleSettingsChange);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobileSlotLayout) {
      setIsMobileSelectorOpen(false);
      return;
    }
    setIsMobileSelectorOpen(true);
  }, [isMobileSlotLayout]);

  useEffect(() => {
    if (!isMobileSlotLayout || !selectedTower) {
      return;
    }

    setIsMobileHudMenuVisible(false);
    writeTowerDefenseShellVisible(false);
  }, [isMobileSlotLayout, selectedTower]);

  useEffect(() => {
    if (!isMobileSlotLayout) {
      setIsMobileHudMenuVisible(true);
      return;
    }

    if (isMobileSelectorOpen) {
      setIsMobileHudMenuVisible(false);
    }
  }, [isMobileSlotLayout, isMobileSelectorOpen]);

  useEffect(() => {
    if (!isMobileSlotLayout || !isTowerPlacementMode) {
      return;
    }

    setIsMobileSelectorOpen(false);
    setIsMobileHudMenuVisible(false);
    writeTowerDefenseShellVisible(false);
  }, [isMobileSlotLayout, isTowerPlacementMode]);

  const previousGameStatusRef = useRef(gameState?.status);

  useEffect(() => {
    const previousStatus = previousGameStatusRef.current;
    const nextStatus = gameState?.status;
    previousGameStatusRef.current = nextStatus;

    if (!isMobileSlotLayout) {
      return;
    }

    if (nextStatus !== 'playing' || previousStatus === 'playing') {
      return;
    }

    setIsMobileSelectorOpen(false);
    setIsMobileHudMenuVisible(false);
    writeTowerDefenseShellVisible(false);
  }, [gameState?.status, isMobileSlotLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOpenMobileLoadout = (event) => {
      if (!isMobileSlotLayout) return;

      const requestedPalette = event?.detail?.palette;
      if (requestedPalette === 'towers' || requestedPalette === 'deployables') {
        onPlacementPaletteChange?.(requestedPalette);
      }

      if (selectedTower) {
        onClearSelectedTower?.();
      }

      setIsMobileSelectorOpen(true);
      setIsMobileHudMenuVisible(false);

      window.dispatchEvent(
        new CustomEvent(TD_MOBILE_LOADOUT_OPENED_EVENT, {
          detail: {
            requestId: event?.detail?.requestId || null,
            source: event?.detail?.source || null,
            palette: requestedPalette === 'deployables' ? 'deployables' : 'towers',
          },
        })
      );
    };

    const handleCollapseMobileUi = (event) => {
      if (!isMobileSlotLayout) return;

      const shouldCloseLoadout = event?.detail?.closeLoadout !== false;
      const shouldHideHud = event?.detail?.hideHud !== false;
      const shouldHideShell = event?.detail?.hideShell !== false;

      if (shouldCloseLoadout) {
        setIsMobileSelectorOpen(false);
      }

      if (shouldHideHud) {
        setIsMobileHudMenuVisible(false);
      }

      if (shouldHideShell) {
        writeTowerDefenseShellVisible(false);
      }
    };

    const handleOpenTowerDetails = () => {
      if (!isMobileSlotLayout || !selectedTower) return;

      setIsMobileSelectorOpen(false);
      setIsMobileHudMenuVisible(false);
      setIsMobileActionDockExpanded(true);
      writeTowerDefenseShellVisible(false);
    };

    window.addEventListener(TD_MOBILE_OPEN_LOADOUT_EVENT, handleOpenMobileLoadout);
    window.addEventListener(TD_MOBILE_COLLAPSE_UI_EVENT, handleCollapseMobileUi);
    window.addEventListener(TD_MOBILE_OPEN_TOWER_DETAILS_EVENT, handleOpenTowerDetails);

    return () => {
      window.removeEventListener(TD_MOBILE_OPEN_LOADOUT_EVENT, handleOpenMobileLoadout);
      window.removeEventListener(TD_MOBILE_COLLAPSE_UI_EVENT, handleCollapseMobileUi);
      window.removeEventListener(TD_MOBILE_OPEN_TOWER_DETAILS_EVENT, handleOpenTowerDetails);
    };
  }, [isMobileSlotLayout, onClearSelectedTower, onPlacementPaletteChange, selectedTower]);

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

  useEffect(() => {
    const element = canvasViewportRef.current;
    if (!element) return undefined;

    const updateViewportSize = () => {
      // Measure the border box so transient scrollbar gutters do not feed back
      // into the fit-scale calculation and make the board oscillate in size.
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.round(rect.width || element.clientWidth || 0);
      const nextHeight = Math.round(rect.height || element.clientHeight || 0);
      setCanvasViewportSize({ width: nextWidth, height: nextHeight });
    };

    if (typeof ResizeObserver === 'undefined') {
      updateViewportSize();
      window.addEventListener('resize', updateViewportSize);
      return () => {
        window.removeEventListener('resize', updateViewportSize);
      };
    }

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(element);
    updateViewportSize();

    return () => {
      observer.disconnect();
    };
  }, []);

  const showStdStreamButtons = isLearningMode;
  const shortenCost = Number(pathActionCosts?.shorten || 0);
  const lengthenCost = Number(pathActionCosts?.lengthen || 0);
  const runTestsCost = Number(verificationActionCosts?.runTests || 0);
  const stdoutCost = Number(verificationActionCosts?.stdout || 0);
  const stderrCost = Number(verificationActionCosts?.stderr || 0);

  const canvasGlitch = useMemo(() => {
    const maxLives = Math.max(1, initialLives || gameState?.lives || 1);
    const currentLives = typeof gameState?.lives === 'number' ? gameState.lives : maxLives;
    const lifeRatio = Math.max(0, Math.min(1, currentLives / maxLives));

    let tier = 0;
    if (lifeRatio <= 0.1) {
      tier = 4;
    } else if (lifeRatio <= 0.3) {
      tier = 3;
    } else if (lifeRatio <= 0.5) {
      tier = 2;
    } else if (lifeRatio <= 0.7) {
      tier = 1;
    }

    const baseIntensity = visualSettings.canvasGlitchIntensity ?? 0;
    const flickerBase = visualSettings.canvasFlickerIntensity ?? 0;
    const flashBase = visualSettings.canvasFlashIntensity ?? 0;
    const enabled = visualSettings.canvasGlitchEnabled !== false;
    const flickerEnabled = visualSettings.canvasFlickerEnabled !== false;
    const flashEnabled = visualSettings.canvasFlashEnabled !== false;
    const tierMultiplier = [0, 0.25, 0.5, 0.75, 1][tier] || 0;
    const effectiveIntensity = enabled
      ? Math.max(0, Math.min(1, baseIntensity * tierMultiplier))
      : 0;
    const effectiveFlicker = flickerEnabled
      ? Math.max(0, Math.min(1, flickerBase * tierMultiplier))
      : 0;
    const effectiveFlash = flashEnabled ? Math.max(0, Math.min(1, flashBase * tierMultiplier)) : 0;
    const active =
      (enabled || flickerEnabled || flashEnabled) && tier > 0 && !isGameOver && !isVictory;

    return {
      active,
      intensity: effectiveIntensity,
      flickerIntensity: effectiveFlicker,
      flashIntensity: effectiveFlash,
    };
  }, [
    gameState.lives,
    initialLives,
    isGameOver,
    isVictory,
    visualSettings.canvasGlitchEnabled,
    visualSettings.canvasGlitchIntensity,
    visualSettings.canvasFlickerEnabled,
    visualSettings.canvasFlickerIntensity,
    visualSettings.canvasFlashEnabled,
    visualSettings.canvasFlashIntensity,
  ]);

  const canvasGlitchStyle = useMemo(() => {
    if (!canvasGlitch.active) {
      return {
        '--glitch-intensity': 0,
        '--glitch-jitter': '0px',
        '--glitch-speed': '1s',
        '--glitch-scan-opacity': 0,
        '--glitch-overlay-opacity': 0,
        '--glitch-flicker-opacity': 0,
        '--glitch-flicker-speed': '1.2s',
        '--glitch-flash-opacity': 0,
      };
    }

    const jitter = (0.8 + canvasGlitch.intensity * 6).toFixed(2);
    const speed = Math.max(0.25, 1.0 - canvasGlitch.intensity * 0.7).toFixed(2);
    const scanOpacity = Math.min(0.5, canvasGlitch.intensity * 0.65).toFixed(2);
    const overlayOpacity = Math.min(0.5, canvasGlitch.intensity * 0.6).toFixed(2);
    const flickerOpacity = Math.min(0.75, canvasGlitch.flickerIntensity * 1.1).toFixed(2);
    const flickerSpeed = Math.max(0.2, 0.7 - canvasGlitch.flickerIntensity * 0.5).toFixed(2);
    const flashOpacity = Math.min(0.8, canvasGlitch.flashIntensity * 1.2).toFixed(2);
    const intrusionOpacity = Math.min(0.9, canvasGlitch.flickerIntensity * 1.3).toFixed(2);

    return {
      '--glitch-intensity': canvasGlitch.intensity,
      '--glitch-jitter': `${jitter}px`,
      '--glitch-speed': `${speed}s`,
      '--glitch-scan-opacity': scanOpacity,
      '--glitch-overlay-opacity': overlayOpacity,
      '--glitch-flicker-opacity': flickerOpacity,
      '--glitch-flicker-speed': `${flickerSpeed}s`,
      '--glitch-flash-opacity': flashOpacity,
      '--intrusion-opacity': intrusionOpacity,
      '--intrusion-speed': `${Math.max(0.4, 1.4 - canvasGlitch.flickerIntensity).toFixed(2)}s`,
    };
  }, [canvasGlitch]);

  const endlessWavesSurvived = Math.max(0, (gameState.endlessWave || 1) - 1);
  const endlessSurvivalSeconds = Math.floor((gameState.endlessSurvivalTime || 0) / 1000);

  const waveLabel = gameState.isEndlessMode
    ? `ENDLESS: ${gameState.endlessWave || 1}`
    : `WAVE: ${gameState.wave}/${gameState.totalWaves || 5}`;

  const deployableLabel = selectedDeployableType
    ? DEPLOYABLE_TYPES[selectedDeployableType]?.type || selectedDeployableType
    : 'Deployable';
  const quickDeployables = useMemo(() => Object.values(DEPLOYABLE_TYPES), []);
  const quickTowers = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const allowedSet = Array.isArray(allowedTowerTypes)
      ? new Set(allowedTowerTypes.map(normalize))
      : null;
    const shouldLimitToCore = gameState.status === 'prehack' || !initialCodeGenerated;

    return Object.entries(TOWER_TYPES)
      .filter(([towerKey, tower]) => {
        const isAllowed =
          !allowedSet ||
          allowedSet.size === 0 ||
          [towerKey, tower.type, tower.conceptKey].some((value) =>
            allowedSet.has(normalize(value))
          );

        if (!isAllowed) return false;
        if (!shouldLimitToCore) return true;

        return (
          isRequiredCoreTower(tower.type, coreTowerRequirements) &&
          missingCoreTowerLabels.includes(tower.type)
        );
      })
      .map(([towerKey, tower]) => ({
        key: towerKey,
        ...tower,
      }));
  }, [
    allowedTowerTypes,
    coreTowerRequirements,
    gameState.status,
    initialCodeGenerated,
    missingCoreTowerLabels,
  ]);

  const placementLabel =
    placementModeKind === 'deployable' ? deployableLabel : selectedTowerType || 'Tower';
  const cancelPlacementLabel =
    placementModeKind === 'deployable' ? 'CANCEL DEPLOYMENT' : 'CANCEL PURCHASE';
  const selectedTowerTargeting =
    selectedTower?.effectiveTargeting || selectedTower?.targeting || TARGETING_MODES[0];
  const selectedTowerTargetingIndex = Math.max(0, TARGETING_MODES.indexOf(selectedTowerTargeting));
  const nextSelectedTowerTargeting =
    TARGETING_MODES[(selectedTowerTargetingIndex + 1) % TARGETING_MODES.length];
  const nextSelectedTowerSpecialTier = (selectedTower?.specialUpgradeLevel || 0) + 1;
  const selectedTowerCanUpgrade =
    Boolean(onUpgradeSelectedTower) &&
    selectedTower?.nextUpgradeCost != null &&
    gameState.credits >= selectedTower.nextUpgradeCost;
  const selectedTowerCanSpecialUpgrade =
    Boolean(onSpecialUpgradeSelectedTower) &&
    Boolean(selectedTower?.canSpecialUpgrade) &&
    selectedTower?.nextSpecialUpgradeCost != null &&
    gameState.credits >= selectedTower.nextSpecialUpgradeCost &&
    !(
      isSpecialUpgradeUnlocked &&
      !isSpecialUpgradeUnlocked(selectedTower?.type, nextSelectedTowerSpecialTier)
    );
  const isMobileCanvasMode = isMobileSlotLayout;
  const canQuickPlaceTowers =
    towerSelectorEnabled && ['ready', 'playing', 'wave-complete'].includes(gameState.status);
  const canQuickPlaceDeployables =
    deployableMenuEnabled && ['ready', 'playing', 'wave-complete'].includes(gameState.status);
  const showMobileActionDock =
    isMobileCanvasMode &&
    !isMobileChatFocus &&
    (Boolean(selectedTower) || canQuickPlaceTowers || canQuickPlaceDeployables) &&
    !isMobileSelectorOpen &&
    !isTowerPlacementMode &&
    !isGameOver &&
    !isVictory;

  const showSidePanel = towerSelectorEnabled || deployableMenuEnabled || Boolean(selectedTower);
  const showMobileSelectorToggle = isMobileSlotLayout && showSidePanel;
  const shouldRenderSidePanel = showSidePanel && (!isMobileSlotLayout || isMobileSelectorOpen);
  const showTowerToggle = towerSelectorEnabled;
  const showDeployableToggle = deployableMenuEnabled;
  const autoStartCountdownLabel = useMemo(() => {
    if (autoStartCountdown === null || autoStartCountdown === undefined) return null;
    const minutes = Math.floor(autoStartCountdown / 60);
    const seconds = autoStartCountdown % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [autoStartCountdown]);
  const showMobileJackInAction =
    isMobileCanvasMode && showJackInButton && !hardcoreMode && !isGameOver && !isVictory;
  const showMobileStartWaveAction =
    isMobileCanvasMode && showStartWaveButton && !autoStartWaves && !isGameOver && !isVictory;
  const showMobileVerificationControls =
    isMobileCanvasMode && shouldShowVerificationControls && !isGameOver && !isVictory;
  const jackInLockedByOnboarding =
    Boolean(activeOnboardingStepId) && activeOnboardingStepId !== 'jack-in';

  const mobileTerminalFeedLines = useMemo(() => {
    const toLineText = (entry) => {
      if (typeof entry === 'string') return entry;
      if (!entry || typeof entry !== 'object') return '';
      if (typeof entry.text === 'string') return entry.text;
      if (typeof entry.message === 'string') return entry.message;
      return '';
    };

    const flattenedOutput = Array.isArray(terminalOutput)
      ? terminalOutput.map(toLineText).filter(Boolean).join('')
      : typeof terminalOutput === 'string'
        ? terminalOutput
        : toLineText(terminalOutput);

    if (!flattenedOutput) return [];

    return flattenedOutput
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0)
      .slice(-5);
  }, [terminalOutput]);

  const showMobileTerminalFeed =
    isMobileCanvasMode && (mobileTerminalFeedLines.length > 0 || isExecuting);

  const showGameHudControls =
    (!hardcoreMode && (onShortenPath || onLengthenPath)) ||
    showMobileSelectorToggle ||
    Boolean(slotSwitcherControl) ||
    Boolean(slotChrome) ||
    showMobileJackInAction ||
    showMobileStartWaveAction ||
    showMobileVerificationControls ||
    showMobileTerminalFeed;
  const showMobileHudMenuToggle = isMobileCanvasMode && showGameHudControls;
  const showCompactHudControlsPanel =
    showGameHudControls &&
    (!isMobileCanvasMode || (isMobileHudMenuVisible && !isMobileSelectorOpen));
  const requireLandscapeOnMobile = isMobileSlotLayout;
  const showRotateLandscapeGuard =
    requireLandscapeOnMobile && !isLandscapeViewport && !isMobileChatFocus;
  const showMobileContinuePrompt =
    isMobileCanvasMode &&
    gameState.status === 'ready' &&
    !initialCodeGenerated &&
    !isGameOver &&
    !isVictory;
  const topHudClearance = isMobileCanvasMode
    ? showCompactHudControlsPanel
      ? showMobileVerificationControls || showMobileTerminalFeed
        ? 96
        : 60
      : showMobileHudMenuToggle
        ? 36
        : 16
    : showGameHudControls
      ? 138
      : 84;
  const bottomHudClearance = isMobileCanvasMode
    ? showMobileContinuePrompt
      ? 36
      : 12
    : showJackInButton ||
        showStartWaveButton ||
        (gameState.status === 'ready' && !initialCodeGenerated && !isGameOver && !isVictory)
      ? 96
      : 20;
  const availableCanvasWidth = Math.max(
    0,
    canvasViewportSize.width - (isMobileCanvasMode ? 0 : 16)
  );
  const availableCanvasHeight = Math.max(
    0,
    canvasViewportSize.height -
      (topHudClearance + bottomHudClearance + (isMobileCanvasMode ? 8 : 24))
  );
  const canvasFitScale = useMemo(() => {
    return resolveCanvasFitScale({
      availableCanvasWidth,
      availableCanvasHeight,
      canvasWidth,
      canvasHeight,
      isMobileCanvasMode,
    });
  }, [availableCanvasHeight, availableCanvasWidth, canvasHeight, canvasWidth, isMobileCanvasMode]);
  const displayCanvasWidth = Math.round(canvasWidth * canvasFitScale);
  const displayCanvasHeight = Math.round(canvasHeight * canvasFitScale);
  const mobileCanvasViewportHeight = useMemo(() => {
    if (!isMobileCanvasMode) {
      return null;
    }

    return resolveMobileCanvasViewportHeight({
      canvasViewportHeight: canvasViewportSize.height,
      displayCanvasHeight,
      topHudClearance,
      bottomHudClearance,
    });
  }, [
    bottomHudClearance,
    canvasViewportSize.height,
    displayCanvasHeight,
    isMobileCanvasMode,
    topHudClearance,
  ]);
  const mobileCanvasViewportHeightPx =
    isMobileCanvasMode && mobileCanvasViewportHeight
      ? `${mobileCanvasViewportHeight}px`
      : undefined;
  const showBelowCanvasVerificationControls =
    !isMobileCanvasMode && shouldShowVerificationControls && !isGameOver && !isVictory;
  useEffect(() => {
    if (isMobileCanvasMode && isTowerPlacementMode) {
      setIsMobileHudMenuVisible(false);
      setIsMobileActionDockExpanded(false);
      if (isMobileSelectorOpen) {
        setIsMobileSelectorOpen(false);
      }
      return;
    }

    if (showMobileVerificationControls) {
      setIsMobileHudMenuVisible(true);
    }

    if (!(isMobileCanvasMode && isExecuting)) return;

    setIsMobileHudMenuVisible(true);
    if (isMobileSelectorOpen) {
      setIsMobileSelectorOpen(false);
    }
  }, [
    isExecuting,
    isMobileCanvasMode,
    isMobileSelectorOpen,
    isTowerPlacementMode,
    showMobileVerificationControls,
  ]);

  useEffect(() => {
    if (showMobileActionDock) {
      return;
    }

    setIsMobileActionDockExpanded(false);
  }, [showMobileActionDock]);

  useEffect(() => {
    if (!isMobileCanvasMode || !MOBILE_HUD_FOCUS_STEP_IDS.has(activeOnboardingStepId)) {
      return;
    }

    setIsMobileSelectorOpen(false);
    setIsMobileActionDockExpanded(false);
    setIsMobileHudMenuVisible(true);
    writeTowerDefenseShellVisible(true);
  }, [activeOnboardingStepId, isMobileCanvasMode]);

  const handleTowerSelection = useCallback(
    (towerType) => {
      onSelectTowerType?.(towerType);
      if (isMobileCanvasMode) {
        setIsMobileSelectorOpen(false);
      }
      if (isHomepageDemo) {
        funnel.towerSelected(towerType);
      }
    },
    [isMobileCanvasMode, onSelectTowerType, isHomepageDemo, funnel]
  );

  const handleDeployableSelection = useCallback(
    (deployableType) => {
      onSelectDeployableType?.(deployableType);
      if (isMobileCanvasMode) {
        setIsMobileSelectorOpen(false);
      }
    },
    [isMobileCanvasMode, onSelectDeployableType]
  );

  const handleQuickDeployableSelection = (deployableType) => {
    onClearSelectedTower?.();
    onPlacementPaletteChange?.('deployables');
    handleDeployableSelection(deployableType);
    setIsMobileActionDockExpanded(false);
    setIsMobileHudMenuVisible(false);
    writeTowerDefenseShellVisible(false);
  };

  const handleQuickTowerSelection = (towerType) => {
    onClearSelectedTower?.();
    onPlacementPaletteChange?.('towers');
    handleTowerSelection(towerType);
    setIsMobileActionDockExpanded(false);
    setIsMobileHudMenuVisible(false);
    writeTowerDefenseShellVisible(false);
  };

  const renderVerificationControls = (compact = false) => {
    const buttonSize = compact ? 'xs' : 'sm';
    const badgeFontSize = compact ? '3xs' : '2xs';

    return (
      <Flex align="center" justify="center" gap={2} wrap="wrap">
        <HStack spacing={2} data-tutorial="learning-path-action-buttons">
          {!isHomepageDemo && (
            <Button
              size={buttonSize}
              colorScheme={isRetroDesktopTheme ? undefined : 'cyan'}
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              onClick={onRunCode}
              isLoading={isExecuting}
              isDisabled={!initialCodeGenerated || gameState.credits < runTestsCost}
              boxShadow={isRetroDesktopTheme ? undefined : '0 0 12px rgba(0, 204, 255, 0.5)'}
              _hover={
                isRetroDesktopTheme
                  ? undefined
                  : {
                      boxShadow: '0 0 20px rgba(0, 204, 255, 0.8)',
                      transform: 'scale(1.03)',
                    }
              }
              fontFamily={hudFontFamily}
              fontSize="xs"
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              Run Tests ({runTestsCost})
            </Button>
          )}
          {!isHomepageDemo && showStdStreamButtons && (
            <Button
              size={buttonSize}
              colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              onClick={() => onRunOutput?.('stdout')}
              isLoading={isExecuting}
              isDisabled={!initialCodeGenerated || gameState.credits < stdoutCost}
              boxShadow={isRetroDesktopTheme ? undefined : '0 0 12px rgba(153, 102, 255, 0.5)'}
              _hover={
                isRetroDesktopTheme
                  ? undefined
                  : {
                      boxShadow: '0 0 20px rgba(153, 102, 255, 0.8)',
                      transform: 'scale(1.03)',
                    }
              }
              fontFamily={hudFontFamily}
              fontSize="xs"
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              Stdout ({stdoutCost})
            </Button>
          )}
          {!isHomepageDemo && showStdStreamButtons && (
            <Button
              size={buttonSize}
              colorScheme={isRetroDesktopTheme ? undefined : 'orange'}
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              onClick={() => onRunOutput?.('stderr')}
              isLoading={isExecuting}
              isDisabled={!initialCodeGenerated || gameState.credits < stderrCost}
              boxShadow={isRetroDesktopTheme ? undefined : '0 0 12px rgba(255, 153, 0, 0.45)'}
              _hover={
                isRetroDesktopTheme
                  ? undefined
                  : {
                      boxShadow: '0 0 20px rgba(255, 153, 0, 0.75)',
                      transform: 'scale(1.03)',
                    }
              }
              fontFamily={hudFontFamily}
              fontSize="xs"
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              Stderr ({stderrCost})
            </Button>
          )}
          <Button
            size={buttonSize}
            colorScheme={isRetroDesktopTheme ? undefined : 'green'}
            variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
            onClick={onSubmitSolution}
            isLoading={isExecuting}
            isDisabled={!initialCodeGenerated || codeSubmitted}
            boxShadow={isRetroDesktopTheme ? undefined : '0 0 14px rgba(0, 255, 140, 0.55)'}
            _hover={
              isRetroDesktopTheme
                ? undefined
                : {
                    boxShadow: '0 0 22px rgba(0, 255, 140, 0.9)',
                    transform: 'scale(1.05)',
                  }
            }
            fontFamily={hudFontFamily}
            fontSize="xs"
            data-tutorial="verify-button"
            sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            {...(isHomepageDemo && {
              animation: 'demoVerifyPulse 1.8s ease-in-out infinite',
              sx: {
                '@keyframes demoVerifyPulse': {
                  '0%, 100%': {
                    boxShadow: '0 0 14px rgba(0, 255, 140, 0.55)',
                    transform: 'scale(1)',
                  },
                  '50%': {
                    boxShadow: '0 0 30px rgba(0, 255, 140, 1), 0 0 60px rgba(0, 255, 140, 0.5)',
                    transform: 'scale(1.07)',
                  },
                },
              },
            })}
          >
            Verify Solution
          </Button>
        </HStack>
        <Text
          color={isRetroDesktopTheme ? '#7b5b13' : '#ffcc00'}
          fontFamily={hudFontFamily}
          fontSize={badgeFontSize}
          letterSpacing="0.5px"
          textShadow={isRetroDesktopTheme ? 'none' : '0 0 6px rgba(255, 204, 0, 0.7)'}
          {...(isHomepageDemo && {
            animation: 'demoTextPulse 1.8s ease-in-out infinite',
            sx: {
              '@keyframes demoTextPulse': {
                '0%, 100%': {
                  textShadow: '0 0 6px rgba(255, 204, 0, 0.7)',
                  opacity: 1,
                },
                '50%': {
                  textShadow: '0 0 16px rgba(255, 204, 0, 1), 0 0 30px rgba(255, 204, 0, 0.6)',
                  opacity: 0.85,
                },
              },
            },
          })}
        >
          Verify before final wave
        </Text>
        <CodeExecutionRateLimitBadge label="Exec" />
      </Flex>
    );
  };

  const renderGameStatusSummary = () => (
    <HStack
      spacing={isMobileCanvasMode ? 2 : 3}
      fontSize={isMobileCanvasMode ? '2xs' : 'xs'}
      fontFamily={hudFontFamily}
      flexWrap="wrap"
    >
      <Text color={isRetroDesktopTheme ? '#7b5b13' : '#FFCC00'} fontWeight="bold">
        BITS: {gameState.credits}
      </Text>
      <Text
        color={
          isRetroDesktopTheme
            ? gameState.lives > 5
              ? '#285d2f'
              : '#8b1f18'
            : gameState.lives > 5
              ? '#00ff8c'
              : '#ff3366'
        }
        fontWeight="bold"
        data-tutorial="lives-display"
      >
        LIVES: {gameState.lives}
      </Text>
      <Text color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'} fontWeight="bold">
        {waveLabel}
      </Text>
      <Text color={isRetroDesktopTheme ? '#7c4914' : '#ff9900'}>
        ENEMIES: {gameState.enemiesRemaining}
      </Text>
    </HStack>
  );

  const renderHudControlsContent = () => (
    <VStack spacing={1} align="stretch">
      <HStack
        spacing={1}
        flexWrap="wrap"
        justify={
          isMobileCanvasMode
            ? showMobileVerificationControls
              ? 'flex-start'
              : 'flex-end'
            : 'flex-start'
        }
      >
        {!isHomepageDemo && (onShortenPath || onLengthenPath) && !hardcoreMode && (
          <>
            {!isMobileCanvasMode && (
              <Text
                color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                fontSize="xs"
                fontFamily={hudFontFamily}
                letterSpacing="0.5px"
              >
                PATH CTRL
              </Text>
            )}
            <Button
              size="xs"
              colorScheme={isRetroDesktopTheme ? undefined : 'cyan'}
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              onClick={onShortenPath}
              isDisabled={!canAdjustPath || isAdjustingPath || gameState.credits < shortenCost}
              fontFamily={hudFontFamily}
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              SHORTEN ({shortenCost})
            </Button>
            <Button
              size="xs"
              colorScheme={isRetroDesktopTheme ? undefined : 'green'}
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              onClick={onLengthenPath}
              isDisabled={!canAdjustPath || isAdjustingPath || gameState.credits < lengthenCost}
              fontFamily={hudFontFamily}
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              LENGTHEN ({lengthenCost})
            </Button>
          </>
        )}
        {showMobileJackInAction && (
          <Button
            size="xs"
            colorScheme={isRetroDesktopTheme ? undefined : 'green'}
            variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
            onClick={onJackIn}
            isDisabled={jackInLockedByOnboarding}
            fontFamily={hudFontFamily}
            data-tutorial="jack-in-button"
            sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
          >
            JACK IN
          </Button>
        )}
        {showMobileStartWaveAction && (
          <Button
            size="xs"
            colorScheme={isRetroDesktopTheme ? undefined : 'green'}
            variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
            onClick={() => onStartWave('normal')}
            fontFamily={hudFontFamily}
            data-tutorial={gameState.wave === 1 ? 'game-start-wave-button' : undefined}
            sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
          >
            START W{gameState.wave}
          </Button>
        )}
        {showMobileSelectorToggle && (
          <Button
            size="xs"
            colorScheme={isRetroDesktopTheme ? undefined : isMobileSelectorOpen ? 'red' : 'cyan'}
            variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
            onClick={() => {
              if (isMobileSelectorOpen && selectedTower) {
                onClearSelectedTower?.();
              }
              setIsMobileSelectorOpen((previous) => !previous);
            }}
            fontFamily={hudFontFamily}
            sx={isRetroDesktopTheme ? createRetroWindowsButtonSx(isMobileSelectorOpen) : undefined}
          >
            {isMobileSelectorOpen ? 'HIDE LOADOUT' : 'OPEN LOADOUT'}
          </Button>
        )}
        {slotChrome}
        {slotSwitcherControl}
      </HStack>

      {showMobileVerificationControls && (
        <Box borderTop="1px solid rgba(0, 255, 140, 0.22)" mt={1} pt={1}>
          {renderVerificationControls(true)}
        </Box>
      )}

      {showMobileTerminalFeed && (
        <Box
          borderTop="1px solid rgba(0, 255, 140, 0.22)"
          mt={1}
          pt={1}
          data-tutorial="mobile-terminal-feed"
        >
          <Text
            color={isRetroDesktopTheme ? '#2f3641' : '#9feaff'}
            fontSize="2xs"
            fontFamily={hudFontFamily}
            letterSpacing="0.08em"
            textTransform="uppercase"
            mb={1}
          >
            Terminal Feed
          </Text>

          <Box
            maxH="92px"
            overflowY="auto"
            border="1px solid rgba(0, 204, 255, 0.25)"
            borderRadius="sm"
            px={2}
            py={1.5}
            bg="rgba(0, 8, 18, 0.82)"
          >
            {mobileTerminalFeedLines.length > 0 ? (
              <VStack spacing={0.5} align="stretch">
                {mobileTerminalFeedLines.map((line, index) => (
                  <Text
                    key={`${index}-${line.slice(0, 24)}`}
                    color="#b9f6ff"
                    fontSize="2xs"
                    fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
                    lineHeight="1.3"
                    whiteSpace="pre-wrap"
                  >
                    {line}
                  </Text>
                ))}
              </VStack>
            ) : (
              <Text
                color="#7bc4d8"
                fontSize="2xs"
                fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
              >
                Waiting for terminal output...
              </Text>
            )}
          </Box>
        </Box>
      )}
    </VStack>
  );

  const loadoutPanelBody = selectedTower ? (
    <TowerUpgradePanel
      selectedTower={selectedTower}
      credits={gameState.credits}
      onUpgrade={onUpgradeSelectedTower}
      onSpecialUpgrade={onSpecialUpgradeSelectedTower}
      onTargetingChange={onSetSelectedTowerTargeting}
      onSell={onSellSelectedTower}
      onClose={onClearSelectedTower}
      hardcoreMode={hardcoreMode}
      isSpecialUpgradeUnlocked={isSpecialUpgradeUnlocked}
      shellTheme={shellTheme}
    />
  ) : (
    <VStack spacing={3} align="stretch">
      {!isHomepageDemo && (showTowerToggle || showDeployableToggle) && (
        <HStack px={3} pt={3} spacing={2} justify="center">
          {showTowerToggle && (
            <Button
              size="sm"
              variant={
                isRetroDesktopTheme
                  ? 'unstyled'
                  : placementPalette === 'towers'
                    ? 'solid'
                    : 'outline'
              }
              colorScheme={
                isRetroDesktopTheme ? undefined : placementPalette === 'towers' ? 'cyan' : 'gray'
              }
              color={placementPalette === 'towers' ? undefined : '#bfe9ff'}
              borderColor={placementPalette === 'towers' ? undefined : 'rgba(0, 204, 255, 0.6)'}
              bg={placementPalette === 'towers' ? undefined : 'rgba(10, 20, 40, 0.6)'}
              _hover={
                placementPalette === 'towers'
                  ? undefined
                  : {
                      bg: 'rgba(10, 30, 60, 0.8)',
                      color: '#e6f7ff',
                      borderColor: 'rgba(0, 204, 255, 0.9)',
                    }
              }
              onClick={() => onPlacementPaletteChange?.('towers')}
              data-tutorial="tower-tab"
              fontFamily={hudFontFamily}
              sx={
                isRetroDesktopTheme
                  ? createRetroWindowsButtonSx(placementPalette === 'towers')
                  : undefined
              }
            >
              TOWERS
            </Button>
          )}
          {showDeployableToggle && (
            <Button
              size="sm"
              variant={
                isRetroDesktopTheme
                  ? 'unstyled'
                  : placementPalette === 'deployables'
                    ? 'solid'
                    : 'outline'
              }
              colorScheme={
                isRetroDesktopTheme
                  ? undefined
                  : placementPalette === 'deployables'
                    ? 'orange'
                    : 'gray'
              }
              color={placementPalette === 'deployables' ? undefined : '#ffd7a6'}
              borderColor={
                placementPalette === 'deployables' ? undefined : 'rgba(255, 153, 0, 0.7)'
              }
              bg={placementPalette === 'deployables' ? undefined : 'rgba(30, 20, 5, 0.6)'}
              _hover={
                placementPalette === 'deployables'
                  ? undefined
                  : {
                      bg: 'rgba(50, 30, 10, 0.8)',
                      color: '#ffe4bf',
                      borderColor: 'rgba(255, 153, 0, 0.9)',
                    }
              }
              onClick={() => onPlacementPaletteChange?.('deployables')}
              data-tutorial="deployable-tab"
              fontFamily={hudFontFamily}
              sx={
                isRetroDesktopTheme
                  ? createRetroWindowsButtonSx(placementPalette === 'deployables')
                  : undefined
              }
            >
              DEPLOYABLES
            </Button>
          )}
        </HStack>
      )}

      {placementPalette === 'deployables' && deployableMenuEnabled ? (
        <DeployableSelector
          credits={gameState.credits}
          selectedDeployableType={selectedDeployableType}
          onSelectDeployable={handleDeployableSelection}
          gameStatus={gameState.status}
          onCancelPlacement={onCancelPlacement}
          deployableUnlockGates={deployableUnlockGates}
          shellTheme={shellTheme}
        />
      ) : null}

      {placementPalette !== 'deployables' && towerSelectorEnabled ? (
        <TowerSelector
          credits={gameState.credits}
          selectedTowerType={selectedTowerType}
          onSelectTower={handleTowerSelection}
          isTowerPlacementMode={isTowerPlacementMode}
          gameStatus={gameState.status}
          initialCodeGenerated={initialCodeGenerated}
          functionTowerPlaced={functionTowerPlaced}
          objectTowerPlaced={objectTowerPlaced}
          coreTowerRequirements={coreTowerRequirements}
          allowedTowerTypes={allowedTowerTypes}
          strictCodeGate={true}
          onCancelPlacement={onCancelPlacement}
          towerUnlockGates={towerUnlockGates}
          shellTheme={shellTheme}
          isHomepageDemo={isHomepageDemo}
        />
      ) : null}

      {!towerSelectorEnabled && !deployableMenuEnabled && (
        <Box px={4} py={6} textAlign="center">
          <Text
            color={isRetroDesktopTheme ? '#1f2430' : 'gray.400'}
            fontSize="sm"
            fontFamily={hudFontFamily}
            fontWeight={isRetroDesktopTheme ? '700' : undefined}
          >
            {isRetroDesktopTheme ? 'Terminal Mode Only' : 'TERMINAL-ONLY MODE'}
          </Text>
          <Text color={isRetroDesktopTheme ? '#4b5563' : 'gray.500'} fontSize="xs" mt={2}>
            Use /tower and /deployable commands.
          </Text>
        </Box>
      )}
    </VStack>
  );

  const shouldRenderMobileLoadoutOverlay = isMobileCanvasMode && shouldRenderSidePanel;
  const shouldRenderDesktopSidePanel = !isMobileCanvasMode && shouldRenderSidePanel;

  return (
    <Flex
      h={isMobileCanvasMode ? 'auto' : '100%'}
      minH={mobileCanvasViewportHeightPx || '0'}
      gap={2}
      direction={isMobileCanvasMode ? 'column' : 'row'}
      position="relative"
    >
      <Flex
        direction="column"
        flex={isMobileCanvasMode ? '0 0 auto' : isMobileSlotLayout ? '1 1 auto' : '3'}
        minW="0"
        minH={mobileCanvasViewportHeightPx || '0'}
        h={isMobileCanvasMode ? 'auto' : '100%'}
        gap={0}
      >
        <GameBoard
          playerLost={isGameOver}
          playerWon={isVictory}
          lives={gameState.lives}
          credits={gameState.credits}
          formattedTime={formattedTime}
          codeSubmissionSuccess={codeSubmissionSuccess}
          isEndlessMode={gameState.isEndlessMode}
          endlessScore={gameState.endlessScore || 0}
          endlessWavesSurvived={endlessWavesSurvived}
          endlessSurvivalSeconds={endlessSurvivalSeconds}
          totalWaves={gameState.totalWaves || 5}
          onResetGame={onResetGame}
          onNavigateToList={onNavigateToList}
          navigateToListLabel={navigateToListLabel}
          containerProps={
            isMobileCanvasMode
              ? {
                  flex: '0 0 auto',
                  minH: mobileCanvasViewportHeightPx,
                  h: 'auto',
                }
              : undefined
          }
          contentProps={
            isMobileCanvasMode
              ? {
                  minH: mobileCanvasViewportHeightPx,
                  h: 'auto',
                }
              : undefined
          }
        >
          <Box
            ref={canvasViewportRef}
            data-tutorial="game-canvas"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            position="relative"
            minW="0"
            w="100%"
            h={isMobileCanvasMode ? 'auto' : '100%'}
            minH={mobileCanvasViewportHeightPx || '100%'}
            overflow="hidden"
            pt={`${topHudClearance}px`}
            pb={`${bottomHudClearance}px`}
            boxSizing="border-box"
            className={canvasGlitch.active ? 'td-canvas-glitch glitch-active' : 'td-canvas-glitch'}
            style={canvasGlitchStyle}
          >
            {canvasGlitch.active && (
              <>
                <Box className="td-canvas-flicker" />
                <Box className="td-canvas-flash" />
                {canvasGlitch.flickerIntensity > 0.05 && (
                  <Box className="td-canvas-intrusion">
                    <Box textAlign="center">
                      <Text fontSize="14px" fontWeight="bold" letterSpacing="2px">
                        INTRUSION DETECTED
                      </Text>
                      <Text fontSize="11px">{'>'} SIGNAL TRACE: ACTIVE</Text>
                      <Text fontSize="11px">{'>'} POSITION REVEALED</Text>
                      <Text fontSize="11px">{'>'} DEFENSE MATRIX LOCKED</Text>
                      <Text fontSize="11px">{'>'} HACK IMMINENT</Text>
                    </Box>
                  </Box>
                )}
              </>
            )}
            <canvas
              ref={canvasRefCallback}
              data-tutorial="game-grid"
              width={canvasWidth}
              height={canvasHeight}
              style={{
                width: `${Math.max(1, displayCanvasWidth || canvasWidth)}px`,
                height: `${Math.max(1, displayCanvasHeight || canvasHeight)}px`,
                border: isRetroDesktopTheme ? '2px solid #232730' : '2px solid #00ff8c',
                borderRadius: isRetroDesktopTheme ? '0' : '8px',
                cursor: isTowerPlacementMode ? 'crosshair' : 'pointer',
                boxShadow: isRetroDesktopTheme
                  ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.42), inset -1px -1px 0 rgba(66, 72, 82, 0.2)'
                  : '0 0 30px rgba(0, 255, 140, 0.3)',
                display: 'block',
                filter:
                  isHomepageDemo &&
                  !isTowerPlacementMode &&
                  !functionTowerPlaced &&
                  !objectTowerPlaced
                    ? 'blur(5px) opacity(0.6)'
                    : 'none',
                transition: 'filter 0.5s ease',
              }}
              onClick={onCanvasClick}
              onMouseMove={onCanvasMouseMove}
              onMouseLeave={onCanvasMouseLeave}
              aria-hidden={showRotateLandscapeGuard}
            />

            {showRotateLandscapeGuard && (
              <Box
                position="absolute"
                inset="0"
                zIndex={6}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="rgba(2, 6, 14, 0.94)"
                px={5}
                textAlign="center"
                backdropFilter="blur(3px)"
              >
                <VStack spacing={3} maxW="340px">
                  <Text
                    color={isRetroDesktopTheme ? '#000080' : '#00e5ff'}
                    fontSize="lg"
                    fontWeight="bold"
                    fontFamily={hudFontFamily}
                    letterSpacing="0.06em"
                  >
                    {isRetroDesktopTheme ? 'Rotate For Landscape' : 'Rotate To Landscape'}
                  </Text>
                  <Text
                    color={isRetroDesktopTheme ? '#2d3440' : '#bfe9ff'}
                    fontSize="sm"
                    lineHeight="1.6"
                  >
                    Tower Defense on phone runs in horizontal mode so the entire map path stays in
                    view. Rotate your device to continue.
                  </Text>
                </VStack>
              </Box>
            )}

            {isMapLoading && (
              <Box
                position="absolute"
                inset="0"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isRetroDesktopTheme ? 'rgba(212, 208, 200, 0.94)' : 'rgba(0, 10, 20, 0.75)'}
                borderRadius={isRetroDesktopTheme ? '0' : '8px'}
                border={
                  isRetroDesktopTheme ? '2px solid #232730' : '1px solid rgba(0, 255, 140, 0.35)'
                }
                backdropFilter={isRetroDesktopTheme ? undefined : 'blur(2px)'}
                zIndex={2}
                boxShadow={
                  isRetroDesktopTheme
                    ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
                    : undefined
                }
              >
                <VStack spacing={2} fontFamily={hudFontFamily}>
                  <Text
                    color={isRetroDesktopTheme ? '#1f2128' : '#00ff8c'}
                    fontSize="sm"
                    fontWeight="bold"
                    letterSpacing="1px"
                  >
                    {isRetroDesktopTheme
                      ? 'Preparing battlefield...'
                      : 'SYNTHESIZING BATTLEFIELD...'}
                  </Text>
                  <Text color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'} fontSize="xs">
                    {isRetroDesktopTheme ? 'Loading desktop map assets' : 'Loading neural grid'}
                  </Text>
                </VStack>
              </Box>
            )}

            {/* In-game status overlay */}
            <Box
              position="absolute"
              top="8px"
              left={isMobileCanvasMode ? '8px' : 'auto'}
              right={isMobileCanvasMode ? 'auto' : '8px'}
              zIndex={7}
              maxW={isMobileCanvasMode ? 'calc(100% - 92px)' : 'none'}
            >
              <Box
                {...(isRetroDesktopTheme
                  ? retroSurfaceProps
                  : {
                      bg: 'rgba(0, 20, 40, 0.8)',
                      borderRadius: 'md',
                      border: '1px solid rgba(0, 255, 140, 0.3)',
                    })}
                px={isMobileCanvasMode ? 2 : 3}
                py={isMobileCanvasMode ? 1.5 : 2}
              >
                {renderGameStatusSummary()}
              </Box>
            </Box>

            {showMobileHudMenuToggle && (
              <Box position="absolute" top="8px" right="8px" zIndex={7}>
                <Button
                  size="xs"
                  variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                  colorScheme={isRetroDesktopTheme ? undefined : 'cyan'}
                  fontFamily={hudFontFamily}
                  onClick={() => setIsMobileHudMenuVisible((previous) => !previous)}
                  sx={
                    isRetroDesktopTheme
                      ? createRetroWindowsButtonSx(isMobileHudMenuVisible)
                      : undefined
                  }
                >
                  {isMobileHudMenuVisible ? 'HIDE UI' : 'SHOW UI'}
                </Button>
              </Box>
            )}

            {showCompactHudControlsPanel && (
              <Box
                position="absolute"
                top={isMobileCanvasMode ? '40px' : '44px'}
                left={
                  isMobileCanvasMode && showMobileVerificationControls
                    ? '8px'
                    : isMobileCanvasMode
                      ? 'auto'
                      : '10px'
                }
                right={isMobileCanvasMode ? '8px' : 'auto'}
                {...(isRetroDesktopTheme
                  ? retroSurfaceProps
                  : {
                      bg: 'rgba(0, 20, 40, 0.8)',
                      borderRadius: 'md',
                      border: '1px solid rgba(0, 255, 140, 0.3)',
                    })}
                px={isMobileCanvasMode ? 1 : 2}
                py={isMobileCanvasMode ? 0.5 : 1}
                maxW={
                  isMobileCanvasMode
                    ? showMobileVerificationControls
                      ? 'calc(100% - 16px)'
                      : '58%'
                    : 'none'
                }
              >
                {renderHudControlsContent()}
              </Box>
            )}

            {/* Jack In Button - shown only in prehack state */}
            {showJackInButton &&
              !hardcoreMode &&
              !isGameOver &&
              !isVictory &&
              !isMobileCanvasMode && (
                <Box
                  position="absolute"
                  bottom={isMobileCanvasMode ? '10px' : '20px'}
                  left={isMobileCanvasMode ? 'auto' : '50%'}
                  right={isMobileCanvasMode ? '12px' : 'auto'}
                  transform={isMobileCanvasMode ? 'none' : 'translateX(-50%)'}
                >
                  <Button
                    colorScheme={isRetroDesktopTheme ? undefined : 'green'}
                    size={isMobileCanvasMode ? 'md' : 'lg'}
                    onClick={onJackIn}
                    isDisabled={jackInLockedByOnboarding}
                    boxShadow={isRetroDesktopTheme ? undefined : '0 0 20px rgba(0, 255, 136, 0.5)'}
                    fontFamily={hudFontFamily}
                    data-tutorial="jack-in-button"
                    variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                    sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
                  >
                    JACK IN
                  </Button>
                </Box>
              )}

            {/* Start Wave Button - shown after towers placed or between waves */}
            {showStartWaveButton &&
              !autoStartWaves &&
              !isGameOver &&
              !isVictory &&
              !isMobileCanvasMode && (
                <Box
                  position="absolute"
                  bottom={isMobileCanvasMode ? '10px' : '20px'}
                  left={isMobileCanvasMode ? 'auto' : '50%'}
                  right={isMobileCanvasMode ? '12px' : 'auto'}
                  transform={isMobileCanvasMode ? 'none' : 'translateX(-50%)'}
                >
                  <Button
                    colorScheme={isRetroDesktopTheme ? undefined : 'green'}
                    size={isMobileCanvasMode ? 'md' : 'lg'}
                    onClick={() => onStartWave('normal')}
                    boxShadow={isRetroDesktopTheme ? undefined : '0 0 20px rgba(0, 255, 136, 0.5)'}
                    fontFamily={hudFontFamily}
                    data-tutorial={gameState.wave === 1 ? 'game-start-wave-button' : undefined}
                    variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                    sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
                  >
                    START WAVE {gameState.wave}
                  </Button>
                </Box>
              )}

            {showStartWaveButton &&
              autoStartWaves &&
              autoStartCountdown !== null &&
              !isGameOver &&
              !isVictory && (
                <Box
                  position="absolute"
                  bottom={isMobileCanvasMode ? '10px' : '20px'}
                  left={isMobileCanvasMode ? 'auto' : '50%'}
                  right={isMobileCanvasMode ? '12px' : 'auto'}
                  transform={isMobileCanvasMode ? 'none' : 'translateX(-50%)'}
                >
                  <Box
                    px={4}
                    py={2}
                    {...(isRetroDesktopTheme
                      ? retroSurfaceProps
                      : {
                          borderRadius: 'md',
                          bg: 'rgba(0, 0, 0, 0.7)',
                          border: '1px solid rgba(0, 255, 136, 0.5)',
                          boxShadow: '0 0 20px rgba(0, 255, 136, 0.35)',
                        })}
                  >
                    <Text
                      color={isRetroDesktopTheme ? '#1f2128' : '#00ff88'}
                      fontFamily={hudFontFamily}
                      fontSize="sm"
                      textAlign="center"
                    >
                      AUTO-START IN {autoStartCountdownLabel}
                    </Text>
                    <Text
                      color={isRetroDesktopTheme ? '#3f4550' : 'gray.300'}
                      fontFamily={hudFontFamily}
                      fontSize="xs"
                      textAlign="center"
                    >
                      Use /game start-wave to launch now
                    </Text>
                  </Box>
                </Box>
              )}

            {/* Waiting for towers message */}
            {showMobileContinuePrompt && (
              <Box
                position="absolute"
                bottom={isMobileCanvasMode ? '10px' : '20px'}
                left={isMobileCanvasMode ? '12px' : '50%'}
                right={isMobileCanvasMode ? '12px' : 'auto'}
                transform={isMobileCanvasMode ? 'none' : 'translateX(-50%)'}
              >
                <Text
                  color={isRetroDesktopTheme ? '#000080' : '#00ccff'}
                  fontFamily={hudFontFamily}
                  fontSize={isMobileCanvasMode ? 'xs' : 'sm'}
                  textAlign="center"
                >
                  Deploy {coreTowerLabelText}{' '}
                  {coreTowerLabelText.includes(' and ') ? 'modules' : 'module'} to continue
                </Text>
              </Box>
            )}

            {/* Placement Mode Indicator */}
            {isTowerPlacementMode && (
              <Box
                position="absolute"
                top="10px"
                left="50%"
                transform="translateX(-50%)"
                bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 204, 255, 0.9)'}
                px={4}
                py={2}
                borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                border={isRetroDesktopTheme ? '2px solid #232730' : undefined}
                zIndex={8}
                boxShadow={
                  isRetroDesktopTheme
                    ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
                    : undefined
                }
              >
                <Flex align="center" gap={3} wrap="wrap" justify="center">
                  <Text
                    color={isRetroDesktopTheme ? '#1f2430' : 'black'}
                    fontWeight="bold"
                    fontSize="sm"
                    fontFamily={hudFontFamily}
                  >
                    {isMobileCanvasMode ? 'Tap' : 'Click'} to place {placementLabel}
                  </Text>
                  <Button
                    size="xs"
                    colorScheme={isRetroDesktopTheme ? undefined : 'blackAlpha'}
                    variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                    onClick={() => onCancelPlacement?.()}
                    sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
                  >
                    {cancelPlacementLabel}
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>
        </GameBoard>

        {/* Verification Controls - below the canvas on desktop layout */}
        {showBelowCanvasVerificationControls && (
          <Box
            {...(isRetroDesktopTheme
              ? retroSurfaceProps
              : {
                  bg: 'rgba(0, 20, 40, 0.9)',
                  borderRadius: 'md',
                  border: '1px solid rgba(0, 255, 140, 0.3)',
                })}
            px={3}
            py={2}
            flexShrink={0}
          >
            {renderVerificationControls(false)}
          </Box>
        )}
      </Flex>

      {shouldRenderDesktopSidePanel && (
        <Box
          w="320px"
          minW="320px"
          flexShrink={0}
          minH="0"
          {...(isRetroDesktopTheme
            ? retroSurfaceProps
            : {
                bg: 'rgba(0, 20, 40, 0.9)',
                borderRadius: 'md',
                border: '1px solid rgba(0, 255, 140, 0.2)',
              })}
          overflow="auto"
          overflowX="hidden"
        >
          {loadoutPanelBody}
        </Box>
      )}

      {showMobileActionDock && (
        <MobileTowerDefenseDock
          isExpanded={isMobileActionDockExpanded}
          onToggle={() => setIsMobileActionDockExpanded((previous) => !previous)}
          onOpenLoadout={() => {
            setIsMobileSelectorOpen(true);
            setIsMobileHudMenuVisible(false);
            writeTowerDefenseShellVisible(false);
          }}
          selectedTower={selectedTower}
          selectedTowerCanUpgrade={selectedTowerCanUpgrade}
          selectedTowerCanSpecialUpgrade={selectedTowerCanSpecialUpgrade}
          selectedTowerTargeting={selectedTowerTargeting}
          nextSelectedTowerTargeting={nextSelectedTowerTargeting}
          onUpgradeSelectedTower={onUpgradeSelectedTower}
          onSpecialUpgradeSelectedTower={onSpecialUpgradeSelectedTower}
          onSetSelectedTowerTargeting={onSetSelectedTowerTargeting}
          onSellSelectedTower={onSellSelectedTower}
          onClearSelectedTower={onClearSelectedTower}
          canQuickPlaceTowers={canQuickPlaceTowers}
          quickTowers={quickTowers}
          towerUnlockGates={towerUnlockGates}
          selectedTowerType={selectedTowerType}
          canQuickPlaceDeployables={canQuickPlaceDeployables}
          quickDeployables={quickDeployables}
          deployableUnlockGates={deployableUnlockGates}
          selectedDeployableType={selectedDeployableType}
          placementPalette={placementPalette}
          onPlacementPaletteChange={onPlacementPaletteChange}
          credits={gameState.credits}
          onQuickTowerSelection={handleQuickTowerSelection}
          onQuickDeployableSelection={handleQuickDeployableSelection}
        />
      )}

      {shouldRenderMobileLoadoutOverlay && (
        <Box
          position="absolute"
          inset="0"
          zIndex={18}
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(1, 8, 18, 0.92)'}
          backdropFilter={isRetroDesktopTheme ? undefined : 'blur(2px)'}
          border={isRetroDesktopTheme ? '2px solid #232730' : '1px solid rgba(0, 255, 140, 0.25)'}
          borderRadius={isRetroDesktopTheme ? '0' : 'md'}
          overflow="hidden"
        >
          <Flex
            align="center"
            justify="space-between"
            px={3}
            py={2}
            borderBottom={
              isRetroDesktopTheme ? '1px solid #232730' : '1px solid rgba(0, 255, 140, 0.25)'
            }
            bg={isRetroDesktopTheme ? '#000080' : 'rgba(0, 20, 40, 0.88)'}
          >
            <Text
              color={isRetroDesktopTheme ? '#f4f4f4' : '#9feaff'}
              fontSize="xs"
              fontFamily={hudFontFamily}
              letterSpacing="0.08em"
            >
              {isRetroDesktopTheme ? 'Tactical Loadout' : 'TACTICAL LOADOUT'}
            </Text>
            <Button
              size="xs"
              variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
              colorScheme={isRetroDesktopTheme ? undefined : 'red'}
              onClick={() => {
                if (selectedTower) {
                  onClearSelectedTower?.();
                }
                setIsMobileSelectorOpen(false);
              }}
              sx={isRetroDesktopTheme ? createRetroWindowsButtonSx() : undefined}
            >
              CLOSE
            </Button>
          </Flex>

          <Box h="calc(100% - 44px)" overflow="auto">
            {loadoutPanelBody}
          </Box>
        </Box>
      )}
    </Flex>
  );
}
