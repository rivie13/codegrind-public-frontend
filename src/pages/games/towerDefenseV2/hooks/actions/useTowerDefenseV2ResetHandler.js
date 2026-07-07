/**
 * Tower Defense V2 - Reset Handler
 */

import { useCallback, useMemo } from 'react';

import useTowerDefenseReset from '../../../../../hooks/towerDefense/engine/useTowerDefenseReset';

export default function useTowerDefenseV2ResetHandler({
  addTerminalMessage,
  pathNodes,
  resetEngineState,
  resetTowerCounts,
  setCode,
  setCodeSubmitted,
  setCodeSubmissionSuccess,
  setFunctionTowerPlaced,
  setInitialCodeGenerated,
  setObjectTowerPlaced,
  setPathOverride,
  setShowSuccessModal,
  setGameStats,
  setTerminalOutput,
  successModalTimer,
  setSuccessModalTimer,
  victoryOutputAppliedRef,
  resetSharedUnlock,
  resetMultiProblemEditors
}) {
  const resetGame = useTowerDefenseReset({
    addTerminalMessage,
    pathNodes,
    resetEngineState,
    resetTowerCounts,
    setCode,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setFunctionTowerPlaced,
    setInitialCodeGenerated,
    setObjectTowerPlaced,
    setPathOverride,
    setShowSuccessModal,
    setGameStats,
    setTerminalOutput,
    successModalTimer,
    setSuccessModalTimer,
    victoryOutputAppliedRef
  });

  const handleResetGame = useCallback(() => {
    resetSharedUnlock();
    if (typeof resetMultiProblemEditors === 'function') {
      resetMultiProblemEditors();
    }
    resetGame();
  }, [resetGame, resetMultiProblemEditors, resetSharedUnlock]);

  return useMemo(() => ({
    resetGame,
    handleResetGame
  }), [handleResetGame, resetGame]);
}
