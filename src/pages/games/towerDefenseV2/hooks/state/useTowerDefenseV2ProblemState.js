/**
 * Tower Defense V2 - Problem State
 */

import { useMemo } from 'react';

import useProblemData from '../../../../../hooks/towerDefense/engine/data/useProblemData';

export default function useTowerDefenseV2ProblemState({
  activeTitleSlug,
  isLearningMode,
  isMultiProblemTower,
  learningNodeId,
  learningPathSlug,
  learningPathTitleSlug,
  learningProblemSlugs,
  sharedLearningMap,
  setSharedLearningMap,
  clearChatHistory,
}) {
  const sharedMapSeedKey = useMemo(() => {
    if (!isMultiProblemTower) return null;
    return (
      learningPathSlug ||
      learningPathTitleSlug ||
      learningProblemSlugs[0] ||
      activeTitleSlug ||
      null
    );
  }, [
    activeTitleSlug,
    isMultiProblemTower,
    learningPathSlug,
    learningPathTitleSlug,
    learningProblemSlugs,
  ]);

  const learningMapSeedKey = useMemo(() => {
    if (!isLearningMode) return null;

    // Keep the initial seed deterministic so the server-rendered tree and the
    // client hydration tree generate the same learning map.
    return isMultiProblemTower
      ? sharedMapSeedKey
      : learningNodeId ||
          activeTitleSlug ||
          learningProblemSlugs[0] ||
          learningPathSlug ||
          learningPathTitleSlug ||
          null;
  }, [
    activeTitleSlug,
    isLearningMode,
    isMultiProblemTower,
    learningNodeId,
    learningPathSlug,
    learningPathTitleSlug,
    learningProblemSlugs,
    sharedMapSeedKey,
  ]);

  const {
    problem,
    error: problemError,
    generatedMap,
    renderProblemDescription,
  } = useProblemData(activeTitleSlug, clearChatHistory, null, {
    sourceHint: isLearningMode ? 'learning' : null,
    sharedMap: isMultiProblemTower ? sharedLearningMap : null,
    setSharedMap: isMultiProblemTower ? setSharedLearningMap : null,
    preserveMapOnSlugChange: isMultiProblemTower,
    mapSeedKey: learningMapSeedKey,
    preserveChatOnSlugChange: isMultiProblemTower,
  });

  const problemDescription = useMemo(() => {
    if (typeof renderProblemDescription === 'function') {
      return renderProblemDescription();
    }

    if (!problem) return null;

    return {
      title: problem.title,
      description: problem.description || '',
      content: problem.content || problem.description || '',
      examples: Array.isArray(problem.examples) ? problem.examples : [],
      constraints: problem.constraints || '',
      difficulty: problem.difficulty || '',
      isAIProblem: Boolean(problem.isAIProblem),
    };
  }, [problem, renderProblemDescription]);

  return {
    sharedMapSeedKey,
    problem,
    problemError,
    generatedMap,
    renderProblemDescription,
    problemDescription,
  };
}
