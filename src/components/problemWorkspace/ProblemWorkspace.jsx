import { Box, Button, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'react-resizable/css/styles.css';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageTemplate from '../layout/PageTemplate';
import LoadingScreen from './LoadingScreen';
import ProblemWorkspaceLayout from './ProblemWorkspaceLayout';
import AdModal from '../towerDefense/AdModal';
import GuestSignupWall from '../guest/GuestSignupWall';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';
import useCityMissionSync from '../../hooks/city/useCityMissionSync';
import useLearningPathData from '../../hooks/useLearningPathData';
import { useEditor } from '../../hooks/problemWorkspace/useEditor';
import { useTimer } from '../../hooks/problemWorkspace/useTimer';
import { api } from '../../services/api';
import { trackUserContentEvent } from '../../services/userContentEventService';
import audioManager from '../../utils/audio/AudioManager';
import logger from '../../utils/core/logger';
import { recordClientIssue } from '../../utils/feedback/clientIssueReporter';
import { getUserFacingErrorMessage } from '../../utils/ui/userFacingErrors';
import { executeCodeWithTestCasesClient } from '@rivie13/premium-core/compiler';

// Import custom hooks
import useAnimationSettings from './hooks/useAnimationSettings';
import useChallengeState from './hooks/useChallengeState';
import useCodeExecution from './hooks/useCodeExecution';
import useExecutionAds from './hooks/useExecutionAds';
import useNextProblem from './hooks/useNextProblem';
import useProblemData from './hooks/useProblemData';
import useScoring from './hooks/useScoring';
import useSubmissions from './hooks/useSubmissions';
import LearningWorkspaceTutorialManager from '../learningPath/tutorial/LearningWorkspaceTutorialManager';

// Import utility functions
//import AnimationControls from '../components/problemWorkspace/utils/AnimationControls';
import { checkTestCases, getFullCode, getUserStdout } from './utils/codeHelpers';
import { formatTime } from './utils/formatters';
import {
  buildGuestLearningCompletedNodes,
  completeLearningPathNode,
  loadLearningPathProgress,
} from '../../utils/learning/learningPathProgress';
import { getNextLearningNode } from '../../utils/learning/learningPathNavigation';
import {
  computeCompletion,
  computeModuleAvailability,
  getNodeStatus,
} from '../../utils/learning/learningPathStatus.js';
import { normalizeDataPacketsPayload } from '../../utils/economy/dataPackets';
import { normalizeClusterNavigation } from '../../utils/navigation/clusterNavigation';
import {
  buildClusterMissionState,
  buildLearningMissionState,
  buildPathWithSearch,
} from '../../utils/navigation/cityStoryState';

// Import high performance mode styles
import '../../styles/highPerformance.css';

const ProblemWorkspace = () => {
  const { titleSlug, pathSlug } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const { syncMissionState } = useCityMissionSync();
  const trackedSurfaceKeyRef = useRef(null);
  const trackedProblemStartedKeyRef = useRef(null);
  const trackedProblemSolvedKeyRef = useRef(null);
  const toast = useToast();
  const resolveLearningLanguage = useCallback((value) => {
    if (!value) return null;
    const normalized = String(value).toLowerCase();
    if (normalized.includes('python')) return 'python';
    if (normalized.includes('javascript')) return 'javascript';
    if (normalized.includes('java')) return 'java';
    if (normalized.includes('cpp') || normalized.includes('c++')) return 'cpp';
    return normalized;
  }, []);
  const mode = location.state?.mode || 'practice';
  const clusterNavigation = useMemo(
    () => normalizeClusterNavigation(location.state?.clusterNavigation),
    [location.state?.clusterNavigation]
  );
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isLearningMode = Boolean(
    location.state?.learningMode ||
    location.state?.learningPath ||
    location.state?.mode === 'learning' ||
    ['1', 'true', 'yes'].includes((searchParams.get('learning') || '').toLowerCase()) ||
    (location.pathname.includes('/learning/') && location.pathname.includes('/problems/'))
  );
  const isLearningPathMode = useMemo(
    () =>
      Boolean(location.state?.learningPath) ||
      (location.pathname.includes('/learning/') && location.pathname.includes('/problems/')),
    [location.pathname, location.state?.learningPath]
  );
  const learningPathState = location.state?.learningPath || null;
  const learningPathSlug =
    pathSlug || learningPathState?.pathId || location.state?.learningLanguage || 'python-path';
  const { pathData: learningPathData, loading: isLearningPathLoading } = useLearningPathData(
    isLearningMode ? learningPathSlug : null
  );
  const learningNodeId = useMemo(() => {
    if (learningPathState?.nodeId) return learningPathState.nodeId;
    if (!learningPathData || !titleSlug) return null;
    const matched = learningPathData.nodes.find(
      (node) => node.content?.learningProblemSlug === titleSlug
    );
    return matched?.id || null;
  }, [learningPathData, learningPathState?.nodeId, titleSlug]);
  const learningNextNode = useMemo(
    () => getNextLearningNode(learningPathData, learningNodeId, learningPathState?.moduleId),
    [learningPathData, learningNodeId, learningPathState?.moduleId]
  );
  const lockedLearningLanguage = useMemo(() => {
    if (!isLearningMode) return null;
    const stateLanguage =
      location.state?.learningLanguage || location.state?.learningPath?.language;
    const resolvedState = resolveLearningLanguage(stateLanguage);
    if (resolvedState) return resolvedState;
    return resolveLearningLanguage(pathSlug);
  }, [isLearningMode, location.state, pathSlug, resolveLearningLanguage]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !titleSlug) return;

    const surface = isLearningMode ? 'learning_workspace' : 'problem_workspace';
    const area = isLearningMode ? 'learning' : 'interview';
    const entrySource = isLearningMode
      ? 'learning_map'
      : clusterNavigation?.clusterId
        ? 'cluster_detail'
        : 'problem_list';
    const pathId = isLearningMode ? learningPathData?.pathId || learningPathSlug : null;
    const key = `${surface}:${titleSlug}:${pathId || ''}:${clusterNavigation?.clusterId || ''}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area,
      surface,
      entrySource,
      problemSlug: titleSlug,
      ...(pathId ? { pathId } : {}),
      ...(clusterNavigation?.clusterId ? { clusterId: clusterNavigation.clusterId } : {}),
      ...(mode ? { mode } : {}),
    });
  }, [
    clusterNavigation?.clusterId,
    isAuthenticated,
    isLearningMode,
    learningPathData?.pathId,
    learningPathSlug,
    mode,
    titleSlug,
  ]);

  // Basic state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isGuestSignupWallOpen, setIsGuestSignupWallOpen] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [learningGateActive, setLearningGateActive] = useState(false);
  const [learningGateChecked, setLearningGateChecked] = useState(false);
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [showLearningAdModal, setShowLearningAdModal] = useState(false);
  const [selectedLearningAdType, setSelectedLearningAdType] = useState(null);
  const [isApplyingLearningAdCredit, setIsApplyingLearningAdCredit] = useState(false);
  const [learningCompletedNodes, setLearningCompletedNodes] = useState(() => new Set());
  const [isLearningProgressLoading, setIsLearningProgressLoading] = useState(false);
  const learningAdOptions = useMemo(
    () => ({
      short: { label: 'Short (+1)', credits: 1 },
      medium: { label: 'Medium (+3)', credits: 3 },
      long: { label: 'Long (+5)', credits: 5 },
    }),
    []
  );
  const [isChatVisible, setIsChatVisible] = useState(() => {
    try {
      const stored = localStorage.getItem('pw_chat_visible');
      return stored !== 'false';
    } catch {
      return true;
    }
  });
  const ensureChatVisible = useCallback(() => {
    setIsChatVisible(true);
  }, []);
  const handleResetLearningTutorial = useCallback(() => {
    window.dispatchEvent(new Event('learning-workspace-tutorial-reset'));
  }, []);



  useEffect(() => {
    if (!isLearningPathMode || !user?.id || !learningPathData?.pathId) {
      setLearningGateActive(false);
      setLearningGateChecked(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const response = await api.learningPath.getRateLimit(learningPathData.pathId);
        if (!isMounted) return;
        const rateLimit = response?.rateLimit || null;
        setLearningRateLimit(rateLimit);
        setLearningGateChecked(true);
        if (rateLimit && !rateLimit.unlimited && rateLimit.remaining <= 0) {
          setLearningGateActive(true);
          setShowLearningAdModal(true);
        } else {
          setLearningGateActive(false);
        }
      } catch {
        if (!isMounted) return;
        setLearningGateActive(false);
        setLearningGateChecked(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isLearningPathMode, learningPathData?.pathId, user?.id]);

  useEffect(() => {
    if (showLearningAdModal) {
      setSelectedLearningAdType(null);
    }
  }, [showLearningAdModal]);

  useEffect(() => {
    if (!isLearningPathMode || !learningPathData?.pathId) {
      setLearningCompletedNodes(new Set());
      setIsLearningProgressLoading(false);
      return;
    }

    let isMounted = true;
    setIsLearningProgressLoading(true);

    (async () => {
      try {
        if (isAuthenticated) {
          const loaded = await loadLearningPathProgress(
            learningPathData.pathId,
            learningPathData.seedCompletedNodeIds,
            learningPathData
          );
          if (isMounted) {
            setLearningCompletedNodes(loaded);
          }
          return;
        }

        const seed = new Set(learningPathData.seedCompletedNodeIds || []);
        const solvedSlugs = Array.isArray(guestCtx?.progress?.problemsSolved)
          ? guestCtx.progress.problemsSolved
          : [];
        const guestCompletedNodes = Array.isArray(guestCtx?.progress?.lpNodesCompleted)
          ? guestCtx.progress.lpNodesCompleted
          : [];
        const merged = buildGuestLearningCompletedNodes({
          pathData: learningPathData,
          seedIds: Array.from(seed),
          solvedSlugs,
          guestNodeIds: guestCompletedNodes,
        });
        if (isMounted) {
          setLearningCompletedNodes(merged);
        }
      } finally {
        if (isMounted) {
          setIsLearningProgressLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    isLearningPathMode,
    learningPathData,
    guestCtx?.progress?.lpNodesCompleted,
    guestCtx?.progress?.problemsSolved,
  ]);

  const learningNode = useMemo(() => {
    if (!isLearningPathMode || !learningPathData || !learningNodeId) return null;
    return learningPathData.nodes.find((node) => node.id === learningNodeId) || null;
  }, [isLearningPathMode, learningNodeId, learningPathData]);

  const learningCompletion = useMemo(
    () => computeCompletion(learningPathData, learningCompletedNodes),
    [learningCompletedNodes, learningPathData]
  );

  const learningModuleAvailability = useMemo(
    () => computeModuleAvailability(learningPathData, learningCompletion),
    [learningCompletion, learningPathData]
  );

  const learningNodeStatus = useMemo(() => {
    if (!isLearningPathMode || !learningNode || !learningPathData) return null;
    return getNodeStatus(learningNode, learningCompletion, learningModuleAvailability);
  }, [
    isLearningPathMode,
    learningNode,
    learningCompletion,
    learningModuleAvailability,
    learningPathData,
  ]);

  useEffect(() => {
    if (!titleSlug) {
      return;
    }

    const resumePath = buildPathWithSearch(location.pathname, location.search);
    const routeMissionState = isLearningMode
      ? buildLearningMissionState({
          learningPathId: learningPathData?.pathId || learningPathSlug,
          moduleId: learningPathState?.moduleId || learningNode?.moduleId || null,
          nextNodeId: learningNextNode?.id || null,
          nodeId: learningNodeId,
          problemSlug: titleSlug,
          resumePath,
          solvedCount: learningCompletedNodes.size,
          totalCount: learningPathData?.nodes?.length ?? null,
        })
      : buildClusterMissionState({
          clusterId: clusterNavigation?.clusterId || null,
          collectionId: clusterNavigation?.collectionId || null,
          problemSlug: titleSlug,
          resumePath,
          totalCount: clusterNavigation?.orderedSlugs?.length ?? null,
        });

    if (!routeMissionState) {
      return;
    }

    void syncMissionState({
      progressSummary: isLearningMode
        ? {
            learningTrialSolvedCount: learningCompletedNodes.size,
            lpNodesCompletedCount: learningCompletedNodes.size,
            problemsSolvedCount: learningCompletedNodes.size,
          }
        : null,
      routeMissionState,
    });
  }, [
    clusterNavigation?.clusterId,
    clusterNavigation?.collectionId,
    clusterNavigation?.orderedSlugs,
    isLearningMode,
    learningCompletedNodes.size,
    learningNextNode?.id,
    learningNode?.moduleId,
    learningNodeId,
    learningPathData?.nodes?.length,
    learningPathData?.pathId,
    learningPathSlug,
    learningPathState?.moduleId,
    location.pathname,
    location.search,
    syncMissionState,
    titleSlug,
  ]);

  const hasResolvedLearningPathContext =
    isLearningPathMode && !isLearningPathLoading && Boolean(learningPathData);

  const isLearningPathProblemBlocked =
    hasResolvedLearningPathContext &&
    !isLearningProgressLoading &&
    (!learningNodeId || !learningNode || learningNodeStatus === 'locked');

  const handleLearningAdComplete = useCallback(async () => {
    if (isApplyingLearningAdCredit || !learningPathData?.pathId) return;
    setIsApplyingLearningAdCredit(true);
    try {
      const response = await api.learningPath.watchAd(
        learningPathData.pathId,
        selectedLearningAdType || 'short'
      );
      setLearningRateLimit(response?.rateLimit || null);
      setLearningGateActive(false);
      setShowLearningAdModal(false);
      toast({
        title: 'Credit applied',
        description: `Added ${response?.creditsEarned || 0} learning credit(s).`,
        status: 'success',
        duration: 2400,
        isClosable: true,
      });
    } catch (error) {
      const remaining = error?.data?.rateLimit?.adCooldownRemaining || 0;
      if (error?.data?.rateLimit) setLearningRateLimit(error.data.rateLimit);
      toast({
        title: 'Ad cooldown active',
        description:
          remaining > 0
            ? `Please wait ${Math.ceil(remaining / 60)}m before watching another ad.`
            : 'Please wait before watching another ad.',
        status: 'warning',
        duration: 2600,
        isClosable: true,
      });
    } finally {
      setIsApplyingLearningAdCredit(false);
    }
  }, [isApplyingLearningAdCredit, learningPathData?.pathId, selectedLearningAdType, toast]);

  // Animation settings hook
  const { isHighRes, animationsEnabled, settings, quality, toggleAnimations } =
    useAnimationSettings({ defaultEnabled: true });

  // Challenge state
  const isChallengeMode = location.state?.mode === 'challenge';
  const challenges = location.state?.challenges || [];

  // Use custom hooks
  const {
    code,
    setCode: handleEditorChange,
    editor,
    setEditor,
    setMatrixBombActive,
    setCurrentLine,
    setShouldAddRandomChars,
    updateMatrixEffect,
  } = useEditor('');

  const { timer, hasStarted, startTimer, stopTimer, restartTimer, setFreshTimer } = useTimer(mode);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [xpSummary, setXpSummary] = useState(null);
  const [xpAwards, setXpAwards] = useState([]);
  const [xpLevelUpInfo, setXpLevelUpInfo] = useState(null);
  const [dataPacketAward, setDataPacketAward] = useState(null);
  const showWorkspaceErrorToast = useCallback(
    (errorFamily) => {
      const toastConfig = {
        problem_load_failed: {
          id: 'problem-workspace-load-failed',
          title: 'Problem unavailable',
          description: 'We could not load this problem right now. Please try again.',
        },
        code_execution_failed: {
          id: 'problem-workspace-run-failed',
          title: 'Run failed',
          description: 'We could not run your code right now. Please try again.',
        },
        output_capture_failed: {
          id: 'problem-workspace-output-failed',
          title: 'Output capture failed',
          description: 'We could not capture program output right now. Please try again.',
        },
        score_history_failed: {
          id: 'problem-workspace-score-history-failed',
          title: 'Score history unavailable',
          description: 'We could not load your previous score history right now.',
        },
        score_sync_failed: {
          id: 'problem-workspace-score-sync-failed',
          title: 'Score not saved',
          description: 'Your result was calculated, but we could not save your score right now.',
        },
      };

      const config = toastConfig[errorFamily];
      if (!config) return;
      if (typeof toast.isActive === 'function' && toast.isActive(config.id)) {
        return;
      }

      toast({
        id: config.id,
        title: config.title,
        description: config.description,
        status: 'warning',
        duration: 3200,
        isClosable: true,
        position: 'top',
      });
    },
    [toast]
  );

  const {
    problemData,
    isLoading,
    error: problemLoadError,
    language,
    handleLanguageChange,
    isAIProblem,
  } = useProblemData({
    titleSlug,
    handleEditorChange,
    pathname: location.pathname,
    preferredLanguage: lockedLearningLanguage,
    onLoadError: () => showWorkspaceErrorToast('problem_load_failed'),
  });

  useEffect(() => {
    if (!lockedLearningLanguage) return;
    if (language !== lockedLearningLanguage) {
      handleLanguageChange(lockedLearningLanguage);
    }
  }, [lockedLearningLanguage, language, handleLanguageChange]);

  const {
    executionRateLimit,
    setExecutionRateLimit,
    showExecutionAdModal,
    setShowExecutionAdModal,
    isApplyingExecutionCredit,
    setIsApplyingExecutionCredit,
    selectedExecutionAdType,
    setSelectedExecutionAdType,
    executionAdOptions,
    selectedExecutionAd,
    handleExecutionAdModalClose,
  } = useExecutionAds();

  const {
    isExecuting,
    setIsExecuting,
    executionResult,
    setExecutionResult,
    handleRunCode: executeRunCode,
    handleRunOutput: executeRunOutput,
  } = useCodeExecution({
    getFullCode: () => getFullCode(code, editor),
    problemData,
    titleSlug,
    language,
    mode,
    user,
    onRateLimit: (data) => {
      const nextRateLimit = data?.rateLimit || null;
      setExecutionRateLimit(nextRateLimit);
      const cooldownRemaining = nextRateLimit?.adCooldownRemaining || 0;
      if (cooldownRemaining > 0) {
        setExecutionResult(
          (prev) =>
            `${prev}\n⏳ Execution ad cooldown active. Wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.\n`
        );
        setShowExecutionAdModal(false);
        return;
      }
      setShowExecutionAdModal(true);
    },
    onRateLimitUpdate: (rateLimit) => {
      setExecutionRateLimit(rateLimit || null);
    },
    onExecutionError: ({ type }) => {
      showWorkspaceErrorToast(
        type === 'output' ? 'output_capture_failed' : 'code_execution_failed'
      );
    },
  });

  const { nextProblem } = useNextProblem({
    problemData,
    isAIProblem,
    currentTitleSlug: titleSlug,
    clusterNavigation,
  });

  useEffect(() => {
    if (!isLearningMode || !isLearningPathLoading) return;
    if (!learningPathData) {
      logger.warn('Learning path data not available yet');
    }
  }, [isLearningMode, isLearningPathLoading, learningPathData]);

  const handleExecutionAdComplete = useCallback(async () => {
    if (isApplyingExecutionCredit) return;

    setIsApplyingExecutionCredit(true);
    try {
      const response = await api.codeExecution.addCredit(selectedExecutionAdType);
      setExecutionRateLimit(response?.rateLimit || null);
      setExecutionResult(
        (prev) => `${prev}\n✅ Added ${response?.creditsEarned || 0} execution credit(s).\n`
      );
    } catch (error) {
      const message = getUserFacingErrorMessage(error, 'Failed to add code execution credits.');
      recordClientIssue({
        title: 'Execution credits failed to apply',
        description: message,
        source: 'problem-workspace.execution-ad',
        error,
      });
      setExecutionResult((prev) => `${prev}\n❌ ${message}\n`);
    } finally {
      setIsApplyingExecutionCredit(false);
      setShowExecutionAdModal(false);
    }
  }, [
    isApplyingExecutionCredit,
    selectedExecutionAdType,
    setExecutionRateLimit,
    setExecutionResult,
    setIsApplyingExecutionCredit,
    setShowExecutionAdModal,
  ]);

  // Use extracted hooks - now setExecutionResult is available
  const { challengeState, setChallengeState } = useChallengeState({
    challenges,
    mode: isChallengeMode ? 'challenge' : mode,
    problemData,
    timer,
    setMatrixBombActive,
    setShouldAddRandomChars,
    setFreshTimer,
    startTimer,
    stopTimer,
    setExecutionResult,
  });

  const {
    sessionSubmissions,
    setSessionSubmissions,
    highScore,
    bestTime,
    hasNewHighScore,
    hasNewBestTime,
    finalScore,
    setFinalScore,
    timeSpent,
    setTimeSpent,
    updateScore,
  } = useSubmissions({
    user,
    problemData,
    mode,
    onLoadError: () => showWorkspaceErrorToast('score_history_failed'),
    onScoreSyncError: () => showWorkspaceErrorToast('score_sync_failed'),
  });

  const { calculateScore, calculateAiPenalty, getTimeLimit } = useScoring({
    difficulty: problemData?.difficulty,
    timer,
    aiUsageCount,
    sessionSubmissions,
    challenges,
  });

  // Generate custom keyframes based on animation settings
  const customScanLineAnimation = useMemo(() => {
    const {
      scanLineAnimation: { speed },
    } = settings;
    return keyframes`
			0% { transform: translateY(-100%); }
			100% { transform: translateY(100vh); }
		`;
  }, [settings.scanLineAnimation]);

  const customGlitchAnimation = useMemo(() => {
    const {
      glitchEffects: { intensity },
    } = settings;
    // Scale down text-shadow values based on intensity
    const scaledIntensity = intensity || 0;
    return keyframes`
			0% {
				text-shadow: ${0.05 * scaledIntensity}em 0 0 #00fffc, ${-0.03 * scaledIntensity}em ${-0.04 * scaledIntensity}em 0 #fc00ff,
									 ${0.025 * scaledIntensity}em ${0.04 * scaledIntensity}em 0 #fffc00;
			}
			15% {
				text-shadow: ${0.05 * scaledIntensity}em 0 0 #00fffc, ${-0.03 * scaledIntensity}em ${-0.04 * scaledIntensity}em 0 #fc00ff,
									 ${0.025 * scaledIntensity}em ${0.04 * scaledIntensity}em 0 #fffc00;
			}
			16% {
				text-shadow: ${-0.05 * scaledIntensity}em ${-0.025 * scaledIntensity}em 0 #00fffc, ${0.025 * scaledIntensity}em ${0.035 * scaledIntensity}em 0 #fc00ff,
									 ${-0.05 * scaledIntensity}em ${-0.05 * scaledIntensity}em 0 #fffc00;
			}
			49% {
				text-shadow: ${-0.05 * scaledIntensity}em ${-0.025 * scaledIntensity}em 0 #00fffc, ${0.025 * scaledIntensity}em ${0.035 * scaledIntensity}em 0 #fc00ff,
									 ${-0.05 * scaledIntensity}em ${-0.05 * scaledIntensity}em 0 #fffc00;
			}
			50% {
				text-shadow: ${0.05 * scaledIntensity}em ${0.035 * scaledIntensity}em 0 #00fffc, ${0.03 * scaledIntensity}em 0 0 #fc00ff,
									 0 ${-0.04 * scaledIntensity}em 0 #fffc00;
			}
			99% {
				text-shadow: ${0.05 * scaledIntensity}em ${0.035 * scaledIntensity}em 0 #00fffc, ${0.03 * scaledIntensity}em 0 0 #fc00ff,
									 0 ${-0.04 * scaledIntensity}em 0 #fffc00;
			}
			100% {
				text-shadow: ${-0.05 * scaledIntensity}em 0 0 #00fffc, ${-0.025 * scaledIntensity}em ${-0.04 * scaledIntensity}em 0 #fc00ff,
									 ${-0.04 * scaledIntensity}em ${-0.025 * scaledIntensity}em 0 #fffc00;
			}
		`;
  }, [settings.glitchEffects]);

  // Wrapper for the runCode function from the hook
  const handleRunCode = async () => {
    await executeRunCode();
  };

  const handleRunOutput = async (filter = 'stdout') => {
    await executeRunOutput(filter);
  };

  const handleReturnToLearningMap = useCallback(() => {
    const moduleId = learningPathState?.moduleId;
    const basePath = `/learning/${learningPathSlug}`;
    const target = moduleId ? `${basePath}?module=${encodeURIComponent(moduleId)}` : basePath;
    navigate(target, {
      state: {
        learningMode: true,
        learningLanguage: learningPathSlug,
        learningPath: learningPathState,
      },
    });
  }, [learningPathSlug, learningPathState, navigate]);

  const handleContinueLearning = useCallback(() => {
    if (!learningPathData || !learningNextNode) {
      handleReturnToLearningMap();
      return;
    }

    const routeSlug = learningPathState?.pathId || learningPathSlug;
    const nextState = {
      learningMode: true,
      learningLanguage: routeSlug,
      learningPath: {
        pathId: learningPathData.pathId,
        nodeId: learningNextNode.id,
        moduleId: learningNextNode.moduleId,
      },
    };

    if (learningNextNode.type === LEARNING_NODE_TYPES.TOWER) {
      navigate(`/learning/${routeSlug}/tower/${learningNextNode.id}`, { state: nextState });
      return;
    }

    if (
      [LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(learningNextNode.type)
    ) {
      const slug = learningNextNode.content?.learningProblemSlug;
      if (slug) {
        navigate(`/learning/${routeSlug}/problems/${slug}`, { state: nextState });
        return;
      }
    }

    navigate(`/learning/${routeSlug}/${learningNextNode.id}`, { state: nextState });
  }, [
    handleReturnToLearningMap,
    learningNextNode,
    learningPathData,
    learningPathSlug,
    learningPathState?.pathId,
    navigate,
  ]);

  // Handle code submission
  const handleSubmit = async () => {
    try {
      setIsExecuting(true);
      setExecutionResult('Running test cases...\n');
      setSessionSubmissions((prev) => prev + 1);

      // Stop the timer
      stopTimer();

      // Determine if the problem is an AI problem or learning problem
      const isAIProblem = location.pathname.includes('/ai-problems/');
      const isLearningProblem =
        location.pathname.includes('/learning/') && location.pathname.includes('/problems/');
      const shouldTrackInterviewSolveEvents =
        isAuthenticated && !isLearningProblem && !isAIProblem && Boolean(titleSlug);

      if (
        shouldTrackInterviewSolveEvents &&
        trackedProblemStartedKeyRef.current !== String(titleSlug)
      ) {
        trackedProblemStartedKeyRef.current = String(titleSlug);
        void trackUserContentEvent('user_problem_started', {
          area: 'interview',
          surface: 'problem_workspace',
          entrySource: clusterNavigation?.clusterId ? 'cluster_detail' : 'problem_list',
          problemSlug: String(titleSlug),
          ...(clusterNavigation?.clusterId ? { clusterId: clusterNavigation.clusterId } : {}),
          ...(mode ? { mode } : {}),
        });
      }

      // Immediate feedback for test cases check
      setExecutionResult((prev) => prev + 'Checking for test cases...\n');

      const hasTestCases = await checkTestCases(problemData?.questionId, titleSlug);
      if (!hasTestCases) {
        setExecutionResult(
          (prev) =>
            prev +
            `❌ Error: No test cases found for problem: ${problemData.title} (ID: ${problemData.questionId})\n`
        );
        return;
      }

      setExecutionResult((prev) => prev + 'Executing code...\n');

      // Fetch test cases and expected outputs
      let testCasesData = [];
      let metadata = null;
      let expectedOutputs = null;

      if (isLearningProblem) {
        const data = await api.learningProblems.getById(titleSlug);
        testCasesData = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: data?.evaluationMode === 'output' ? 'void' : null,
        };
      } else if (isAIProblem) {
        const data = await api.aiProblems.getById(titleSlug);
        testCasesData = data?.testCases;
        expectedOutputs = data?.expectedOutputs;
        metadata = {
          name: data?.functionName,
          params: data?.functionParams,
          returnType: null,
        };
      } else {
        const data = await api.problems.checkTestCases(titleSlug);
        testCasesData = data?.testCases;
        expectedOutputs = data?.expectedOutputs || data?.metaData?.expectedOutputs;
        metadata = {
          name: data?.metaData?.functionName || data?.metaData?.name || 'solution',
          params: data?.metaData?.functionParams || data?.metaData?.params,
          returnType: data?.metaData?.returnType || null,
        };
      }

      if (!testCasesData || !Array.isArray(testCasesData)) {
        throw new Error('No test cases found for this problem');
      }

      const formattedTestCases = testCasesData.map((tc, index) => {
        return {
          input: tc,
          expected: expectedOutputs ? expectedOutputs[index] : (tc.expected ?? tc.expectedOutput ?? null),
          metadata,
        };
      });

      const evalResult = await executeCodeWithTestCasesClient(
        getFullCode(code, editor),
        formattedTestCases,
        language
      );

      const payload = {
        problemId: isAIProblem || isLearningProblem ? titleSlug : problemData?.questionId,
        code: getFullCode(code, editor),
        language: language.toLowerCase(),
        status: evalResult.success ? 'accepted' : 'failed',
        executionTime: evalResult.executionTime,
        memoryUsed: evalResult.memoryUsed,
        difficulty: problemData?.difficulty || 'easy',
        mode: mode || 'practice',
        newTime: timer,
        aiUsageCount
      };

      const submitResponse = isAuthenticated
        ? await api.problems.submitSolution(payload)
        : await api.problems.submitGuestSolution(payload);

      const response = {
        ...submitResponse,
        testResults: evalResult.results,
        formatted: {
          testCases: evalResult.results,
        },
      };

      let output = '';

      // Process test case results
      const testCases = isLearningProblem ? response?.testResults : response?.formatted?.testCases;

      if (testCases) {
        testCases.forEach((testCase, index) => {
          output += `Test case details:\n`;
          output += testCase.passed ? '✅ Test Case Passed ✅\n' : '❌ Test Case Failed ❌\n';
          output += `Input: ${JSON.stringify(testCase.input)}\n`;
          output += `Expected Output: ${JSON.stringify(testCase.expectedOutput)}\n`;
          output += `Actual Output: ${JSON.stringify(testCase.actualOutput)}\n`;
          output += `Runtime: ${parseFloat(testCase.runtime || 0).toFixed(2)}s\n`;
          output += `Memory Used: ${((testCase.memory || 0) / 1024).toFixed(2)}MB\n`;

          const userStdout = getUserStdout(testCase.stdout);
          if (userStdout) {
            output += `Stdout:\n${userStdout}\n`;
          }

          // Show error information regardless of mode
          if (!testCase.passed) {
            if (testCase.compile_output) {
              output += `Compilation Error:\n${testCase.compile_output}\n`;
            }
            if (testCase.stderr) {
              output += `Runtime Error:\n${testCase.stderr}\n`;
            }
            if (testCase.message) {
              output += `Message:\n${testCase.message}\n`;
            }
            if (testCase.error) {
              output += `Error:\n${testCase.error}\n`;
            }
          }
          output += `------------------\n`;
        });

        // Set the execution result before checking if all tests passed
        setExecutionResult(output);

        // Continue with score calculation only if all tests passed and in ranked mode
        const allTestsPassed = testCases.every((testCase) => testCase.passed);
        audioManager.playSoundEffect(allTestsPassed ? 'solution-successful' : 'solution-failed');

        // Restart the timer if failed any test case and in ranked mode or challenge mode
        if (!allTestsPassed && (mode === 'ranked' || mode === 'challenge')) {
          restartTimer();
        }

        // Check if all tests passed
        if (allTestsPassed && isLearningProblem) {
          // Compute guest XP preview BEFORE mutations so we can show it in the modal
          const guestXpPreview =
            !isAuthenticated && titleSlug
              ? guestCtx?.getSolveRewardPreview?.(titleSlug, problemData?.difficulty || 'easy')
              : null;

          if (!isAuthenticated && titleSlug) {
            guestCtx?.recordProblemAttempt?.(titleSlug);
            guestCtx?.recordProblemSolved?.(titleSlug, {
              difficulty: problemData?.difficulty || 'easy',
              source: 'learning-workspace',
            });
          }

          let completionResponse = null;
          if (learningPathData?.pathId && learningNodeId && user?.id) {
            completionResponse = await completeLearningPathNode(
              learningPathData.pathId,
              learningNodeId
            );
          }
          if (completionResponse?.error === 'rate_limit') {
            const remaining = completionResponse.rateLimit?.adCooldownRemaining || 0;
            const description =
              remaining > 0
                ? `Please wait ${Math.ceil(remaining / 60)}m before completing more learning activities.`
                : 'Please wait before completing more learning activities.';
            setExecutionResult(`\n⚠️ Learning path rate limit reached. ${description}\n`);
            toast({
              title: 'Learning limit reached',
              description,
              status: 'warning',
              duration: 2800,
              isClosable: true,
            });
            return;
          }
          // Server XP is authoritative; guest local preview is fallback only when server
          // returns nothing (expected for unauthenticated guests).
          const xpPayload = completionResponse?.xp || guestXpPreview || null;
          setXpSummary(xpPayload?.summary || null);
          setXpAwards(Array.isArray(xpPayload?.awards) ? xpPayload.awards : []);
          setXpLevelUpInfo(xpPayload?.levelUp || null);
          setDataPacketAward(
            normalizeDataPacketsPayload(completionResponse?.dataPackets, {
              fallbackXpAmount: Array.isArray(xpPayload?.awards)
                ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
                : 0,
            })
          );

          output = '\nAll test cases passed! 🎉\n\n';
          testCases.forEach((testCase) => {
            output += `Test case details:\n`;
            output += testCase.passed ? '✅ Test Case Passed ✅\n' : '❌ Test Case Failed ❌\n';
            output += `Input: ${JSON.stringify(testCase.input)}\n`;
            output += `Expected Output: ${JSON.stringify(testCase.expectedOutput)}\n`;
            output += `Actual Output: ${JSON.stringify(testCase.actualOutput)}\n`;
            output += `Runtime: ${parseFloat(testCase.runtime || 0).toFixed(2)}s\n`;
            output += `Memory Used: ${((testCase.memory || 0) / 1024).toFixed(2)}MB\n`;
            output += `------------------\n`;
          });
          setExecutionResult(output);
          setTimeout(() => {
            onOpen();
          }, 1200);

          setChallengeState({
            isTimerRunning: false,
            hasRandomChars: false,
            hasMatrixBomb: false,
            isAIDisabled: false,
          });
          return;
        }

        if (allTestsPassed) {
          // Compute guest XP preview BEFORE mutations so we can show it in the modal
          const guestXpPreview =
            !isAuthenticated && titleSlug
              ? guestCtx?.getSolveRewardPreview?.(titleSlug, problemData?.difficulty || 'easy')
              : null;

          if (!isAuthenticated && titleSlug) {
            guestCtx?.recordProblemAttempt?.(titleSlug);
            guestCtx?.recordProblemSolved?.(titleSlug, {
              difficulty: problemData?.difficulty || 'easy',
              source: isAIProblem ? 'ai-workspace' : 'problem-workspace',
            });
          }

          // Server XP is authoritative; guest local preview is fallback only when server
          // returns nothing (expected for unauthenticated guests).
          const xpPayload = response?.xp || guestXpPreview || null;
          setXpSummary(xpPayload?.summary || null);
          setXpAwards(Array.isArray(xpPayload?.awards) ? xpPayload.awards : []);
          setXpLevelUpInfo(xpPayload?.levelUp || null);
          setDataPacketAward(
            normalizeDataPacketsPayload(response?.dataPackets, {
              fallbackXpAmount: Array.isArray(xpPayload?.awards)
                ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
                : 0,
            })
          );

          if (
            shouldTrackInterviewSolveEvents &&
            trackedProblemSolvedKeyRef.current !== String(titleSlug)
          ) {
            trackedProblemSolvedKeyRef.current = String(titleSlug);
            void trackUserContentEvent('user_problem_solved', {
              area: 'interview',
              surface: 'problem_workspace',
              entrySource: clusterNavigation?.clusterId ? 'cluster_detail' : 'problem_list',
              problemSlug: String(titleSlug),
              ...(clusterNavigation?.clusterId ? { clusterId: clusterNavigation.clusterId } : {}),
              ...(mode ? { mode } : {}),
            });
          }

          const totalRuntime = testCases
            .reduce((sum, testCase) => sum + parseFloat(testCase.runtime || 0), 0)
            .toFixed(3);

          const maxMemory = Math.max(...testCases.map((testCase) => testCase.memory || 0));

          // Calculate score using the useScoring hook
          const { finalScore, breakdown } = calculateScore({
            totalRuntime,
            maxMemory,
            isTimeAttack: challengeState.isTimeAttack,
          });

          // First, calculate actual time spent
          const actualTimeSpent = challengeState.isTimeAttack
            ? getTimeLimit(problemData?.difficulty) - timer
            : timer;

          // Set the state for the modal display
          setTimeSpent(actualTimeSpent);
          setFinalScore(finalScore);

          // Update score in the database
          if (user?.id && (mode === 'ranked' || mode === 'challenge')) {
            await updateScore(finalScore, actualTimeSpent);

            // Explicitly compute the achievement values locally to use in output
            const previousHighScore = highScore;
            const previousBestTime = bestTime;
            const hasNewHighScoreLocal = finalScore > previousHighScore || !previousHighScore;
            const hasNewBestTimeLocal = actualTimeSpent < previousBestTime || !previousBestTime;
          }

          // Detailed output
          output = '\nAll test cases passed! 🎉\n\n';

          // Always show test case details
          if (testCases) {
            testCases.forEach((testCase, index) => {
              output += `Test case details:\n`;
              output += testCase.passed ? '✅ Test Case Passed ✅\n' : '❌ Test Case Failed ❌\n';
              output += `Input: ${JSON.stringify(testCase.input)}\n`;
              output += `Expected Output: ${JSON.stringify(testCase.expectedOutput)}\n`;
              output += `Actual Output: ${JSON.stringify(testCase.actualOutput)}\n`;
              output += `Runtime: ${parseFloat(testCase.runtime).toFixed(2)}s\n`;
              output += `Memory Used: ${(testCase.memory / 1024).toFixed(2)}MB\n`;

              if (!testCase.passed) {
                if (testCase.compile_output) {
                  output += `Compilation Error:\n${testCase.compile_output}\n`;
                }
                if (testCase.stderr) {
                  output += `Runtime Error:\n${testCase.stderr}\n`;
                }
                if (testCase.message) {
                  output += `Message:\n${testCase.message}\n`;
                }
                if (testCase.error) {
                  output += `Error:\n${testCase.error}\n`;
                }
              }
              output += `------------------\n`;
            });
          }

          // Always show performance details
          output += 'Performance Details:\n';
          output += '===================\n';
          output += `Total Runtime: ${totalRuntime}s\n`;
          output += `Peak Memory Usage: ${(maxMemory / 1024).toFixed(2)}MB\n\n`;

          // Only show score breakdown in ranked mode or challenge mode
          if (mode === 'ranked' || mode === 'challenge') {
            output += 'Score Breakdown:\n';
            output += '================\n';
            output += `Base Score: ${breakdown.baseScore}\n`;
            if (challengeState.isTimeAttack) {
              output += `Time Penalty: -${breakdown.timeDeduction} (${actualTimeSpent}s)\n`;
            } else {
              output += `Time Penalty: -${breakdown.timeDeduction} (${timer}s)\n`;
            }
            output += `Runtime Penalty: -${breakdown.runtimeDeduction}\n`;
            output += `Memory Penalty: -${breakdown.memoryDeduction}\n`;
            output += `Submission Penalty: -${breakdown.submissionDeduction} (${sessionSubmissions + 1} attempts)\n`;

            // AI Usage Breakdown
            if (breakdown.aiDeduction) {
              output += 'AI Usage Breakdown:\n';
              output += '=================\n';
              output += `Times Used: ${aiUsageCount}\n`;
              for (let i = 0; i < aiUsageCount; i++) {
                output += `Use #${i + 1}: -${50 + i * 25} points\n`;
              }
              output += '----------------\n';
              output += `Total AI Penalty: -${breakdown.aiDeduction}\n\n`;
            }

            output += '----------------\n';
            output += `Raw Score: ${breakdown.rawScore}\n\n`;

            // Challenge Bonus Breakdown
            if (challenges.length > 0) {
              output += 'Challenge Bonuses:\n';
              output += '=================\n';
              challenges.forEach((challenge) => {
                const bonus =
                  {
                    autoTimer: 30,
                    noAI: 75,
                    randomChars: 50,
                    matrixBomb: 75,
                    timeAttack: 100,
                  }[challenge] || 0;
                output += `${challenge}: +${bonus}%\n`;
              });
              output += '----------------\n';
              output += `Total Challenge Bonus: +${breakdown.totalChallengeBonus}%\n`;
              output += `Bonus Multiplier: ${(1 + breakdown.totalChallengeBonus / 1000).toFixed(2)}x\n\n`;
            }

            output += '================\n';
            output += `Final Score: ${finalScore}\n`;

            // Add to output based on achievements
            // Calculate local values rather than using state
            if (user?.id && (mode === 'ranked' || mode === 'challenge')) {
              const previousHighScore = highScore;
              const previousBestTime = bestTime;
              const hasNewHighScoreLocal = finalScore > previousHighScore || !previousHighScore;
              const hasNewBestTimeLocal = actualTimeSpent < previousBestTime || !previousBestTime;

              if (hasNewHighScoreLocal) {
                output += '\n🎉 New High Score! 🎉\n';
              }
              if (hasNewBestTimeLocal) {
                output += '\n⚡ New Best Time! ⚡\n';
              }
            }
          }

          output += '\n\n\n';
          setExecutionResult(output);

          // Open the modal if all test cases passed
          // Wait for 10 seconds before opening the modal
          setTimeout(() => {
            onOpen();
          }, 10000);

          // Stop all challenge effects after successful submission
          setChallengeState({
            isTimerRunning: false,
            hasRandomChars: false,
            hasMatrixBomb: false,
            isAIDisabled: false,
          });
        } else {
          output += '\nSome test cases failed. Please fix the errors and try again.\n\n\n';
          output += '\n\n\n';
          setExecutionResult(output);
        }
      }
    } catch (error) {
      logger.error('Submit error:');
      logger.debug(error.stack);
      audioManager.playSoundEffect('solution-failed');
      if (error?.data?.error_code === 'CODE_EXECUTION_RATE_LIMIT' || error?.data?.showAd) {
        setExecutionRateLimit(error?.data?.rateLimit || null);
        setShowExecutionAdModal(true);
        const message = getUserFacingErrorMessage(error, 'Rate limit exceeded.');
        setExecutionResult((prev) => prev + `❌ ${message}\n`);
      } else {
        const message = getUserFacingErrorMessage(
          error,
          'We could not submit your solution right now. Please try again.'
        );
        recordClientIssue({
          title: 'Solution submission failed',
          description: message,
          source: 'problem-workspace.submit-solution',
          error,
          metadata: { titleSlug },
        });
        setExecutionResult((prev) => prev + `❌ ${message}\n`);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Modify the handleChatInput function to count AI usage
  const handleChatInput = () => {
    if (mode === 'ranked' && !hasStarted) {
      startTimer();
    }
    setAiUsageCount((prev) => prev + 1);
  };

  const handleToggleChatVisibility = () => {
    setIsChatVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pw_chat_visible', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Handle editor content change
  const handleEditorContentChange = (value) => {
    if (mode === 'ranked' || (mode === 'challenge' && !hasStarted)) {
      startTimer();
    }
    handleEditorChange(value);
  };

  // Handle navigation to next problem
  const handleNavigateWithRefresh = (titleSlug, state) => {
    // Store the navigation state in sessionStorage
    sessionStorage.setItem('navigationState', JSON.stringify(state));
    // Navigate to the new problem - use correct endpoint based on current problem type
    if (isAIProblem) {
      navigate(`/ai-problems/${titleSlug}`, { state });
    } else {
      navigate(`/problems/${titleSlug}`, { state });
    }
  };

  // Initialize from session storage
  useEffect(() => {
    const storedState = sessionStorage.getItem('navigationState');
    if (storedState) {
      const state = JSON.parse(storedState);
      // Clear the stored state immediately
      sessionStorage.removeItem('navigationState');
      // Update location state - use correct endpoint based on current problem type
      const isAIProblem = location.pathname.includes('/ai-problems/');
      if (isAIProblem) {
        navigate(`/ai-problems/${titleSlug}`, { state, replace: true });
      } else {
        navigate(`/problems/${titleSlug}`, { state, replace: true });
      }
    }
  }, []);

  // Matrix bomb effect for challenge mode
  useEffect(() => {
    if (challengeState?.hasMatrixBomb && hasStarted && editor && code) {
      // Only activate if animations are enabled or it's a challenge mode requirement
      if (animationsEnabled || challengeState.hasMatrixBomb) {
        setMatrixBombActive(true);
        // Apply matrix effect with intensity based on animation settings
        const intensity = settings.matrixEffects.intensity || 1;
        // Force cursor position update when editor is ready
        const position = editor.getPosition();
        const lineNumber = position ? position.lineNumber : 1;
        setCurrentLine(lineNumber - 1);
        updateMatrixEffect(editor, code, lineNumber, intensity);
      }
    }
    return () => setMatrixBombActive(false);
  }, [
    editor,
    challengeState?.hasMatrixBomb,
    code,
    updateMatrixEffect,
    animationsEnabled,
    settings.matrixEffects,
  ]);

  // Random characters effect for challenge mode
  useEffect(() => {
    if (challengeState.hasRandomChars && hasStarted) {
      // Only activate if animations are enabled or it's a challenge mode requirement
      if (animationsEnabled || challengeState.hasRandomChars) {
        setShouldAddRandomChars(true);
      }
    }
    return () => setShouldAddRandomChars(false);
  }, [hasStarted, challengeState.hasRandomChars, setShouldAddRandomChars, animationsEnabled]);

  // Time attack failure check
  useEffect(() => {
    if (challengeState.isTimeAttack && timer <= 0) {
      // Time's up - stop the timer
      stopTimer();
      setExecutionResult("Time Attack: Time's up! Try again.");
      // Reset timer to initial time limit
      const timeLimit = getTimeLimit(problemData?.difficulty);
      setFreshTimer(timeLimit, true);
    }
  }, [timer, challengeState.isTimeAttack, problemData]);

  // Loading state
  if (isLoading) {
    return (
      <PageTemplate>
        <LoadingScreen
          animationsEnabled={animationsEnabled}
          settings={settings}
          customScanLineAnimation={customScanLineAnimation}
          customGlitchAnimation={customGlitchAnimation}
        />
      </PageTemplate>
    );
  }

  const workspaceLayout = (
    <ProblemWorkspaceLayout
      isAIProblem={isAIProblem}
      isHighRes={isHighRes}
      animationsEnabled={animationsEnabled}
      settings={settings}
      customScanLineAnimation={customScanLineAnimation}
      quality={quality}
      executionRateLimit={executionRateLimit}
      code={code}
      language={language}
      isExecuting={isExecuting}
      executionResult={executionResult}
      onRun={handleRunCode}
      onRunOutput={handleRunOutput}
      onSubmit={handleSubmit}
      mode={mode}
      timer={timer}
      problemData={problemData}
      problemLoadError={problemLoadError}
      sessionSubmissions={sessionSubmissions}
      bestTime={bestTime}
      highScore={highScore}
      formatTime={formatTime}
      setMatrixBombActive={setMatrixBombActive}
      challengeState={challengeState}
      setCurrentLine={setCurrentLine}
      setEditor={setEditor}
      toggleAnimations={toggleAnimations}
      isChatVisible={isChatVisible}
      onToggleChatVisibility={handleToggleChatVisibility}
      onEditorChange={handleEditorContentChange}
      onLanguageChange={handleLanguageChange}
      onChatInput={handleChatInput}
      onResetLearningTutorial={handleResetLearningTutorial}
      fullCode={getFullCode(code, editor)}
      showExecutionAdModal={showExecutionAdModal}
      handleExecutionAdModalClose={handleExecutionAdModalClose}
      handleExecutionAdComplete={handleExecutionAdComplete}
      executionAdOptions={executionAdOptions}
      selectedExecutionAd={selectedExecutionAd}
      selectedExecutionAdType={selectedExecutionAdType}
      setSelectedExecutionAdType={setSelectedExecutionAdType}
      isApplyingExecutionCredit={isApplyingExecutionCredit}
      isSuccessModalOpen={isOpen}
      onCloseSuccessModal={onClose}
      learningNextNode={learningNextNode}
      onContinueLearning={handleContinueLearning}
      onReturnToMap={handleReturnToLearningMap}
      onGuestSignupWallRequested={() => {
        onClose();
        setIsGuestSignupWallOpen(true);
      }}
      timeSpent={timeSpent}
      isLearningMode={isLearningMode}
      isLearningPathMode={isLearningPathMode}
      lockedLearningLanguage={lockedLearningLanguage}
      finalScore={finalScore}
      hasNewHighScore={hasNewHighScore}
      hasNewBestTime={hasNewBestTime}
      aiUsageCount={aiUsageCount}
      xpSummary={xpSummary}
      xpAwards={xpAwards}
      levelUpInfo={xpLevelUpInfo}
      dataPacketAward={dataPacketAward}
      onTryAnotherProblem={() => {
        onClose();
        navigate(isAIProblem ? '/ai-problems/browse' : '/problems');
      }}
      clusterNavigation={clusterNavigation}
      nextProblem={nextProblem}
      isChallengeModalOpen={isChallengeModalOpen}
      onCloseChallengeModal={() => setIsChallengeModalOpen(false)}
      onConfirmChallenge={(challenges) => {
        setIsChallengeModalOpen(false);
        handleNavigateWithRefresh(nextProblem.titleSlug, {
          mode: 'challenge',
          challenges,
          ...(clusterNavigation ? { clusterNavigation } : {}),
        });
      }}
    />
  );

  if (isLearningPathProblemBlocked) {
    const isLockedStep = learningNodeStatus === 'locked';
    return (
      <PageTemplate showGiphyBackground={false}>
        <Box width="100%" minH="100vh" bg="rgba(3, 5, 8, 0.95)" py={{ base: 10, lg: 16 }}>
          <Box maxW="container.md" mx="auto" px={{ base: 4, md: 8 }}>
            <Text fontFamily="'Orbitron', sans-serif" fontSize="2xl" color="cyan.300">
              {isLockedStep ? 'Learning path step locked' : 'Learning path step unavailable'}
            </Text>
            <Text mt={3} color="gray.300" fontFamily="monospace">
              {isLockedStep
                ? 'Complete the required earlier learning path steps before opening this problem.'
                : 'This learning path problem is not available from the current step.'}
            </Text>
            <Button mt={6} colorScheme="cyan" onClick={handleReturnToLearningMap}>
              Back to map
            </Button>
          </Box>
        </Box>
      </PageTemplate>
    );
  }

  if (isLearningPathMode && learningGateChecked && learningGateActive) {
    return (
      <PageTemplate showGiphyBackground={false}>
        <Box width="100%" minH="100vh" bg="rgba(3, 5, 8, 0.95)" py={{ base: 10, lg: 16 }}>
          <Box maxW="container.md" mx="auto" px={{ base: 4, md: 8 }}>
            <Text fontFamily="'Orbitron', sans-serif" fontSize="2xl" color="cyan.300">
              Learning limit reached
            </Text>
            <Text mt={3} color="gray.300" fontFamily="monospace">
              Watch an ad to unlock more learning activities, or wait for the cooldown to reset.
            </Text>
            <Button
              mt={6}
              colorScheme="cyan"
              onClick={() => navigate(`/learning/${learningPathSlug}`)}
            >
              Back to map
            </Button>
          </Box>
        </Box>
        <AdModal
          isOpen={showLearningAdModal}
          onClose={() => setShowLearningAdModal(false)}
          onAdComplete={handleLearningAdComplete}
          title="Learning Path Sponsor"
          ctaLabel={`Unlock +${learningAdOptions[selectedLearningAdType || 'short']?.credits || 1} Credit`}
          footerText={
            learningRateLimit?.adCooldownRemaining
              ? `Ad cooldown: ${Math.ceil(learningRateLimit.adCooldownRemaining / 60)}m.`
              : 'Watching this ad adds learning path credits now.'
          }
          processingText="Syncing sponsor link..."
          adTypeOptions={learningAdOptions}
          selectedAdType={selectedLearningAdType}
          onAdTypeChange={setSelectedLearningAdType}
          adTypeSelectionDisabled={isApplyingLearningAdCredit}
          requireAdTypeSelection
          showSkipButton
          skipLabel="Maybe later"
          onSkip={() => setShowLearningAdModal(false)}
        />
      </PageTemplate>
    );
  }

  if (!isLearningMode) {
    return (
      <>
        {workspaceLayout}
        <GuestSignupWall
          isOpen={isGuestSignupWallOpen}
          onClose={() => setIsGuestSignupWallOpen(false)}
          activitySummary={guestCtx?.activitySummary}
          trialTrack="pro"
        />
      </>
    );
  }

  return (
    <LearningWorkspaceTutorialManager
      isLearningMode={isLearningMode}
      isChatVisible={isChatVisible}
      onEnsureChatVisible={ensureChatVisible}
    >
      {workspaceLayout}
      <GuestSignupWall
        isOpen={isGuestSignupWallOpen}
        onClose={() => setIsGuestSignupWallOpen(false)}
        activitySummary={guestCtx?.activitySummary}
        trialTrack="beginner"
      />
    </LearningWorkspaceTutorialManager>
  );
};

export default ProblemWorkspace;

