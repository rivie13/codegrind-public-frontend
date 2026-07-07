/**
 * ClusterMap.jsx -- Unified cluster map + detail page.
 *
 * Handles BOTH routes:
 *   /games/clusters              -> macro grid
 *   /games/clusters/:clusterId   -> zoomed-in detail
 *
 * CyberGrid renders everything on a single canvas with a camera zoom system.
 * This page manages: collection selection, problem meta fetching, guest state,
 * URL synchronisation (replaceState), and routing to the problem solver.
 */

import { Box, Button, Flex, Select, Text, VStack } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CyberGrid from '../../components/cyberGrid/CyberGrid';
import GuestSignupWall from '../../components/guest/GuestSignupWall';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import useCityMissionSync from '../../hooks/city/useCityMissionSync';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import CLUSTER_COLLECTIONS, { DEFAULT_COLLECTION_ID } from '../../data/clusterCollections';
import { api } from '../../services/api';
import { trackUserContentEvent } from '../../services/userContentEventService';
import {
  canLockScreenOrientation,
  releaseScreenOrientation,
  requestScreenOrientation,
} from '../../utils/mobile/screenOrientation';
import { buildClusterNavigationState } from '../../utils/navigation/clusterNavigation';
import {
  CLUSTER_SHELL_VISIBILITY_EVENT,
  readClusterShellVisible,
} from '../../utils/ui/clusterShellVisibility';
import {
  buildClusterMissionState,
  buildPathWithSearch,
} from '../../utils/navigation/cityStoryState';
import {
  MOBILE_SHELL_VISIBILITY_EVENT,
  readMobileShellVisible,
} from '../../utils/ui/mobileShellVisibility';

const CUSTOM_PROBLEM_META = {
  'hello-world': { slug: 'hello-world', title: 'Hello World', difficulty: 'Easy' },
};

const SUPPORTED_SCORE_SOURCES = new Set(['CODEGRIND', 'LEETCODE']);

const detectLandscapeViewport = () => {
  if (typeof window === 'undefined') return true;

  const orientationType = window.screen?.orientation?.type;
  if (typeof orientationType === 'string') {
    if (orientationType.includes('landscape')) return true;
    if (orientationType.includes('portrait')) return false;
  }

  return window.innerWidth >= window.innerHeight;
};

function getProblemType(meta) {
  const normalizedSource = typeof meta?.source === 'string' ? meta.source.toUpperCase() : null;
  return SUPPORTED_SCORE_SOURCES.has(normalizedSource) ? normalizedSource : null;
}

function getScoreLookupIds(meta) {
  const lookupIds = [];

  if (Number.isInteger(meta?.id) && meta.id > 0) {
    lookupIds.push(meta.id);
  }

  const parsedQuestionId = Number.parseInt(meta?.questionId, 10);
  if (Number.isInteger(parsedQuestionId) && parsedQuestionId > 0) {
    lookupIds.push(parsedQuestionId);
  }

  return [...new Set(lookupIds)];
}

function pickScoreRecord(scoresById, lookupIds) {
  if (!scoresById || !Array.isArray(lookupIds)) return null;

  for (const lookupId of lookupIds) {
    const directMatch = scoresById[lookupId] ?? scoresById[String(lookupId)];
    if (directMatch) return directMatch;
  }

  return null;
}

