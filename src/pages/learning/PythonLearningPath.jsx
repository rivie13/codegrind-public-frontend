import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Switch,
  Text,
  Tooltip,
  VStack,
  usePrefersReducedMotion,
  useToast,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiBookOpen,
  FiCode,
  FiFlag,
  FiGitBranch,
  FiLayers,
  FiMap,
  FiShield,
  FiStar,
} from 'react-icons/fi';
import PageTemplate from '../../components/layout/PageTemplate';
import AdModal from '../../components/towerDefense/AdModal';
import GuestSignupWall from '../../components/guest/GuestSignupWall';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import { drawProfileCard } from '../../components/cyberGrid/profileCardRenderer';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';
import useLearningPathData from '../../hooks/useLearningPathData';
import { api } from '../../services/api';
import {
  buildGuestLearningCompletedNodes,
  loadLearningPathProgress,
  resetLearningPathProgress,
} from '../../utils/learning/learningPathProgress';
import {
  computeCompletion,
  computeModuleAvailability,
  getNodeStatus,
} from '../../utils/learning/learningPathStatus.js';

const NODE_SIZE = 10;
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 110;
const MICRO_COLUMN_WIDTH = 180;
const MICRO_ROW_HEIGHT = 90;
const LABEL_WIDTH = 170;
const PROFILE_CARD_CANVAS_WIDTH = 350;
const PROFILE_CARD_CANVAS_HEIGHT = 120;
const LEARNING_PATH_BG_GIF = 'https://media.giphy.com/media/l3mZnuz4coJp8EBBm/giphy.gif';

const nodeTypeIcons = {
  [LEARNING_NODE_TYPES.ROOT]: FiMap,
  [LEARNING_NODE_TYPES.MODULE]: FiLayers,
  [LEARNING_NODE_TYPES.LEARN]: FiBookOpen,
  [LEARNING_NODE_TYPES.WORKSPACE]: FiCode,
  [LEARNING_NODE_TYPES.TOWER]: FiShield,
  [LEARNING_NODE_TYPES.FINAL]: FiFlag,
  [LEARNING_NODE_TYPES.CAPSTONE]: FiStar,
};

const nodeTypeLabels = {
  [LEARNING_NODE_TYPES.ROOT]: 'Path Root',
  [LEARNING_NODE_TYPES.MODULE]: 'Module',
  [LEARNING_NODE_TYPES.LEARN]: 'Learning',
  [LEARNING_NODE_TYPES.WORKSPACE]: 'Workspace',
  [LEARNING_NODE_TYPES.TOWER]: 'Tower Defense',
  [LEARNING_NODE_TYPES.FINAL]: 'Final Challenge',
  [LEARNING_NODE_TYPES.CAPSTONE]: 'Capstone',
};

const statusStyles = {
  completed: {
    border: '#00FF8C',
    glow: 'rgba(0, 255, 140, 0.7)',
    bg: 'rgba(0, 255, 140, 0.12)',
    text: '#00FF8C',
  },
  available: {
    border: '#00FFFF',
    glow: 'rgba(0, 255, 255, 0.6)',
    bg: 'rgba(0, 255, 255, 0.08)',
    text: '#00FFFF',
  },
  locked: {
    border: '#2d3748',
    glow: 'rgba(45, 55, 72, 0.4)',
    bg: 'rgba(10, 10, 12, 0.7)',
    text: '#718096',
  },
};

/* ── Learning-path tree animations ── */
const pulseGlowGreen = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(0,255,140,0.7), 0 0 4px rgba(0,255,140,0.3); }
  50% { box-shadow: 0 0 24px rgba(0,255,140,0.9), 0 0 48px rgba(0,255,140,0.2); }
`;

const pulseGlowCyan = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(0,255,255,0.6), 0 0 4px rgba(0,255,255,0.2); }
  50% { box-shadow: 0 0 22px rgba(0,255,255,0.85), 0 0 44px rgba(0,255,255,0.18); }
`;

const pulseNextObjective = keyframes`
  0%, 100% {
    box-shadow: 0 0 14px rgba(0,255,255,0.7), 0 0 6px rgba(0,255,255,0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 32px rgba(0,255,255,1), 0 0 64px rgba(0,255,255,0.45), 0 0 96px rgba(0,255,255,0.15);
    transform: scale(1.18);
  }
`;

const nodeEntrance = keyframes`
  0% { opacity: 0; transform: scale(0.3); }
  70% { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
`;

