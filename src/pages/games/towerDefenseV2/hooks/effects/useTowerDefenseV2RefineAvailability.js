/**
 * Tower Defense V2 - Refinement Availability
 */

import { useEffect } from 'react';

export default function useTowerDefenseV2RefineAvailability({
  isDemo,
  effectiveInitialCodeGenerated,
  isRefining,
  gameStatus,
  setCanRefineSolution
}) {
  useEffect(() => {
    const available =
      !isDemo &&
      localStorage.getItem('user_id') &&
      effectiveInitialCodeGenerated &&
      !isRefining &&
      gameStatus !== 'playing';

    setCanRefineSolution(Boolean(available));
  }, [effectiveInitialCodeGenerated, gameStatus, isDemo, isRefining, setCanRefineSolution]);
}
