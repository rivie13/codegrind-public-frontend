import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Container, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import PageTemplate from '../../components/layout/PageTemplate';
import AdModal from '../../components/towerDefense/AdModal';
import TowerDefenseV2 from '../games/towerDefenseV2/TowerDefenseV2Page';
import { LEARNING_NODE_TYPES } from '../../data/learningPathRegistry';
import useLearningPathData from '../../hooks/useLearningPathData';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { api } from '../../services/api';
import { trackUserContentEvent } from '../../services/userContentEventService';
import {
  HOMEPAGE_DEMO_ONBOARDING_COMPLETE_KEY,
  TD_FOUNDATION_ONBOARDING_COMPLETE_KEY,
} from '../../components/towerDefense/onboarding/onboardingStorageKeys';
import { loadLearningPathProgress } from '../../utils/learning/learningPathProgress';
import {
  computeCompletion,
  computeModuleAvailability,
  getNodeStatus,
} from '../../utils/learning/learningPathStatus.js';

const STATUS_TONES = {
  info: {
    accent: 'var(--cg-accent-blue)',
  },
  warning: {
    accent: 'var(--cg-accent-amber)',
  },
  error: {
    accent: 'var(--cg-accent-red)',
  },
};

function LearningMissionStatusShell({
  actionLabel = null,
  children = null,
  description,
  fileLabel = 'learning-td.exe',
  onAction = null,
  status = 'info',
  statusLabel = null,
  title,
}) {
  const tone = STATUS_TONES[status] || STATUS_TONES.info;

  return (
    <PageTemplate>
      <Container maxW="container.md" py={{ base: 10, lg: 16 }}>
        <Box className="cg-panel-window" overflow="hidden">
          <Box
            className="cg-titlebar"
            px={{ base: 3, md: 4 }}
            py={2}
            display="flex"
            alignItems="center"
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
              px={{ base: 4, md: 5 }}
              py={{ base: 4, md: 5 }}
            >
              <VStack align="stretch" spacing={4}>
                <Heading
                  size="md"
                  color={tone.accent}
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

export default function LearningPathTowerDefense({ pathSlug: pathSlugProp, nodeId: nodeIdProp }) {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const guestCtx = useGuestProgressCtx();
  const trackedSurfaceKeyRef = useRef(null);
  const rawPathSlug = pathSlugProp || params.pathSlug;
  const pathSlug = useMemo(() => rawPathSlug, [rawPathSlug]);
  const nodeId = nodeIdProp || params.nodeId;

  // Mission 1 (Hello Print) now lives on the home page as the shared demo.
  // Redirect direct URL access to the home page.
  useEffect(() => {
    if (nodeId === 'py-m0-tower-hello') {
      navigate('/', { replace: true });
    }
  }, [nodeId, navigate]);

  const { pathData, loading: isPathLoading } = useLearningPathData(pathSlug);
  const node = useMemo(
    () => pathData?.nodes?.find((item) => item.id === nodeId),
    [pathData, nodeId]
  );
  const moduleTitle = useMemo(() => {
    if (!node?.moduleId) return null;
    const allModules = [
      ...(Array.isArray(pathData?.modules) ? pathData.modules : []),
      ...(pathData?.capstone ? [pathData.capstone] : []),
    ];
    const matched = allModules.find((moduleItem) => moduleItem?.moduleId === node.moduleId);
    return matched?.title || null;
  }, [node?.moduleId, pathData?.capstone, pathData?.modules]);

  const towerConfig = node?.content?.towerConfig || null;
  const onboardingId = towerConfig?.onboardingId || null;
  const hasCompletedFoundationOnboarding = useMemo(() => {
    if (typeof window === 'undefined') return false;

    try {
      return (
        window.localStorage.getItem(TD_FOUNDATION_ONBOARDING_COMPLETE_KEY) === '1' ||
        window.localStorage.getItem(HOMEPAGE_DEMO_ONBOARDING_COMPLETE_KEY) === '1'
      );
    } catch {
      return false;
    }
  }, []);
  const learningProblemSlug =
    node?.content?.learningProblemSlug ||
    towerConfig?.learningProblemSlug ||
    (Array.isArray(towerConfig?.learningProblemSlugs)
      ? towerConfig.learningProblemSlugs[0]
      : null) ||
    null;
  const inferredModuleZeroOnboardingId = useMemo(() => {
    const normalizedSlug = String(learningProblemSlug || '')
      .trim()
      .toLowerCase();
    if (!normalizedSlug) return null;

    if (normalizedSlug.includes('-m0-td-hello-print')) {
      return 'lp-m0-hello-brief';
    }

    if (normalizedSlug.includes('-m0-td-addition')) {
      return 'lp-m0-addition';
    }

    if (normalizedSlug.includes('-m0-td-variables')) {
      return 'lp-m0-variables';
    }

    return null;
  }, [learningProblemSlug]);

  const effectiveOnboardingId = useMemo(() => {
    const baseOnboardingId = onboardingId || inferredModuleZeroOnboardingId;
    if (!baseOnboardingId) return null;

    const isModuleZeroOnboarding =
      typeof baseOnboardingId === 'string' && baseOnboardingId.startsWith('lp-m0-');

    if (!hasCompletedFoundationOnboarding || !isModuleZeroOnboarding) {
      return baseOnboardingId;
    }

    if (baseOnboardingId.endsWith('-brief')) {
      return baseOnboardingId;
    }

    if (baseOnboardingId === 'lp-m0-onboarding') {
      return 'lp-m0-hello-brief';
    }

    if (baseOnboardingId === 'lp-m0-addition') {
      return 'lp-m0-addition-brief';
    }

    if (baseOnboardingId === 'lp-m0-variables') {
      return 'lp-m0-variables-brief';
    }

    const normalizedSlug = String(learningProblemSlug || '')
      .trim()
      .toLowerCase();

    if (normalizedSlug.includes('-m0-td-hello-print')) {
      return 'lp-m0-hello-brief';
    }

    if (normalizedSlug.includes('-m0-td-addition')) {
      return 'lp-m0-addition-brief';
    }

    if (normalizedSlug.includes('-m0-td-variables')) {
      return 'lp-m0-variables-brief';
    }

    return 'lp-m0-hello-brief';
  }, [
    hasCompletedFoundationOnboarding,
    inferredModuleZeroOnboardingId,
    learningProblemSlug,
    onboardingId,
  ]);

  const shouldEnableLearningPathOnboarding =
    Boolean(effectiveOnboardingId) && !user?.onboardingComplete;
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [showLearningAdModal, setShowLearningAdModal] = useState(false);
  const [selectedLearningAdType, setSelectedLearningAdType] = useState(null);
  const [isApplyingLearningAdCredit, setIsApplyingLearningAdCredit] = useState(false);
  const [learningGateActive, setLearningGateActive] = useState(false);
  const [completedNodes, setCompletedNodes] = useState(() => new Set());
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const learningAdOptions = useMemo(
    () => ({
      short: { label: 'Short (+1)', credits: 1 },
      medium: { label: 'Medium (+3)', credits: 3 },
      long: { label: 'Long (+5)', credits: 5 },
    }),
    []
  );
  const isAuthenticated = Boolean(user?.id);

  useEffect(() => {
    if (!isAuthenticated || !pathData?.pathId || !node?.id) return;

    const key = `learning_td:${pathData.pathId}:${node.id}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area: 'learning',
      surface: 'learning_td',
      entrySource: 'learning_map',
      pathId: pathData.pathId,
      nodeId: node.id,
      ...(node.moduleId ? { moduleId: node.moduleId } : {}),
      ...(learningProblemSlug ? { problemSlug: learningProblemSlug } : {}),
    });
  }, [isAuthenticated, learningProblemSlug, node?.id, node?.moduleId, pathData?.pathId]);

  useEffect(() => {
    if (!pathData?.pathId) {
      setCompletedNodes(new Set());
      setIsProgressLoading(false);
      return;
    }

    let isMounted = true;
    setIsProgressLoading(true);

    (async () => {
      try {
        if (isAuthenticated) {
          const loaded = await loadLearningPathProgress(
            pathData.pathId,
            pathData.seedCompletedNodeIds,
            pathData
          );
          if (isMounted) {
            setCompletedNodes(loaded);
          }
          return;
        }

        const seed = new Set(pathData.seedCompletedNodeIds || []);
        const guestCompletedNodes = Array.isArray(guestCtx?.progress?.lpNodesCompleted)
          ? guestCtx.progress.lpNodesCompleted
          : [];
        for (const completedId of guestCompletedNodes) {
          if (completedId) seed.add(completedId);
        }
        if (isMounted) {
          setCompletedNodes(seed);
        }
      } finally {
        if (isMounted) {
          setIsProgressLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [guestCtx?.progress?.lpNodesCompleted, isAuthenticated, pathData]);

  const completion = useMemo(
    () => computeCompletion(pathData, completedNodes),
    [completedNodes, pathData]
  );

  const moduleAvailability = useMemo(
    () => computeModuleAvailability(pathData, completion),
    [completion, pathData]
  );

  const nodeStatus = useMemo(() => {
    if (!node || !pathData || isProgressLoading) return null;
    return getNodeStatus(node, completion, moduleAvailability);
  }, [completion, isProgressLoading, moduleAvailability, node, pathData]);

  useEffect(() => {
    if (!user?.id || !pathData?.pathId || !node?.id) {
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
        if (rateLimit && !rateLimit.unlimited && rateLimit.remaining <= 0) {
          setLearningGateActive(true);
          setShowLearningAdModal(true);
        } else {
          setLearningGateActive(false);
        }
      } catch {
        if (isMounted) setLearningGateActive(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [node?.id, pathData?.pathId, user?.id]);

  useEffect(() => {
    if (showLearningAdModal) {
      setSelectedLearningAdType(null);
    }
  }, [showLearningAdModal]);

  const handleLearningAdComplete = useCallback(async () => {
    if (isApplyingLearningAdCredit || !pathData?.pathId) return;
    setIsApplyingLearningAdCredit(true);
    try {
      const response = await api.learningPath.watchAd(
        pathData.pathId,
        selectedLearningAdType || 'short'
      );
      setLearningRateLimit(response?.rateLimit || null);
      setLearningGateActive(false);
      setShowLearningAdModal(false);
    } finally {
      setIsApplyingLearningAdCredit(false);
    }
  }, [isApplyingLearningAdCredit, pathData?.pathId, selectedLearningAdType]);

  if (isPathLoading || !pathData) {
    return (
      <LearningMissionStatusShell
        fileLabel="learning-td.exe"
        status="info"
        statusLabel="Loading"
        title="Loading Mission"
        description="Fetching the latest tower-defense lesson content and mission configuration."
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
      </LearningMissionStatusShell>
    );
  }

  const isTowerNode = node?.type === LEARNING_NODE_TYPES.TOWER;
  const isTowerFinal = node?.type === LEARNING_NODE_TYPES.FINAL && node?.content?.isTowerDefense;

  if (!node || (!isTowerNode && !isTowerFinal) || !towerConfig || !learningProblemSlug) {
    return (
      <LearningMissionStatusShell
        fileLabel="learning-td.exe"
        status="error"
        statusLabel="Unavailable"
        title="Tower Defense Node Not Found"
        description="This tower-defense lesson is not available yet for the selected learning path."
        actionLabel="Back To Map"
        onAction={() => navigate('/learning/python-path')}
      />
    );
  }

  if (!isProgressLoading && nodeStatus === 'locked') {
    return (
      <LearningMissionStatusShell
        fileLabel="learning-td.exe"
        status="warning"
        statusLabel="Locked"
        title="Learning Path Step Locked"
        description="Complete the required earlier learning-path steps before opening this tower-defense mission."
        actionLabel="Back To Map"
        onAction={() => navigate(`/learning/${pathSlug}`)}
      />
    );
  }

  if (learningGateActive) {
    return (
      <LearningMissionStatusShell
        fileLabel="learning-td.exe"
        status="warning"
        statusLabel="Rate Limit"
        title="Learning Limit Reached"
        description="Watch a sponsor ad to unlock more learning activities, or wait for the cooldown to reset."
        actionLabel="Back To Map"
        onAction={() => navigate(`/learning/${pathSlug}`)}
      >
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
      </LearningMissionStatusShell>
    );
  }

  const isCapstoneActivity =
    pathData?.capstone?.moduleId && node?.moduleId
      ? pathData.capstone.moduleId === node.moduleId
      : false;

  const learningTowerConfig = {
    ...towerConfig,
    learningProblemSlug,
    learningProblemSlugs: towerConfig?.learningProblemSlugs,
    conceptIntro: node?.content?.conceptIntro || null,
    onboardingId: shouldEnableLearningPathOnboarding ? effectiveOnboardingId : null,
  };

  return (
    <Box minH="100vh">
      <TowerDefenseV2
        key={`${pathSlug || 'learning'}:${node.id}`}
        learningPathTitleSlug={learningProblemSlug}
        learningPathOnboarding={shouldEnableLearningPathOnboarding}
        learningTowerConfig={learningTowerConfig}
        learningPathSlug={pathSlug}
        learningIsCapstone={isCapstoneActivity}
        learningPathMeta={{
          pathId: pathData.pathId,
          nodeId: node.id,
          moduleId: node.moduleId,
          nodeType: node.type,
          nodeTitle: node.label || node.title || null,
          moduleTitle,
        }}
      />
    </Box>
  );
}
