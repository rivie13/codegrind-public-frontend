/**
 * Tower Defense V2 - Derived State
 */

import { useMemo } from 'react';

import { GAME_STATUS } from '../../../../../game-engine-v2';

export default function useTowerDefenseV2DerivedState({
  gameState,
  initialCodeGenerated,
  functionTowerPlaced,
  objectTowerPlaced,
  coreTowerRequirements = { function: true, object: true },
  sharedUnlockActive,
  totalWavesByDifficulty,
}) {
  return useMemo(() => {
    const requiresFunctionTower = coreTowerRequirements.function !== false;
    const requiresObjectTower = coreTowerRequirements.object !== false;
    const effectiveInitialCodeGenerated = sharedUnlockActive ? true : initialCodeGenerated;
    const effectiveFunctionTowerPlaced =
      sharedUnlockActive || !requiresFunctionTower ? true : functionTowerPlaced;
    const effectiveObjectTowerPlaced =
      sharedUnlockActive || !requiresObjectTower ? true : objectTowerPlaced;

    const totalWaves = gameState.totalWaves || totalWavesByDifficulty;

    const isReadyForFinalWave =
      gameState.status === GAME_STATUS.READY || gameState.status === GAME_STATUS.WAVE_COMPLETE;
    const hasValidFinalWave = Number.isFinite(totalWaves) && totalWaves > 0;
    const shouldShowVerificationControls =
      effectiveInitialCodeGenerated &&
      hasValidFinalWave &&
      isReadyForFinalWave &&
      gameState.wave === totalWaves;

    const showJackInButton = gameState.status === GAME_STATUS.PREHACK;
    const showStartWaveButton =
      ((gameState.status === 'ready' && effectiveInitialCodeGenerated) ||
        gameState.status === GAME_STATUS.WAVE_COMPLETE) &&
      gameState.wave < totalWaves;

    return {
      effectiveInitialCodeGenerated,
      effectiveFunctionTowerPlaced,
      effectiveObjectTowerPlaced,
      totalWaves,
      isReadyForFinalWave,
      hasValidFinalWave,
      shouldShowVerificationControls,
      showJackInButton,
      showStartWaveButton,
    };
  }, [
    functionTowerPlaced,
    coreTowerRequirements,
    gameState.status,
    gameState.totalWaves,
    gameState.wave,
    initialCodeGenerated,
    objectTowerPlaced,
    sharedUnlockActive,
    totalWavesByDifficulty,
  ]);
}
