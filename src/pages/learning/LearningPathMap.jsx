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
  useBreakpointValue,
  usePrefersReducedMotion,
  useToast,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiBook,
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
import useCityMissionSync from '../../hooks/city/useCityMissionSync';
import useLearningPathData from '../../hooks/useLearningPathData';
import { api } from '../../services/api';
import {
  buildGuestLearningCompletedNodes,
  loadLearningPathProgress,
  resetLearningPathProgress,
} from '../../utils/learning/learningPathProgress';
import { trackUserContentEvent } from '../../services/userContentEventService';
import {
  computeCompletion,
  computeModuleAvailability,
  getNodeStatus,
} from '../../utils/learning/learningPathStatus.js';
import {
  buildLearningMissionState,
  buildPathWithSearch,
} from '../../utils/navigation/cityStoryState';

const NODE_SIZE = 40;
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 110;
const MICRO_COLUMN_WIDTH = 180;
const MICRO_ROW_HEIGHT = 90;
const LABEL_WIDTH = 170;
const PROFILE_CARD_CANVAS_WIDTH = 350;
const PROFILE_CARD_CANVAS_HEIGHT = 120;
const MOBILE_COLUMN_WIDTH = 180;
const MOBILE_ROW_HEIGHT = 96;
const MOBILE_MICRO_COLUMN_WIDTH = 150;
const MOBILE_MICRO_ROW_HEIGHT = 82;
const MOBILE_LABEL_WIDTH = 120;
const RETRO_PANEL_SHADOW = 'var(--cg-window-outset), 14px 14px 0 rgba(0, 0, 0, 0.12)';
const RETRO_BUTTON_OUTSET =
  'inset 1px 1px 0 var(--cg-window-light), inset 2px 2px 0 #f8f5ef, inset -1px -1px 0 #404040, inset -2px -2px 0 var(--cg-window-dark)';
const RETRO_BUTTON_INSET =
  'inset 1px 1px 0 #6d6d6d, inset 2px 2px 0 #3d3d3d, inset -1px -1px 0 var(--cg-window-light), inset -2px -2px 0 #f4efe7';
const RETRO_MAP_SURFACE = `
  linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 16%),
  radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.22) 0, transparent 24%),
  repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 2px, transparent 2px 44px),
  repeating-linear-gradient(0deg, rgba(49, 77, 61, 0.16) 0 1px, transparent 1px 34px),
  linear-gradient(180deg, #9ab4a0 0%, #6b8570 100%)
`;

const nodeTypeIcons = {
  [LEARNING_NODE_TYPES.ROOT]: FiMap,
  [LEARNING_NODE_TYPES.COURSE]: FiBook,
  [LEARNING_NODE_TYPES.MODULE]: FiLayers,
  [LEARNING_NODE_TYPES.LEARN]: FiBookOpen,
  [LEARNING_NODE_TYPES.WORKSPACE]: FiCode,
  [LEARNING_NODE_TYPES.TOWER]: FiShield,
  [LEARNING_NODE_TYPES.FINAL]: FiFlag,
  [LEARNING_NODE_TYPES.CAPSTONE]: FiStar,
};

const nodeTypeLabels = {
  [LEARNING_NODE_TYPES.ROOT]: 'Path Root',
  [LEARNING_NODE_TYPES.COURSE]: 'Course',
  [LEARNING_NODE_TYPES.MODULE]: 'Module',
  [LEARNING_NODE_TYPES.LEARN]: 'Learning',
  [LEARNING_NODE_TYPES.WORKSPACE]: 'Workspace',
  [LEARNING_NODE_TYPES.TOWER]: 'Tower Defense',
  [LEARNING_NODE_TYPES.FINAL]: 'Final Challenge',
  [LEARNING_NODE_TYPES.CAPSTONE]: 'Capstone',
};

const statusStyles = {
  completed: {
    border: '#2f6d34',
    glow: 'rgba(47, 109, 52, 0.28)',
    bg: 'linear-gradient(180deg, rgba(236, 244, 232, 0.98), rgba(211, 225, 205, 0.96))',
    text: '#1d5322',
  },
  available: {
    border: '#1e4f8f',
    glow: 'rgba(30, 79, 143, 0.26)',
    bg: 'linear-gradient(180deg, rgba(244, 240, 230, 0.98), rgba(223, 214, 200, 0.96))',
    text: '#163d74',
  },
  locked: {
    border: '#7a7771',
    glow: 'rgba(100, 94, 87, 0.18)',
    bg: 'linear-gradient(180deg, rgba(205, 198, 189, 0.96), rgba(184, 177, 168, 0.94))',
    text: '#5e5b56',
  },
};

/* ── Learning-path tree animations ── */
const pulseGlowGreen = keyframes`
  0%, 100% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(80, 107, 75, 0.82), 0 0 0 1px rgba(47, 109, 52, 0.26), 3px 3px 0 rgba(0, 0, 0, 0.14);
  }
  50% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.82), inset -1px -1px 0 rgba(80, 107, 75, 0.92), 0 0 0 1px rgba(47, 109, 52, 0.44), 4px 4px 0 rgba(0, 0, 0, 0.18);
  }
`;

