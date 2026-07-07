/**
 * Tower Defense V2 - Learning State
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getNextLearningNode } from '../../../../../utils/learning/learningPathNavigation';
import useLearningPathData from '../../../../../hooks/useLearningPathData';

export default function useTowerDefenseV2LearningState({
  isDemo = false,
  demoTitleSlug = null,
  learningPathTitleSlug = null,
  learningPathSlug = null,
  learningPathOnboarding = false,
  learningTowerConfig = null,
  learningPathMeta = null,
  learningIsCapstone = false,
  titleSlug = null
}) {
  const navigate = useNavigate();
  const isLearningMode = Boolean(learningPathTitleSlug || learningPathOnboarding);

  const learningProblemSlugs = useMemo(() => {
    if (learningTowerConfig?.multiTab && Array.isArray(learningTowerConfig?.learningProblemSlugs)) {
      return learningTowerConfig.learningProblemSlugs.filter(Boolean);
    }
    if (learningTowerConfig?.learningProblemSlug) {
      return [learningTowerConfig.learningProblemSlug];
    }
    if (Array.isArray(learningTowerConfig?.learningProblemSlugs)) {
      return learningTowerConfig.learningProblemSlugs.filter(Boolean);
    }
    return [];
  }, [learningTowerConfig]);

  const [activeProblemIndex, setActiveProblemIndex] = useState(0);

  const resolvedLearningSlug = learningProblemSlugs[activeProblemIndex]
    || learningTowerConfig?.learningProblemSlug
    || (Array.isArray(learningTowerConfig?.learningProblemSlugs)
      ? learningTowerConfig.learningProblemSlugs[0]
      : null);

  const activeTitleSlug = (isLearningMode
    ? (learningProblemSlugs[activeProblemIndex] || resolvedLearningSlug || learningPathTitleSlug)
    : learningPathTitleSlug)
    || (isDemo ? demoTitleSlug : (titleSlug || null));

  useEffect(() => {
    if (!learningProblemSlugs.length) return;
    if (activeProblemIndex < learningProblemSlugs.length) return;
    setActiveProblemIndex(0);
  }, [activeProblemIndex, learningProblemSlugs.length]);

  const resolvedLearningPathSlug = learningPathSlug
    || (learningPathMeta?.pathId || null)
    || null;

  const { pathData: learningPathData } = useLearningPathData(resolvedLearningPathSlug);
  const learningNodeId = learningPathMeta?.nodeId || null;

  const learningNextNode = useMemo(() => (
    getNextLearningNode(learningPathData, learningNodeId, learningPathMeta?.moduleId)
  ), [learningPathData, learningNodeId, learningPathMeta?.moduleId]);

  const learningReturnPath = useMemo(() => {
    if (!resolvedLearningPathSlug) return '/learning/python-path';
    if (!learningPathMeta?.moduleId) return `/learning/${resolvedLearningPathSlug}`;
    return `/learning/${resolvedLearningPathSlug}?module=${encodeURIComponent(learningPathMeta.moduleId)}`;
  }, [learningPathMeta?.moduleId, resolvedLearningPathSlug]);

  const buildLearningRoute = useCallback((node) => {
    if (!node || !resolvedLearningPathSlug) return null;
    if (node.type === 'tower') {
      return `/learning/${resolvedLearningPathSlug}/tower/${node.id}`;
    }
    if (node.type === 'learn') {
      return `/learning/${resolvedLearningPathSlug}/${node.id}`;
    }
    if (node.type === 'workspace' || node.type === 'final') {
      const slug = node.content?.learningProblemSlug || null;
      if (slug) return `/learning/${resolvedLearningPathSlug}/problems/${slug}`;
      return `/learning/${resolvedLearningPathSlug}/${node.id}`;
    }
    return `/learning/${resolvedLearningPathSlug}`;
  }, [resolvedLearningPathSlug]);

  const learningNextRoute = useMemo(
    () => buildLearningRoute(learningNextNode),
    [buildLearningRoute, learningNextNode]
  );

  const handleContinueLearning = useCallback(() => {
    if (!learningNextRoute || !learningNextNode) {
      navigate(learningReturnPath);
      return;
    }

    const nextLearningPath = {
      ...(learningPathMeta || {}),
      nodeId: learningNextNode.id,
      moduleId: learningNextNode.moduleId || learningPathMeta?.moduleId || null
    };

    navigate(learningNextRoute, { state: { learningMode: true, learningPath: nextLearningPath } });
  }, [learningNextNode, learningNextRoute, learningReturnPath, learningPathMeta, navigate]);

  const handleReturnToMap = useCallback(() => {
    navigate(learningReturnPath);
  }, [learningReturnPath, navigate]);

  const canEnterEndlessMode = !isLearningMode || learningIsCapstone;

  const isMultiProblemTower = Boolean(
    isLearningMode && learningTowerConfig?.multiTab && learningProblemSlugs.length > 1
  );

  return {
    isLearningMode,
    learningProblemSlugs,
    activeProblemIndex,
    setActiveProblemIndex,
    resolvedLearningSlug,
    activeTitleSlug,
    resolvedLearningPathSlug,
    learningPathData,
    learningNodeId,
    learningNextNode,
    learningNextRoute,
    learningReturnPath,
    buildLearningRoute,
    handleContinueLearning,
    handleReturnToMap,
    canEnterEndlessMode,
    isMultiProblemTower
  };
}
