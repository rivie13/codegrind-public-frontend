/**
 * Tower Defense V2 - Panel/Layout Builder
 */

import React from 'react';

import { PANEL_TYPES } from '../../../components/towerDefense/ui/layout/panelTypes';
import {
  GamePanelContent,
  EditorPanelContent,
  ChatPanelContent,
  ProblemPanelContent,
} from './TowerDefenseV2Panels';
import TowerDefenseV2Layout from './TowerDefenseV2Layout';
import { GAME_STATUS } from '../../../game-engine-v2';
import useIsMobileDevice from '../../../hooks/useIsMobileDevice';

export default function useTowerDefenseV2PanelLayout({
  isLearningMode,
  gameState,
  initialLives,
  formattedTime,
  codeSubmissionSuccess,
  resetGame,
  onNavigateToList,
  navigateToListLabel,
  canvasRefCallback,
  canvasWidth,
  canvasHeight,
  isTowerPlacementMode,
  handleCanvasClick,
  handleCanvasMouseMove,
  handleCanvasMouseLeave,
  showJackInButton,
  showStartWaveButton,
  handleJackIn,
  startWave,
  autoStartCountdown,
  autoStartEnabled,
  hardcoreMode,
  initialCodeGenerated,
  functionTowerPlaced,
  objectTowerPlaced,
  coreTowerRequirements,
  selectedTowerType,
  selectedDeployableType,
  placementModeKind,
  selectedTower,
  handleUpgradeSelectedTower,
  handleSpecialUpgradeSelectedTower,
  handleSetSelectedTowerTargeting,
  handleSellSelectedTower,
  clearSelectedTower,
  handleTowerSelection,
  handleDeployableSelection,
  placementPalette,
  handlePlacementPaletteChange,
  handleCancelPlacement,
  validatedGameSettings,
  allowedTowerTypes,
  towerUnlockGates,
  deployableUnlockGates,
  isSpecialUpgradeUnlocked,
  handleGameSettingsChange,
  canEditGameSettings,
  difficultyBaseStats,
  isMapLoading,
  canAdjustPath,
  pathAdjusting,
  adjustPath,
  language,
  code,
  terminalOutput,
  terminalRef,
  chatPanelRef,
  terminalResetKey,
  codeSubmitted,
  towerPlacementLocked,
  _shouldShowVerificationControls,
  handleLanguageChange,
  setCode,
  handleCodeLineCommitted,
  isDemo,
  isHomepageDemo,
  handleTerminalCommandTracked,
  problem,
  problemDescription,
  problemAutoSwitchRemaining,
  problemAutoSwitchActive,
  showProblemIntroNote,
  activeTitleSlug,
  problemTabs,
  activeProblemIndex,
  onProblemTabChange,
  problemError,
  leftPanel,
  rightPanel,
  handlePanelChange,
  panelActionsProps,
  lockedLearningLanguage,
  shellTheme = 'default',
  allowEmbeddedHandheldPageScroll = false,
  desktopShellSizingMode = 'embedded',
}) {
  const towerSelectorEnabled =
    validatedGameSettings.towerSelectorEnabled && towerPlacementLocked !== true;
  const deployableMenuEnabled = validatedGameSettings.deployableMenuEnabled;

  const gameContent = React.createElement(GamePanelContent, {
    isGameOver: gameState.status === GAME_STATUS.GAME_OVER,
    isVictory: gameState.status === GAME_STATUS.LEVEL_COMPLETE,
    gameState,
    initialLives,
    formattedTime,
    codeSubmissionSuccess,
    onResetGame: resetGame,
    onNavigateToList,
    navigateToListLabel,
    canvasRefCallback,
    canvasWidth,
    canvasHeight,
    isTowerPlacementMode,
    onCanvasClick: handleCanvasClick,
    onCanvasMouseMove: handleCanvasMouseMove,
    onCanvasMouseLeave: handleCanvasMouseLeave,
    showJackInButton,
    showStartWaveButton,
    onJackIn: handleJackIn,
    onStartWave: startWave,
    autoStartCountdown,
    autoStartWaves: autoStartEnabled,
    hardcoreMode,
    initialCodeGenerated,
    functionTowerPlaced,
    objectTowerPlaced,
    coreTowerRequirements,
    selectedTowerType,
    selectedDeployableType,
    placementModeKind,
    selectedTower,
    onUpgradeSelectedTower: handleUpgradeSelectedTower,
    onSpecialUpgradeSelectedTower: handleSpecialUpgradeSelectedTower,
    onSetSelectedTowerTargeting: handleSetSelectedTowerTargeting,
    onSellSelectedTower: handleSellSelectedTower,
    onClearSelectedTower: clearSelectedTower,
    onSelectTowerType: handleTowerSelection,
    onSelectDeployableType: handleDeployableSelection,
    placementPalette,
    onPlacementPaletteChange: handlePlacementPaletteChange,
    onCancelPlacement: handleCancelPlacement,
    allowedTowerTypes,
    towerUnlockGates,
    deployableUnlockGates,
    isSpecialUpgradeUnlocked,
    gameSettings: validatedGameSettings,
    onGameSettingsChange: handleGameSettingsChange,
    canEditGameSettings,
    difficultyMinimums: difficultyBaseStats,
    towerSelectorEnabled,
    deployableMenuEnabled,
    upgradeMenuEnabled: validatedGameSettings.upgradeMenuEnabled,
    isMapLoading,
    canAdjustPath,
    isAdjustingPath: pathAdjusting,
    onShortenPath: () => adjustPath('shorten'),
    onLengthenPath: () => adjustPath('lengthen'),
    pathActionCosts: {
      shorten: panelActionsProps.actionCosts?.pathShorten || 0,
      lengthen: panelActionsProps.actionCosts?.pathLengthen || 0,
    },
    // Verification controls from panelActionsProps
    shouldShowVerificationControls: panelActionsProps.shouldShowVerificationControls,
    onRunCode: panelActionsProps.onRunCode,
    onRunOutput: panelActionsProps.onRunOutput,
    onSubmitSolution: panelActionsProps.onSubmitSolution,
    verificationActionCosts: {
      runTests: panelActionsProps.actionCosts?.runTests || 0,
      stdout: panelActionsProps.actionCosts?.stdout || 0,
      stderr: panelActionsProps.actionCosts?.stderr || 0,
    },
    isExecuting: panelActionsProps.isExecuting,
    codeSubmitted: panelActionsProps.codeSubmitted,
    isLearningMode: panelActionsProps.isLearningMode,
    terminalOutput,
    isDemo,
    isHomepageDemo,
    shellTheme,
  });

  const editorContent = React.createElement(EditorPanelContent, {
    initialCodeGenerated,
    gameState,
    playerLost: gameState.status === GAME_STATUS.GAME_OVER,
    playerWon: gameState.status === GAME_STATUS.LEVEL_COMPLETE,
    initialLives,
    language,
    code,
    terminalOutput,
    terminalRef,
    terminalResetKey,
    codeSubmitted,
    codeSubmissionSuccess,
    selectedTowerType,
    isTowerPlacementMode,
    onLanguageChange: handleLanguageChange,
    onCodeChange: (newCode) => setCode(newCode),
    onCodeLineCommitted: handleCodeLineCommitted,
    isLearningMode,
    lockedLearningLanguage,
    onStartWave: () => startWave('normal'),
    onResetGame: resetGame,
    onCancelPlacement: handleCancelPlacement,
    problemTitle: problem?.title || 'V2 Test Problem',
    difficulty: problem?.difficulty || 'Unknown',
    isDemo,
    onTerminalCommand: handleTerminalCommandTracked,
    terminalInputEnabled: gameState.status !== GAME_STATUS.PLAYING,
    terminalInputPlaceholder: 'Type /help for commands',
    terminalInputDisabledReason: 'Commands are locked during active waves.',
    problemTabs,
    activeProblemIndex,
    onProblemTabChange,
    shellTheme,
    isHomepageDemo,
    functionTowerPlaced,
    // Refine Solution controls from panelActionsProps
    shouldShowVerificationControls: panelActionsProps.shouldShowVerificationControls,
    onRefineSolution: panelActionsProps.onRefineSolution,
    isRefining: panelActionsProps.isRefining,
    canRefineSolution: panelActionsProps.canRefineSolution,
    refinementLimitReached: panelActionsProps.refinementLimitReached,
    onShowAdModal: panelActionsProps.onShowAdModal,
    isWatchingAd: panelActionsProps.isWatchingAd,
  });

  const chatContent = validatedGameSettings.aiChatEnabled
    ? React.createElement(ChatPanelContent, {
        chatPanelRef,
        problemId: problem?.titleSlug || activeTitleSlug,
        activeTitleSlug,
        shouldLoadUsage: gameState?.status !== 'prehack',
        hasProblemError: problemError,
        isDemo,
        problem,
        problemDescription,
        language,
        code,
        terminalOutput,
        isLearningMode,
        shellTheme,
      })
    : null;

  const problemContent = React.createElement(ProblemPanelContent, {
    problem,
    problemDescription,
    currentWave: gameState.wave,
    totalWaves: gameState.totalWaves,
    isMissionComplete: gameState.status === GAME_STATUS.LEVEL_COMPLETE,
    isHomepageDemo,
    autoSwitchRemaining: problemAutoSwitchRemaining,
    autoSwitchActive: problemAutoSwitchActive,
    showIntroNote: showProblemIntroNote,
    problemTabs,
    activeProblemIndex,
    onProblemTabChange,
    shellTheme,
  });

  const isWaveActive = gameState.status === GAME_STATUS.PLAYING;
  const lockedSlots = {
    left: isWaveActive && leftPanel === PANEL_TYPES.GAME,
    right: isWaveActive && rightPanel === PANEL_TYPES.GAME,
  };

  const [activeStepId, setActiveStepId] = React.useState(() => {
    if (typeof window === 'undefined') return null;
    return (
      window.__tdInlineOnboardingStepDetail?.step?.id ||
      (isHomepageDemo ? 'mission-objective' : null)
    );
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStepChange = (event) => {
      const step = event?.detail?.step;
      setActiveStepId(step?.id || null);
    };

    window.addEventListener('td-onboarding-step-change', handleStepChange);

    return () => {
      window.removeEventListener('td-onboarding-step-change', handleStepChange);
    };
  }, [isHomepageDemo]);

  const isGamePanelBlurred = Boolean(isHomepageDemo && activeStepId === 'mission-objective');

  const isMobileDevice = useIsMobileDevice();
  const dynamicDefaultLeftPanel =
    isMobileDevice && isHomepageDemo ? PANEL_TYPES.PROBLEM : PANEL_TYPES.GAME;
  const dynamicDefaultRightPanel =
    isMobileDevice && isHomepageDemo ? PANEL_TYPES.GAME : PANEL_TYPES.PROBLEM;

  return React.createElement(TowerDefenseV2Layout, {
    gameContent,
    editorContent,
    chatContent,
    problemContent,
    hiddenPanels: validatedGameSettings.aiChatEnabled ? [] : [PANEL_TYPES.CHAT],
    leftPanel,
    rightPanel,
    onPanelChange: handlePanelChange,
    panelActionsProps,
    defaultLeftPanel: dynamicDefaultLeftPanel,
    defaultRightPanel: dynamicDefaultRightPanel,
    lockedSlots,
    shellTheme,
    allowEmbeddedHandheldPageScroll,
    desktopShellSizingMode,
    isGamePanelBlurred,
  });
}