const pulseGlowCyan = keyframes`
  0%, 100% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.74), inset -1px -1px 0 rgba(81, 92, 121, 0.84), 0 0 0 1px rgba(30, 79, 143, 0.24), 3px 3px 0 rgba(0, 0, 0, 0.14);
  }
  50% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.84), inset -1px -1px 0 rgba(81, 92, 121, 0.94), 0 0 0 1px rgba(30, 79, 143, 0.42), 4px 4px 0 rgba(0, 0, 0, 0.18);
  }
`;

const pulseNextObjective = keyframes`
  0%, 100% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.86), inset -1px -1px 0 rgba(124, 87, 23, 0.88), 0 0 0 2px rgba(163, 110, 21, 0.46), 4px 4px 0 rgba(0, 0, 0, 0.18);
    transform: scale(1);
  }
  50% {
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.92), inset -1px -1px 0 rgba(124, 87, 23, 0.94), 0 0 0 2px rgba(163, 110, 21, 0.72), 6px 6px 0 rgba(0, 0, 0, 0.22);
    transform: translate(-1px, -1px) scale(1.08);
  }
`;

const nodeEntrance = keyframes`
  0% { opacity: 0; transform: scale(0.3); }
  70% { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
`;

/* ── Cyber-static transition keyframes ── */
const cyberStaticNoise = keyframes`
  0%, 100% { background-position: 0 0, 0 0, 0 0; }
  10% { background-position: -7px -15px, 13px 8px, -3px 11px; }
  20% { background-position: 12px 5px, -9px -12px, 7px -6px; }
  30% { background-position: -4px 11px, 5px -7px, -11px 3px; }
  40% { background-position: 9px -3px, -14px 10px, 5px -9px; }
  50% { background-position: -11px 7px, 8px -5px, -6px 14px; }
  60% { background-position: 6px -12px, -3px 13px, 10px -4px; }
  70% { background-position: -8px 4px, 11px -9px, -5px 7px; }
  80% { background-position: 14px -6px, -7px 4px, 9px -11px; }
  90% { background-position: -3px 9px, 6px -14px, -8px 5px; }
`;
const scanlineScroll = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(8px); }
`;
const staticFlicker = keyframes`
  0%, 100% { opacity: 0.7; }
  15% { opacity: 0.9; }
  30% { opacity: 0.6; }
  45% { opacity: 1; }
  60% { opacity: 0.5; }
  75% { opacity: 0.85; }
  90% { opacity: 0.65; }
