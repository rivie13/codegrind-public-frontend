/**
 * ClusterProgressWidget.jsx — Compact cluster progress grid for the dashboard.
 *
 * Shows the user's solved/total across CodeGrind Core clusters with mini progress bars.
 * Fetches solved slugs from the backend and cross-references with cluster data.
 */

import { Box, Button, Flex, Grid, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { FiGrid } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CLUSTER_COLLECTIONS, CLUSTER_DIFFICULTY } from '../../data/clusterCollections';
import api from '../../services/api';

/* ── Difficulty tier accent colors ────────────────────────────── */
const TIER_COLOR = {
  [CLUSTER_DIFFICULTY.BEGINNER]: 'var(--cg-accent-green)',
  [CLUSTER_DIFFICULTY.INTERMEDIATE]: 'var(--cg-accent-amber)',
  [CLUSTER_DIFFICULTY.ADVANCED]: 'var(--cg-accent-red)',
};

/* ── Cluster cell ─────────────────────────────────────────────── */
function ClusterCell({ cluster, solvedCount, onClick }) {
  const total = cluster.slugs.length;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
  const accent = cluster.accent || TIER_COLOR[cluster.difficulty] || 'var(--cg-link)';
  const isDone = pct === 100;
  const hasProgress = solvedCount > 0;

  return (
    <Tooltip
      label={`${cluster.title}: ${solvedCount}/${total} solved (${pct}%)`}
      fontSize="xs"
      bg="var(--cg-window-face)"
      color="var(--cg-text)"
      border="1px solid var(--cg-window-shadow)"
      placement="top"
      hasArrow
    >
      <Box
        bg={hasProgress ? 'rgba(255,255,255,0.24)' : 'var(--cg-panel-shell)'}
        border="1px solid var(--cg-window-shadow)"
        borderLeft="4px solid"
        borderLeftColor={hasProgress ? accent : 'var(--cg-window-dark)'}
        boxShadow="var(--cg-window-inset)"
        borderRadius="0"
        p={2}
        cursor="pointer"
        _hover={{
          bg: 'rgba(255,255,255,0.35)',
        }}
        transition="background 0.15s ease"
        onClick={onClick}
      >
        <Flex align="center" mb={1.5} gap={1}>
          <Text fontSize="var(--cg-font-size-meta)" lineHeight={1}>
            {cluster.icon || '⬡'}
          </Text>
          <Text
            color={hasProgress ? accent : 'var(--cg-muted)'}
            fontSize="var(--cg-font-size-micro)"
            fontFamily="var(--cg-font-retro-display)"
            fontWeight="bold"
            letterSpacing="wide"
            noOfLines={1}
            flex={1}
            textTransform="uppercase"
          >
            {cluster.shortTitle || cluster.title}
          </Text>
        </Flex>

        <Text
          color={hasProgress ? 'var(--cg-text)' : 'var(--cg-muted)'}
          fontSize="var(--cg-font-size-meta)"
          fontFamily="var(--cg-font-retro-display)"
          mb={1}
        >
          {solvedCount}/{total}
        </Text>

        <Box
          h="8px"
          bg="var(--cg-window-face)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          borderRadius="0"
          overflow="hidden"
        >
          <Box
            h="100%"
            w={`${pct}%`}
            bg={
              isDone ? 'repeating-linear-gradient(90deg, #1f6e2c 0 8px, #2f8d3d 8px 16px)' : accent
            }
            borderRadius="0"
            transition="width 0.4s ease"
          />
        </Box>
      </Box>
    </Tooltip>
  );
}

