import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  UnorderedList,
  VStack,
  usePrefersReducedMotion,
  useToast,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import AdModal from '../../components/towerDefense/AdModal';
import adSlots from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';
import useLearningPathData from '../../hooks/useLearningPathData';
import { api } from '../../services/api';
import { trackUserContentEvent } from '../../services/userContentEventService';
import {
  completeLearningPathNode,
  loadLearningPathProgress,
} from '../../utils/learning/learningPathProgress';
import { getNextLearningNode } from '../../utils/learning/learningPathNavigation';
import {
  computeCompletion,
  computeModuleAvailability,
  getNodeStatus,
} from '../../utils/learning/learningPathStatus.js';
import XpProgressBar from '../../components/shared/XpProgressBar';
import DataPacketsEarnedBadge from '../../components/shared/DataPacketsEarnedBadge';
import useXpLevelUpAnimation from '../../hooks/animations/useXpLevelUpAnimation';
import useCityMissionSync from '../../hooks/city/useCityMissionSync';
import audioService from '../../utils/audio/AudioService';
import BugReportButton from '../../components/feedback/BugReportButton';
import { normalizeDataPacketsPayload } from '../../utils/economy/dataPackets';
import { getProgressTransitionDuration } from '../../utils/game/xpAnimation';
import {
  buildLearningMissionState,
  buildPathWithSearch,
} from '../../utils/navigation/cityStoryState';
import SocialShareButtons from '../../components/shared/SocialShareButtons';
import RetroPageShell, { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';

const fadeSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(0.985); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const AnimatedIn = ({ delay = 0, prefersReducedMotion, children, ...props }) => (
  <Box
    opacity={prefersReducedMotion ? 1 : 0}
    transform={prefersReducedMotion ? 'none' : 'translateY(18px) scale(0.985)'}
    animation={prefersReducedMotion ? undefined : `${fadeSlideUp} 0.7s ease forwards`}
    animationDelay={`${delay}ms`}
    {...props}
  >
    {children}
  </Box>
);

const AnimatedLearnPanel = ({ caption, lines }) => (
  <RetroInset mt={5} p={{ base: 4, md: 5 }}>
    <VStack spacing={2} align="start">
      {caption ? (
        <Text
          fontFamily="var(--cg-font-retro-display)"
          color="var(--cg-accent-blue)"
          fontSize="sm"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {caption}
        </Text>
      ) : null}
      {(lines || []).map((line) => (
        <Text
          key={line}
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          color="var(--cg-text)"
          lineHeight="1.7"
        >
          {line}
        </Text>
      ))}
    </VStack>
  </RetroInset>
);

const GiphyEmbed = ({ urls, caption, interstitials }) => (
  <Box mt={5} position="relative">
    {caption ? (
      <Text
        mb={3}
        fontFamily="var(--cg-font-retro-display)"
        color="var(--cg-accent-blue)"
        fontSize="sm"
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        {caption}
      </Text>
    ) : null}
    <VStack spacing={4} align="stretch">
      {(urls || []).map((url, index) => (
        <Box key={url}>
          {url.includes('giphy.com/embed') ? (
            <Box
              position="relative"
              width="100%"
              paddingBottom="56%"
              overflow="hidden"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              bg="var(--cg-window)"
            >
              <Box
                as="iframe"
                title="Giphy preview"
                src={url}
                position="absolute"
                inset={0}
                width="100%"
                height="100%"
                frameBorder="0"
              />
            </Box>
          ) : (
            <Box
              overflow="hidden"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              bg="var(--cg-window)"
            >
              <Box
                as="img"
                src={url}
                alt="Learning visual"
                width="100%"
                height="auto"
                display="block"
              />
            </Box>
          )}
          {index < (urls?.length || 0) - 1 && (
            <Box mt={3}>
              {interstitials?.[index] ? (
                <Text
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                  mb={2}
                >
                  {interstitials[index]}
                </Text>
              ) : null}
              <Divider borderColor="var(--cg-window-dark)" />
            </Box>
          )}
        </Box>
      ))}
    </VStack>
  </Box>
);

const LearningVisual = ({ visual }) => {
  if (!visual) return null;
  if (visual.type === 'pulse-grid') {
    return <AnimatedLearnPanel caption={visual.caption} lines={visual.lines} />;
  }
  if (visual.type === 'giphy') {
    return (
      <GiphyEmbed
        caption={visual.caption}
        urls={visual.urls}
        interstitials={visual.interstitials}
      />
    );
  }
  return null;
};

const LearningSection = ({ section }) => {
  if (!section) return null;
  if (section.type === 'giphy') {
    return <LearningVisual visual={section} />;
  }
  if (section.type === 'example') {
    return (
      <RetroInset mt={5} p={4}>
        {section.title ? (
          <Text
            fontFamily="var(--cg-font-retro-display)"
            color="var(--cg-accent-blue)"
            fontSize="sm"
            mb={2}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            {section.title}
          </Text>
        ) : null}
        <Text
          as="pre"
          whiteSpace="pre-wrap"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          color="var(--cg-text)"
        >
          {section.code}
        </Text>
        {section.note ? (
          <Text
            mt={2}
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
            color="var(--cg-muted)"
          >
            {section.note}
          </Text>
        ) : null}
      </RetroInset>
    );
  }
  return (
    <Box mt={4}>
      {section.title ? (
        <Text
          fontFamily="var(--cg-font-retro-display)"
          color="var(--cg-accent-blue)"
          fontSize="sm"
          mb={2}
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {section.title}
        </Text>
      ) : null}
      {(section.paragraphs || []).map((paragraph) => (
        <Text
          key={paragraph}
          color="var(--cg-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          mb={2}
          lineHeight="1.7"
        >
          {paragraph}
        </Text>
      ))}
      {section.bullets?.length ? (
        <UnorderedList
          spacing={2}
          color="var(--cg-text)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          mt={3}
        >
          {section.bullets.map((bullet) => (
            <ListItem key={bullet}>{bullet}</ListItem>
          ))}
        </UnorderedList>
      ) : null}
    </Box>
  );
};

function LearningActivityStatusShell({
  actionLabel = null,
  children = null,
  description,
  fileLabel = 'learning-activity.exe',
  onAction = null,
  status = 'info',
  statusLabel = null,
  title,
}) {
  const accent =
    status === 'error'
      ? 'var(--cg-accent-red)'
      : status === 'warning'
        ? 'var(--cg-accent-amber)'
        : 'var(--cg-accent-blue)';

  return (
    <PageTemplate>
      <Container maxW="container.md" py={{ base: 10, lg: 16 }}>
        <Box className="cg-panel-window" overflow="hidden">
          <Box
            className="cg-titlebar"
            px={{ base: 3, md: 4 }}
            py={2}
            display="flex"
            justifyContent="space-between"
            gap={3}
          >
            <Text fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
              {fileLabel}
            </Text>
            <Text fontSize="10px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
              {statusLabel || status}
            </Text>
          </Box>
          <Box p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.16)">
            <Box
              bg="var(--cg-window-face)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              p={{ base: 4, md: 5 }}
            >
              <VStack align="stretch" spacing={4}>
                <Heading
                  size="md"
                  color={accent}
                  fontFamily="var(--cg-font-retro-display)"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {title}
                </Heading>
                <Text color="var(--cg-text)" lineHeight="1.7">
                  {description}
                </Text>
                {children}
                {actionLabel ? (
                  <Button onClick={onAction} color="var(--cg-accent-blue)" alignSelf="flex-start">
                    {actionLabel}
                  </Button>
                ) : null}
              </VStack>
            </Box>
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  );
}

