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
  isSimpleDemo = false,
}) {
  return useMemo(() => {
    const requiresFunctionTower = coreTowerRequirements.function !== false;
    const requiresObjectTower = coreTowerRequirements.object !== false;
    const effectiveInitialCodeGenerated = isSimpleDemo
      ? true
      : sharedUnlockActive
        ? true
        : initialCodeGenerated;
    const effectiveFunctionTowerPlaced =
      sharedUnlockActive || !requiresFunctionTower ? true : functionTowerPlaced;
    const effectiveObjectTowerPlaced =
      sharedUnlockActive || !requiresObjectTower ? true : objectTowerPlaced;

    const totalWaves = gameState.totalWaves || totalWavesByDifficulty;

    const isReadyForFinalWave =
      gameState.status === GAME_STATUS.READY || gameState.status === GAME_STATUS.WAVE_COMPLETE;
    const hasValidFinalWave = Number.isFinite(totalWaves) && totalWaves > 0;
    // Simple demo (two-button first activity): SUBMIT appears only right
    // before the final wave — on the wave-complete that precedes it, or once
    // the final wave is ready. Never on load or mid-wave.
    const shouldShowVerificationControls = isSimpleDemo
      ? hasValidFinalWave &&
        isReadyForFinalWave &&
        (gameState.wave === totalWaves ||
          (gameState.status === GAME_STATUS.WAVE_COMPLETE && gameState.wave === totalWaves - 1))
      : effectiveInitialCodeGenerated &&
        hasValidFinalWave &&
        isReadyForFinalWave &&
        gameState.wave === totalWaves;

    // Simple demo: START WAVE shows on ready/wave-complete with no
    // tower-placement or code-generation gates.
    const showStartWaveButton = isSimpleDemo
      ? (gameState.status === 'ready' || gameState.status === GAME_STATUS.WAVE_COMPLETE) &&
        gameState.wave < totalWaves
      : ((gameState.status === 'ready' && effectiveInitialCodeGenerated) ||
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
    isSimpleDemo,
  ]);
}