/* ── Main widget ──────────────────────────────────────────────── */
export default function ClusterProgressWidget({ userId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [solvedSlugs, setSolvedSlugs] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSlugs() {
      try {
        const slugs = await api.submissions.getSolvedSlugs(userId);
        if (!cancelled) setSolvedSlugs(slugs);
      } catch {
        // Best effort
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSlugs();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Get CodeGrind Core collection
  const clusters = useMemo(() => {
    const coreCollection = CLUSTER_COLLECTIONS.find((c) => c.id === 'codegrind-core');
    return coreCollection?.clusters || [];
  }, []);

  // Compute per-cluster solved counts
  const { clusterProgress, totalSolved, overallPct } = useMemo(() => {
    const solvedSet = new Set(solvedSlugs);
    const progress = new Map();
    let totalS = 0;
    let totalP = 0;

    for (const cluster of clusters) {
      const solved = cluster.slugs.filter((s) => solvedSet.has(s)).length;
      progress.set(cluster.id, solved);
      totalS += solved;
      totalP += cluster.slugs.length;
    }

    return {
      clusterProgress: progress,
      totalSolved: totalS,
      totalProblems: totalP,
      overallPct: totalP > 0 ? Math.round((totalS / totalP) * 100) : 0,
    };
  }, [solvedSlugs, clusters]);

  /* ── Group clusters by difficulty tier ──────────────────────── */
  const tiers = useMemo(() => {
    const tierMap = new Map();
    for (const cluster of clusters) {
      const tier = cluster.difficulty || 'beginner';
      if (!tierMap.has(tier)) tierMap.set(tier, []);
      tierMap.get(tier).push(cluster);
    }
    return tierMap;
  }, [clusters]);

  /* ── Loading placeholder ──────────────────────────────────── */
  if (loading) {
    return (
      <Box className="cg-panel-window" minH="320px" visibility="hidden" aria-hidden="true">
        {/* Reserve space without showing loading lines or animations. */}
      </Box>
    );
  }

  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={3} py={2}>
        <Flex justify="space-between" align="center" gap={3}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            core_clusters.map
          </Text>
          <Text fontSize="xs" fontWeight="700">
            {overallPct}%
          </Text>
        </Flex>
      </Box>

      <Box p={5} bg="rgba(255,255,255,0.14)">
        <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
          <HStack spacing={2}>
            <Box as={FiGrid} color="var(--cg-link)" boxSize={4} />
            <Text
              color="var(--cg-link)"
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
              fontWeight="700"
              textTransform="uppercase"
            >
              Cluster Progress
            </Text>
          </HStack>
          <Text color="var(--cg-muted)" fontSize="xs" fontFamily="var(--cg-font-retro-display)">
            {totalSolved} solved across CodeGrind Core
          </Text>
        </Flex>

        <Box
          h="10px"
          bg="var(--cg-window-face)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          borderRadius="0"
          overflow="hidden"
          mb={4}
        >
          <Box
            h="100%"
            w={`${overallPct}%`}
            bg="repeating-linear-gradient(90deg, var(--cg-accent-blue) 0 12px, var(--cg-link) 12px 24px)"
            transition="width 0.5s ease"
          />
        </Box>

        <VStack spacing={3} align="stretch">
          {[
            CLUSTER_DIFFICULTY.BEGINNER,
            CLUSTER_DIFFICULTY.INTERMEDIATE,
            CLUSTER_DIFFICULTY.ADVANCED,
          ].map((tier) => {
            const tierClusters = tiers.get(tier);
            if (!tierClusters?.length) return null;
            const tierColor = TIER_COLOR[tier];

            return (
              <Box key={tier}>
                <Text
                  color={tierColor}
                  fontSize="8px"
                  fontFamily="var(--cg-font-retro-display)"
                  fontWeight="bold"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  mb={1.5}
                  opacity={0.8}
                >
                  {tier}
                </Text>
                <Grid
                  templateColumns={{
                    base: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: `repeat(${Math.min(tierClusters.length, 4)}, 1fr)`,
                  }}
                  gap={2}
                >
                  {tierClusters.map((cluster) => (
                    <ClusterCell
                      key={cluster.id}
                      cluster={cluster}
                      solvedCount={clusterProgress.get(cluster.id) || 0}
                      onClick={() => navigate(`/games/clusters/${cluster.id}`)}
                    />
                  ))}
                </Grid>
              </Box>
            );
          })}
        </VStack>

        <Flex justify="flex-end" mt={4}>
          <Button size="sm" onClick={() => navigate('/games/clusters')}>
            View All Clusters
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
