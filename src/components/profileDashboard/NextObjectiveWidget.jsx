/**
 * NextObjectiveWidget.jsx — prominent "do this next" objective card.
 *
 * Uses recent activity signals (AI generation/solving, learning path activity,
 * and cluster progress) to keep recommendations aligned with what the user
 * has actually been doing lately.
 */

import { Badge, Box, Button, Flex, HStack, Progress, Text, VStack } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiBookOpen,
  FiCompass,
  FiCpu,
  FiGrid,
  FiMap,
  FiTarget,
  FiZap,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CLUSTER_COLLECTIONS } from '../../data/clusterCollections';

const OBJECTIVES = {
  CONTINUE_AI_GENERATION: 'CONTINUE_AI_GENERATION',
  CONTINUE_AI_SOLVING: 'CONTINUE_AI_SOLVING',
  CONTINUE_LP: 'CONTINUE_LP',
  CONTINUE_CLUSTER: 'CONTINUE_CLUSTER',
  START_LP: 'START_LP',
  TRY_TD: 'TRY_TD',
  EXPLORE_CLUSTERS: 'EXPLORE_CLUSTERS',
};

const objectiveMeta = {
  [OBJECTIVES.CONTINUE_AI_GENERATION]: {
    icon: FiCpu,
    color: 'var(--cg-accent-amber)',
    label: 'AI PROBLEM GENERATION',
    cta: 'Generate another AI problem',
  },
  [OBJECTIVES.CONTINUE_AI_SOLVING]: {
    icon: FiCpu,
    color: 'var(--cg-link)',
    label: 'AI PROBLEM SOLVING',
    cta: 'Continue AI problem solving',
  },
  [OBJECTIVES.CONTINUE_LP]: {
    icon: FiBookOpen,
    color: 'var(--cg-accent-green)',
    label: 'CONTINUE LEARNING',
    cta: 'Continue your learning path',
  },
  [OBJECTIVES.CONTINUE_CLUSTER]: {
    icon: FiZap,
    color: 'var(--cg-link)',
    label: 'CONTINUE CLUSTER',
    cta: 'Continue your cluster',
  },
  [OBJECTIVES.START_LP]: {
    icon: FiMap,
    color: 'var(--cg-link)',
    label: 'START LEARNING',
    cta: 'Start your learning path',
  },
  [OBJECTIVES.TRY_TD]: {
    icon: FiTarget,
    color: 'var(--cg-accent-amber)',
    label: 'TRY TOWER DEFENSE',
    cta: 'Try tower defense mode',
  },
  [OBJECTIVES.EXPLORE_CLUSTERS]: {
    icon: FiGrid,
    color: 'var(--cg-accent-red)',
    label: 'EXPLORE CLUSTERS',
    cta: 'Explore clusters',
  },
};

const RECENT_CATEGORY = {
  AI_GENERATION: 'AI_GENERATION',
  AI_SOLVING: 'AI_SOLVING',
  LEARNING_PATH: 'LEARNING_PATH',
  CLUSTER: 'CLUSTER',
};

const NODE_TYPE_LABELS = {
  learn: 'Lesson',
  workspace: 'Practice',
  tower: 'Tower Defense',
  final: 'Final Challenge',
};

function toTimestamp(value) {
  if (!value) return 0;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function getNumericSolvedCount(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value && typeof value.solved === 'number') {
    return value.solved;
  }
  return 0;
}

function getLearningPathObjective({ completedNodeIds, pathData }) {
  if (pathData?.modules?.length) {
    const allNodes = pathData.modules.flatMap((m) =>
      (m.nodes || []).map((n) => ({ ...n, moduleTitle: m.title, moduleId: m.moduleId }))
    );
    const completedSet = new Set(completedNodeIds || []);
    const nextNode = allNodes.find((n) => !completedSet.has(n.nodeId));

    if (nextNode && completedSet.size > 0) {
      const typeLabel = NODE_TYPE_LABELS[nextNode.type] || nextNode.type;
      return {
        type: OBJECTIVES.CONTINUE_LP,
        title: `${nextNode.moduleTitle}: ${typeLabel}`,
        subtitle: nextNode.title || nextNode.nodeId,
        reason: 'You were recently active in learning paths.',
        route:
          nextNode.type === 'tower'
            ? `/learning/python-path/tower/${nextNode.nodeId}`
            : `/learning/python-path/${nextNode.nodeId}`,
        progress: Math.round((completedSet.size / allNodes.length) * 100),
      };
    }
  }

  if (pathData?.modules?.length) {
    const completedSet = new Set(completedNodeIds || []);
    if (completedSet.size === 0) {
      return {
        type: OBJECTIVES.START_LP,
        title: 'Python Fundamentals',
        subtitle: 'Learn Python through tower defense — from Hello World to algorithms.',
        reason: 'A learning path is ready for you to begin.',
        route: '/learning/python-path',
        progress: 0,
      };
    }
  }

  return null;
}