export default function ClusterMap() {
  const { isAuthenticated, user } = useAuth();
  const guest = useGuestProgressCtx();
  const { syncMissionState } = useCityMissionSync();
  const location = useLocation();
  const navigate = useNavigate();
  const { clusterId: routeClusterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const collectionId = searchParams.get('collection') || DEFAULT_COLLECTION_ID;

  const selectedCollection = useMemo(
    () => CLUSTER_COLLECTIONS.find((c) => c.id === collectionId) || CLUSTER_COLLECTIONS[0],
    [collectionId]
  );

  /* ── Focused cluster + problem metas ──────────────────────── */
  const [focusedClusterId, setFocusedClusterId] = useState(routeClusterId || null);
  const [problemMetas, setProblemMetas] = useState([]);
  const [problemModeStatusBySlug, setProblemModeStatusBySlug] = useState({});
  const [isGuestSignupWallOpen, setIsGuestSignupWallOpen] = useState(false);
  const trackedSurfaceKeyRef = useRef(null);
  const isProTrialLocked = !isAuthenticated && Boolean(guest?.isProTrialLocked);
  const isMobileDevice = useIsMobileDevice();
  const [isMapOverlayHidden, setIsMapOverlayHidden] = useState(() => isMobileDevice);
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => detectLandscapeViewport());
  const [isClusterShellVisible, setIsClusterShellVisible] = useState(() =>
    readClusterShellVisible()
  );
  const [isMobileShellVisible, setIsMobileShellVisible] = useState(() => readMobileShellVisible());
  const canAutoLockOrientation = canLockScreenOrientation();
  const showRotateLandscapeGuard = isMobileDevice && !isLandscapeViewport;

  const focusedCluster = useMemo(
    () => selectedCollection.clusters.find((c) => c.id === focusedClusterId),
    [selectedCollection, focusedClusterId]
  );

  const clusterMissionSolvedCount = useMemo(() => {
    if (!focusedCluster) {
      return null;
    }

    if (isAuthenticated) {
      return focusedCluster.slugs.reduce((count, slug) => {
        const status = problemModeStatusBySlug?.[slug];
        const isSolved = Boolean(status?.workspace?.completed || status?.td?.completed);
        return isSolved ? count + 1 : count;
      }, 0);
    }

    const solvedSlugs = Array.isArray(guest?.progress?.problemsSolved)
      ? guest.progress.problemsSolved
      : [];
    const solvedSlugSet = new Set(solvedSlugs);
    return focusedCluster.slugs.reduce(
      (count, slug) => (solvedSlugSet.has(slug) ? count + 1 : count),
      0
    );
  }, [focusedCluster, guest?.progress?.problemsSolved, isAuthenticated, problemModeStatusBySlug]);

  useEffect(() => {
    const routeMissionState = buildClusterMissionState({
      clusterId: focusedCluster?.id || null,
      collectionId: selectedCollection.id,
      resumePath: buildPathWithSearch(location.pathname, location.search),
      solvedCount: clusterMissionSolvedCount,
      totalCount: focusedCluster?.slugs?.length ?? null,
    });

    if (!routeMissionState) {
      return;
    }

    void syncMissionState({
      progressSummary:
        focusedCluster && clusterMissionSolvedCount != null
          ? {
              clusterFreeProblemsRemaining: Math.max(
                0,
                focusedCluster.slugs.length - clusterMissionSolvedCount
              ),
              clusterTrialProblemLimit: focusedCluster.slugs.length,
              clusterTrialSolvedCount: clusterMissionSolvedCount,
              problemsSolvedCount: clusterMissionSolvedCount,
            }
          : null,
      routeMissionState,
    });
  }, [
    clusterMissionSolvedCount,
    focusedCluster,
    location.pathname,
    location.search,
    selectedCollection.id,
    syncMissionState,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const activeClusterId = routeClusterId || focusedClusterId || '';
    const surface = activeClusterId ? 'cluster_detail' : 'cluster_map';
    const key = `${surface}:${selectedCollection.id}:${activeClusterId}`;
    if (trackedSurfaceKeyRef.current === key) return;

    trackedSurfaceKeyRef.current = key;
    void trackUserContentEvent('user_content_surface_opened', {
      area: 'interview',
      surface,
      entrySource: activeClusterId ? 'cluster_map' : 'direct',
      collectionId: selectedCollection.id,
      ...(activeClusterId ? { clusterId: activeClusterId } : {}),
    });
  }, [focusedClusterId, isAuthenticated, routeClusterId, selectedCollection.id]);

  // Fetch problem metas when a cluster is focused
  useEffect(() => {
    if (!focusedCluster) {
      setProblemMetas((previous) => (previous.length > 0 ? [] : previous));
      return;
    }
    let cancelled = false;

    async function fetchMetas() {
      try {
        const res = await api.problems.lookupBySlugs(focusedCluster.slugs);
        if (!cancelled && res?.problems) {
          const apiMetas = res.problems.map((p) => ({
            id: p.id,
            slug: p.titleSlug,
            title: p.title,
            questionId: p.questionId,
            difficulty: p.difficulty,
            source: p.source,
            referenceName:
              p?.metadata?.referenceName || p?.metaData?.referenceName || p?.referenceName || null,
            referenceSlug:
              p?.metadata?.referenceSlug || p?.metaData?.referenceSlug || p?.referenceSlug || null,
          }));

          // Merge in hardcoded metas for slugs missing from API
          const apiSlugs = new Set(apiMetas.map((m) => m.slug));
          for (const s of focusedCluster.slugs) {
            if (!apiSlugs.has(s) && CUSTOM_PROBLEM_META[s]) {
              apiMetas.push(CUSTOM_PROBLEM_META[s]);
            }
          }

          setProblemMetas(apiMetas);
        }
      } catch {
        // Fallback to slug-based titles
      }
    }

    fetchMetas();
    return () => {
      cancelled = true;
    };
  }, [focusedCluster]);

  useEffect(() => {
    if (!focusedCluster || !isAuthenticated || !user?.id || problemMetas.length === 0) {
      setProblemModeStatusBySlug((previous) => (Object.keys(previous).length > 0 ? {} : previous));
      return;
    }

    let cancelled = false;

    async function fetchProblemModeStatus() {
      const groupedMetas = new Map();

      for (const meta of problemMetas) {
        const problemType = getProblemType(meta);
        const lookupIds = getScoreLookupIds(meta);

        if (!problemType || lookupIds.length === 0 || !meta?.slug) {
          continue;
        }

        const existingGroup = groupedMetas.get(problemType) || {
          problemType,
          metas: [],
          lookupIds: new Set(),
        };

        existingGroup.metas.push({ ...meta, lookupIds });
        lookupIds.forEach((lookupId) => existingGroup.lookupIds.add(lookupId));
        groupedMetas.set(problemType, existingGroup);
      }

      const nextStatusBySlug = {};

      await Promise.all(
        Array.from(groupedMetas.values()).map(async ({ problemType, metas, lookupIds }) => {
          try {
            const [workspaceResponse, tdResponse] = await Promise.all([
              api.scores.getBulk(user.id, Array.from(lookupIds), problemType),
              api.towerDefense.getScoresBulk(user.id, Array.from(lookupIds), problemType),
            ]);

            const workspaceScores = workspaceResponse?.scores || {};
            const towerDefenseScores = tdResponse?.scores || {};

            for (const meta of metas) {
              const workspaceScore = pickScoreRecord(workspaceScores, meta.lookupIds);
              const towerDefenseScore = pickScoreRecord(towerDefenseScores, meta.lookupIds);

              nextStatusBySlug[meta.slug] = {
                workspace: {
                  attempted: Boolean(workspaceScore),
                  completed: Boolean(
                    workspaceScore &&
                    ((workspaceScore.highScore || 0) > 0 || (workspaceScore.bestTime || 0) > 0)
                  ),
                  highScore: workspaceScore?.highScore || 0,
                  bestTime: workspaceScore?.bestTime || 0,
                },
                td: {
                  attempted: Boolean(towerDefenseScore),
                  completed: Boolean(
                    towerDefenseScore &&
                    (towerDefenseScore.solutionStatus || towerDefenseScore.gameStatus)
                  ),
                  score: towerDefenseScore?.score || 0,
                  bestTime: towerDefenseScore?.bestTime || 0,
                  solutionStatus: Boolean(towerDefenseScore?.solutionStatus),
                  gameStatus: Boolean(towerDefenseScore?.gameStatus),
                  endlessScore: towerDefenseScore?.endlessScore || 0,
                },
              };
            }
          } catch {
            // Leave per-mode details empty when score lookups fail.
          }
        })
      );

      if (!cancelled) {
        setProblemModeStatusBySlug(nextStatusBySlug);
      }
    }

    void fetchProblemModeStatus();

    return () => {
      cancelled = true;
    };
  }, [focusedCluster, isAuthenticated, problemMetas, user?.id]);

  // Record guest cluster browse
  useEffect(() => {
    if (!isAuthenticated && focusedCluster && guest) {
      guest.recordClusterBrowsed(focusedCluster.id);
    }
  }, [focusedCluster, isAuthenticated, guest]);

  /* ── Solved slugs (guest + auth) ──────────────────────────── */
  const [authSolvedSlugs, setAuthSolvedSlugs] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let cancelled = false;

    api.submissions
      .getSolvedSlugs(user.id)
      .then((slugs) => {
        if (!cancelled) setAuthSolvedSlugs(new Set(slugs));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const solvedSlugs = useMemo(() => {
    if (isAuthenticated) {
      return authSolvedSlugs || new Set();
    }
    if (guest?.progress?.problemsSolved) {
      return new Set(guest.progress.problemsSolved);
    }
    return new Set();
  }, [isAuthenticated, authSolvedSlugs, guest]);

  /* ── Cluster progress map (computed from solvedSlugs) ─────── */
  const progress = useMemo(() => {
    const map = new Map();
    for (const c of selectedCollection.clusters) {
      const solved = c.slugs.filter((s) => solvedSlugs.has(s)).length;
      map.set(c.id, { solved, total: c.slugs.length });
    }
    return map;
  }, [selectedCollection, solvedSlugs]);

  const profileCardUser = useMemo(() => {
    if (isAuthenticated) return user;
    const summary = guest?.xpSummary;
    if (!summary) return null;
    return {
      username: 'Guest',
      xp: summary.xp,
      progress: summary,
      roleName: summary.roleName,
    };
  }, [guest?.xpSummary, isAuthenticated, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      setIsLandscapeViewport(detectLandscapeViewport());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobileDevice) return undefined;

    void requestScreenOrientation('landscape');

    return () => {
      void releaseScreenOrientation();
    };
  }, [isMobileDevice]);

  useEffect(() => {
    if (!showRotateLandscapeGuard) return;
    void requestScreenOrientation('landscape');
  }, [showRotateLandscapeGuard]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncClusterShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsClusterShellVisible(nextVisible);
        return;
      }

      setIsClusterShellVisible(readClusterShellVisible());
    };

    syncClusterShellVisibility();
    window.addEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
    window.addEventListener('storage', syncClusterShellVisibility);

    return () => {
      window.removeEventListener(CLUSTER_SHELL_VISIBILITY_EVENT, syncClusterShellVisibility);
      window.removeEventListener('storage', syncClusterShellVisibility);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncMobileShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsMobileShellVisible(nextVisible);
        return;
      }

      setIsMobileShellVisible(readMobileShellVisible());
    };

    syncMobileShellVisibility();
    window.addEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
    window.addEventListener('storage', syncMobileShellVisibility);

    return () => {
      window.removeEventListener(MOBILE_SHELL_VISIBILITY_EVENT, syncMobileShellVisibility);
      window.removeEventListener('storage', syncMobileShellVisibility);
    };
  }, []);

  const hasVisibleMobileShell = isMobileDevice && isClusterShellVisible && isMobileShellVisible;
  const mobileClusterViewportHeight = hasVisibleMobileShell ? 'calc(100dvh - 50px)' : '100dvh';
  const clusterViewportHeight = isMobileDevice
    ? mobileClusterViewportHeight
    : 'calc(100vh - 120px)';

  /* ── Collection selector ──────────────────────────────────── */
  const handleCollectionChange = useCallback(
    (e) => {
      setSearchParams({ collection: e.target.value }, { replace: true });
    },
    [setSearchParams]
  );

  /* ── Camera focus change -> URL sync ────────────────────────── */
  const handleFocusChange = useCallback(
    (newClusterId) => {
      setFocusedClusterId(newClusterId);
      if (newClusterId) {
        window.history.replaceState(null, '', `/games/clusters/${newClusterId}`);
      } else {
        const params = collectionId !== DEFAULT_COLLECTION_ID ? `?collection=${collectionId}` : '';
        window.history.replaceState(null, '', `/games/clusters${params}`);
      }
    },
    [collectionId]
  );

  /* ── Problem click -> route to solver ─────────────────────── */
  const handleProblemClick = useCallback(
    (slug, _index, mode) => {
      if (isProTrialLocked) {
        setIsGuestSignupWallOpen(true);
        return;
      }

      if (!isAuthenticated && guest?.hasReachedClusterProblemWall && !solvedSlugs.has(slug)) {
        setIsGuestSignupWallOpen(true);
        return;
      }

      const clusterNavigation = buildClusterNavigationState(focusedCluster, selectedCollection.id);
      const baseState = clusterNavigation ? { clusterNavigation } : null;
      const towerDefenseState =
        mode === 'td-settings'
          ? {
              ...(baseState || {}),
              towerDefenseUiIntent: 'open-settings',
            }
          : baseState;

      if (slug === 'hello-world') {
        // hello-world has no standalone workspace route.
        navigate('/');
        return;
      }

      if (mode === 'workspace' || mode === 'editor') {
        if (baseState) {
          navigate(`/problems/${slug}`, { state: baseState });
        } else {
          navigate(`/problems/${slug}`);
        }
      } else if (mode === 'challenge') {
        navigate(`/problems/${slug}`, {
          state: {
            ...(baseState || {}),
            mode: 'challenge',
          },
        });
      } else {
        if (towerDefenseState) {
          navigate(`/games/tower-defense/${slug}`, { state: towerDefenseState });
        } else {
          navigate(`/games/tower-defense/${slug}`);
        }
      }
    },
    [
      navigate,
      isAuthenticated,
      guest,
      solvedSlugs,
      isProTrialLocked,
      focusedCluster,
      selectedCollection.id,
    ]
  );

  return (
    <PageTemplate showGiphyBackground={false}>
      <PageSeo
        title="Coding Problem Clusters for Pattern Practice"
        description="Explore curated coding problem clusters on CodeGrind to practice core interview patterns and transition from concept learning to tower defense coding gameplay."
        path={routeClusterId ? `/games/clusters/${routeClusterId}` : '/games/clusters'}
        keywords="coding problem clusters, interview coding patterns, interview problem practice, coding game progression"
      />
      {showRotateLandscapeGuard ? (
        <Flex minH={clusterViewportHeight} align="center" justify="center" px={4} py={8}>
          <VStack
            spacing={5}
            align="stretch"
            maxW="container.md"
            w="100%"
            p={{ base: 5, md: 7 }}
            borderRadius="0"
            border="2px solid var(--cg-window-shadow)"
            bg="linear-gradient(180deg, var(--cg-window) 0%, var(--cg-window-face) 100%)"
            boxShadow="var(--cg-window-outset), 16px 16px 0 rgba(0, 0, 0, 0.12)"
          >
            <Text
              color="var(--cg-link)"
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="black"
              fontFamily="var(--cg-font-retro-display)"
            >
              Rotate your phone to landscape to use the cluster map.
            </Text>
            <Text
              color="var(--cg-text)"
              fontSize={{ base: 'md', md: 'lg' }}
              lineHeight="1.8"
              fontFamily="var(--cg-font-retro-display)"
            >
              The cluster map needs the full horizontal layout so the grid, paths, and focus state
              stay readable on mobile.
            </Text>
            <Text
              color="var(--cg-muted)"
              fontSize={{ base: 'sm', md: 'md' }}
              lineHeight="1.8"
              fontFamily="var(--cg-font-retro-display)"
            >
              {canAutoLockOrientation
                ? 'CodeGrind asked your browser to switch to landscape automatically. If it stayed in portrait, rotate manually or disable rotation lock on your device.'
                : 'This browser does not allow orientation lock here, so rotate your device manually to continue.'}
            </Text>
            <Button
              alignSelf="flex-start"
              bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
              color="var(--cg-text)"
              border="2px solid var(--cg-window-shadow)"
              borderRadius="0"
              fontFamily="var(--cg-font-retro-display)"
              boxShadow="inset 1px 1px 0 var(--cg-window-light), inset 2px 2px 0 #f8f5ef, inset -1px -1px 0 #404040, inset -2px -2px 0 var(--cg-window-dark)"
              _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
              _active={{
                boxShadow:
                  'inset 1px 1px 0 #6d6d6d, inset 2px 2px 0 #3d3d3d, inset -1px -1px 0 var(--cg-window-light), inset -2px -2px 0 #f4efe7',
                transform: 'translate(1px, 1px)',
              }}
              onClick={() => void requestScreenOrientation('landscape')}
            >
              Try Landscape Again
            </Button>
          </VStack>
        </Flex>
      ) : (
        <Flex
          direction="column"
          h={clusterViewportHeight}
          bg="linear-gradient(180deg, #c1c9b2 0%, #8e9f7e 100%)"
          overflow="hidden"
          position="relative"
        >
          {/* Collection selector -- hidden when zoomed into a cluster */}
          {!focusedClusterId &&
            (isMobileDevice ? (
              <Box position="absolute" top="12px" left="12px" right="12px" zIndex={3}>
                <Flex
                  px={isMapOverlayHidden ? 0 : 3}
                  py={isMapOverlayHidden ? 0 : 2}
                  align="center"
                  gap={2}
                  flexWrap="wrap"
                  justify={isMapOverlayHidden ? 'flex-end' : 'space-between'}
                  bg={
                    isMapOverlayHidden
                      ? 'transparent'
                      : 'linear-gradient(180deg, rgba(214, 209, 200, 0.96), rgba(194, 187, 176, 0.92))'
                  }
                  border={isMapOverlayHidden ? '0' : '2px solid var(--cg-window-shadow)'}
                  boxShadow={
                    isMapOverlayHidden
                      ? 'none'
                      : 'var(--cg-window-outset), 8px 8px 0 rgba(0, 0, 0, 0.12)'
                  }
                >
                  {!isMapOverlayHidden && (
                    <>
                      <Box minW="0" flex="1 1 160px">
                        <Text
                          color="var(--cg-link)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="2xs"
                          letterSpacing="wider"
                          whiteSpace="nowrap"
                          mb={1}
                        >
                          COLLECTION
                        </Text>
                        <Select
                          value={selectedCollection.id}
                          onChange={handleCollectionChange}
                          bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                          borderColor="var(--cg-window-shadow)"
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="xs"
                          size="sm"
                          borderRadius="0"
                          boxShadow="var(--cg-window-inset)"
                          sx={{
                            option: {
                              background: '#f4efe7',
                              color: '#1e1e1e',
                            },
                          }}
                        >
                          {CLUSTER_COLLECTIONS.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name}
                            </option>
                          ))}
                        </Select>
                      </Box>
                      <Text
                        color="var(--cg-muted)"
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="2xs"
                        maxW="160px"
                        noOfLines={2}
                      >
                        {selectedCollection.description}
                      </Text>
                    </>
                  )}
                  <Button
                    size="xs"
                    bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                    color="var(--cg-text)"
                    border="2px solid var(--cg-window-shadow)"
                    borderRadius="0"
                    fontFamily="var(--cg-font-retro-display)"
                    boxShadow="inset 1px 1px 0 var(--cg-window-light), inset 2px 2px 0 #f8f5ef, inset -1px -1px 0 #404040, inset -2px -2px 0 var(--cg-window-dark)"
                    _hover={{ bg: 'linear-gradient(180deg, #fbf8f1 0%, #e0dad1 100%)' }}
                    _active={{
                      boxShadow:
                        'inset 1px 1px 0 #6d6d6d, inset 2px 2px 0 #3d3d3d, inset -1px -1px 0 var(--cg-window-light), inset -2px -2px 0 #f4efe7',
                      transform: 'translate(1px, 1px)',
                    }}
                    onClick={() => setIsMapOverlayHidden((previous) => !previous)}
                  >
                    {isMapOverlayHidden ? 'Show Map UI' : 'Hide Map UI'}
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Flex
                px={{ base: 3, md: 6 }}
                pt={{ base: 2, md: 3 }}
                pb={{ base: 2, md: 2 }}
                align="center"
                gap={{ base: 2, md: 4 }}
                flexWrap="wrap"
                flexShrink={0}
                justify="flex-start"
                bg="linear-gradient(180deg, rgba(214, 209, 200, 0.96), rgba(194, 187, 176, 0.92))"
                borderBottom="2px solid var(--cg-window-shadow)"
              >
                <Text
                  color="var(--cg-link)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="xs"
                  letterSpacing="wider"
                  whiteSpace="nowrap"
                >
                  COLLECTION
                </Text>
                <Select
                  value={selectedCollection.id}
                  onChange={handleCollectionChange}
                  bg="linear-gradient(180deg, #f4efe7 0%, #d5cec5 100%)"
                  borderColor="var(--cg-window-shadow)"
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="sm"
                  maxW={{ base: '100%', md: '300px' }}
                  size="sm"
                  borderRadius="0"
                  boxShadow="var(--cg-window-inset)"
                  sx={{
                    option: {
                      background: '#f4efe7',
                      color: '#1e1e1e',
                    },
                  }}
                >
                  {CLUSTER_COLLECTIONS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </Select>
                <Text
                  color="var(--cg-muted)"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="xs"
                  display={{ base: 'none', md: 'block' }}
                >
                  {selectedCollection.description}
                </Text>
              </Flex>
            ))}

          <Box flex="1" overflow="hidden">
            <CyberGrid
              clusters={selectedCollection.clusters}
              collectionId={selectedCollection.id}
              progress={progress}
              isAuthenticated={isAuthenticated}
              isMobileDevice={isMobileDevice}
              user={profileCardUser}
              title={selectedCollection.name.toUpperCase()}
              initialFocusClusterId={routeClusterId || null}
              problemMetas={problemMetas}
              problemModeStatusBySlug={problemModeStatusBySlug}
              solvedSlugs={solvedSlugs}
              freeProblemsRemaining={guest?.clusterFreeProblemsRemaining ?? 3}
              hasReachedWall={isProTrialLocked || guest?.hasReachedClusterProblemWall || false}
              hideMacroOverlay={isMobileDevice && isMapOverlayHidden}
              onFocusChange={handleFocusChange}
              onProblemClick={handleProblemClick}
              onTrialWallHit={() => setIsGuestSignupWallOpen(true)}
            />
          </Box>
          <GuestSignupWall
            isOpen={isGuestSignupWallOpen}
            onClose={() => setIsGuestSignupWallOpen(false)}
            activitySummary={guest?.activitySummary}
            trialTrack="pro"
          />
        </Flex>
      )}
    </PageTemplate>
  );
}
