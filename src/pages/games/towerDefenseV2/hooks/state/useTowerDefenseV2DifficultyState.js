import { useMemo } from 'react';

import {
  getAutoStartWaveCountdownSeconds,
  getDifficultyBaseStats,
  getDifficultyConfig,
  normalizeProblemDifficulty
} from '../../../../../utils/problems/difficultyConfig';

export default function useTowerDefenseV2DifficultyState({ problem }) {
  const problemDifficulty = useMemo(
    () => normalizeProblemDifficulty(problem?.difficulty),
    [problem?.difficulty]
  );
  const difficultyConfig = useMemo(
    () => getDifficultyConfig(problemDifficulty),
    [problemDifficulty]
  );
  const difficultyBaseStats = useMemo(
    () => getDifficultyBaseStats(problemDifficulty),
    [problemDifficulty]
  );
  const autoStartWaveSeconds = useMemo(
    () => getAutoStartWaveCountdownSeconds(problemDifficulty),
    [problemDifficulty]
  );

  return {
    autoStartWaveSeconds,
    difficultyBaseStats,
    difficultyConfig,
    problemDifficulty
  };
}