function getClusterObjective({ solvedSlugs }) {
  if (!solvedSlugs?.length) {
    return null;
  }

  const solvedSet = new Set(solvedSlugs);
  const coreCollection = CLUSTER_COLLECTIONS.find((c) => c.id === 'codegrind-core');
  const clusters = coreCollection?.clusters || [];

  let bestCluster = null;
  let bestPct = 0;
  let bestSolved = 0;

  for (const cluster of clusters) {
    const solved = cluster.slugs.filter((s) => solvedSet.has(s)).length;
    if (solved === 0 || solved === cluster.slugs.length) continue;
    const pct = solved / cluster.slugs.length;
    if (pct > bestPct) {
      bestPct = pct;
      bestCluster = cluster;
      bestSolved = solved;
    }
  }

  if (!bestCluster) {
    return null;
  }

  return {
    type: OBJECTIVES.CONTINUE_CLUSTER,
    title: bestCluster.title,
    subtitle: `${bestSolved}/${bestCluster.slugs.length} problems solved — keep going!`,
    reason: 'Your recent activity points to cluster practice.',
    route: `/games/clusters/${bestCluster.id}`,
    progress: Math.round(bestPct * 100),
  };
}

function classifySubmissionCategory(submission, clusterSlugSet) {
  const mode = String(submission?.mode || '').toLowerCase();
  const problemId = String(submission?.problemId || '').toLowerCase();

  if (mode.includes('ai') || problemId.startsWith('ai-')) {
    return RECENT_CATEGORY.AI_SOLVING;
  }

  if (problemId.startsWith('lp-') || problemId.includes('learning-path')) {
    return RECENT_CATEGORY.LEARNING_PATH;
  }

  if (clusterSlugSet.has(problemId)) {
    return RECENT_CATEGORY.CLUSTER;
  }

  return null;
}

function inferRecentFocus({ recentSubmissions, createdAiProblems, clusterSlugSet }) {
  const events = [];

  for (const sub of recentSubmissions || []) {
    const category = classifySubmissionCategory(sub, clusterSlugSet);
    if (!category) continue;

    events.push({
      category,
      at: toTimestamp(sub?.submission_date || sub?.submissionDate || sub?.createdAt),
    });
  }

  for (const aiProblem of createdAiProblems || []) {
    events.push({
      category: RECENT_CATEGORY.AI_GENERATION,
      at: toTimestamp(aiProblem?.createdAt),
    });
  }

  events.sort((a, b) => b.at - a.at);

  const score = {
    [RECENT_CATEGORY.AI_GENERATION]: 0,
    [RECENT_CATEGORY.AI_SOLVING]: 0,
    [RECENT_CATEGORY.LEARNING_PATH]: 0,
    [RECENT_CATEGORY.CLUSTER]: 0,
  };

  events.slice(0, 8).forEach((event, index) => {
    const weight = Math.max(1, 8 - index);
    score[event.category] += weight;
  });

  const aiScore = score.AI_GENERATION + score.AI_SOLVING;
  const learningScore = score.LEARNING_PATH;
  const clusterScore = score.CLUSTER;

  if (aiScore === 0 && learningScore === 0 && clusterScore === 0) {
    return null;
  }

  if (aiScore >= learningScore && aiScore >= clusterScore) {
    const newestAiEvent = events.find(
      (event) =>
        event.category === RECENT_CATEGORY.AI_GENERATION ||
        event.category === RECENT_CATEGORY.AI_SOLVING
    );

    return newestAiEvent?.category === RECENT_CATEGORY.AI_GENERATION
      ? RECENT_CATEGORY.AI_GENERATION
      : RECENT_CATEGORY.AI_SOLVING;
  }

  if (learningScore >= clusterScore) {
    return RECENT_CATEGORY.LEARNING_PATH;
  }

  return RECENT_CATEGORY.CLUSTER;
}

