/**
 * LearningPathProgressWidget.jsx — Mini skill-tree progress card for the dashboard.
 *
 * Shows the user's progress through the Python learning path:
 *  - Overall completion percentage
 *  - Module-level progress with status indicators (completed/in-progress/locked)
 *  - Current module highlighted with glow effect
 *  - Activity-level detail for the active module
 *  - Click-to-navigate to the learning path or specific module
 */

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Progress,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiCheck, FiCode, FiLock, FiPlay, FiStar, FiTarget } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { normalizeLearningPath } from '../../data/learningPathRegistry';
import {
  computeCompletion,
  computeModuleAvailability,
} from '../../utils/learning/learningPathStatus';

/* ── Node type icons ──────────────────────────────────────────── */
const NODE_TYPE_ICON = {
  learn: FiBookOpen,
  workspace: FiCode,
  tower: FiTarget,
  final: FiStar,
};

const NODE_TYPE_LABEL = {
  learn: 'Lesson',
  workspace: 'Practice',
  tower: 'Tower Defense',
  final: 'Final Challenge',
};

/* ── Status colors & icons ────────────────────────────────────── */
const STATUS_CONFIG = {
  completed: { color: 'var(--cg-accent-green)', icon: FiCheck, bg: 'rgba(47, 141, 61, 0.18)' },
  available: { color: 'var(--cg-link)', icon: FiPlay, bg: 'rgba(10, 56, 154, 0.14)' },
  locked: { color: 'var(--cg-muted)', icon: FiLock, bg: 'rgba(40, 42, 48, 0.28)' },
};

/* ── Module status pill ───────────────────────────────────────── */
function ModuleStatusPill({ status, completedCount, totalCount }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
  return (
    <Badge
      bg="var(--cg-window-face)"
      color={cfg.color}
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset)"
      fontSize="var(--cg-font-size-micro)"
      fontFamily="var(--cg-font-retro-display)"
      px={2}
      py={0.5}
      borderRadius="0"
      textTransform="uppercase"
      letterSpacing="wider"
    >
      {status === 'completed'
        ? 'DONE'
        : status === 'available'
          ? `${completedCount}/${totalCount}`
          : 'LOCKED'}
    </Badge>
  );
}