function PythonLearningPath() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [motionEnabled, setMotionEnabled] = useState(!prefersReducedMotion);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const selectedTrialTrack = guestCtx?.selectedTrialTrack || guestCtx?.progress?.pathChoice || null;
  const recordPathChoice = guestCtx?.recordPathChoice;
  const recordTrialLearningPath = guestCtx?.recordTrialLearningPath;
  const isBeginnerTrialLocked = !isAuthenticated && Boolean(guestCtx?.isBeginnerTrialLocked);
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');
  const profileCardCanvasRef = useRef(null);
  const shouldShowProfileCard = !isAuthenticated || Boolean(user);
  const profileCardUser = useMemo(() => {
    if (isAuthenticated) return user;
    const summary = guestCtx?.xpSummary;
    if (!summary) return null;
    return {
      username: 'Guest',
      xp: summary.xp,
      progress: summary,
      roleName: summary.roleName,
    };
  }, [guestCtx?.xpSummary, isAuthenticated, user]);

  const { pathData, loading: isPathLoading } = useLearningPathData('python-path');

  useEffect(() => {
    if (isAuthenticated) return;
    if (selectedTrialTrack === 'pro') return;
    recordPathChoice?.('beginner');
    recordTrialLearningPath?.('python-path');
  }, [isAuthenticated, recordPathChoice, recordTrialLearningPath, selectedTrialTrack]);

  const allNodes = useMemo(() => pathData?.nodes || [], [pathData?.nodes]);
  const nodesById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
  const isMacroView = !selectedModuleId;
  const [completedNodes, setCompletedNodes] = useState(() => new Set());
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [showLearningAdModal, setShowLearningAdModal] = useState(false);
  const [selectedLearningAdType, setSelectedLearningAdType] = useState(null);
  const [isApplyingLearningAdCredit, setIsApplyingLearningAdCredit] = useState(false);
  const [pendingNode, setPendingNode] = useState(null);
  const [isGuestSignupWallOpen, setIsGuestSignupWallOpen] = useState(false);

  const showLearningFetchToast = useCallback(
    (kind) => {
      const config = {
        rate_limit_status_failed: {
          id: 'python-learning-rate-limit-failed',
          title: 'Learning access unavailable',
          description: 'We could not refresh learning access right now. Please try again.',
        },
        progress_load_failed: {
          id: 'python-learning-progress-failed',
          title: 'Progress unavailable',
          description: 'We could not load your saved learning progress right now.',
        },
      }[kind];

      if (!config) return;
      if (typeof toast.isActive === 'function' && toast.isActive(config.id)) return;

      toast({
        id: config.id,
        title: config.title,
        description: config.description,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    },
    [toast]
  );

  const learningAdOptions = useMemo(
    () => ({
      short: { label: 'Short (+1)', credits: 1 },
      medium: { label: 'Medium (+3)', credits: 3 },
      long: { label: 'Long (+5)', credits: 5 },
    }),
    []
  );

  useEffect(() => {
    if (!pathData?.seedCompletedNodeIds) return;
    setCompletedNodes(new Set(pathData.seedCompletedNodeIds || []));
  }, [pathData?.seedCompletedNodeIds]);

  useEffect(() => {
    if (!isAuthenticated || !pathData?.pathId) {
      setLearningRateLimit(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const response = await api.learningPath.getRateLimit(pathData.pathId);
        if (isMounted) setLearningRateLimit(response?.rateLimit || null);
      } catch {
        if (isMounted) {
          setLearningRateLimit(null);
          showLearningFetchToast('rate_limit_status_failed');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, pathData?.pathId]);

  useEffect(() => {
    if (showLearningAdModal) {
      setSelectedLearningAdType(null);
    }
  }, [showLearningAdModal]);

  useEffect(() => {
    if (!shouldShowProfileCard) return undefined;

    const canvas = profileCardCanvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return undefined;

    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return undefined;
    }
    if (!ctx) return undefined;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cssWidth = PROFILE_CARD_CANVAS_WIDTH;
    const cssHeight = PROFILE_CARD_CANVAS_HEIGHT;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    let animId = null;
    let running = true;

    const drawFrame = (ts) => {
      if (!running) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawProfileCard(ctx, cssWidth, cssHeight, profileCardUser, ts / 1000, {
        isGuest: !isAuthenticated,
        guestLabel: 'Guest',
        guestCta: 'Sign up to save learning path progress',
      });
      animId = window.requestAnimationFrame(drawFrame);
    };

    animId = window.requestAnimationFrame(drawFrame);
    return () => {
      running = false;
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [isAuthenticated, profileCardUser, shouldShowProfileCard]);

  const getModuleKey = (nodeId) => {
    const node = nodesById.get(nodeId);
    if (!node) return null;
    if ([LEARNING_NODE_TYPES.MODULE, LEARNING_NODE_TYPES.CAPSTONE].includes(node.type))
      return node.id;
    return node.moduleId || node.id;
  };

  const isModuleZeroNode = useCallback((node) => {
    if (!node) return false;
    const nodeId = String(node.id || '');
    const moduleId = String(node.moduleId || '');
    return nodeId.startsWith('py-m0-') || moduleId.startsWith('py-m0-');
  }, []);

  const macroNodes = useMemo(
    () =>
      allNodes.filter((node) =>
        [
          LEARNING_NODE_TYPES.ROOT,
          LEARNING_NODE_TYPES.MODULE,
          LEARNING_NODE_TYPES.CAPSTONE,
        ].includes(node.type)
      ),
    [allNodes]
  );

  const selectedModule = useMemo(
    () => allNodes.find((node) => node.id === selectedModuleId) || null,
    [allNodes, selectedModuleId]
  );

  const microNodes = useMemo(() => {
    if (!selectedModule) return [];
    const moduleKey = getModuleKey(selectedModule.id);
    return allNodes.filter(
      (node) => node.id === selectedModule.id || getModuleKey(node.id) === moduleKey
    );
  }, [allNodes, selectedModule]);

  const computedCompletion = useMemo(
    () => computeCompletion(pathData, completedNodes),
    [completedNodes, pathData]
  );

  const moduleAvailability = useMemo(
    () => computeModuleAvailability(pathData, computedCompletion),
    [computedCompletion, pathData]
  );

  const layoutNodes = useMemo(() => {
    const viewNodes = isMacroView ? macroNodes : microNodes;
    if (!viewNodes.length) return [];

    if (isMacroView) {
      const sorted = [...viewNodes].sort((a, b) => {
        const rowDiff = (a.position.row ?? 0) - (b.position.row ?? 0);
        if (rowDiff !== 0) return rowDiff;
        return (a.position.col ?? 0) - (b.position.col ?? 0);
      });

      return sorted.map((node) => ({
        ...node,
        x: (node.position.col ?? 0) * COLUMN_WIDTH,
        y: (node.position.row ?? 0) * ROW_HEIGHT,
      }));
    }

    const typeOrder = [
      LEARNING_NODE_TYPES.MODULE,
      LEARNING_NODE_TYPES.LEARN,
      LEARNING_NODE_TYPES.WORKSPACE,
      LEARNING_NODE_TYPES.TOWER,
      LEARNING_NODE_TYPES.FINAL,
      LEARNING_NODE_TYPES.CAPSTONE,
    ];

    const moduleNode = viewNodes.find((node) => node.type === LEARNING_NODE_TYPES.MODULE) || null;
    const finalNode = viewNodes.find((node) => node.type === LEARNING_NODE_TYPES.FINAL) || null;
    const activityNodes = viewNodes.filter((node) =>
      [
        LEARNING_NODE_TYPES.LEARN,
        LEARNING_NODE_TYPES.WORKSPACE,
        LEARNING_NODE_TYPES.TOWER,
      ].includes(node.type)
    );

    const sortedActivities = [...activityNodes].sort((a, b) => {
      const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      if (typeDiff !== 0) return typeDiff;
      return a.label.localeCompare(b.label);
    });

    const positioned = [];
    const activityCount = sortedActivities.length;
    const centerOffset = activityCount ? (activityCount - 1) / 2 : 0;
    const activityRowY = MICRO_ROW_HEIGHT * 1.35;
    const finalRowY = MICRO_ROW_HEIGHT * 2.7;

    if (moduleNode) {
      positioned.push({
        ...moduleNode,
        x: 0,
        y: 0,
      });
    }

    sortedActivities.forEach((node, index) => {
      positioned.push({
        ...node,
        x: (index - centerOffset) * MICRO_COLUMN_WIDTH,
        y: activityRowY,
      });
    });

    if (finalNode) {
      positioned.push({
        ...finalNode,
        x: 0,
        y: finalRowY,
      });
    }

    if (!positioned.length) return [];
    const minX = Math.min(...positioned.map((node) => node.x));
    return positioned.map((node) => ({
      ...node,
      x: node.x - minX,
    }));
  }, [isMacroView, macroNodes, microNodes]);

  const edges = useMemo(() => {
    const byId = new Map(layoutNodes.map((node) => [node.id, node]));
    const viewIdSet = new Set(layoutNodes.map((node) => node.id));
    const macroIdSet = new Set(macroNodes.map((node) => node.id));
    const visitedEdges = new Set();

    if (!isMacroView) {
      const moduleNode =
        layoutNodes.find((node) => node.type === LEARNING_NODE_TYPES.MODULE) || null;
      const finalNode = layoutNodes.find((node) => node.type === LEARNING_NODE_TYPES.FINAL) || null;
      const activityNodes = layoutNodes.filter((node) =>
        [
          LEARNING_NODE_TYPES.LEARN,
          LEARNING_NODE_TYPES.WORKSPACE,
          LEARNING_NODE_TYPES.TOWER,
        ].includes(node.type)
      );

      const results = [];
      if (moduleNode && activityNodes.length) {
        activityNodes.forEach((activity) => {
          results.push({ from: moduleNode, to: activity });
        });
      }
      if (finalNode && activityNodes.length) {
        activityNodes.forEach((activity) => {
          results.push({ from: activity, to: finalNode });
        });
      } else if (moduleNode && finalNode) {
        results.push({ from: moduleNode, to: finalNode });
      }
      return results;
    }

    const findMacroAncestor = (nodeId, visited = new Set()) => {
      if (!nodeId || visited.has(nodeId)) return null;
      visited.add(nodeId);
      const node = nodesById.get(nodeId);
      if (!node) return null;
      if (macroIdSet.has(node.id)) return node.id;
      if (!node.prereqs?.length) return null;
      for (const prereq of node.prereqs) {
        const ancestor = findMacroAncestor(prereq, visited);
        if (ancestor) return ancestor;
      }
      return null;
    };

    const results = [];
    layoutNodes.forEach((node) => {
      node.prereqs?.forEach((prereqId) => {
        let sourceId = prereqId;
        if (!viewIdSet.has(prereqId)) {
          sourceId = findMacroAncestor(prereqId);
        }
        if (!sourceId || !viewIdSet.has(sourceId)) return;
        const edgeKey = `${sourceId}__${node.id}`;
        if (visitedEdges.has(edgeKey)) return;
        visitedEdges.add(edgeKey);
        results.push({
          from: byId.get(sourceId),
          to: byId.get(node.id),
        });
      });
    });
    return results;
  }, [layoutNodes, macroNodes, nodesById, isMacroView]);

  const mapSize = useMemo(() => {
    if (!layoutNodes.length) return { width: 0, height: 0 };
    const maxX = Math.max(...layoutNodes.map((node) => node.x));
    const maxY = Math.max(...layoutNodes.map((node) => node.y));
    const width = maxX + (isMacroView ? COLUMN_WIDTH : MICRO_COLUMN_WIDTH);
    const height = maxY + (isMacroView ? ROW_HEIGHT : MICRO_ROW_HEIGHT);
    return { width, height };
  }, [layoutNodes, isMacroView]);

  const gridRowHeight = isMacroView ? ROW_HEIGHT : MICRO_ROW_HEIGHT;

  const getGuestTrialProblemSlug = useCallback((node) => {
    if (!node) return null;

    if (node.type === LEARNING_NODE_TYPES.TOWER) {
      const towerConfig = node.content?.towerConfig;
      return (
        towerConfig?.learningProblemSlug ||
        (Array.isArray(towerConfig?.learningProblemSlugs)
          ? towerConfig.learningProblemSlugs[0]
          : null) ||
        null
      );
    }

    if (node.type === LEARNING_NODE_TYPES.FINAL && node.content?.isTowerDefense) {
      const towerConfig = node.content?.towerConfig;
      return (
        towerConfig?.learningProblemSlug ||
        (Array.isArray(towerConfig?.learningProblemSlugs)
          ? towerConfig.learningProblemSlugs[0]
          : null) ||
        null
      );
    }

    if ([LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(node.type)) {
      return node.content?.learningProblemSlug || null;
    }

    return null;
  }, []);

  const handleGuestNodeEntry = useCallback(
    (node) => {
      if (isAuthenticated) return true;
      if (isBeginnerTrialLocked) {
        setIsGuestSignupWallOpen(true);
        return false;
      }

      if (!isModuleZeroNode(node)) {
        setIsGuestSignupWallOpen(true);
        return false;
      }

      const trialSlug = getGuestTrialProblemSlug(node);
      if (!trialSlug) return true;

      const solved = Array.isArray(guestCtx?.progress?.problemsSolved)
        ? guestCtx.progress.problemsSolved
        : [];
      const alreadySolved = solved.includes(trialSlug);

      if (guestCtx?.hasReachedLearningProblemWall && !alreadySolved) {
        setIsGuestSignupWallOpen(true);
        return false;
      }

      return true;
    },
    [getGuestTrialProblemSlug, guestCtx, isAuthenticated, isBeginnerTrialLocked, isModuleZeroNode]
  );

  const navigateToNode = useCallback(
    (node) => {
      // Mission 1 (Hello Print) now lives on the home page as the shared demo.
      if (node.id === 'py-m0-tower-hello') {
        navigate('/');
        return;
      }

      if (node.type === LEARNING_NODE_TYPES.TOWER) {
        const towerConfig = node.content?.towerConfig;
        const hasLearningProblem = Boolean(
          towerConfig?.learningProblemSlug ||
          (Array.isArray(towerConfig?.learningProblemSlugs) &&
            towerConfig.learningProblemSlugs.length) ||
          towerConfig?.onboardingId
        );
        if (hasLearningProblem) {
          navigate(`/learning/${pathData.pathId}/tower/${node.id}`);
          return;
        }
      }

      if ([LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(node.type)) {
        const isTowerFinal =
          node.type === LEARNING_NODE_TYPES.FINAL && node.content?.isTowerDefense;
        if (isTowerFinal) {
          const towerConfig = node.content?.towerConfig;
          const hasLearningProblem = Boolean(
            towerConfig?.learningProblemSlug ||
            (Array.isArray(towerConfig?.learningProblemSlugs) &&
              towerConfig.learningProblemSlugs.length)
          );
          if (hasLearningProblem) {
            navigate(`/learning/${pathData.pathId}/tower/${node.id}`);
            return;
          }
        }

        const learningProblemSlug = node.content?.learningProblemSlug;
        if (learningProblemSlug) {
          navigate(`/learning/${pathData.pathId}/problems/${learningProblemSlug}`, {
            state: {
              learningMode: true,
              learningLanguage: pathData.pathId,
              learningPath: {
                pathId: pathData.pathId,
                nodeId: node.id,
                moduleId: node.moduleId,
              },
            },
          });
          return;
        }
      }

      if (
        [
          LEARNING_NODE_TYPES.LEARN,
          LEARNING_NODE_TYPES.WORKSPACE,
          LEARNING_NODE_TYPES.TOWER,
          LEARNING_NODE_TYPES.FINAL,
        ].includes(node.type)
      ) {
        navigate(`/learning/${pathData.pathId}/${node.id}`);
        return;
      }

      toast({
        title: 'Node preview',
        description: `${node.label} will launch the learning activity in the next pass.`,
        status: 'success',
        duration: 2200,
        isClosable: true,
      });
    },
    [navigate, pathData?.pathId, toast]
  );

  const handleNodeClick = async (node, status) => {
    /* Root-type nodes (path root always, module header in micro view)
       are never interactive — bail immediately as a safety guard. */
    if (node.type === LEARNING_NODE_TYPES.ROOT) return;
    if (!isMacroView && node.type === LEARNING_NODE_TYPES.MODULE) return;

    if (status === 'locked') {
      toast({
        title: 'Locked node',
        description: 'Clear the required nodes to unlock this step.',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (isMacroView) {
      if (!isAuthenticated && isBeginnerTrialLocked) {
        setIsGuestSignupWallOpen(true);
        return;
      }
      if ([LEARNING_NODE_TYPES.MODULE, LEARNING_NODE_TYPES.CAPSTONE].includes(node.type)) {
        if (!isAuthenticated && !isModuleZeroNode(node)) {
          setIsGuestSignupWallOpen(true);
          return;
        }
        setSelectedModuleId(node.id);
        setSearchParams({ module: node.id });
      }
      return;
    }

    if (!handleGuestNodeEntry(node)) {
      return;
    }

    if (
      isAuthenticated &&
      status === 'available' &&
      [
        LEARNING_NODE_TYPES.LEARN,
        LEARNING_NODE_TYPES.WORKSPACE,
        LEARNING_NODE_TYPES.TOWER,
        LEARNING_NODE_TYPES.FINAL,
      ].includes(node.type)
    ) {
      let rateLimit = learningRateLimit;
      if (!rateLimit && pathData?.pathId) {
        try {
          const response = await api.learningPath.getRateLimit(pathData.pathId);
          rateLimit = response?.rateLimit || null;
          setLearningRateLimit(rateLimit);
        } catch {
          rateLimit = null;
        }
      }

      if (rateLimit && !rateLimit.unlimited && rateLimit.remaining <= 0) {
        if (rateLimit.adCooldownRemaining > 0) {
          toast({
            title: 'Activity cooldown active',
            description: `Please wait ${Math.ceil(rateLimit.adCooldownRemaining / 60)}m before watching another ad.`,
            status: 'info',
            duration: 2600,
            isClosable: true,
          });
          return;
        }
        setPendingNode(node);
        setShowLearningAdModal(true);
        return;
      }
    }

    navigateToNode(node);
  };

  const handleLearningAdComplete = useCallback(async () => {
    if (isApplyingLearningAdCredit || !pathData?.pathId) return;

    setIsApplyingLearningAdCredit(true);
    try {
      const response = await api.learningPath.watchAd(
        pathData.pathId,
        selectedLearningAdType || 'short'
      );
      setLearningRateLimit(response?.rateLimit || null);
      toast({
        title: 'Credit applied',
        description: `Added ${response?.creditsEarned || 0} learning credit(s).`,
        status: 'success',
        duration: 2200,
        isClosable: true,
      });
      setShowLearningAdModal(false);
      if (pendingNode) {
        navigateToNode(pendingNode);
        setPendingNode(null);
      }
    } catch (error) {
      const remaining = error?.data?.rateLimit?.adCooldownRemaining || 0;
      if (error?.data?.rateLimit) {
        setLearningRateLimit(error.data.rateLimit);
      }
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
  }, [
    isApplyingLearningAdCredit,
    navigateToNode,
    pathData?.pathId,
    pendingNode,
    selectedLearningAdType,
    toast,
  ]);

  useEffect(() => {
    let isMounted = true;
    if (!pathData?.pathId) return undefined;

    if (isAuthenticated) {
      (async () => {
        try {
          const loaded = await loadLearningPathProgress(
            pathData.pathId,
            pathData.seedCompletedNodeIds,
            pathData
          );
          if (isMounted) setCompletedNodes(loaded);
        } catch {
          if (isMounted) {
            showLearningFetchToast('progress_load_failed');
          }
        }
      })();
    } else {
      const solvedSlugs = Array.isArray(guestCtx?.progress?.problemsSolved)
        ? guestCtx.progress.problemsSolved
        : [];
      const guestNodeIds = Array.isArray(guestCtx?.progress?.lpNodesCompleted)
        ? guestCtx.progress.lpNodesCompleted
        : [];
      const merged = buildGuestLearningCompletedNodes({
        pathData,
        seedIds: pathData.seedCompletedNodeIds || [],
        solvedSlugs,
        guestNodeIds,
      });
      if (isMounted) setCompletedNodes(merged);
    }

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    pathData,
    pathData?.pathId,
    pathData?.seedCompletedNodeIds,
    guestCtx?.progress?.lpNodesCompleted,
    guestCtx?.progress?.problemsSolved,
    showLearningFetchToast,
  ]);

  useEffect(() => {
    if (!moduleParam) {
      if (selectedModuleId !== null) setSelectedModuleId(null);
      return;
    }
    if (!isAuthenticated && !String(moduleParam).startsWith('py-m0-')) {
      if (selectedModuleId !== null) setSelectedModuleId(null);
      setSearchParams({});
      setIsGuestSignupWallOpen(true);
      return;
    }
    if (nodesById.has(moduleParam)) {
      if (selectedModuleId !== moduleParam) setSelectedModuleId(moduleParam);
      return;
    }
    if (selectedModuleId !== null) setSelectedModuleId(null);
    setSearchParams({});
  }, [moduleParam, isAuthenticated, nodesById, selectedModuleId, setSearchParams]);

  if (isPathLoading && !pathData) {
    return (
      <PageTemplate showGiphyBackground={false}>
        <Container maxW="container.md" py={{ base: 10, lg: 16 }}>
          <Heading size="lg" fontFamily="'Orbitron', sans-serif" color="cyan.300">
            Loading learning path
          </Heading>
          <Text mt={4} color="gray.300" fontFamily="monospace">
            Fetching the latest path content...
          </Text>
        </Container>
      </PageTemplate>
    );
  }

  if (!pathData) {
    return (
      <PageTemplate showGiphyBackground={false}>
        <Container maxW="container.md" py={{ base: 10, lg: 16 }}>
          <Heading size="lg" fontFamily="'Orbitron', sans-serif" color="cyan.300">
            Learning path not found
          </Heading>
          <Text mt={4} color="gray.300" fontFamily="monospace">
            We could not load the learning path content.
          </Text>
          <Button mt={6} onClick={() => navigate('/learning')} colorScheme="cyan">
            Back to learning
          </Button>
        </Container>
      </PageTemplate>
    );
  }

  const handleResetProgress = async () => {
    if (!pathData?.pathId) return;
    const confirmed = window.confirm('Reset your learning path progress? This cannot be undone.');
    if (!confirmed) return;

    const result = await resetLearningPathProgress(pathData.pathId);
    if (!result?.cleared) {
      toast({
        title: 'Reset failed',
        description: 'We could not reset your learning path progress. Please try again.',
        status: 'error',
        duration: 2400,
        isClosable: true,
      });
      return;
    }

    setCompletedNodes(new Set(pathData.seedCompletedNodeIds || []));
    setSelectedModuleId(null);
    setSearchParams({});
    toast({
      title: 'Progress cleared',
      description: 'Your learning path progress has been reset.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <PageTemplate showGiphyBackground={motionEnabled} giphyOpacity={0.18}>
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={8}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>
      <Container maxW="container.xl" py={{ base: 10, lg: 16 }}>
        <VStack spacing={8} align="stretch">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', lg: 'center' }}
            gap={6}
          >
            <Box>
              <Badge
                bg="rgba(0, 255, 140, 0.1)"
                color="#00FF8C"
                border="1px solid rgba(0, 255, 140, 0.4)"
                fontFamily="monospace"
                mb={3}
              >
                LEARNING PATH • DEMO BUILD
              </Badge>
              <Heading
                size="2xl"
                fontFamily="'Orbitron', sans-serif"
                bgGradient="linear(to-r, #00ff8c, #00FFFF)"
                bgClip="text"
                textShadow="0 0 12px rgba(0, 255, 255, 0.3)"
              >
                Python Beginner Crash Course
              </Heading>
              <Text mt={3} color="gray.300" fontFamily="monospace" maxW="720px">
                Short wins only. Each node is a 3-8 minute mission that ends with a visible unlock.
                Clear both branches (If + For) to reach the Return module and the Two Sum capstone.
              </Text>
            </Box>
            <HStack spacing={4} align="center">
              <HStack
                spacing={2}
                bg="rgba(10, 10, 12, 0.7)"
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid #1f2933"
              >
                <Text fontSize="sm" color="gray.300" fontFamily="monospace">
                  Motion background
                </Text>
                <Switch
                  isChecked={motionEnabled}
                  onChange={(event) => setMotionEnabled(event.target.checked)}
                  colorScheme="cyan"
                />
              </HStack>
              <Button
                variant="ghost"
                size="sm"
                color="gray.300"
                border="1px solid rgba(255, 255, 255, 0.15)"
                _hover={{ bg: 'rgba(255, 255, 255, 0.08)' }}
                fontFamily="monospace"
                onClick={handleResetProgress}
              >
                Reset progress
              </Button>
              <HStack spacing={2} fontFamily="monospace" color="gray.300" fontSize="sm">
                <FiGitBranch />
                <Text>Branch unlocks require both sides</Text>
              </HStack>
            </HStack>
          </Flex>

          <Box
            position="relative"
            bg="rgba(10, 10, 12, 0.75)"
            borderRadius="xl"
            border="1px solid rgba(0, 255, 255, 0.15)"
            boxShadow="0 0 30px rgba(0, 255, 255, 0.1)"
            overflow="auto"
            p={{ base: 6, lg: 10 }}
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              opacity: 0.22,
              backgroundImage: `linear-gradient(180deg, rgba(3, 3, 8, 0.6), rgba(3, 3, 8, 0.92)), url("${LEARNING_PATH_BG_GIF}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              pointerEvents: 'none',
            }}
            _after={
              motionEnabled
                ? {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    borderRadius: 'xl',
                  }
                : undefined
            }
          >
            <Flex
              align="center"
              justify="space-between"
              mb={6}
              direction={{ base: 'column', md: 'row' }}
              gap={3}
            >
              <HStack spacing={3} fontFamily="monospace" color="gray.300">
                <FiMap />
                <Text fontSize="sm">
                  {isMacroView
                    ? 'Macro view: click a module to zoom in.'
                    : 'Micro view: module details.'}
                </Text>
              </HStack>
              {!isMacroView && selectedModule && (
                <HStack spacing={3} align="center">
                  <Badge
                    bg="rgba(0, 255, 255, 0.1)"
                    color="#00FFFF"
                    border="1px solid rgba(0, 255, 255, 0.3)"
                    fontFamily="monospace"
                  >
                    MODULE VIEW
                  </Badge>
                  <Text fontSize="sm" color="gray.300" fontFamily="monospace">
                    {selectedModule.label}
                  </Text>
                  <Box
                    as="button"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontFamily="monospace"
                    color="#00FFFF"
                    border="1px solid rgba(0, 255, 255, 0.35)"
                    borderRadius="full"
                    bg="rgba(0, 255, 255, 0.08)"
                    _hover={{ bg: 'rgba(0, 255, 255, 0.15)' }}
                    onClick={() => {
                      setSelectedModuleId(null);
                      setSearchParams({});
                    }}
                  >
                    Back to modules
                  </Box>
                </HStack>
              )}
            </Flex>
            <Flex
              align="center"
              justify="center"
              minH={{ base: '320px', md: '380px' }}
              minW="100%"
              position="relative"
            >
              {shouldShowProfileCard && (
                <Box
                  as="canvas"
                  ref={profileCardCanvasRef}
                  position="absolute"
                  top={{ base: 2, md: 3 }}
                  right={{ base: 2, md: 3 }}
                  width={`${PROFILE_CARD_CANVAS_WIDTH}px`}
                  height={`${PROFILE_CARD_CANVAS_HEIGHT}px`}
                  pointerEvents="none"
                  zIndex={3}
                  opacity={0.96}
                  transform={{ base: 'scale(0.72)', md: 'scale(0.86)', lg: 'scale(1)' }}
                  transformOrigin="top right"
                />
              )}
              <Box position="relative" width={mapSize.width} height={mapSize.height} mx="auto">
                <Box
                  as="svg"
                  position="absolute"
                  top={0}
                  left={0}
                  width={mapSize.width}
                  height={mapSize.height}
                  pointerEvents="none"
                  overflow="visible"
                >
                  <defs>
                    <filter id="lpEdgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="lpParticleGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {Array.from({
                    length: Math.max(0, Math.floor(mapSize.height / gridRowHeight) + 1),
                  }).map((_, index) => (
                    <line
                      key={`level-${index}`}
                      x1={0}
                      y1={index * gridRowHeight + NODE_SIZE / 2}
                      x2={mapSize.width}
                      y2={index * gridRowHeight + NODE_SIZE / 2}
                      stroke="rgb(0, 255, 255)"
                      strokeOpacity="0.05"
                      strokeWidth="1"
                    >
                      {motionEnabled && (
                        <animate
                          attributeName="stroke-opacity"
                          values="0.04;0.1;0.04"
                          dur={`${4 + index * 0.4}s`}
                          repeatCount="indefinite"
                        />
                      )}
                    </line>
                  ))}
                  {edges.map((edge, index) => {
                    const x1 = edge.from.x + NODE_SIZE / 2;
                    const y1 = edge.from.y + NODE_SIZE / 2;
                    const x2 = edge.to.x + NODE_SIZE / 2;
                    const y2 = edge.to.y + NODE_SIZE / 2;
                    const midY = (y1 + y2) / 2;
                    const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
                    return (
                      <g key={`edge-${edge.from.id}-${edge.to.id}-${index}`}>
                        {/* Soft glow underlayer */}
                        <path
                          d={d}
                          fill="none"
                          stroke="rgba(0, 255, 255, 0.06)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          filter="url(#lpEdgeGlow)"
                        />
                        {/* Main path with animated dash flow */}
                        <path
                          d={d}
                          fill="none"
                          stroke="rgba(0, 255, 255, 0.3)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={motionEnabled ? '6 10' : undefined}
                        >
                          {motionEnabled && (
                            <animate
                              attributeName="stroke-dashoffset"
                              from="0"
                              to="-32"
                              dur={`${2 + index * 0.15}s`}
                              repeatCount="indefinite"
                            />
                          )}
                        </path>
                        {/* Travelling particle dots */}
                        {motionEnabled &&
                          [0, 1].map((pIdx) => (
                            <circle
                              key={pIdx}
                              r={pIdx === 0 ? '3' : '2'}
                              fill={
                                pIdx === 0 ? 'rgba(0, 255, 255, 0.7)' : 'rgba(0, 255, 255, 0.45)'
                              }
                              filter="url(#lpParticleGlow)"
                            >
                              <animateMotion
                                dur={`${3 + pIdx * 1.5}s`}
                                begin={`${pIdx * 1.4}s`}
                                repeatCount="indefinite"
                                path={d}
                              />
                            </circle>
                          ))}
                      </g>
                    );
                  })}
                </Box>

                {/* Compute net objective — first available node in layout order */}
                {(() => {
                  /* In macro view, MODULE / CAPSTONE nodes ARE valid objectives
                     so the pulsing highlight draws attention to the next module.
                     In micro view, skip MODULE (it's the view root) and ROOT. */
                  const nextId =
                    layoutNodes.find((n) => {
                      const s = getNodeStatus(n, computedCompletion, moduleAvailability);
                      if (s !== 'available') return false;
                      if (n.type === LEARNING_NODE_TYPES.ROOT) return false;
                      if (!isMacroView && n.type === LEARNING_NODE_TYPES.MODULE) return false;
                      return true;
                    })?.id ?? null;

                  return layoutNodes.map((node, nodeIndex) => {
                    const isNextObjective = node.id === nextId;
                    /* Root nodes (path root in macro, module header in micro)
                       are always shown as completed and are never interactive. */
                    const isViewRoot =
                      node.type === LEARNING_NODE_TYPES.ROOT ||
                      (!isMacroView && node.type === LEARNING_NODE_TYPES.MODULE);
                    const status = isViewRoot
                      ? 'completed'
                      : getNodeStatus(node, computedCompletion, moduleAvailability);
                    const styles = statusStyles[status];
                    const Icon = nodeTypeIcons[node.type] || FiMap;
                    const nodeLabel = nodeTypeLabels[node.type] || 'Node';
                    const tooltipLabel = (() => {
                      if (node.type === LEARNING_NODE_TYPES.FINAL && node.content?.isTowerDefense) {
                        const towerConfig = node.content?.towerConfig || null;
                        const waves = towerConfig?.waves ? `${towerConfig.waves} waves` : null;
                        const problems = towerConfig?.problems
                          ? `${towerConfig.problems} problems`
                          : null;
                        const detail = [waves, problems].filter(Boolean).join(' · ');
                        return detail ? `Tower Defense Final · ${detail}` : 'Tower Defense Final';
                      }
                      return node.description || node.label || nodeLabel;
                    })();

                    const glowAnim = motionEnabled
                      ? status === 'completed'
                        ? `${pulseGlowGreen} 3s ease-in-out infinite`
                        : isNextObjective
                          ? `${pulseNextObjective} 1.6s ease-in-out infinite`
                          : status === 'available'
                            ? `${pulseGlowCyan} 2.8s ease-in-out infinite`
                            : undefined
                      : undefined;

                    const entranceAnim = motionEnabled
                      ? `${nodeEntrance} 0.5s ease-out ${nodeIndex * 0.07}s both`
                      : undefined;

                    return (
                      <Tooltip
                        key={node.id}
                        label={tooltipLabel}
                        bg="rgba(0, 0, 0, 0.85)"
                        color="gray.100"
                        border="1px solid rgba(0, 255, 255, 0.2)"
                        borderRadius="md"
                        fontSize="sm"
                        maxW="240px"
                        hasArrow
                      >
                        <Box
                          position="absolute"
                          top={node.y}
                          left={node.x}
                          width={NODE_SIZE}
                          height={NODE_SIZE}
                          borderRadius="full"
                          border={`2px solid ${styles.border}`}
                          bg={styles.bg}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow={`0 0 12px ${styles.glow}`}
                          cursor={
                            status === 'locked' ? 'not-allowed' : isViewRoot ? 'default' : 'pointer'
                          }
                          transition="transform 0.25s ease, box-shadow 0.25s ease"
                          animation={glowAnim || entranceAnim}
                          _hover={
                            status === 'locked' || isViewRoot
                              ? {}
                              : {
                                  transform: 'scale(1.15)',
                                  boxShadow: `0 0 28px ${styles.glow}, 0 0 56px ${styles.glow}`,
                                }
                          }
                          onClick={isViewRoot ? undefined : () => handleNodeClick(node, status)}
                        >
                          <Icon color={styles.text} size={18} />

                          {/* Orbiting particles for active nodes */}
                          {motionEnabled &&
                            status !== 'locked' &&
                            [0, 1, 2].map((i) => (
                              <Box
                                key={`orbit-${i}`}
                                position="absolute"
                                w="4px"
                                h="4px"
                                borderRadius="full"
                                bg={
                                  status === 'completed'
                                    ? i % 2 === 0
                                      ? '#00FF8C'
                                      : '#00FFFF'
                                    : '#00FFFF'
                                }
                                top="50%"
                                left="50%"
                                pointerEvents="none"
                                sx={{
                                  animation: `lpOrbit${nodeIndex}_${i} ${3.5 + i * 1.1}s linear ${i * 0.8}s infinite`,
                                  [`@keyframes lpOrbit${nodeIndex}_${i}`]: {
                                    '0%': {
                                      transform: `rotate(${i * 120}deg) translateX(${24 + i * 3}px) rotate(-${i * 120}deg)`,
                                      opacity: 0.7,
                                    },
                                    '50%': { opacity: 0.25 },
                                    '100%': {
                                      transform: `rotate(${i * 120 + 360}deg) translateX(${24 + i * 3}px) rotate(-${i * 120 + 360}deg)`,
                                      opacity: 0.7,
                                    },
                                  },
                                }}
                              />
                            ))}

                          <Box
                            position="absolute"
                            top="calc(100% + 6px)"
                            left="50%"
                            transform="translateX(-50%)"
                            minW={LABEL_WIDTH}
                            textAlign="center"
                          >
                            <Text
                              fontSize="xs"
                              color={styles.text}
                              fontFamily="monospace"
                              textTransform="uppercase"
                            >
                              {nodeLabel}
                            </Text>
                            <Text fontSize="xs" color="gray.200" fontFamily="monospace">
                              {node.label}
                            </Text>
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  });
                })()}
              </Box>
            </Flex>
          </Box>

          <Box
            bg="rgba(10, 10, 12, 0.7)"
            borderRadius="lg"
            border="1px solid rgba(0, 255, 255, 0.12)"
            p={6}
          >
            <HStack spacing={6} flexWrap="wrap">
              {Object.entries(nodeTypeLabels).map(([type, label]) => {
                const Icon = nodeTypeIcons[type] || FiMap;
                return (
                  <HStack key={type} spacing={2} fontFamily="monospace" color="gray.300">
                    <Icon size={16} />
                    <Text fontSize="sm">{label}</Text>
                  </HStack>
                );
              })}
            </HStack>
            <Text mt={4} fontSize="sm" color="gray.400" fontFamily="monospace">
              Status colors: cyan = available, green = completed, gray = locked. Progress will sync
              to your account once learning nodes are wired to the backend.
            </Text>
          </Box>
        </VStack>
      </Container>
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={10}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>

      <AdModal
        isOpen={showLearningAdModal}
        onClose={() => {
          setShowLearningAdModal(false);
          setPendingNode(null);
        }}
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
        onSkip={() => {
          setShowLearningAdModal(false);
          setPendingNode(null);
        }}
      />
      <GuestSignupWall
        isOpen={isGuestSignupWallOpen}
        onClose={() => setIsGuestSignupWallOpen(false)}
        activitySummary={guestCtx?.activitySummary}
        trialTrack="beginner"
      />
    </PageTemplate>
  );
}

export default PythonLearningPath;