function resolveNextObjective({
  completedNodeIds,
  pathData,
  profileStats,
  solvedSlugs,
  recentSubmissions,
  createdAiProblems,
}) {
  const clusterSlugSet = new Set(
    CLUSTER_COLLECTIONS.flatMap((collection) =>
      (collection?.clusters || []).flatMap((cluster) => cluster?.slugs || [])
    )
  );

  const recentFocus = inferRecentFocus({ recentSubmissions, createdAiProblems, clusterSlugSet });
  const learningPathObjective = getLearningPathObjective({ completedNodeIds, pathData });
  const clusterObjective = getClusterObjective({ solvedSlugs });

  const aiGenerationObjective = {
    type: OBJECTIVES.CONTINUE_AI_GENERATION,
    title: 'Generate Your Next AI Problem',
    subtitle: 'You were creating AI problems recently. Keep your custom set growing.',
    reason: 'Based on your latest activity: AI problem generation.',
    route: '/ai-problems/create',
  };

  const aiSolvingObjective = {
    type: OBJECTIVES.CONTINUE_AI_SOLVING,
    title: 'Continue Solving AI Problems',
    subtitle: 'You were recently in AI problem practice. Pick up where you left off.',
    reason: 'Based on your latest activity: AI problem solving.',
    route: '/ai-problems/browse',
  };

  if (recentFocus === RECENT_CATEGORY.AI_GENERATION) {
    return aiGenerationObjective;
  }

  if (recentFocus === RECENT_CATEGORY.AI_SOLVING) {
    return aiSolvingObjective;
  }

  if (recentFocus === RECENT_CATEGORY.LEARNING_PATH && learningPathObjective) {
    return {
      ...learningPathObjective,
      reason: 'Based on your latest activity: learning path progress.',
    };
  }

  if (recentFocus === RECENT_CATEGORY.CLUSTER && clusterObjective) {
    return {
      ...clusterObjective,
      reason: 'Based on your latest activity: cluster practice.',
    };
  }

  if (learningPathObjective?.type === OBJECTIVES.CONTINUE_LP) {
    return {
      ...learningPathObjective,
      reason: 'You already have active learning path progress.',
    };
  }

  if (clusterObjective) {
    return {
      ...clusterObjective,
      reason: 'You have active cluster progress to continue.',
    };
  }

  if (learningPathObjective) {
    return learningPathObjective;
  }

  const tdPlayed =
    profileStats?.towerDefenseStats?.totalGames || profileStats?.totalTowerDefenseGames || 0;
  const solved =
    getNumericSolvedCount(profileStats?.easy) +
    getNumericSolvedCount(profileStats?.medium) +
    getNumericSolvedCount(profileStats?.hard);

  if (solved > 0 && tdPlayed === 0) {
    return {
      type: OBJECTIVES.TRY_TD,
      title: 'Tower Defense Mode',
      subtitle: 'Defend your base with code. Every function you write spawns a tower.',
      reason: 'A fresh mode can diversify your practice.',
      route: '/games/tower-defense',
    };
  }

  return {
    type: OBJECTIVES.EXPLORE_CLUSTERS,
    title: 'Interview Clusters',
    subtitle: '17 curated problem sets organized by pattern — circuit-board style.',
    reason: 'Best next step: pick a cluster and start building momentum.',
    route: '/games/clusters',
  };
}