`;

/* ── Transition timing (ms) ── */
const TRANS_ZOOM_MS = 340;
const TRANS_STATIC_MS = 200;
const TRANS_REVEAL_MS = 280;
const TRANS_TOTAL_FWD = TRANS_ZOOM_MS + TRANS_STATIC_MS + TRANS_REVEAL_MS;
const TRANS_TOTAL_BWD = 250 + 180 + 250;

const PATH_M0_PREFIXES = {
  'python-path': 'py-m0-',
  'javascript-path': 'js-m0-',
  'java-path': 'java-m0-',
  'cpp-path': 'cpp-m0-',
};

function LearningPathMap() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [motionEnabled, setMotionEnabled] = useState(!prefersReducedMotion);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathSlug } = useParams();
  const { isAuthenticated, user } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const { syncMissionState } = useCityMissionSync();
  const selectedTrialTrack = guestCtx?.selectedTrialTrack || guestCtx?.progress?.pathChoice || null;
  const recordPathChoice = guestCtx?.recordPathChoice;
  const recordTrialLearningPath = guestCtx?.recordTrialLearningPath;
  const isBeginnerTrialLocked = !isAuthenticated && Boolean(guestCtx?.isBeginnerTrialLocked);
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');
  const courseParam = searchParams.get('course');
  const profileCardCanvasRef = useRef(null);
  const trackedSurfaceKeyRef = useRef(null);
  const mapFlexRef = useRef(null);
  const [mapFlexWidth, setMapFlexWidth] = useState(0);
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

  const { pathData, loading: isPathLoading } = useLearningPathData(pathSlug);

  useEffect(() => {
    if (!isAuthenticated || !pathData?.pathId) return;

    const key = `learning_map:${pathData.pathId}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area: 'learning',
      surface: 'learning_map',
      entrySource: 'direct',
      pathId: pathData.pathId,
    });
  }, [isAuthenticated, pathData?.pathId]);

  useEffect(() => {
    if (isAuthenticated || !pathData?.pathId) return;
    if (selectedTrialTrack === 'pro') return;
    recordPathChoice?.('beginner');
    recordTrialLearningPath?.(pathData.pathId);
  }, [
    isAuthenticated,
    pathData?.pathId,
    recordPathChoice,
    recordTrialLearningPath,
    selectedTrialTrack,
  ]);

  const allNodes = useMemo(() => pathData?.nodes || [], [pathData?.nodes]);
  const nodesById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
  const hasCourses = (pathData?.courseNodeIds?.length ?? 0) > 0;
  const viewLevel =
    !selectedCourseId && hasCourses ? 'course' : !selectedModuleId ? 'module' : 'activity';
  const [completedNodes, setCompletedNodes] = useState(() => new Set());
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [showLearningAdModal, setShowLearningAdModal] = useState(false);
  const [selectedLearningAdType, setSelectedLearningAdType] = useState(null);
  const [isApplyingLearningAdCredit, setIsApplyingLearningAdCredit] = useState(false);
  const [pendingNode, setPendingNode] = useState(null);
  const [isGuestSignupWallOpen, setIsGuestSignupWallOpen] = useState(false);
  const isMobileMapLayout = useBreakpointValue({ base: true, md: false }) ?? false;
  const macroColumnWidth = isMobileMapLayout ? MOBILE_COLUMN_WIDTH : COLUMN_WIDTH;
  const macroRowHeight = isMobileMapLayout ? MOBILE_ROW_HEIGHT : ROW_HEIGHT;
  const microColumnWidth = isMobileMapLayout ? MOBILE_MICRO_COLUMN_WIDTH : MICRO_COLUMN_WIDTH;
  const microRowHeight = isMobileMapLayout ? MOBILE_MICRO_ROW_HEIGHT : MICRO_ROW_HEIGHT;

  const showLearningFetchToast = useCallback(
    (kind) => {
      const config = {
        rate_limit_status_failed: {
          id: 'learning-map-rate-limit-failed',
          title: 'Learning access unavailable',
          description: 'We could not refresh learning access right now. Please try again.',
        },
        progress_load_failed: {
          id: 'learning-map-progress-failed',
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

  /* ── View-transition state (zoom → static → reveal) ── */
  const [viewTransition, setViewTransition] = useState(null);
  // null | { phase: 'zoom'|'static'|'reveal', direction: 'forward'|'backward', origin: string }
  const transitionTimersRef = useRef([]);

  const startViewTransition = useCallback(
    (direction, applyViewChange, nodeX, nodeY) => {
      if (!motionEnabled) {
        applyViewChange();
        return;
      }
      // Cancel any in-flight transition
      transitionTimersRef.current.forEach(clearTimeout);

      const origin =
        nodeX != null ? `${nodeX + NODE_SIZE / 2}px ${nodeY + NODE_SIZE / 2}px` : 'center center';
      const isFwd = direction === 'forward';

      setViewTransition({ phase: 'zoom', direction, origin });

      const zoomMs = isFwd ? TRANS_ZOOM_MS : 250;
      const staticMs = isFwd ? TRANS_STATIC_MS : 180;
      const revealMs = isFwd ? TRANS_REVEAL_MS : 250;

      const t1 = setTimeout(() => {
        setViewTransition((p) => (p ? { ...p, phase: 'static' } : null));
        applyViewChange();
      }, zoomMs);

      const t2 = setTimeout(() => {
        setViewTransition((p) => (p ? { ...p, phase: 'reveal' } : null));
      }, zoomMs + staticMs);

      const t3 = setTimeout(
        () => {
          setViewTransition(null);
        },
        zoomMs + staticMs + revealMs
      );

      transitionTimersRef.current = [t1, t2, t3];
    },
    [motionEnabled]
  );

  // Cleanup transition timers on unmount
  useEffect(() => {
    return () => transitionTimersRef.current.forEach(clearTimeout);
  }, []);

  // Measure the map flex container width so we can scale the map to fit on mobile
  useEffect(() => {
    const el = mapFlexRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setMapFlexWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setMapFlexWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

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
    const routeMissionState = buildLearningMissionState({
      learningPathId: pathData?.pathId || pathSlug,
      moduleId: selectedModuleId,
      resumePath: buildPathWithSearch(location.pathname, location.search),
      solvedCount: completedNodes.size,
      totalCount: pathData?.nodes?.length ?? null,
    });

    if (!routeMissionState) {
      return;
    }

    void syncMissionState({
      progressSummary: {
        learningTrialSolvedCount: completedNodes.size,
        lpNodesCompletedCount: completedNodes.size,
        problemsSolvedCount: completedNodes.size,
      },
      routeMissionState,
    });
  }, [
    completedNodes.size,
    location.pathname,
    location.search,
    pathData?.nodes?.length,
    pathData?.pathId,
    pathSlug,
    selectedModuleId,
    syncMissionState,
  ]);

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

  const isModuleZeroNode = useCallback(
    (node) => {
      if (!node) return false;
      const nodeId = String(node.id || '');
      const moduleId = String(node.moduleId || '');
      const m0Prefix = PATH_M0_PREFIXES[pathData?.pathId] || 'py-m0-';
      return nodeId.startsWith(m0Prefix) || moduleId.startsWith(m0Prefix);
    },
    [pathData?.pathId]
  );

  const macroNodes = useMemo(
    () =>
      allNodes.filter((node) => {
        if (node.type === LEARNING_NODE_TYPES.ROOT) return true;
        if (![LEARNING_NODE_TYPES.MODULE, LEARNING_NODE_TYPES.CAPSTONE].includes(node.type))
          return false;
        return !selectedCourseId || node.courseId === selectedCourseId;
      }),
    [allNodes, selectedCourseId]
  );

  const courseNodes = useMemo(
    () =>
      allNodes.filter((node) =>
        [LEARNING_NODE_TYPES.ROOT, LEARNING_NODE_TYPES.COURSE].includes(node.type)
      ),
    [allNodes]
  );

  const selectedCourse = useMemo(
    () => allNodes.find((node) => node.id === selectedCourseId) || null,
    [allNodes, selectedCourseId]
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
    const viewNodes =
      viewLevel === 'course' ? courseNodes : viewLevel === 'module' ? macroNodes : microNodes;
    if (!viewNodes.length) return [];

    if (viewLevel === 'course' || viewLevel === 'module') {
      const minRow = Math.min(...viewNodes.map((node) => node.position.row ?? 0));
      const minCol = Math.min(...viewNodes.map((node) => node.position.col ?? 0));
      const sorted = [...viewNodes].sort((a, b) => {
        const rowDiff = (a.position.row ?? 0) - (b.position.row ?? 0);
        if (rowDiff !== 0) return rowDiff;
        return (a.position.col ?? 0) - (b.position.col ?? 0);
      });

      return sorted.map((node) => ({
        ...node,
        x: ((node.position.col ?? 0) - minCol) * macroColumnWidth,
        y: ((node.position.row ?? 0) - minRow) * macroRowHeight,
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
    const activityRowY = microRowHeight;
    const finalRowY = microRowHeight * 2;

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
        x: (index - centerOffset) * microColumnWidth,
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
    const minY = Math.min(...positioned.map((node) => node.y));
    return positioned.map((node) => ({
      ...node,
      x: node.x - minX,
      y: node.y - minY,
    }));
  }, [
    viewLevel,
    courseNodes,
    macroNodes,
    microNodes,
    macroColumnWidth,
    macroRowHeight,
    microColumnWidth,
    microRowHeight,
  ]);

  const edges = useMemo(() => {
    const byId = new Map(layoutNodes.map((node) => [node.id, node]));
    const viewIdSet = new Set(layoutNodes.map((node) => node.id));
    const visitedEdges = new Set();

    if (viewLevel === 'activity') {
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

    /* Course view & Module view — prereq-based edges */
    const findViewAncestor = (nodeId, visited = new Set()) => {
      if (!nodeId || visited.has(nodeId)) return null;
      visited.add(nodeId);
      const node = nodesById.get(nodeId);
      if (!node) return null;
      if (viewIdSet.has(node.id)) return node.id;
      if (!node.prereqs?.length) return null;
      for (const prereq of node.prereqs) {
        const ancestor = findViewAncestor(prereq, visited);
        if (ancestor) return ancestor;
      }
      return null;
    };

    const results = [];
    layoutNodes.forEach((node) => {
      node.prereqs?.forEach((prereqId) => {
        let sourceId = prereqId;
        if (!viewIdSet.has(prereqId)) {
          sourceId = findViewAncestor(prereqId);
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
  }, [layoutNodes, nodesById, viewLevel]);

  const mapSize = useMemo(() => {
    if (!layoutNodes.length) return { width: 0, height: 0 };
    const maxX = Math.max(...layoutNodes.map((node) => node.x));
    const maxY = Math.max(...layoutNodes.map((node) => node.y));
    const colWidth = viewLevel === 'activity' ? microColumnWidth : macroColumnWidth;
    const rowHt = viewLevel === 'activity' ? microRowHeight : macroRowHeight;
    return { width: maxX + colWidth, height: maxY + rowHt };
  }, [layoutNodes, macroColumnWidth, macroRowHeight, microColumnWidth, microRowHeight, viewLevel]);

  const gridRowHeight = viewLevel === 'activity' ? microRowHeight : macroRowHeight;

  // Scale the map canvas down on mobile so it fits without horizontal scroll.
  // Uses the measured width of the flex container that wraps the map.
  const mapScale = useMemo(() => {
    if (!isMobileMapLayout || !mapFlexWidth || !mapSize.width) return 1;
    return Math.min(1, Math.max(0.3, mapFlexWidth / mapSize.width));
  }, [isMobileMapLayout, mapFlexWidth, mapSize.width]);

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
    /* Root-type nodes (path root always, module header in activity view)
       are never interactive — bail immediately as a safety guard. */
    if (node.type === LEARNING_NODE_TYPES.ROOT) return;
    if (viewLevel === 'activity' && node.type === LEARNING_NODE_TYPES.MODULE) return;

    /* Block clicks while a transition is playing */
    if (viewTransition) return;

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

    /* Course view: click a course to enter its module map */
    if (viewLevel === 'course') {
      if (node.type === LEARNING_NODE_TYPES.COURSE) {
        startViewTransition(
          'forward',
          () => {
            setSelectedCourseId(node.id);
            setSearchParams({ course: node.id });
          },
          node.x,
          node.y
        );
      }
      return;
    }

    /* Module view: click a module to see its activities */
    if (viewLevel === 'module') {
      if (!isAuthenticated && isBeginnerTrialLocked) {
        setIsGuestSignupWallOpen(true);
        return;
      }
      if ([LEARNING_NODE_TYPES.MODULE, LEARNING_NODE_TYPES.CAPSTONE].includes(node.type)) {
        if (!isAuthenticated && !isModuleZeroNode(node)) {
          setIsGuestSignupWallOpen(true);
          return;
        }
        startViewTransition(
          'forward',
          () => {
            setSelectedModuleId(node.id);
            const params = selectedCourseId
              ? { course: selectedCourseId, module: node.id }
              : { module: node.id };
            setSearchParams(params);
          },
          node.x,
          node.y
        );
      }
      return;
    }

    /* Activity view: navigate to the learning activity */
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
    if (!courseParam) {
      if (selectedCourseId !== null) setSelectedCourseId(null);
      return;
    }
    if (nodesById.has(courseParam)) {
      if (selectedCourseId !== courseParam) setSelectedCourseId(courseParam);
      return;
    }
    if (selectedCourseId !== null) setSelectedCourseId(null);
    if (selectedModuleId !== null) setSelectedModuleId(null);
    setSearchParams({});
  }, [courseParam, nodesById, selectedCourseId, selectedModuleId, setSearchParams]);

  useEffect(() => {
    if (!moduleParam) {
      if (selectedModuleId !== null) setSelectedModuleId(null);
      return;
    }
    const m0Prefix = PATH_M0_PREFIXES[pathData?.pathId] || 'py-m0-';
    if (!isAuthenticated && !String(moduleParam).startsWith(m0Prefix)) {
      if (selectedModuleId !== null) setSelectedModuleId(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('module');
        return next;
      });
      setIsGuestSignupWallOpen(true);
      return;
    }
    if (nodesById.has(moduleParam)) {
      if (selectedModuleId !== moduleParam) setSelectedModuleId(moduleParam);
      return;
    }
    if (selectedModuleId !== null) setSelectedModuleId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('module');
      return next;
    });
  }, [
    moduleParam,
    isAuthenticated,
    nodesById,
    selectedModuleId,
    setSearchParams,
    pathData?.pathId,
  ]);

  if (isPathLoading && !pathData) {
    return (
      <PageTemplate showGiphyBackground={false}>
        <Container maxW="container.md" py={{ base: 10, lg: 16 }}>
          <Heading size="lg" fontFamily="var(--cg-font-retro-display)" color="var(--cg-link)">
            Loading learning path
          </Heading>
          <Text mt={4} color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
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
          <Heading size="lg" fontFamily="var(--cg-font-retro-display)" color="var(--cg-link)">
            Learning path not found
          </Heading>
          <Text mt={4} color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
            We could not load the learning path content.
          </Text>
          <Button
            mt={6}
            onClick={() => navigate('/learning')}
            bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
            color="var(--cg-text)"
            border="2px solid var(--cg-window-shadow)"
            borderRadius="0"
            fontFamily="var(--cg-font-retro-display)"
            boxShadow={RETRO_BUTTON_OUTSET}
            _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
            _active={{ boxShadow: RETRO_BUTTON_INSET, transform: 'translate(1px, 1px)' }}
          >
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
    setSelectedCourseId(null);
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
    <PageTemplate showGiphyBackground={false}>
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={8}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>
      <Container maxW="container.xl" py={{ base: 6, lg: 16 }}>
        <VStack spacing={8} align="stretch">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', lg: 'center' }}
            gap={6}
          >
            <Box>
              <Badge
                bg="linear-gradient(180deg, rgba(248, 244, 236, 0.98), rgba(223, 214, 199, 0.96))"
                color="var(--cg-link)"
                border="1px solid var(--cg-window-shadow)"
                borderRadius="0"
                fontFamily="var(--cg-font-retro-display)"
                boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 0 rgba(122, 122, 122, 0.75)"
                mb={3}
              >
                LEARNING PATH • DEMO BUILD
              </Badge>
              <Heading
                size="2xl"
                fontFamily="var(--cg-font-retro-display)"
                color="var(--cg-link)"
                letterSpacing="0.01em"
              >
                {viewLevel === 'course' ? pathData.title : selectedCourse?.label || pathData.title}
              </Heading>
              <Text
                mt={3}
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
                maxW="720px"
              >
                {viewLevel === 'course'
                  ? pathData.summary || 'Select a course to begin your learning journey.'
                  : selectedCourse?.description || ''}
              </Text>
            </Box>
            <HStack
              spacing={{ base: 2, md: 4 }}
              align="center"
              flexWrap="wrap"
              justify={{ base: 'flex-start', lg: 'flex-end' }}
              w={{ base: '100%', lg: 'auto' }}
            >
              <HStack
                spacing={2}
                bg="linear-gradient(180deg, rgba(244, 239, 231, 0.98), rgba(216, 208, 198, 0.94))"
                px={{ base: 3, md: 4 }}
                py={2}
                borderRadius="0"
                border="2px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-outset)"
              >
                <Text
                  fontSize="sm"
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  Animations
                </Text>
                <Switch
                  isChecked={motionEnabled}
                  onChange={(event) => setMotionEnabled(event.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
              <Button
                size={{ base: 'xs', md: 'sm' }}
                bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                color="var(--cg-text)"
                border="2px solid var(--cg-window-shadow)"
                borderRadius="0"
                boxShadow={RETRO_BUTTON_OUTSET}
                _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
                _active={{ boxShadow: RETRO_BUTTON_INSET, transform: 'translate(1px, 1px)' }}
                fontFamily="var(--cg-font-retro-display)"
                onClick={handleResetProgress}
              >
                Reset progress
              </Button>
              <HStack
                spacing={2}
                fontFamily="var(--cg-font-retro-display)"
                color="var(--cg-text)"
                fontSize="sm"
                display={{ base: 'none', lg: 'inline-flex' }}
              >
                <FiGitBranch />
                <Text>Branch unlocks require both sides</Text>
              </HStack>
            </HStack>
          </Flex>

          <Box
            position="relative"
            bg="linear-gradient(180deg, var(--cg-window) 0%, var(--cg-window-face) 100%)"
            borderRadius="0"
            border="2px solid var(--cg-window-shadow)"
            boxShadow={RETRO_PANEL_SHADOW}
            overflow={viewTransition ? 'hidden' : 'auto'}
            p={{ base: 3, md: 6, lg: 10 }}
            sx={{ WebkitOverflowScrolling: 'touch' }}
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              opacity: 0.88,
              backgroundImage: RETRO_MAP_SURFACE,
              backgroundSize: 'auto',
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
                      'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(50, 58, 53, 0.08) 3px, rgba(50, 58, 53, 0.08) 4px)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    borderRadius: 0,
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
                <Text
                  fontSize="sm"
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  {viewLevel === 'course'
                    ? 'Course view: select a course to see its modules.'
                    : viewLevel === 'module'
                      ? 'Module view: click a module to zoom in.'
                      : 'Activity view: module details.'}
                </Text>
              </HStack>
              {viewLevel === 'module' && selectedCourse && (
                <HStack spacing={3} align="center">
                  <Badge
                    bg="linear-gradient(180deg, rgba(248, 244, 236, 0.98), rgba(223, 214, 199, 0.96))"
                    color="var(--cg-link)"
                    border="1px solid var(--cg-window-shadow)"
                    borderRadius="0"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    COURSE
                  </Badge>
                  <Text
                    fontSize="sm"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    {selectedCourse.label}
                  </Text>
                  <Box
                    as="button"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontFamily="var(--cg-font-retro-display)"
                    color="var(--cg-text)"
                    border="2px solid var(--cg-window-shadow)"
                    borderRadius="0"
                    bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                    boxShadow={RETRO_BUTTON_OUTSET}
                    _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
                    _active={{ boxShadow: RETRO_BUTTON_INSET, transform: 'translate(1px, 1px)' }}
                    onClick={() => {
                      startViewTransition('backward', () => {
                        setSelectedCourseId(null);
                        setSelectedModuleId(null);
                        setSearchParams({});
                      });
                    }}
                  >
                    Back to courses
                  </Box>
                </HStack>
              )}
              {viewLevel === 'activity' && selectedModule && (
                <HStack spacing={3} align="center">
                  <Badge
                    bg="linear-gradient(180deg, rgba(248, 244, 236, 0.98), rgba(223, 214, 199, 0.96))"
                    color="var(--cg-link)"
                    border="1px solid var(--cg-window-shadow)"
                    borderRadius="0"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    MODULE VIEW
                  </Badge>
                  <Text
                    fontSize="sm"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    {selectedModule.label}
                  </Text>
                  <Box
                    as="button"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontFamily="var(--cg-font-retro-display)"
                    color="var(--cg-text)"
                    border="2px solid var(--cg-window-shadow)"
                    borderRadius="0"
                    bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                    boxShadow={RETRO_BUTTON_OUTSET}
                    _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
                    _active={{ boxShadow: RETRO_BUTTON_INSET, transform: 'translate(1px, 1px)' }}
                    onClick={() => {
                      startViewTransition('backward', () => {
                        setSelectedModuleId(null);
                        setSearchParams(selectedCourseId ? { course: selectedCourseId } : {});
                      });
                    }}
                  >
                    Back to modules
                  </Box>
                </HStack>
              )}
            </Flex>
            <Flex
              ref={mapFlexRef}
              align="center"
              justify="center"
              minH={{ base: '320px', md: '380px' }}
              minW="100%"
              position="relative"
              style={
                viewTransition?.phase === 'zoom' && viewTransition.direction === 'forward'
                  ? {
                      transform: 'scale(2.6)',
                      transformOrigin: viewTransition.origin,
                      filter: 'brightness(0.3) blur(6px)',
                    }
                  : {}
              }
              transition={
                viewTransition
                  ? 'transform 0.34s cubic-bezier(0.4, 0, 0.2, 1), filter 0.34s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none'
              }
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
                  display={{ base: 'none', md: 'block' }}
                  transform={{ base: 'scale(0.72)', md: 'scale(0.86)', lg: 'scale(1)' }}
                  transformOrigin="top right"
                />
              )}
              {/* Scale wrapper: on mobile the outer box provides the scaled footprint so the
                  parent Flex sees the right dimensions; the inner box holds the actual map
                  and is scaled down via CSS transform. On desktop mapScale is always 1. */}
              <Box
                position="relative"
                style={{
                  width: `${mapSize.width * mapScale}px`,
                  height: `${mapSize.height * mapScale}px`,
                }}
                mx="auto"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width={`${mapSize.width}px`}
                  height={`${mapSize.height}px`}
                  style={
                    mapScale < 1
                      ? { transform: `scale(${mapScale})`, transformOrigin: 'top left' }
                      : undefined
                  }
                >
                  <Box
                    as="svg"
                    position="absolute"
                    top={0}
                    left={0}
                    width={`${mapSize.width}px`}
                    height={`${mapSize.height}px`}
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
                        stroke="rgb(35, 73, 120)"
                        strokeOpacity="0.11"
                        strokeWidth="1"
                      >
                        {motionEnabled && (
                          <animate
                            attributeName="stroke-opacity"
                            values="0.08;0.18;0.08"
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
                            stroke="rgba(28, 56, 94, 0.14)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            filter="url(#lpEdgeGlow)"
                          />
                          {/* Main path with animated dash flow */}
                          <path
                            d={d}
                            fill="none"
                            stroke="rgba(70, 96, 53, 0.42)"
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
                                  pIdx === 0
                                    ? 'rgba(232, 212, 156, 0.8)'
                                    : 'rgba(255, 255, 255, 0.55)'
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
                    /* In course/module views, COURSE/MODULE/CAPSTONE nodes ARE valid objectives.
                     In activity view, skip MODULE (it's the view root) and ROOT. */
                    const nextId =
                      layoutNodes.find((n) => {
                        const s = getNodeStatus(n, computedCompletion, moduleAvailability);
                        if (s !== 'available') return false;
                        if (n.type === LEARNING_NODE_TYPES.ROOT) return false;
                        if (viewLevel === 'activity' && n.type === LEARNING_NODE_TYPES.MODULE)
                          return false;
                        return true;
                      })?.id ?? null;

                    return layoutNodes.map((node, nodeIndex) => {
                      const isNextObjective = node.id === nextId;
                      /* Root nodes (path root in course/module view, module header in activity view)
                       are always shown as completed and are never interactive. */
                      const isViewRoot =
                        node.type === LEARNING_NODE_TYPES.ROOT ||
                        (viewLevel === 'activity' && node.type === LEARNING_NODE_TYPES.MODULE);
                      const status = isViewRoot
                        ? 'completed'
                        : getNodeStatus(node, computedCompletion, moduleAvailability);
                      const styles = statusStyles[status];
                      const Icon = nodeTypeIcons[node.type] || FiMap;
                      const nodeLabel = nodeTypeLabels[node.type] || 'Node';
                      const tooltipLabel = (() => {
                        if (
                          node.type === LEARNING_NODE_TYPES.FINAL &&
                          node.content?.isTowerDefense
                        ) {
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
                          bg="linear-gradient(180deg, rgba(244, 239, 231, 0.98), rgba(213, 206, 197, 0.96))"
                          color="var(--cg-text)"
                          border="1px solid var(--cg-window-shadow)"
                          borderRadius="0"
                          fontSize="sm"
                          maxW="240px"
                          hasArrow
                        >
                          <Box
                            position="absolute"
                            top={`${node.y}px`}
                            left={`${node.x}px`}
                            width={`${NODE_SIZE}px`}
                            height={`${NODE_SIZE}px`}
                            borderRadius="4px"
                            border={`2px solid ${styles.border}`}
                            bg={styles.bg}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="var(--cg-window-outset), 3px 3px 0 rgba(0, 0, 0, 0.14)"
                            cursor={
                              status === 'locked'
                                ? 'not-allowed'
                                : isViewRoot
                                  ? 'default'
                                  : 'pointer'
                            }
                            transition="transform 0.25s ease, box-shadow 0.25s ease"
                            animation={glowAnim || entranceAnim}
                            _hover={
                              status === 'locked' || isViewRoot
                                ? {}
                                : {
                                    transform: 'translate(-1px, -1px) scale(1.08)',
                                    boxShadow:
                                      'var(--cg-window-outset), 5px 5px 0 rgba(0, 0, 0, 0.16), 0 0 0 1px ' +
                                      styles.glow,
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
                                        ? '#2f6d34'
                                        : '#d0a03b'
                                      : '#1e4f8f'
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
                              minW={{
                                base: `${MOBILE_LABEL_WIDTH}px`,
                                md: `${LABEL_WIDTH}px`,
                              }}
                              maxW={{ base: '140px', md: '220px' }}
                              textAlign="center"
                            >
                              <Text
                                fontSize="xs"
                                color={styles.text}
                                fontFamily="var(--cg-font-retro-display)"
                                textTransform="uppercase"
                                noOfLines={1}
                              >
                                {nodeLabel}
                              </Text>
                              <Text
                                fontSize="xs"
                                color="var(--cg-text)"
                                fontFamily="var(--cg-font-retro-display)"
                                noOfLines={2}
                              >
                                {node.label}
                              </Text>
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    });
                  })()}
                </Box>
              </Box>
            </Flex>

            {/* ═══ Cyber-static transition overlay ═══ */}
            {viewTransition && (
              <Box
                position="absolute"
                inset={0}
                zIndex={8}
                borderRadius="0"
                overflow="hidden"
                pointerEvents="all"
                bg="rgba(34, 44, 42, 0.94)"
                opacity={
                  viewTransition.phase === 'zoom'
                    ? viewTransition.direction === 'forward'
                      ? 0.85
                      : 0.9
                    : viewTransition.phase === 'static'
                      ? 1
                      : 0
                }
                transition={
                  viewTransition.phase === 'zoom'
                    ? `opacity ${viewTransition.direction === 'forward' ? '0.34s' : '0.25s'} ease-in`
                    : viewTransition.phase === 'reveal'
                      ? 'opacity 0.28s ease-out'
                      : 'none'
                }
              >
                {/* Rapid-shifting noise texture */}
                <Box
                  position="absolute"
                  inset="-50%"
                  width="200%"
                  height="200%"
                  sx={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 1px,
                        rgba(232, 212, 156, 0.08) 1px,
                        rgba(232, 212, 156, 0.08) 2px
                      ),
                      repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 2px,
                        rgba(28, 56, 94, 0.08) 2px,
                        rgba(28, 56, 94, 0.08) 3px
                      ),
                      repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        rgba(255, 255, 255, 0.04) 3px,
                        rgba(255, 255, 255, 0.04) 4px
                      )
                    `,
                    backgroundSize: '4px 4px, 5px 5px, 6px 6px',
                    animation: `${cyberStaticNoise} 0.12s steps(8) infinite`,
                  }}
                />
                {/* Horizontal scanlines */}
                <Box
                  position="absolute"
                  inset={0}
                  background="repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(19, 24, 29, 0.22) 2px, rgba(19, 24, 29, 0.22) 4px)"
                  sx={{ animation: `${scanlineScroll} 0.25s linear infinite` }}
                />
                {/* Flicker bars */}
                <Box
                  position="absolute"
                  inset={0}
                  sx={{
                    animation: `${staticFlicker} 0.18s steps(4) infinite`,
                    backgroundImage: `
                      linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(232, 212, 156, 0.08) 15%,
                        transparent 30%,
                        rgba(28, 56, 94, 0.08) 50%,
                        transparent 65%,
                        rgba(255, 255, 255, 0.06) 80%,
                        transparent 100%
                      )
                    `,
                  }}
                />
                {/* Central glow */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  width="70%"
                  height="70%"
                  borderRadius="full"
                  background="radial-gradient(circle, rgba(232, 212, 156, 0.14) 0%, transparent 70%)"
                />
              </Box>
            )}
          </Box>

          <Box
            bg="linear-gradient(180deg, var(--cg-window) 0%, var(--cg-window-face) 100%)"
            borderRadius="0"
            border="2px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-outset)"
            p={{ base: 4, md: 6 }}
          >
            <Flex flexWrap="wrap" gap={{ base: 3, md: 4 }}>
              {Object.entries(nodeTypeLabels).map(([type, label]) => {
                const Icon = nodeTypeIcons[type] || FiMap;
                return (
                  <HStack
                    key={type}
                    spacing={2}
                    fontFamily="var(--cg-font-retro-display)"
                    color="var(--cg-text)"
                    flexShrink={0}
                  >
                    <Icon size={14} />
                    <Text fontSize={{ base: 'xs', md: 'sm' }}>{label}</Text>
                  </HStack>
                );
              })}
            </Flex>
            <Text
              mt={3}
              fontSize={{ base: 'xs', md: 'sm' }}
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
            >
              Status colors: blue = available, green = completed, gray = locked.
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

export default LearningPathMap;
