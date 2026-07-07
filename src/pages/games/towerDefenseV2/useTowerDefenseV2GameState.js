/**
 * Tower Defense V2 - Game State Hook
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../../contexts/GuestProgressProvider';
import useGuestFunnel from '../../../hooks/guest/useGuestFunnel';

import { api } from '../../../services/api';

// REUSE: Existing UI Components
import { PANEL_TYPES } from '../../../components/towerDefense/ui/layout/panelTypes';

// REUSE: Existing Hooks
import useCodeEditor from '../../../hooks/towerDefense/codeEditor/useCodeEditor';
import useTowerDefensePathAdjustment from '../../../hooks/towerDefense/engine/useTowerDefensePathAdjustment';
import useTowerDefenseScoreSubmission from '../../../hooks/towerDefense/engine/scoring/useTowerDefenseScoreSubmission';
import useTowerDefenseAudioLifecycle from '../../../hooks/towerDefense/engine/audio/useTowerDefenseAudioLifecycle';
import useProblemAutoSwitch from '../../../hooks/towerDefense/engine/data/useProblemAutoSwitch';
import useExecutionAdFlow from '../../../hooks/towerDefense/engine/ads/useExecutionAdFlow';
import useAICodeGenerationBridge from '../../../hooks/towerDefense/codeEditor/ai/useAICodeGenerationBridge';
import useTowerDefenseV2DifficultyState from './hooks/state/useTowerDefenseV2DifficultyState';
import useTowerDefenseV2DebugBridge from './hooks/effects/useTowerDefenseV2DebugBridge';
import useTowerDefenseV2DerivedState from './hooks/state/useTowerDefenseV2DerivedState';
import useTowerDefenseV2EngineState from './hooks/engine/useTowerDefenseV2EngineState';
import useTowerDefenseV2GameControls from './hooks/engine/useTowerDefenseV2GameControls';
import useTowerDefenseV2InitialCodeEffects from './hooks/effects/useTowerDefenseV2InitialCodeEffects';
import useTowerDefenseV2LanguageLock, {
  resolveLearningLanguageLock,
} from './hooks/learning/useTowerDefenseV2LanguageLock';
import useTowerDefenseV2PanelInteractions from './hooks/ui/useTowerDefenseV2PanelInteractions';
import useTowerDefenseV2LearningState from './hooks/learning/useTowerDefenseV2LearningState';
import useLearningUnlockCodeRestore from './hooks/learning/useLearningUnlockCodeRestore';
import useTowerDefenseV2MapState from './hooks/state/useTowerDefenseV2MapState';
import useTowerDefenseV2MultiProblemState from './hooks/state/useTowerDefenseV2MultiProblemState';
import useTowerDefenseV2PanelActions from './hooks/ui/useTowerDefenseV2PanelActions';
import useTowerDefenseV2PanelLayoutProps from './hooks/ui/useTowerDefenseV2PanelLayoutProps';
import useTowerDefenseV2PanelState from './hooks/state/useTowerDefenseV2PanelState';
import useTowerDefenseV2PlacementState from './hooks/ui/useTowerDefenseV2PlacementState';
import useTowerDefenseV2ProblemState from './hooks/state/useTowerDefenseV2ProblemState';
import useTowerDefenseV2RefineAvailability from './hooks/effects/useTowerDefenseV2RefineAvailability';
import useTowerDefenseV2RefSync from './hooks/effects/useTowerDefenseV2RefSync';
import useTowerDefenseV2ResetHandler from './hooks/actions/useTowerDefenseV2ResetHandler';
import useTowerDefenseV2RunActions from './hooks/actions/useTowerDefenseV2RunActions';
import useTowerDefenseV2TerminalHandlers from './hooks/terminal/useTowerDefenseV2TerminalHandlers';
import useTowerDefenseV2LearningCompletion from './hooks/learning/useTowerDefenseV2LearningCompletion';
import useTowerDefenseV2SettingsEffects from './hooks/effects/useTowerDefenseV2SettingsEffects';
import useTowerDefenseV2SettingsState from './hooks/state/useTowerDefenseV2SettingsState';
import useTDUnlockState from './hooks/state/useTDUnlockState';
import useTowerDefenseV2TerminalState from './hooks/state/useTowerDefenseV2TerminalState';
import useTowerDefenseV2TimerState from './hooks/state/useTowerDefenseV2TimerState';
import useTowerDefenseV2UiState from './hooks/state/useTowerDefenseV2UiState';
import useIsMobileDevice from '../../../hooks/useIsMobileDevice';

// REUSE: Existing Utilities
import {
  areRequiredCoreTowersPlaced,
  resolveAllowedTowerTypes,
  resolveCoreTowerRequirements,
} from '../../../utils/towerDefense/coreTowerRequirements';

// Game Engine V2
import { TOWER_TYPES } from '../../../game-engine-v2';

import {
  resolveTypeKey as resolveTypeKeyHelper,
  getDeployablePlacementType as getDeployablePlacementTypeHelper,
  getTowerDefenseProblemId as getTowerDefenseProblemIdHelper,
} from './helpers';
import { CELL_SIZE, PROBLEM_AUTO_SWITCH_SECONDS } from './constants';
import { isTowerPlacementLocked } from '@rivie13/premium-core/sync/towerDefense/verificationLock';
import CodeSnippetManager from '@rivie13/premium-core/sync/towerDefense/CodeSnippetManager';
import {
  normalizeClusterNavigation,
  resolveBrowseBackTarget,
} from '../../../utils/navigation/clusterNavigation';
import useEquippedCosmetics from '../../../hooks/cosmetics/useEquippedCosmetics';
import {
  TD_ACTION_COST_KEYS,
  createInitialActionUsageCounts,
  getTowerDefenseActionCost,
  getTowerDefenseActionCosts,
} from './actionEconomy';
import { getEmbeddedShellCosmetics } from './embeddedShellThemes';

export default function useTowerDefenseV2GameState({
  isDemo = false,
  demoTitleSlug = null,
  learningPathTitleSlug = null,
  learningPathSlug = null,
  learningPathOnboarding = false,
  learningTowerConfig = null,
  learningPathMeta = null,
  learningIsCapstone = false,
  embeddedShellTheme = 'retro-desktop',
  onEmbeddedVictory = null,
  onEmbeddedLearningXp = null,
  demoLaunchStartTime = null,
}) {
  const toast = useToast();
  const location = useLocation();
  const { titleSlug } = useParams();
  const { user } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const funnel = useGuestFunnel();
  const clusterNavigation = useMemo(
    () => normalizeClusterNavigation(location.state?.clusterNavigation),
    [location.state?.clusterNavigation]
  );
  const browseBackTarget = useMemo(
    () =>
      resolveBrowseBackTarget({
        clusterNavigation,
        fallbackPath: '/games/tower-defense',
      }),
    [clusterNavigation]
  );
  const {
    isLearningMode,
    learningProblemSlugs,
    activeProblemIndex,
    setActiveProblemIndex,
    activeTitleSlug,
    learningPathData,
    learningNodeId,
    learningNextNode,
    // eslint-disable-next-line no-unused-vars
    _learningReturnPath,
    handleContinueLearning,
    handleReturnToMap,
    canEnterEndlessMode,
    isMultiProblemTower,
  } = useTowerDefenseV2LearningState({
    isDemo,
    demoTitleSlug,
    learningPathTitleSlug,
    learningPathSlug,
    learningPathOnboarding,
    learningTowerConfig,
    learningPathMeta,
    learningIsCapstone,
    titleSlug,
  });
  const clearSuggestionQueueForTowerRef = useRef(null);
  const livesRef = useRef(10);
  const creditsRef = useRef(0);
  const waveRef = useRef(1);
  const timerSecondsRef = useRef(0);
  const formattedTimeRef = useRef('00:00');
  const victoryOutputAppliedRef = useRef(false);
  const scoreSubmittedRef = useRef(false);
  const endlessScoreSubmittedRef = useRef(false);
  const navigate = useNavigate();
  const [sharedLearningMap, setSharedLearningMap] = useState(null);
  const [verifyAttemptInProgress, setVerifyAttemptInProgress] = useState(false);
  const [actionUsageCounts, setActionUsageCounts] = useState(() =>
    createInitialActionUsageCounts()
  );
  const chatActorId = useMemo(
    () => user?.id || localStorage.getItem('user_id') || 'guest',
    [user?.id]
  );
  const [learningUnlockActive, setLearningUnlockActive] = useState(false);
  const playerLevel = useMemo(() => {
    // Funnel requirement: all demo/onboarding experiences start at level 1 (BASIC only).
    if (isDemo || learningPathOnboarding) return 1;

    const authLevelValue = user?.progress?.level ?? user?.level;
    const guestLevelValue = guestCtx?.xpSummary?.level ?? guestCtx?.activitySummary?.guestLevel;
    const levelValue = user ? authLevelValue : guestLevelValue;
    const numericLevel = Number(levelValue);
    if (!Number.isFinite(numericLevel) || numericLevel < 1) return 1;
    return Math.floor(numericLevel);
  }, [
    guestCtx?.activitySummary?.guestLevel,
    guestCtx?.xpSummary?.level,
    isDemo,
    learningPathOnboarding,
    user,
  ]);

  const learningUnlockKey = useMemo(() => {
    if (!isLearningMode) return null;
    const pathId =
      learningPathMeta?.pathId || learningPathSlug || learningPathTitleSlug || 'learning-path';
    const nodeId =
      learningPathMeta?.nodeId || activeTitleSlug || learningPathTitleSlug || 'learning-node';
    return `td_learning_unlock_${pathId}_${nodeId}`;
  }, [
    activeTitleSlug,
    isLearningMode,
    learningPathMeta?.nodeId,
    learningPathMeta?.pathId,
    learningPathSlug,
    learningPathTitleSlug,
  ]);

  const {
    terminalRef,
    chatPanelRef,
    terminalOutput,
    setTerminalOutput,
    terminalResetKey,
    setTerminalResetKey,
    addTerminalMessage,
    normalizeTerminalOutput,
    clearChatHistory,
  } = useTowerDefenseV2TerminalState();
  const isHomepageDemo = Boolean(
    onEmbeddedVictory && learningPathOnboarding && learningPathTitleSlug === 'lp-m0-td-hello-print'
  );

  const {
    tdMapPack,
    tdBackgroundPack,
    tdTowerPack,
    tdEnemyPack,
    tdDamageTextPack,
    tdDeathFxPack,
    tdPathGradientMode,
    tdAttackFxMode,
  } = useEquippedCosmetics();

  const tdBoardTheme = useMemo(() => {
    if (!tdMapPack && !tdBackgroundPack) return null;
    return {
      ...(tdBackgroundPack || {}),
      ...(tdMapPack || {}),
    };
  }, [tdBackgroundPack, tdMapPack]);

  const embeddedShellCosmetics = useMemo(
    () => getEmbeddedShellCosmetics(embeddedShellTheme),
    [embeddedShellTheme]
  );

  const rendererCosmetics = useMemo(
    () => ({
      pathGradientMode:
        embeddedShellCosmetics?.pathGradientMode || tdPathGradientMode || 'homepage-default',
      tdAttackFxMode: embeddedShellCosmetics?.tdAttackFxMode || tdAttackFxMode || 'none',
      mapTheme: embeddedShellCosmetics?.mapTheme || tdBoardTheme,
      lightningInternalMode:
        embeddedShellCosmetics?.lightningInternalMode ??
        (tdTowerPack?.id === 'lightning-core' ? 'edge-sweep' : null),
      lightningColor:
        embeddedShellCosmetics?.lightningColor || tdTowerPack?.lightningColor || '#FDE047',
      lightningGlow:
        embeddedShellCosmetics?.lightningGlow || tdTowerPack?.lightningGlow || '#FEF08A',
      towerPack: embeddedShellCosmetics?.towerPack || tdTowerPack || null,
      enemyPack: embeddedShellCosmetics?.enemyPack || tdEnemyPack || null,
      damageTextPack: embeddedShellCosmetics?.damageTextPack || tdDamageTextPack || null,
      deathFxPack: embeddedShellCosmetics?.deathFxPack || tdDeathFxPack || null,
    }),
    [
      embeddedShellCosmetics,
      tdAttackFxMode,
      tdBoardTheme,
      tdDamageTextPack,
      tdDeathFxPack,
      tdEnemyPack,
      tdPathGradientMode,
      tdTowerPack,
    ]
  );

  const {
    refinementLimitReached,
    setRefinementLimitReached,
    isWatchingAd,
    setIsWatchingAd,
    isRefining,
    setIsRefining,
    canRefineSolution,
    setCanRefineSolution,
    showAdModal,
    setShowAdModal,
    isGeneratingAICode,
    setIsGeneratingAICode,
    currentTowerType,
    setCurrentTowerType,
    showSuccessModal,
    setShowSuccessModal,
    successModalTimer,
    setSuccessModalTimer,
    gameStats,
    setGameStats,
    placementPalette,
    setPlacementPalette,
    pathOverride,
    setPathOverride,
    lastTerminalCommand,
    setLastTerminalCommand,
  } = useTowerDefenseV2UiState();

  const {
    executionAdOptions,
    executionRateLimit,
    showExecutionAdModal,
    setShowExecutionAdModal,
    isApplyingExecutionCredit,
    selectedExecutionAdType,
    setSelectedExecutionAdType,
    selectedExecutionAd,
    handleExecutionAdComplete,
    handleExecutionRateLimit,
  } = useExecutionAdFlow({ api, addTerminalMessage });

  const { problem, problemError, generatedMap, problemDescription } = useTowerDefenseV2ProblemState(
    {
      activeTitleSlug,
      isLearningMode,
      isMultiProblemTower,
      learningNodeId,
      learningPathSlug,
      learningPathTitleSlug,
      learningProblemSlugs,
      sharedLearningMap,
      setSharedLearningMap,
      clearChatHistory,
    }
  );

  const problemLoadedFiredRef = useRef(false);
  useEffect(() => {
    if (problem && !problemLoadedFiredRef.current) {
      problemLoadedFiredRef.current = true;
      const now = performance.now();
      const startTime = demoLaunchStartTime !== null ? demoLaunchStartTime : 0;
      const durationMs = Math.round(now - startTime);
      funnel.demoProblemLoaded({
        durationMs: String(durationMs),
        problemSlug: problem.titleSlug || 'unknown',
        isDemo: String(isDemo),
      });
    }
  }, [problem, demoLaunchStartTime, funnel, isDemo]);

  const isMobileDevice = useIsMobileDevice();
  const dynamicDefaultLeftPanel =
    isMobileDevice && isHomepageDemo ? PANEL_TYPES.PROBLEM : PANEL_TYPES.GAME;
  const dynamicDefaultRightPanel =
    isMobileDevice && isHomepageDemo ? PANEL_TYPES.GAME : PANEL_TYPES.PROBLEM;

  const {
    leftPanel,
    rightPanel,
    setLeftPanel,
    setRightPanel,
    learningPathOnboardingActive,
    setLearningPathOnboardingActive,
  } = useTowerDefenseV2PanelState({
    learningPathOnboarding,
    defaultLeftPanel: dynamicDefaultLeftPanel,
    defaultRightPanel: dynamicDefaultRightPanel,
  });

  const {
    problemAutoSwitchRemaining,
    problemAutoSwitchActive,
    showProblemIntroNote,
    setShowProblemIntroNote,
    cancelProblemAutoSwitch,
  } = useProblemAutoSwitch({
    activeTitleSlug,
    rightPanel,
    setLeftPanel,
    setRightPanel,
    problemDescription,
    problem,
    defaultLeftPanel: dynamicDefaultLeftPanel,
    defaultRightPanel: dynamicDefaultRightPanel,
    autoSwitchSeconds: PROBLEM_AUTO_SWITCH_SECONDS,
    onAutoSwitch: () => setRightPanel(PANEL_TYPES.EDITOR),
    preservePanelsOnSlugChange: isMultiProblemTower,
  });

  const { autoStartWaveSeconds, difficultyBaseStats, difficultyConfig, problemDifficulty } =
    useTowerDefenseV2DifficultyState({ problem });

  const {
    handleGameSettingsChange,
    lockGameSettings,
    setSettingsLocked,
    settingsLocked,
    validatedGameSettings,
  } = useTowerDefenseV2SettingsState({
    activeTitleSlug,
    learningPathOnboarding,
    problemDifficulty,
    isLearningMode,
    learningTowerConfig,
  });

  const {
    isTowerUnlocked,
    isDeployableUnlocked,
    isSpecialUpgradeUnlocked,
    towerUnlockGates,
    deployableUnlockGates,
  } = useTDUnlockState({ playerLevel, user, isDemo });

  const rawAllowedTowerTypes = useMemo(() => {
    const allowed = learningTowerConfig?.allowedTowers;
    return Array.isArray(allowed) && allowed.length ? allowed : null;
  }, [learningTowerConfig?.allowedTowers]);

  const preferredLearningLanguage = useMemo(
    () =>
      resolveLearningLanguageLock({
        isLearningMode,
        learningPathSlug: learningPathMeta?.pathId || learningPathSlug,
        learningPathTitleSlug,
      }),
    [isLearningMode, learningPathMeta?.pathId, learningPathSlug, learningPathTitleSlug]
  );

  const allowedTowerTypes = useMemo(
    () =>
      resolveAllowedTowerTypes({
        problem,
        language: preferredLearningLanguage,
        allowedTowerTypes: rawAllowedTowerTypes,
      }),
    [problem, preferredLearningLanguage, rawAllowedTowerTypes]
  );

  const { pathNodes, basePathLength, isMapLoading, gridRows, gridCols } = useTowerDefenseV2MapState(
    {
      activeTitleSlug,
      fallbackGridCols: difficultyConfig.gridSize.cols,
      fallbackGridRows: difficultyConfig.gridSize.rows,
      generatedMap,
      pathOverride,
      setPathOverride,
    }
  );

  // Code editor hook (reuse V1 logic)
  const codeEditor = useCodeEditor({
    problem,
    addTerminalMessage,
    onExecutionRateLimit: handleExecutionRateLimit,
    preserveOnProblemChange: isMultiProblemTower,
    allowedTowerTypes,
    initialLanguage: preferredLearningLanguage || 'python',
  });
  const {
    code,
    setCode,
    language,
    setLanguage,
    handleLanguageChange,
    isExecuting,
    setIsExecuting,
    codeSubmitted,
    codeSubmissionSuccess,
    functionTowerPlaced,
    objectTowerPlaced,
    initialCodeGenerated,
    setFunctionTowerPlaced,
    setObjectTowerPlaced,
    setInitialCodeGenerated,
    generateInitialCodeSnippet,
    addTowerCodeSnippet,
    getCodeSnippetForLanguage,
    resetTowerCounts,
    runCodeTests,
    runCodeOutput,
    submitSolution,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
  } = codeEditor;

  const coreTowerRequirements = useMemo(
    () => resolveCoreTowerRequirements({ problem, language, allowedTowerTypes }),
    [allowedTowerTypes, language, problem]
  );

  const requiredCoreTowersPlaced = useMemo(
    () =>
      areRequiredCoreTowersPlaced(coreTowerRequirements, {
        functionTowerPlaced,
        objectTowerPlaced,
      }),
    [coreTowerRequirements, functionTowerPlaced, objectTowerPlaced]
  );

  useEffect(() => {
    if (isHomepageDemo) return;
    if (!isLearningMode || !learningUnlockKey) return;
    if (!requiredCoreTowersPlaced) return;
    try {
      const stored = localStorage.getItem(learningUnlockKey);
      if (stored === 'true') {
        setLearningUnlockActive(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [isLearningMode, learningUnlockKey, requiredCoreTowersPlaced, isHomepageDemo]);

  useEffect(() => {
    if (isHomepageDemo) return;
    if (!isLearningMode || !learningUnlockKey) return;
    if (!requiredCoreTowersPlaced) return;
    try {
      localStorage.setItem(learningUnlockKey, 'true');
      setLearningUnlockActive(true);
    } catch {
      // Ignore storage errors
    }
  }, [isLearningMode, learningUnlockKey, requiredCoreTowersPlaced, isHomepageDemo]);

  useLearningUnlockCodeRestore({
    isLearningMode,
    learningUnlockActive,
    requiredCoreTowersPlaced,
    initialCodeGenerated,
    code,
    generateInitialCodeSnippet,
    setInitialCodeGenerated,
    isHomepageDemo,
  });

  const { lockedLearningLanguage, handleUserLanguageChange } = useTowerDefenseV2LanguageLock({
    isLearningMode,
    learningPathSlug: learningPathMeta?.pathId || learningPathSlug,
    learningPathTitleSlug,
    problemLanguage: problem?.language,
    language,
    handleLanguageChange,
  });

  const cellSize = useMemo(
    () => generatedMap?.cellSize || difficultyConfig.cellSize || CELL_SIZE,
    [difficultyConfig.cellSize, generatedMap?.cellSize]
  );
  const totalWavesByDifficulty =
    validatedGameSettings.totalWaves || difficultyBaseStats.totalWaves || 5;
  const initialLives = validatedGameSettings.startingLives ?? difficultyBaseStats.initialLives;
  const autoStartEnabled = Boolean(validatedGameSettings.autoStartWaves);
  const effectiveInitialCodeGeneratedForPlacement =
    initialCodeGenerated || (isLearningMode && learningUnlockActive);

  const getDeployablePlacementType = useCallback(
    (deployable) => getDeployablePlacementTypeHelper(deployable),
    []
  );

  const getTowerDefenseProblemId = useCallback(
    () => getTowerDefenseProblemIdHelper(problem),
    [problem]
  );
  const towerPlacementLocked = isTowerPlacementLocked(codeSubmitted);

  const notifyScoreSyncError = useCallback(
    ({ mode }) => {
      const toastId = mode === 'endless' ? 'td-endless-score-sync-failed' : 'td-score-sync-failed';
      if (typeof toast.isActive === 'function' && toast.isActive(toastId)) {
        return;
      }

      toast({
        id: toastId,
        title: 'Score not saved',
        description:
          mode === 'endless'
            ? 'Your endless run finished, but we could not save the score right now.'
            : 'You cleared the map, but we could not save the score right now.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
        position: 'top',
      });
    },
    [toast]
  );

  const { submitTowerDefenseWin, submitTowerDefenseEndless } = useTowerDefenseScoreSubmission({
    getTowerDefenseProblemId,
    codeSubmissionSuccess,
    problemSource: problem?.source,
    shouldSubmitScores: !isLearningMode,
    scoreSubmittedRef,
    endlessScoreSubmittedRef,
    onScoreSyncError: notifyScoreSyncError,
  });

  // Guest XP preview callback — computes XP payload before mutations so the
  // victory handler can populate gameStats.xp for the success modal.
  const getGuestXpPreview = useCallback(() => {
    if (user) return null; // authenticated — server provides XP
    const slug = problem?.titleSlug;
    const difficulty = problem?.difficulty || 'easy';
    return guestCtx?.getSolveRewardPreview?.(slug, difficulty) ?? null;
  }, [guestCtx, problem?.difficulty, problem?.titleSlug, user]);

  const {
    canvasRefCallback,
    gameState,
    selectedTowerType,
    selectedDeployableType,
    selectedTower,
    isTowerPlacementMode,
    placementModeKind,
    handleCanvasClick,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    handleTowerTypeSelect,
    handleDeployableTypeSelect,
    reserveTowerPlacement,
    reserveDeployablePlacement,
    getReservedTowerCount,
    getReservedDeployableCount,
    handleUpgradeSelectedTower,
    handleSpecialUpgradeSelectedTower,
    handleSetSelectedTowerTargeting,
    handleSellSelectedTower,
    selectTowerById,
    transformTowerAtPosition,
    cancelPlacementMode,
    clearSelectedTower,
    setStatus,
    startWave: startEngineWave,
    startEndlessMode,
    resetEngineState,
    applyGameSettings,
    notifySolutionSuccess,
    canSpendBits,
    spendBits,
    resolveHasTowerType,
  } = useTowerDefenseV2EngineState({
    pathNodes,
    gridCols,
    gridRows,
    cellSize,
    difficultyBaseStats,
    validatedGameSettings,
    problemDifficulty,
    playerLevel,
    isTowerUnlocked,
    isDeployableUnlocked,
    isSpecialUpgradeUnlocked,
    addTerminalMessage,
    towerPlacementLocked,
    isLearningMode,
    learningUnlockActive,
    livesRef,
    creditsRef,
    victoryOutputAppliedRef,
    initialLives,
    isDemo,
    isHomepageDemo,
    normalizeTerminalOutput,
    onEmbeddedVictory,
    setGameStats,
    setShowSuccessModal,
    setSuccessModalTimer,
    setTerminalOutput,
    submitTowerDefenseEndless,
    submitTowerDefenseWin,
    getGuestXpPreview,
    successModalTimer,
    timerSecondsRef,
    formattedTimeRef,
    functionTowerPlaced,
    objectTowerPlaced,
    initialCodeGenerated,
    effectiveInitialCodeGenerated: effectiveInitialCodeGeneratedForPlacement,
    setFunctionTowerPlaced,
    setObjectTowerPlaced,
    setInitialCodeGenerated,
    setCode,
    code,
    addTowerCodeSnippet,
    getCodeSnippetForLanguage,
    language,
    problem,
    coreTowerRequirements,
    waveRef,
    codeSubmissionSuccess,
    totalWavesByDifficulty,
    rendererCosmetics,
  });

  const {
    problemTabs,
    runMultiTabVerification,
    sharedUnlockActive,
    resetSharedUnlock,
    resetMultiProblemEditors,
  } = useTowerDefenseV2MultiProblemState({
    isMultiProblemTower,
    learningProblemSlugs,
    activeTitleSlug,
    problem,
    language,
    setLanguage,
    code,
    setCode,
    initialCodeGenerated,
    setInitialCodeGenerated,
    functionTowerPlaced,
    setFunctionTowerPlaced,
    objectTowerPlaced,
    setObjectTowerPlaced,
    terminalOutput,
    setTerminalOutput,
    terminalResetKey,
    setTerminalResetKey,
    codeSubmitted,
    setCodeSubmitted,
    codeSubmissionSuccess,
    setCodeSubmissionSuccess,
    generateInitialCodeSnippet,
    api,
    addTerminalMessage,
    handleExecutionRateLimit,
    lockedLearningLanguage,
    chatActorId,
    resolveHasTowerType,
    submitSolution,
    learningUnlockActive,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__tdSharedEditorUnlock = Boolean(sharedUnlockActive);
  }, [sharedUnlockActive]);

  useTowerDefenseV2DebugBridge({ transformTowerAtPosition });

  const { formattedTime } = useTowerDefenseV2TimerState({
    gameStatus: gameState.status,
    timerSecondsRef,
    formattedTimeRef,
  });

  const { canAdjustPath, pathAdjusting, adjustPath } = useTowerDefensePathAdjustment({
    addTerminalMessage,
    basePathLength,
    getDeployablePlacementType,
    gridCols,
    gridRows,
    isMapLoading,
    gameState,
    pathNodes,
    problemDifficulty,
    setPathOverride,
  });

  const actionCosts = useMemo(
    () => getTowerDefenseActionCosts(actionUsageCounts),
    [actionUsageCounts]
  );

  const incrementActionUsage = useCallback((actionKey) => {
    setActionUsageCounts((prev) => ({
      ...prev,
      [actionKey]: Math.max(0, Number(prev?.[actionKey] || 0)) + 1,
    }));
  }, []);

  const spendForAction = useCallback(
    ({ actionKey, label }) => {
      const cost = getTowerDefenseActionCost(actionKey, actionUsageCounts);
      const bits = Number(gameState.credits || 0);
      const safeBits = Number.isFinite(bits) ? bits : 0;

      if (!canSpendBits(cost)) {
        addTerminalMessage(
          `[WARNING] Not enough bits for ${label}. Need ${cost}, have ${safeBits}.`
        );
        return false;
      }

      const didSpend = spendBits(cost, { reason: `action:${actionKey}` });
      if (!didSpend) {
        addTerminalMessage(
          `[WARNING] Not enough bits for ${label}. Need ${cost}, have ${safeBits}.`
        );
        return false;
      }

      incrementActionUsage(actionKey);
      return true;
    },
    [
      actionUsageCounts,
      addTerminalMessage,
      canSpendBits,
      gameState.credits,
      incrementActionUsage,
      spendBits,
    ]
  );

  const resolveTypeKey = useCallback((input, types) => resolveTypeKeyHelper(input, types), []);

  const {
    handlePlacementPaletteChange,
    handleCancelPlacement,
    handleTowerSelection,
    handleDeployableSelection,
  } = useTowerDefenseV2PlacementState({
    placementPalette,
    setPlacementPalette,
    cancelPlacementMode,
    isTowerPlacementMode,
    addTerminalMessage,
    handleTowerTypeSelect,
    handleDeployableTypeSelect,
    getClearSuggestionQueueForTower: () => clearSuggestionQueueForTowerRef.current,
    resolveTypeKey,
    towerTypes: TOWER_TYPES,
    validatedGameSettings,
  });

  useEffect(() => {
    if (!towerPlacementLocked) return;
    if (placementPalette !== 'towers') return;
    if (!validatedGameSettings.deployableMenuEnabled) return;
    setPlacementPalette('deployables');
  }, [
    placementPalette,
    setPlacementPalette,
    towerPlacementLocked,
    validatedGameSettings.deployableMenuEnabled,
  ]);

  useTowerDefenseV2RefSync({
    gameState,
    livesRef,
    creditsRef,
    waveRef,
    scoreSubmittedRef,
    endlessScoreSubmittedRef,
    victoryOutputAppliedRef,
  });

  const {
    effectiveInitialCodeGenerated,
    effectiveFunctionTowerPlaced,
    effectiveObjectTowerPlaced,
    totalWaves,
    shouldShowVerificationControls,
    showJackInButton,
    showStartWaveButton,
  } = useTowerDefenseV2DerivedState({
    gameState,
    initialCodeGenerated,
    functionTowerPlaced,
    objectTowerPlaced,
    coreTowerRequirements,
    sharedUnlockActive,
    totalWavesByDifficulty,
  });

  const { canEditGameSettings } = useTowerDefenseV2SettingsEffects({
    applyGameSettings,
    gameStateStatus: gameState.status,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    settingsLocked,
    setSettingsLocked,
    validatedGameSettings,
  });

  const isAnyActionInProgress = isGeneratingAICode || isExecuting || isRefining;
  const currentActionType = isGeneratingAICode
    ? currentTowerType || 'SYNTHESIS'
    : isExecuting
      ? 'SUBMISSION'
      : isRefining
        ? 'REFINEMENT'
        : 'READY';

  useEffect(() => {
    return () => {
      if (successModalTimer) {
        clearTimeout(successModalTimer);
      }
    };
  }, [successModalTimer]);

  useTowerDefenseAudioLifecycle();

  useTowerDefenseV2RefineAvailability({
    isDemo,
    effectiveInitialCodeGenerated,
    isRefining,
    gameStatus: gameState.status,
    setCanRefineSolution,
  });

  useAICodeGenerationBridge({
    setIsGeneratingAICode,
    setCurrentTowerType,
  });

  const { handleJackIn, startWave, autoStartCountdown } = useTowerDefenseV2GameControls({
    addTerminalMessage,
    effectiveInitialCodeGenerated,
    setStatus,
    startEngineWave,
    currentWave: gameState.wave,
    cancelPlacementMode,
    autoStartEnabled,
    autoStartWaveSeconds,
    gameStatus: gameState.status,
    totalWaves,
    coreTowerRequirements,
  });

  const { handleResetGame } = useTowerDefenseV2ResetHandler({
    addTerminalMessage,
    pathNodes,
    resetEngineState,
    resetTowerCounts,
    setCode,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setFunctionTowerPlaced,
    setInitialCodeGenerated,
    setObjectTowerPlaced,
    setPathOverride,
    setShowSuccessModal,
    setGameStats,
    setTerminalOutput,
    successModalTimer,
    setSuccessModalTimer,
    victoryOutputAppliedRef,
    resetSharedUnlock,
    resetMultiProblemEditors,
  });

  const handleResetGameWithEconomy = useCallback(() => {
    setActionUsageCounts(createInitialActionUsageCounts());
    handleResetGame();
  }, [handleResetGame]);

  const {
    handleRunCode,
    handleRunCodeOutput,
    handleSubmitSolution,
    handleRefineSolution,
    handleWatchAdForRefinement,
    handleEnterEndlessMode,
  } = useTowerDefenseV2RunActions({
    addTerminalMessage,
    api,
    canRefineSolution,
    code,
    effectiveInitialCodeGenerated,
    isDemo,
    isRefining,
    language,
    lockGameSettings,
    problem,
    runCodeTests,
    runCodeOutput,
    setCode,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setIsExecuting,
    setIsRefining,
    setRefinementLimitReached,
    setShowAdModal,
    startEndlessMode: canEnterEndlessMode ? startEndlessMode : null,
    startEngineWave,
    submitSolution: runMultiTabVerification,
    setVerifyAttemptInProgress,
    terminalRef,
    setTerminalOutput,
    setTerminalResetKey,
    setShowSuccessModal,
    setCanRefineSolution,
    setIsWatchingAd,
    notifySolutionSuccess,
    coreTowerRequirements,
  });

  const handleRunCodeCharged = useCallback(() => {
    const didSpend = spendForAction({
      actionKey: TD_ACTION_COST_KEYS.RUN_TESTS,
      label: 'Run Tests',
    });
    if (!didSpend) return;
    handleRunCode();
  }, [handleRunCode, spendForAction]);

  const handleRunCodeOutputCharged = useCallback(
    (filter = 'both') => {
      const normalizedFilter = String(filter || 'both').toLowerCase();
      const actionKey =
        normalizedFilter === 'stdout'
          ? TD_ACTION_COST_KEYS.STDOUT
          : normalizedFilter === 'stderr'
            ? TD_ACTION_COST_KEYS.STDERR
            : TD_ACTION_COST_KEYS.OUTPUT;
      const label =
        normalizedFilter === 'stdout'
          ? 'Stdout'
          : normalizedFilter === 'stderr'
            ? 'Stderr'
            : 'Output Capture';

      const didSpend = spendForAction({ actionKey, label });
      if (!didSpend) return;
      handleRunCodeOutput(filter);
    },
    [handleRunCodeOutput, spendForAction]
  );

  const handleAdjustPathCharged = useCallback(
    (mode) => {
      if (!canAdjustPath || pathAdjusting) {
        addTerminalMessage('[WARNING] Path control unavailable right now.');
        return;
      }

      const normalizedMode = mode === 'lengthen' ? 'lengthen' : 'shorten';
      const actionKey =
        normalizedMode === 'lengthen'
          ? TD_ACTION_COST_KEYS.PATH_LENGTHEN
          : TD_ACTION_COST_KEYS.PATH_SHORTEN;
      const didSpend = spendForAction({
        actionKey,
        label: normalizedMode === 'lengthen' ? 'Lengthen Path' : 'Shorten Path',
      });
      if (!didSpend) return;

      adjustPath(normalizedMode);
    },
    [addTerminalMessage, adjustPath, canAdjustPath, pathAdjusting, spendForAction]
  );

  const typewriterIntervalRef = useRef(null);
  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLaserHit = () => {
      // console.log(
      //   '[DEBUG] handleLaserHit triggered in useTowerDefenseV2GameState, language:',
      //   language,
      //   'problem:',
      //   problem
      // );
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
      const snippet = CodeSnippetManager.getCodeSnippetForLanguage(language, problem) || '';
      let index = 0;
      let typedText = '';
      if (window.__tdMonacoEditor) {
        window.__tdMonacoEditor.setValue('');
      }
      typewriterIntervalRef.current = setInterval(() => {
        if (index < snippet.length) {
          typedText += snippet.charAt(index);
          index++;
          if (window.__tdMonacoEditor) {
            window.__tdMonacoEditor.setValue(typedText);
            const model = window.__tdMonacoEditor.getModel();
            if (model) {
              const lineCount = model.getLineCount();
              const maxCol = model.getLineMaxColumn(lineCount);
              window.__tdMonacoEditor.setPosition({ lineNumber: lineCount, column: maxCol });
            }
          }
          setCode(typedText);
        } else {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
          setInitialCodeGenerated(true);
          setCode(snippet);
          if (addTerminalMessage) {
            addTerminalMessage(
              '[COMPILE] Initial solution template generated. Ready for algorithm implementation.'
            );
          }
        }
      }, 20);
    };

    window.addEventListener('td-laser-hit', handleLaserHit);
    return () => {
      window.removeEventListener('td-laser-hit', handleLaserHit);
    };
  }, [language, problem, setCode, setInitialCodeGenerated, addTerminalMessage]);

  const { handleTerminalCommandTracked, handleCodeLineCommitted, clearSuggestionQueueForTower } =
    useTowerDefenseV2TerminalHandlers({
      addTerminalMessage,
      gameState,
      effectiveInitialCodeGenerated,
      isLearningMode,
      effectiveFunctionTowerPlaced,
      effectiveObjectTowerPlaced,
      totalWaves,
      isExecuting,
      isTowerPlacementMode,
      getReservedTowerCount,
      getReservedDeployableCount,
      handleTowerTypeSelect,
      handleDeployableTypeSelect,
      reserveTowerPlacement,
      reserveDeployablePlacement,
      resolveTypeKey,
      setPlacementPalette,
      selectedTower,
      selectTowerById,
      handleUpgradeSelectedTower,
      handleSpecialUpgradeSelectedTower,
      handleSellSelectedTower,
      handleJackIn,
      startWave,
      adjustPath: handleAdjustPathCharged,
      handleCancelPlacement,
      handleRunCode: handleRunCodeCharged,
      handleRunCodeOutput: handleRunCodeOutputCharged,
      handleSubmitSolution,
      shouldShowVerificationControls,
      towerPlacementLocked,
      allowedTowerTypes,
      coreTowerRequirements,
      isDeployableUnlocked,
      isSpecialUpgradeUnlocked,
      setLastTerminalCommand,
      isHomepageDemo,
    });

  clearSuggestionQueueForTowerRef.current = clearSuggestionQueueForTower;

  // Canvas dimensions
  const canvasWidth = gridCols * cellSize;
  const canvasHeight = gridRows * cellSize;

  const { handlePanelChange } = useTowerDefenseV2PanelInteractions({
    setLeftPanel,
    setRightPanel,
    cancelProblemAutoSwitch,
    setShowProblemIntroNote,
    isHomepageDemo,
  });

  useTowerDefenseV2InitialCodeEffects({ initialCodeGenerated });

  const panelActionsProps = useTowerDefenseV2PanelActions({
    shouldShowVerificationControls,
    handleRunCode: handleRunCodeCharged,
    handleRunCodeOutput: handleRunCodeOutputCharged,
    handleSubmitSolution,
    handleRefineSolution,
    isExecuting,
    isRefining,
    isWatchingAd,
    refinementLimitReached,
    canRefineSolution,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    codeSubmitted,
    isAnyActionInProgress,
    currentActionType,
    formattedTime,
    setShowAdModal,
    handleResetGame: handleResetGameWithEconomy,
    validatedGameSettings,
    handleGameSettingsChange,
    canEditGameSettings,
    difficultyBaseStats,
    isLearningMode,
    actionCosts,
  });

  const isEmbeddedHomepageOnboardingDemo = Boolean(
    onEmbeddedVictory && learningPathOnboarding && learningPathTitleSlug === 'lp-m0-td-hello-print'
  );

  useTowerDefenseV2LearningCompletion({
    isLearningMode,
    learningPathMeta,
    gameStatus: gameState.status,
    addTerminalMessage,
    setGameStats,
    shouldPersistGuestLearningCompletion: !isEmbeddedHomepageOnboardingDemo,
    onLearningXpAwarded: onEmbeddedLearningXp,
  });

  const handleNavigateToList = useCallback(
    () => (isLearningMode ? handleReturnToMap() : navigate(browseBackTarget.path)),
    [browseBackTarget.path, handleReturnToMap, isLearningMode, navigate]
  );

  const panelLayoutProps = useTowerDefenseV2PanelLayoutProps({
    isLearningMode,
    gameState,
    initialLives,
    formattedTime,
    codeSubmissionSuccess,
    handleResetGame,
    handleNavigateToList,
    navigateToListLabel: browseBackTarget.label,
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
    validatedGameSettings,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    functionTowerPlaced: effectiveFunctionTowerPlaced,
    objectTowerPlaced: effectiveObjectTowerPlaced,
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
    adjustPath: handleAdjustPathCharged,
    language,
    code,
    terminalOutput,
    terminalRef,
    chatPanelRef,
    terminalResetKey,
    codeSubmitted,
    towerPlacementLocked,
    shouldShowVerificationControls,
    handleUserLanguageChange,
    setCode,
    handleCodeLineCommitted,
    lockedLearningLanguage,
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
    setActiveProblemIndex,
    problemError,
    leftPanel,
    rightPanel,
    handlePanelChange,
    panelActionsProps,
  });

  return {
    panelLayoutProps,
    language,
    gameState,
    codeSubmitted,
    codeSubmissionSuccess,
    playerLevel,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    functionTowerPlaced,
    objectTowerPlaced,
    isMultiProblemTower,
    problemTabs,
    activeProblemIndex,
    code,
    gridCols,
    gridRows,
    leftPanel,
    rightPanel,
    setLeftPanel,
    setRightPanel,
    lastTerminalCommand,
    learningPathOnboardingActive,
    setLearningPathOnboardingActive,
    verifyAttemptInProgress,
    validatedGameSettings,
    problem,
    problemError,
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
    handleEnterEndlessMode: canEnterEndlessMode ? handleEnterEndlessMode : null,
    learningPathData,
    learningNodeId,
    learningNextNode,
    handleContinueLearning,
    handleReturnToMap,
  };
}