export default function NextObjectiveWidget({ userId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [solvedSlugs, setSolvedSlugs] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [createdAiProblems, setCreatedAiProblems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [progressRes, pathRes, statsRes, slugsRes, profileRes, createdAiRes] =
          await Promise.allSettled([
            api.learningPath.getProgress('python-path'),
            api.learningPath.getPath('python-path'),
            userId ? api.submissions.getProfileStats(userId) : Promise.resolve(null),
            userId ? api.submissions.getSolvedSlugs(userId) : Promise.resolve([]),
            userId ? api.profile.getPublicProfile(userId) : Promise.resolve(null),
            userId ? api.submissions.getCreatedAIProblems(userId, 8) : Promise.resolve({}),
          ]);

        if (cancelled) return;

        if (progressRes.status === 'fulfilled' && progressRes.value?.completedNodeIds) {
          setCompletedNodeIds(progressRes.value.completedNodeIds);
        }
        if (pathRes.status === 'fulfilled' && pathRes.value) {
          setPathData(pathRes.value);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setProfileStats(statsRes.value);
        }
        if (slugsRes.status === 'fulfilled' && Array.isArray(slugsRes.value)) {
          setSolvedSlugs(slugsRes.value);
        }
        if (profileRes.status === 'fulfilled' && profileRes.value?.recentSubmissions) {
          setRecentSubmissions(profileRes.value.recentSubmissions);
        }
        if (createdAiRes.status === 'fulfilled' && Array.isArray(createdAiRes.value?.problems)) {
          setCreatedAiProblems(createdAiRes.value.problems);
        }
      } catch {
        // Best effort — fallback objective still works.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const objective = useMemo(
    () =>
      resolveNextObjective({
        completedNodeIds,
        pathData,
        profileStats,
        solvedSlugs,
        recentSubmissions,
        createdAiProblems,
      }),
    [completedNodeIds, pathData, profileStats, solvedSlugs, recentSubmissions, createdAiProblems]
  );

  const meta = objectiveMeta[objective.type];

  if (loading) {
    return (
      <Box className="cg-panel-window" minH="128px" visibility="hidden" aria-hidden="true">
        {/* Reserve space without showing loading lines or animations. */}
      </Box>
    );
  }

  return (
    <Box
      className="cg-panel-window"
      overflow="hidden"
      cursor="pointer"
      onClick={() => navigate(objective.route)}
    >
      <Box className="cg-titlebar" px={3} py={2}>
        <Flex justify="space-between" align="center" gap={3}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            next_objective.exe
          </Text>
          <Badge
            bg="var(--cg-window-face)"
            color={meta.color}
            fontSize="var(--cg-font-size-meta)"
            borderRadius="0"
          >
            DO THIS NEXT
          </Badge>
        </Flex>
      </Box>

      <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
        <VStack align="start" spacing={3}>
          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Box as={FiCompass} color={meta.color} boxSize={4} />
              <Text
                color={meta.color}
                fontSize="xs"
                fontFamily="var(--cg-font-retro-display)"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                {meta.label}
              </Text>
            </HStack>
            <Text
              color="var(--cg-muted)"
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
              textTransform="uppercase"
            >
              Your dashboard priority task right now
            </Text>
          </VStack>

          <VStack align="start" spacing={1}>
            <Text
              color="var(--cg-text)"
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="700"
              lineHeight="short"
              fontFamily="var(--cg-font-retro-display)"
            >
              {objective.title}
            </Text>
            <Text color="var(--cg-muted)" fontSize="sm" lineHeight="1.6">
              {objective.subtitle}
            </Text>
            {objective.reason && (
              <Box
                bg="var(--cg-panel-shell)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                px={3}
                py={2}
                w="100%"
              >
                <Text
                  color={meta.color}
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  lineHeight="1.5"
                >
                  {objective.reason}
                </Text>
              </Box>
            )}
          </VStack>

          {objective.progress != null && objective.progress > 0 && (
            <Box w="100%">
              <Flex justify="space-between" mb={1}>
                <Text
                  color="var(--cg-muted)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  PROGRESS
                </Text>
                <Text color={meta.color} fontSize="xs" fontFamily="var(--cg-font-retro-display)">
                  {objective.progress}%
                </Text>
              </Flex>
              <Progress value={objective.progress} sx={{ '& > div': { background: meta.color } }} />
            </Box>
          )}

          <Button
            size="sm"
            color={meta.color}
            rightIcon={<FiArrowRight />}
            onClick={(event) => {
              event.stopPropagation();
              navigate(objective.route);
            }}
          >
            {meta.cta}
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
