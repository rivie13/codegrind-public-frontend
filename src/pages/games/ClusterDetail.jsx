/**
 * ClusterDetail.jsx — Canvas-based "micro view" for a single LeetCode cluster.
 *
 * Route: /games/clusters/:clusterId
 *   - Authenticated users see all nodes active / complete
 *   - Guest users on beginner clusters see free-trial nodes
 *   - Other clusters require sign-in (redirect)
 *
 * Uses the same pixel-art canvas drawing primitives as the macro CyberGrid.
 * Clicking a problem node routes to Tower Defense or Editor mode.
 * Clicking the ← BACK chip (or browser back) zooms out to the macro view.
 */

import { Box, Container, Text, VStack, Button } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CyberClusterDetail from '../../components/cyberGrid/CyberClusterDetail';
import PageTemplate from '../../components/layout/PageTemplate';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import { ALL_CLUSTERS, TRIAL_CLUSTER_ID } from '../../data/clusterCollections';
import { api } from '../../services/api';
import { buildClusterNavigationState } from '../../utils/navigation/clusterNavigation';

/* ── Main ClusterDetail page ───────────────────────────────────── */
export default function ClusterDetail() {
  const { clusterId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const guest = useGuestProgressCtx();
  const isProTrialLocked = !isAuthenticated && Boolean(guest?.isProTrialLocked);

  const [problemMetas, setProblemMetas] = useState([]);

  const cluster = useMemo(() => ALL_CLUSTERS.find((c) => c.id === clusterId), [clusterId]);

  const isBeginner = cluster?.id === TRIAL_CLUSTER_ID;

  // Record cluster browse for guest tracking
  useEffect(() => {
    if (!isAuthenticated && cluster && guest) {
      guest.recordClusterBrowsed(cluster.id);
    }
  }, [cluster, isAuthenticated, guest]);

  // Fetch minimal problem metadata (title + difficulty) for display
  useEffect(() => {
    if (!cluster) return;
    let cancelled = false;

    async function fetchMetas() {
      try {
        const res = await api.post('/api/problems/lookup', {
          slugs: cluster.slugs,
        });
        if (!cancelled && res.data?.problems) {
          const metas = res.data.problems.map((p) => ({
            slug: p.titleSlug,
            title: p.title,
            difficulty: p.difficulty,
            referenceName:
              p?.metadata?.referenceName || p?.metaData?.referenceName || p?.referenceName || null,
            referenceSlug:
              p?.metadata?.referenceSlug || p?.metaData?.referenceSlug || p?.referenceSlug || null,
          }));
          setProblemMetas(metas);
        }
      } catch {
        // Silently fail — fallback to slug-based titles
      }
    }

    fetchMetas();
    return () => {
      cancelled = true;
    };
  }, [cluster]);

  // Build solved slugs set
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
    // Guest progress
    if (guest?.progress?.problemsSolved) {
      return new Set(guest.progress.problemsSolved);
    }
    return new Set();
  }, [isAuthenticated, authSolvedSlugs, guest]);

  const handleBack = useCallback(() => {
    navigate('/games/clusters');
  }, [navigate]);

  const handleProblemClick = useCallback(
    (slug, _index, mode) => {
      if (isProTrialLocked) return;

      const clusterNavigation = buildClusterNavigationState(cluster);
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

      if (cluster?.towerDefenseOnly) {
        if (towerDefenseState) {
          navigate(`/games/tower-defense/${slug}`, { state: towerDefenseState });
        } else {
          navigate(`/games/tower-defense/${slug}`);
        }
        return;
      }

      if (mode === 'workspace' || mode === 'editor') {
        if (baseState) {
          navigate(`/problems/${slug}`, { state: baseState });
        } else {
          navigate(`/problems/${slug}`);
        }
        return;
      }

      if (mode === 'challenge') {
        navigate(`/problems/${slug}`, {
          state: {
            ...(baseState || {}),
            mode: 'challenge',
          },
        });
        return;
      }

      if (towerDefenseState) {
        navigate(`/games/tower-defense/${slug}`, { state: towerDefenseState });
      } else {
        navigate(`/games/tower-defense/${slug}`);
      }
    },
    [navigate, cluster, isProTrialLocked]
  );

  // Not found
  if (!cluster) {
    return (
      <PageTemplate>
        <Box minH="100vh" bg="#07080a" py={20}>
          <Container maxW="container.md">
            <VStack spacing={4}>
              <Text color="gray.500" fontSize="lg" fontFamily="mono">
                Cluster not found
              </Text>
              <Button
                variant="outline"
                borderColor="#00FFFF44"
                color="#00FFFF"
                onClick={handleBack}
                fontFamily="mono"
                size="sm"
              >
                Back to Clusters
              </Button>
            </VStack>
          </Container>
        </Box>
      </PageTemplate>
    );
  }

  // Non-beginner clusters require auth. Also lock cluster trial for beginner-track guests.
  if (!isAuthenticated && (!isBeginner || isProTrialLocked)) {
    return (
      <PageTemplate>
        <Box minH="100vh" bg="#07080a" py={20}>
          <Container maxW="container.md">
            <VStack spacing={4}>
              <Text color="gray.400" fontSize="md" fontFamily="mono">
                {isProTrialLocked
                  ? 'Your guest trial is locked to the Beginner learning path. Sign in to unlock pro clusters.'
                  : 'Sign in to access this cluster'}
              </Text>
              <Button
                variant="outline"
                borderColor="#00FFFF44"
                color="#00FFFF"
                onClick={handleBack}
                fontFamily="mono"
                size="sm"
              >
                Back to Clusters
              </Button>
            </VStack>
          </Container>
        </Box>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <Box minH="100vh" bg="#07080a">
        <CyberClusterDetail
          cluster={cluster}
          problemMetas={problemMetas}
          solvedSlugs={solvedSlugs}
          isAuthenticated={isAuthenticated}
          isBeginner={isBeginner}
          freeProblemsRemaining={guest?.clusterFreeProblemsRemaining ?? 3}
          hasReachedWall={isProTrialLocked || guest?.hasReachedClusterProblemWall || false}
          onBack={handleBack}
          onProblemClick={handleProblemClick}
        />
      </Box>
    </PageTemplate>
  );
}