const formatCooldown = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'a moment';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export default function LearningPathActivity() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathSlug, nodeId } = useParams();
  const { pathData, loading: isPathLoading } = useLearningPathData(pathSlug);
  const { isAuthenticated } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const { syncMissionState } = useCityMissionSync();
  const prefersReducedMotion = usePrefersReducedMotion();
  const trackedSurfaceKeyRef = useRef(null);

  const [completedNodes, setCompletedNodes] = useState(() => new Set());
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [xpSummary, setXpSummary] = useState(null);
  const [xpAwards, setXpAwards] = useState([]);
  const [xpLevelUpInfo, setXpLevelUpInfo] = useState(null);
  const [dataPacketAward, setDataPacketAward] = useState(null);
  const [showDataPacketsAward, setShowDataPacketsAward] = useState(false);
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [showLearningAdModal, setShowLearningAdModal] = useState(false);
  const [selectedLearningAdType, setSelectedLearningAdType] = useState(null);
  const [isApplyingLearningAdCredit, setIsApplyingLearningAdCredit] = useState(false);
  const [learningGateActive, setLearningGateActive] = useState(false);

  const showLearningFetchToast = useCallback(
    (kind) => {
      const config = {
        rate_limit_status_failed: {
          id: 'learning-activity-rate-limit-failed',
          title: 'Learning access unavailable',
          description: 'We could not refresh learning access right now. Please try again.',
        },
        progress_load_failed: {
          id: 'learning-activity-progress-failed',
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

  const node = useMemo(
    () => pathData?.nodes?.find((item) => item.id === nodeId),
    [pathData, nodeId]
  );
  const moduleTitleById = useMemo(() => {
    const entries = [
      ...(Array.isArray(pathData?.modules) ? pathData.modules : []),
      ...(pathData?.capstone ? [pathData.capstone] : []),
    ]
      .filter(Boolean)
      .map((moduleItem) => [moduleItem.moduleId, moduleItem.title]);
    return new Map(entries);
  }, [pathData?.capstone, pathData?.modules]);

  useEffect(() => {
    if (!isAuthenticated || !pathData?.pathId || !node?.id) return;

    const key = `learning_activity:${pathData.pathId}:${node.id}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area: 'learning',
      surface: 'learning_activity',
      entrySource: 'learning_map',
      pathId: pathData.pathId,
      nodeId: node.id,
      ...(node.type ? { nodeType: node.type } : {}),
      ...(node.moduleId ? { moduleId: node.moduleId } : {}),
    });
  }, [isAuthenticated, node?.id, node?.moduleId, node?.type, pathData?.pathId]);

  useEffect(() => {
    if (!isAuthenticated || !pathData?.pathId || !node?.id) {
      setLearningGateActive(false);
      return undefined;
    }

    let isMounted = true;
    (async () => {
      try {
        const response = await api.learningPath.getRateLimit(pathData.pathId);
        if (!isMounted) return;
        const rateLimit = response?.rateLimit || null;
        setLearningRateLimit(rateLimit);
        const alreadyCompleted = completedNodes.has(node.id);
        if (!alreadyCompleted && rateLimit && !rateLimit.unlimited && rateLimit.remaining <= 0) {
          setLearningGateActive(true);
          setShowLearningAdModal(true);
        } else {
          setLearningGateActive(false);
        }
      } catch {
        if (isMounted) {
          setLearningGateActive(false);
          showLearningFetchToast('rate_limit_status_failed');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [completedNodes, isAuthenticated, node?.id, pathData?.pathId]);

  useEffect(() => {
    if (showLearningAdModal) {
      setSelectedLearningAdType(null);
    }
  }, [showLearningAdModal]);

  const computedCompletion = useMemo(
    () => computeCompletion(pathData, completedNodes),
    [completedNodes, pathData]
  );

  const moduleAvailability = useMemo(
    () => computeModuleAvailability(pathData, computedCompletion),
    [computedCompletion, pathData]
  );

  const status = useMemo(() => {
    if (!node || !pathData) return 'locked';
    return getNodeStatus(node, computedCompletion, moduleAvailability);
  }, [node, computedCompletion, moduleAvailability, pathData]);

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
    } else if (guestCtx?.progress?.lpNodesCompleted?.length) {
      // Guest: load LP progress from localStorage
      const seed = new Set(pathData.seedCompletedNodeIds || []);
      for (const nId of guestCtx.progress.lpNodesCompleted) {
        seed.add(nId);
      }
      setCompletedNodes(seed);
    }

    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    pathData?.pathId,
    pathData?.seedCompletedNodeIds,
    guestCtx?.progress?.lpNodesCompleted,
    showLearningFetchToast,
  ]);

  const learningPathSlug = pathSlug || pathData?.pathId || 'python-path';

  const getReturnPath = useCallback(() => {
    if (!node?.moduleId) return `/learning/${learningPathSlug}`;
    return `/learning/${learningPathSlug}?module=${encodeURIComponent(node.moduleId)}`;
  }, [learningPathSlug, node?.moduleId]);

  const learningNextNode = useMemo(
    () => getNextLearningNode(pathData, node?.id, node?.moduleId),
    [node?.id, node?.moduleId, pathData]
  );

  const buildLearningRoute = useCallback(
    (targetNode) => {
      if (!targetNode) return null;
      if (targetNode.type === LEARNING_NODE_TYPES.TOWER) {
        return `/learning/${learningPathSlug}/tower/${targetNode.id}`;
      }
      if (targetNode.type === LEARNING_NODE_TYPES.LEARN) {
        return `/learning/${learningPathSlug}/${targetNode.id}`;
      }
      if ([LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(targetNode.type)) {
        if (targetNode.type === LEARNING_NODE_TYPES.FINAL && targetNode.content?.isTowerDefense) {
          return `/learning/${learningPathSlug}/tower/${targetNode.id}`;
        }
        const slug = targetNode.content?.learningProblemSlug || null;
        if (slug) return `/learning/${learningPathSlug}/problems/${slug}`;
        return `/learning/${learningPathSlug}/${targetNode.id}`;
      }
      return `/learning/${learningPathSlug}`;
    },
    [learningPathSlug]
  );

  const learningNextRoute = useMemo(
    () => buildLearningRoute(learningNextNode),
    [buildLearningRoute, learningNextNode]
  );

  useEffect(() => {
    const routeMissionState = buildLearningMissionState({
      learningPathId: pathData?.pathId || learningPathSlug,
      moduleId: node?.moduleId || null,
      nextNodeId: learningNextNode?.id || null,
      nodeId: node?.id || nodeId,
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
    learningNextNode?.id,
    learningPathSlug,
    location.pathname,
    location.search,
    node?.id,
    node?.moduleId,
    nodeId,
    pathData?.nodes?.length,
    pathData?.pathId,
    syncMissionState,
  ]);

  const handleContinueLearning = useCallback(() => {
    setIsXpModalOpen(false);
    if (!learningNextNode || !learningNextRoute) {
      navigate(getReturnPath());
      return;
    }

    const nextLearningPath = {
      pathId: pathData?.pathId || learningPathSlug,
      nodeId: learningNextNode.id,
      moduleId: learningNextNode.moduleId || node?.moduleId || null,
    };

    const nextState = {
      learningMode: true,
      learningPath: nextLearningPath,
    };

    if (
      [LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(learningNextNode.type) &&
      learningNextNode.content?.learningProblemSlug &&
      !(
        learningNextNode.type === LEARNING_NODE_TYPES.FINAL &&
        learningNextNode.content?.isTowerDefense
      )
    ) {
      navigate(learningNextRoute, {
        state: {
          ...nextState,
          learningLanguage: pathData?.pathId || learningPathSlug,
        },
      });
      return;
    }

    navigate(learningNextRoute, { state: nextState });
  }, [
    getReturnPath,
    learningNextNode,
    learningNextRoute,
    learningPathSlug,
    navigate,
    node?.moduleId,
    pathData?.pathId,
  ]);

  const handleComplete = async () => {
    const markLocalCompletion = () => {
      setCompletedNodes((prev) => {
        const next = new Set(prev);
        next.add(node.id);
        return next;
      });
    };

    const openCompletionModal = (payload = null, rawDataPackets = null) => {
      const safeAwards = Array.isArray(payload?.awards) ? payload.awards : [];
      const totalAwardedXp = safeAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
      setXpSummary(payload?.summary || null);
      setXpAwards(safeAwards);
      setXpLevelUpInfo(payload?.levelUp || null);
      setDataPacketAward(
        normalizeDataPacketsPayload(rawDataPackets, {
          fallbackXpAmount: totalAwardedXp,
          fallbackIsExact: !isAuthenticated,
        })
      );
      setIsXpModalOpen(true);
    };

    if (!isAuthenticated) {
      const guestXpPreview = guestCtx?.getLearningNodeRewardPreview?.(node.id, {
        pathId: pathData?.pathId || learningPathSlug,
        nodeType: node?.type || null,
        nodeTitle: node?.label || node?.title || null,
        moduleId: node?.moduleId || null,
        moduleTitle: moduleTitleById.get(node?.moduleId) || null,
      });

      guestCtx?.recordLpNodeCompleted?.(node.id, {
        pathId: pathData?.pathId || learningPathSlug,
        nodeType: node?.type || null,
        nodeTitle: node?.label || node?.title || null,
        moduleId: node?.moduleId || null,
        moduleTitle: moduleTitleById.get(node?.moduleId) || null,
      });
      markLocalCompletion();
      openCompletionModal(guestXpPreview, null);
      return;
    }

    if (isAuthenticated) {
      const saved = await completeLearningPathNode(pathData.pathId, node.id);
      if (saved?.error === 'rate_limit') {
        const remaining = saved.rateLimit?.adCooldownRemaining || 0;
        setLearningRateLimit(saved.rateLimit || null);
        if (remaining > 0) {
          toast({
            title: 'Activity cooldown active',
            description: `Please wait ${formatCooldown(remaining)} before watching another ad.`,
            status: 'info',
            duration: 2800,
            isClosable: true,
          });
          return;
        }
        setShowLearningAdModal(true);
        return;
      }

      if (!saved) {
        toast({
          title: 'Progress not saved',
          description: 'We could not sync your learning path progress. Please try again.',
          status: 'warning',
          duration: 2200,
          isClosable: true,
        });
      }

      markLocalCompletion();
      openCompletionModal(saved?.xp || null, saved?.dataPackets || null);
      if (saved) {
        void trackUserContentEvent('user_learning_node_completed', {
          area: 'learning',
          surface: 'learning_activity',
          pathId: pathData.pathId,
          nodeId: node.id,
          ...(node.type ? { nodeType: node.type } : {}),
          ...(node.moduleId ? { moduleId: node.moduleId } : {}),
        });
      }
      return;
    }
  };

  const handleLearningAdComplete = useCallback(async () => {
    if (isApplyingLearningAdCredit) return;
    if (!pathData?.pathId) return;

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
        duration: 2400,
        isClosable: true,
      });
      setShowLearningAdModal(false);
    } catch (error) {
      const cooldownRemaining = error?.data?.rateLimit?.adCooldownRemaining || 0;
      if (error?.status === 429 && error?.data?.rateLimit) {
        setLearningRateLimit(error.data.rateLimit);
      }
      toast({
        title: 'Ad cooldown active',
        description:
          cooldownRemaining > 0
            ? `Please wait ${formatCooldown(cooldownRemaining)} before watching another ad.`
            : 'Please wait before watching another ad.',
        status: 'warning',
        duration: 2600,
        isClosable: true,
      });
    } finally {
      setIsApplyingLearningAdCredit(false);
    }
  }, [isApplyingLearningAdCredit, pathData?.pathId, selectedLearningAdType, toast]);

  const xpReasonLabels = {
    problem_solve: 'Problem Solve',
    problem_solve_repeat: 'Repeat Solve (25%)',
    ai_solve: 'AI Solve',
    ai_solve_repeat: 'Repeat AI Solve (25%)',
    daily_solve_bonus: 'Daily Solve Bonus',
    tower_defense_win: 'Tower Defense Win',
    tower_defense_repeat: 'Repeat Win (25%)',
    first_solve_ever: 'First Solve Ever',
    first_solve_day: 'First Solve of Day',
    daily_streak_bonus: 'Daily Streak Bonus',
    first_solve_easy: 'First Easy Solve',
    first_solve_medium: 'First Medium Solve',
    first_solve_hard: 'First Hard Solve',
    first_try_solve: 'First Try Solve',
    no_ai_assist: 'No AI Assist Bonus',
    speed_bonus: 'Speed Bonus',
    daily_challenge_complete: 'Daily Challenge Complete',
    weekly_challenge_complete: 'Weekly Challenge Complete',
    comeback_bonus: 'Comeback Bonus',
    perfect_run: 'Perfect Run',
    learning_path_node_complete: 'Learning Activity Complete',
    learning_path_node_repeat: 'Learning Activity Repeat',
  };

  const resolvedXpSummary = useMemo(() => {
    if (isAuthenticated) return xpSummary;
    const guestSummary = guestCtx?.xpSummary || null;
    if (!guestSummary) return xpSummary;
    if (!xpSummary) return guestSummary;
    const payloadXp = Number(xpSummary?.xp ?? NaN);
    const guestXp = Number(guestSummary?.xp ?? NaN);
    if (Number.isFinite(payloadXp) && Number.isFinite(guestXp)) {
      return guestXp >= payloadXp ? guestSummary : xpSummary;
    }
    return xpSummary || guestSummary;
  }, [guestCtx?.xpSummary, isAuthenticated, xpSummary]);

  const safeAwards = Array.isArray(xpAwards) ? xpAwards : [];
  const totalXpGained = safeAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
  const xpIntoLevel = Number(resolvedXpSummary?.xpIntoLevel ?? 0);
  const xpToNextLevel = Number(resolvedXpSummary?.xpToNextLevel ?? 0);
  const xpProgress =
    xpToNextLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)) : 0;

  const previousXpIntoLevel = Number(xpLevelUpInfo?.previousXpIntoLevel ?? 0);
  const previousXpToNextLevel = Number(xpLevelUpInfo?.previousXpToNextLevel ?? 0);
  const hasLevelUp = Boolean(xpLevelUpInfo?.newLevel && Number.isFinite(previousXpToNextLevel));
  const previousXpProgress =
    hasLevelUp && previousXpToNextLevel > 0
      ? Math.min(100, Math.round((previousXpIntoLevel / previousXpToNextLevel) * 100))
      : 0;

  const {
    animatedXpProgress,
    progressTransition,
    showLevelUpCelebration,
    levelUpEmphasisActive,
    displayLevel,
    displayRoleName,
    barFullGlow,
    barFlashActive,
    barShakeActive,
    animatedXpDisplay,
  } = useXpLevelUpAnimation({
    isOpen: isXpModalOpen,
    hasLevelUp,
    previousXpProgress,
    xpProgress,
    previousLevel: xpLevelUpInfo?.previousLevel || resolvedXpSummary?.level || 1,
    previousRoleName: xpLevelUpInfo?.previousRoleName || resolvedXpSummary?.roleName || 'Greenhorn',
    newLevel: xpLevelUpInfo?.newLevel || resolvedXpSummary?.level || 1,
    newRoleName: xpLevelUpInfo?.newRoleName || resolvedXpSummary?.roleName || 'Greenhorn',
    roleChanged: Boolean(xpLevelUpInfo?.roleChanged),
    xpGained: totalXpGained,
    prefersReducedMotion,
    previousXpIntoLevel,
    previousXpToNextLevel,
    currentXpIntoLevel: xpIntoLevel,
    currentXpToNextLevel: xpToNextLevel,
    currentXpRemaining: resolvedXpSummary ? Math.max(0, xpToNextLevel - xpIntoLevel) : null,
    hasXpData: Boolean(resolvedXpSummary),
  });

  useEffect(() => {
    if (!isXpModalOpen) return;
    audioService.initialize();
  }, [isXpModalOpen]);

  useEffect(() => {
    if (!isXpModalOpen || !dataPacketAward) {
      setShowDataPacketsAward(false);
      return undefined;
    }

    if (prefersReducedMotion) {
      setShowDataPacketsAward(true);
      return undefined;
    }

    const phase1Duration = hasLevelUp
      ? getProgressTransitionDuration({ fromPercent: previousXpProgress, toPercent: 100 })
      : 0;
    const phase2Duration = getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress });

    const revealDelay = hasLevelUp
      ? 1090 + phase1Duration + phase2Duration + 120
      : 140 + phase2Duration + 120;

    setShowDataPacketsAward(false);
    const timer = setTimeout(() => setShowDataPacketsAward(true), revealDelay);
    return () => clearTimeout(timer);
  }, [
    dataPacketAward,
    hasLevelUp,
    isXpModalOpen,
    prefersReducedMotion,
    previousXpProgress,
    xpProgress,
  ]);

  if (isPathLoading && !pathData) {
    return (
      <LearningActivityStatusShell
        status="info"
        statusLabel="Loading"
        title="Loading Learning Path"
        description="Fetching the latest lesson content and activity metadata."
      >
        <Box
          width="56px"
          height="56px"
          display="grid"
          placeItems="center"
          bg="var(--cg-window)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          color="var(--cg-accent-blue)"
        >
          <Spinner thickness="4px" speed="0.8s" color="currentColor" emptyColor="transparent" />
        </Box>
      </LearningActivityStatusShell>
    );
  }

  if (!pathData || !node) {
    return (
      <LearningActivityStatusShell
        status="error"
        statusLabel="Unavailable"
        title="Learning Path Not Found"
        description="This learning-path activity is not available yet."
        actionLabel="Back to map"
        onAction={() => navigate('/learning/python-path')}
      />
    );
  }

  if (learningGateActive) {
    return (
      <LearningActivityStatusShell
        status="warning"
        statusLabel="Rate Limit"
        title="Learning Limit Reached"
        description="Watch a sponsor ad to unlock more learning activities, or wait for the cooldown to reset."
        actionLabel="Back to map"
        onAction={() => navigate(getReturnPath())}
      >
        <AdModal
          isOpen={showLearningAdModal}
          onClose={() => setShowLearningAdModal(false)}
          onAdComplete={handleLearningAdComplete}
          title="Learning Path Sponsor"
          ctaLabel={`Unlock +${learningAdOptions[selectedLearningAdType || 'short']?.credits || 1} Credit`}
          footerText={
            learningRateLimit?.adCooldownRemaining
              ? `Ad cooldown: ${formatCooldown(learningRateLimit.adCooldownRemaining)}.`
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
      </LearningActivityStatusShell>
    );
  }

  return (
    <PageTemplate>
      <RetroPageShell
        mainMaxW="container.md"
        heroFileLabel="learning-activity.exe"
        heroTitle={node.label}
        heroSubtitle={node.description}
        heroMeta={pathData.title}
        heroActions={
          <BugReportButton
            pageType="learning-content"
            pageContext={{
              learningPathTitle: pathData.title,
              learningPathSlug,
              nodeId: node.id,
              nodeLabel: node.label,
              nodeType: node.type,
            }}
            clientState={{ status }}
            buttonProps={{
              size: 'sm',
              color: 'var(--cg-accent-blue)',
              width: { base: '100%', sm: 'auto' },
            }}
          />
        }
        topSlot={
          <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={60}>
            <Box width="100%" maxWidth="728px" mx="auto" mb={8} px={{ base: 4, md: 0 }}>
              <TopBannerAd slotId={adSlots.generic.top} />
            </Box>
          </AnimatedIn>
        }
        bottomSlot={
          <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={140}>
            <Box width="100%" maxWidth="728px" mx="auto" mt={10} px={{ base: 4, md: 0 }}>
              <BottomBannerAd slotId={adSlots.generic.bottom} />
            </Box>
          </AnimatedIn>
        }
      >
        {status === 'locked' ? (
          <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={180}>
            <RetroPanel
              fileLabel="status.log"
              title="Activity Locked"
              subtitle="Complete the prerequisite nodes first, then return to this lesson."
            >
              <Button onClick={() => navigate(getReturnPath())} color="var(--cg-accent-blue)">
                Back to map
              </Button>
            </RetroPanel>
          </AnimatedIn>
        ) : (
          <>
            {node.type === LEARNING_NODE_TYPES.LEARN && (
              <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={200}>
                <RetroPanel fileLabel="lesson.txt" title="Quick Lesson">
                  {node.content?.sections?.length ? (
                    node.content.sections.map((section, index) => (
                      <AnimatedIn
                        key={section.id || section.title}
                        prefersReducedMotion={prefersReducedMotion}
                        delay={240 + index * 90}
                      >
                        <LearningSection section={section} />
                      </AnimatedIn>
                    ))
                  ) : (
                    <>
                      <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={240}>
                        <UnorderedList
                          spacing={2}
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {(node.content?.body || []).map((line) => (
                            <ListItem key={line}>{line}</ListItem>
                          ))}
                        </UnorderedList>
                      </AnimatedIn>
                      <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={320}>
                        <LearningVisual visual={node.content?.visual} />
                      </AnimatedIn>
                    </>
                  )}
                </RetroPanel>
              </AnimatedIn>
            )}

            {[LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(node.type) &&
              !node.content?.isTowerDefense && (
                <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={220}>
                  <RetroPanel
                    fileLabel="workspace.txt"
                    title={node.content?.problem?.title || 'Workspace'}
                  >
                    <Text
                      color="var(--cg-text)"
                      fontFamily="var(--cg-font-retro-display)"
                      lineHeight="1.7"
                    >
                      {node.content?.problem?.prompt}
                    </Text>
                    {node.content?.problem?.constraints?.length ? (
                      <Box mt={4}>
                        <Text
                          fontSize="sm"
                          color="var(--cg-muted)"
                          fontFamily="var(--cg-font-retro-display)"
                          textTransform="uppercase"
                          letterSpacing="0.08em"
                        >
                          Constraints
                        </Text>
                        <UnorderedList
                          spacing={1}
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          mt={2}
                        >
                          {node.content.problem.constraints.map((item) => (
                            <ListItem key={item}>{item}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>
                    ) : null}
                    {node.content?.problem?.starterCode ? (
                      <RetroInset mt={4} p={3}>
                        <Text
                          fontSize="sm"
                          color="var(--cg-muted)"
                          fontFamily="var(--cg-font-retro-display)"
                          textTransform="uppercase"
                          letterSpacing="0.08em"
                        >
                          Starter Code
                        </Text>
                        <Text
                          mt={2}
                          whiteSpace="pre-wrap"
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="sm"
                        >
                          {node.content.problem.starterCode}
                        </Text>
                      </RetroInset>
                    ) : null}
                  </RetroPanel>
                </AnimatedIn>
              )}

            <AnimatedIn prefersReducedMotion={prefersReducedMotion} delay={360}>
              <RetroPanel
                fileLabel="actions.bat"
                title="Next Step"
                subtitle="Launch the next learning surface, record completion, or return to the map."
              >
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4} flexWrap="wrap">
                  {node.content?.learningProblemSlug &&
                    [LEARNING_NODE_TYPES.WORKSPACE, LEARNING_NODE_TYPES.FINAL].includes(
                      node.type
                    ) &&
                    !node.content?.isTowerDefense && (
                      <Button
                        color="var(--cg-accent-blue)"
                        onClick={() =>
                          navigate(
                            `/learning/${pathSlug || pathData?.pathId || 'python-path'}/problems/${node.content.learningProblemSlug}`,
                            {
                              state: {
                                learningMode: true,
                                learningLanguage: pathSlug || pathData?.pathId || 'python-path',
                                learningPath: {
                                  pathId: pathData.pathId,
                                  nodeId: node.id,
                                  moduleId: node.moduleId,
                                },
                              },
                            }
                          )
                        }
                      >
                        Launch workspace →
                      </Button>
                    )}
                  {node.type === LEARNING_NODE_TYPES.FINAL && node.content?.isTowerDefense && (
                    <Button
                      color="var(--cg-accent-blue)"
                      onClick={() =>
                        navigate(
                          `/learning/${pathSlug || pathData?.pathId || 'python-path'}/tower/${node.id}`
                        )
                      }
                    >
                      Launch tower defense →
                    </Button>
                  )}
                  <Button color="var(--cg-accent-green)" onClick={handleComplete}>
                    Mark complete
                  </Button>
                  <Button color="var(--cg-muted)" onClick={() => navigate(getReturnPath())}>
                    Back to map
                  </Button>
                </Stack>
              </RetroPanel>
            </AnimatedIn>
          </>
        )}
      </RetroPageShell>

      <Modal
        isOpen={isXpModalOpen}
        onClose={() => {
          setIsXpModalOpen(false);
          navigate(getReturnPath());
        }}
        size="lg"
      >
        <ModalOverlay backdropFilter="blur(2px)" bg="rgba(9, 18, 34, 0.32)" />
        <ModalContent
          className="cg-panel-window"
          bg="#d4d0c8"
          borderRadius="0"
          color="#1f2430"
          overflow="hidden"
          maxW={{ base: '96vw', md: '620px' }}
        >
          <ModalHeader className="cg-titlebar" py={2} px={{ base: 3, md: 4 }}>
            <Text
              color="#f5f7ff"
              fontSize="xs"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.08em"
              textAlign="center"
            >
              activity_complete.exe
            </Text>
          </ModalHeader>
          <ModalBody px={{ base: 3, md: 6 }} bg="#d4d0c8">
            <VStack spacing={{ base: 3, md: 4 }} align="stretch" py={{ base: 2, md: 3 }}>
              <Box
                p={{ base: 3, md: 4 }}
                bg="#efebe7"
                borderRadius="0"
                border="2px solid #5d636e"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
              >
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {node?.label || node?.title || 'Learning Step'}
                </Text>
                <Text
                  mt={2}
                  color="#1f2430"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="sm"
                >
                  Great work! This learning activity is now complete.
                </Text>
                {learningNextNode ? (
                  <Text
                    mt={3}
                    color="#0f6f17"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="sm"
                  >
                    Next up:{' '}
                    {learningNextNode.label || learningNextNode.title || learningNextNode.id}
                  </Text>
                ) : (
                  <Text
                    mt={3}
                    color="#4a5160"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="sm"
                  >
                    You&apos;re at the end of this path segment.
                  </Text>
                )}
              </Box>

              <Box
                order={{ base: -1, md: 0 }}
                p={{ base: 3, md: 4 }}
                bg="#efebe7"
                borderRadius="0"
                border="2px solid #5d636e"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
              >
                <Text
                  fontWeight="700"
                  mb={2}
                  color="#0a2c9a"
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  textAlign={{ base: 'center', md: 'left' }}
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  XP Sync Report:
                </Text>
                <Text
                  color="#0f6f17"
                  fontWeight="700"
                  fontSize={{ base: 'xl', md: 'lg' }}
                  textAlign={{ base: 'center', md: 'left' }}
                  mb={3}
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                >
                  +{totalXpGained} XP
                </Text>
                <VStack spacing={2} align="stretch">
                  {resolvedXpSummary ? (
                    <XpProgressBar
                      animatedXpProgress={animatedXpProgress}
                      progressTransition={progressTransition}
                      barFullGlow={barFullGlow}
                      barFlashActive={barFlashActive}
                      barShakeActive={barShakeActive}
                      showLevelUpCelebration={showLevelUpCelebration}
                      levelUpEmphasisActive={levelUpEmphasisActive}
                      displayLevel={displayLevel}
                      displayRoleName={displayRoleName}
                      animatedXpDisplay={animatedXpDisplay}
                      newLevel={xpLevelUpInfo?.newLevel}
                      newRoleName={xpLevelUpInfo?.newRoleName}
                      roleChanged={Boolean(xpLevelUpInfo?.roleChanged)}
                      totalXpGained={totalXpGained}
                      prefersReducedMotion={prefersReducedMotion}
                      theme="retro-desktop"
                    />
                  ) : (
                    <Text
                      color="#4a5160"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      No XP awarded for this activity.
                    </Text>
                  )}

                  {safeAwards.length > 0 &&
                    safeAwards.map((award, index) => (
                      <HStack
                        key={`${award?.reason || 'xp'}-${index}`}
                        justify="space-between"
                        align={{ base: 'flex-start', sm: 'center' }}
                        direction={{ base: 'column', sm: 'row' }}
                        spacing={{ base: 1, sm: 2 }}
                        p={2}
                        bg="#d4d0c8"
                        borderRadius="0"
                        border="1px solid #7f7f7f"
                        boxShadow="var(--cg-window-inset)"
                      >
                        <Text
                          color="#1f2430"
                          fontSize="sm"
                          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                        >
                          {xpReasonLabels[award?.reason] || award?.reason || 'XP Award'}
                        </Text>
                        <Text
                          color="#0f6f17"
                          fontWeight="700"
                          fontSize="sm"
                          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                        >
                          +{award?.amount || 0} XP
                        </Text>
                      </HStack>
                    ))}
                </VStack>

                {showDataPacketsAward && (
                  <Box mt={3}>
                    <DataPacketsEarnedBadge dataPackets={dataPacketAward} theme="retro-desktop" />
                  </Box>
                )}
              </Box>

              <Box
                p={3}
                bg="#efebe7"
                borderRadius="0"
                border="2px solid #5d636e"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
              >
                <SocialShareButtons
                  url={window.location.href}
                  text={`I just completed "${node?.label || node?.title || 'a learning activity'}" on CodeGrind! 🎓 #CodeGrind #coding`}
                  label="Share your progress"
                  surface="learning_activity_success"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter
            bg="#d4d0c8"
            justifyContent="center"
            gap={3}
            py={3}
            flexDirection={{ base: 'column', sm: 'row' }}
          >
            <Button
              bg="#d4d0c8"
              color="#0a2c9a"
              border="1px solid #7f7f7f"
              borderRadius="0"
              boxShadow="var(--cg-window-outset)"
              _hover={{ bg: '#efebe7', color: '#0a2c9a' }}
              _active={{ boxShadow: 'var(--cg-window-inset)', transform: 'translateY(1px)' }}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.06em"
              onClick={() => {
                setIsXpModalOpen(false);
                navigate(getReturnPath());
              }}
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              Back to Map
            </Button>
            <Button
              bg="#d4d0c8"
              color="#0f6f17"
              border="1px solid #7f7f7f"
              borderRadius="0"
              boxShadow="var(--cg-window-outset)"
              _hover={{ bg: '#efebe7', color: '#0f6f17' }}
              _active={{ boxShadow: 'var(--cg-window-inset)', transform: 'translateY(1px)' }}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.06em"
              onClick={handleContinueLearning}
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              {learningNextNode ? 'Continue' : 'Back to Map'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AdModal
        isOpen={showLearningAdModal}
        onClose={() => setShowLearningAdModal(false)}
        onAdComplete={handleLearningAdComplete}
        title="Learning Path Sponsor"
        ctaLabel={`Unlock +${learningAdOptions[selectedLearningAdType || 'short']?.credits || 1} Credit`}
        footerText={
          learningRateLimit?.adCooldownRemaining
            ? `Ad cooldown: ${formatCooldown(learningRateLimit.adCooldownRemaining)}.`
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