/* ── Activity node dot (tiny for compact view) ────────────────── */
function ActivityDot({ nodeType, status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
  const Icon = NODE_TYPE_ICON[nodeType] || FiCode;
  const label = NODE_TYPE_LABEL[nodeType] || nodeType;

  return (
    <Tooltip
      label={`${label} — ${status}`}
      fontSize="xs"
      bg="var(--cg-window-face)"
      color="var(--cg-text)"
      border="1px solid var(--cg-window-shadow)"
      placement="top"
      hasArrow
    >
      <Flex
        align="center"
        justify="center"
        w="22px"
        h="22px"
        borderRadius="0"
        bg="var(--cg-window-face)"
        border="1px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-outset)"
        flexShrink={0}
      >
        <Box as={Icon} color={cfg.color} boxSize="10px" />
      </Flex>
    </Tooltip>
  );
}

/* ── Module row ───────────────────────────────────────────────── */
function ModuleRow({ module, activities, completion, moduleAvailability, isActive, onClick }) {
  const isCompleted = completion.completedModules.has(module.id);
  const isAvailable = moduleAvailability.get(module.id);
  const status = isCompleted ? 'completed' : isAvailable ? 'available' : 'locked';
  const cfg = STATUS_CONFIG[status];

  // Count completed activities in this module
  const activityStatuses = activities.map((a) => {
    if (completion.completedNodes.has(a.id)) return 'completed';
    if (completion.arePrereqsMet(a)) return 'available';
    return 'locked';
  });
  const completedCount = activityStatuses.filter((s) => s === 'completed').length;

  return (
    <Box
      bg={isActive ? 'rgba(255,255,255,0.28)' : 'var(--cg-panel-shell)'}
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
      borderRadius="0"
      px={3}
      py={2}
      cursor={status !== 'locked' ? 'pointer' : 'default'}
      opacity={status === 'locked' ? 0.7 : 1}
      _hover={status !== 'locked' ? { bg: 'rgba(255,255,255,0.35)' } : {}}
      transition="background 0.15s ease"
      onClick={status !== 'locked' ? onClick : undefined}
    >
      <Flex justify="space-between" align="center" mb={1}>
        <HStack spacing={2}>
          <Box w="8px" h="8px" borderRadius="0" bg={cfg.color} />
          <Text
            color={cfg.color}
            fontSize="xs"
            fontFamily="var(--cg-font-retro-display)"
            fontWeight="bold"
            letterSpacing="wide"
            noOfLines={1}
            textTransform="uppercase"
          >
            {module.label}
          </Text>
        </HStack>
        <ModuleStatusPill
          status={status}
          completedCount={completedCount}
          totalCount={activities.length}
        />
      </Flex>

      {/* Activity dots row — only show for active or completed modules */}
      {(isActive || isCompleted) && activities.length > 0 && (
        <HStack spacing={1} mt={1} ml="16px">
          {activities.map((a, i) => (
            <ActivityDot key={a.id} nodeType={a.type} status={activityStatuses[i]} />
          ))}
        </HStack>
      )}
    </Box>
  );
}

/* ── Main widget ──────────────────────────────────────────────── */
export default function LearningPathProgressWidget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pathData, setPathData] = useState(null);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [pathRes, progressRes] = await Promise.allSettled([
          api.learningPath.getPath('python-path'),
          api.learningPath.getProgress('python-path'),
        ]);

        if (cancelled) return;

        if (pathRes.status === 'fulfilled' && pathRes.value) {
          setPathData(normalizeLearningPath(pathRes.value));
        }
        if (progressRes.status === 'fulfilled' && progressRes.value?.completedNodeIds) {
          setCompletedNodeIds(progressRes.value.completedNodeIds);
        }
      } catch {
        // Best effort — widget degrades gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute completion state
  const {
    completion,
    moduleAvailability,
    modules,
    activitiesByModule,
    overallProgress,
    activeModuleId,
  } = useMemo(() => {
    if (!pathData) {
      return {
        completion: null,
        moduleAvailability: new Map(),
        modules: [],
        activitiesByModule: new Map(),
        overallProgress: 0,
        activeModuleId: null,
      };
    }

    const completedSet = new Set(completedNodeIds || []);
    const comp = computeCompletion(pathData, completedSet);
    const modAvail = computeModuleAvailability(pathData, comp);

    // Extract module nodes and their activities
    const moduleNodes = pathData.nodes.filter((n) => n.type === 'module' || n.type === 'capstone');
    const actByMod = new Map();
    for (const mod of moduleNodes) {
      const activityIds = pathData.moduleActivityMap.get(mod.id) || [];
      const activities = activityIds
        .map((id) => pathData.nodes.find((n) => n.id === id))
        .filter(Boolean);
      actByMod.set(mod.id, activities);
    }

    // Count all activity nodes
    const allActivities = [...actByMod.values()].flat();
    const completedActivities = allActivities.filter((a) => completedSet.has(a.id));
    const progress =
      allActivities.length > 0
        ? Math.round((completedActivities.length / allActivities.length) * 100)
        : 0;

    // Find the active module (first non-completed available module)
    let activeMod = null;
    for (const mod of moduleNodes) {
      const isCompleted = comp.completedModules.has(mod.id);
      const isAvailable = modAvail.get(mod.id);
      if (!isCompleted && isAvailable) {
        activeMod = mod.id;
        break;
      }
    }

    return {
      completion: comp,
      moduleAvailability: modAvail,
      modules: moduleNodes,
      activitiesByModule: actByMod,
      overallProgress: progress,
      activeModuleId: activeMod,
    };
  }, [pathData, completedNodeIds]);

  /* ── Loading placeholder ──────────────────────────────────── */
  if (loading) {
    return (
      <Box className="cg-panel-window" minH="240px" visibility="hidden" aria-hidden="true">
        {/* Reserve space without showing loading lines or animations. */}
      </Box>
    );
  }

  /* ── No path data — prompt to start ─────────────────────── */
  if (!pathData || modules.length === 0) {
    return (
      <Box
        className="cg-panel-window"
        overflow="hidden"
        cursor="pointer"
        onClick={() => navigate('/learning/python-path')}
      >
        <Box className="cg-titlebar" px={3} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            learning_path.sys
          </Text>
        </Box>
        <Box p={5} bg="rgba(255,255,255,0.14)">
          <HStack spacing={2} mb={2}>
            <Box as={FiBookOpen} color="var(--cg-link)" boxSize={4} />
            <Text
              color="var(--cg-link)"
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
              fontWeight="700"
              textTransform="uppercase"
            >
              Learning Path
            </Text>
          </HStack>
          <Text color="var(--cg-muted)" fontSize="sm">
            Start the Python learning path to track lessons, practice nodes, and tower-defense
            checkpoints here.
          </Text>
        </Box>
      </Box>
    );
  }

  const hasStarted = completedNodeIds.length > 0;

  /* ── Main render ────────────────────────────────────────── */
  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={3} py={2}>
        <Flex justify="space-between" align="center" gap={3}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            learning_path.sys
          </Text>
          <Text fontSize="xs" fontWeight="700">
            {overallProgress}%
          </Text>
        </Flex>
      </Box>

      <Box p={5} bg="rgba(255,255,255,0.14)">
        <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
          <HStack spacing={2}>
            <Box as={FiBookOpen} color="var(--cg-accent-green)" boxSize={4} />
            <Text
              color="var(--cg-accent-green)"
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
              fontWeight="700"
              textTransform="uppercase"
            >
              Python Learning Path
            </Text>
          </HStack>
          <Text color="var(--cg-muted)" fontSize="xs" fontFamily="var(--cg-font-retro-display)">
            {hasStarted ? 'Resume your current module chain.' : 'Ready to begin your first module.'}
          </Text>
        </Flex>

        <Progress
          value={overallProgress}
          mb={4}
          sx={{
            '& > div': {
              background: 'repeating-linear-gradient(90deg, #1f6e2c 0 12px, #2f8d3d 12px 24px)',
            },
          }}
        />

        <VStack spacing={1} align="stretch">
          {modules.map((mod) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              activities={activitiesByModule.get(mod.id) || []}
              completion={completion}
              moduleAvailability={moduleAvailability}
              isActive={mod.id === activeModuleId}
              onClick={() => navigate('/learning/python-path')}
            />
          ))}
        </VStack>

        <Flex justify="flex-end" mt={4}>
          <Button size="sm" onClick={() => navigate('/learning/python-path')}>
            {hasStarted ? 'Open Skill Tree' : 'Start Path'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
