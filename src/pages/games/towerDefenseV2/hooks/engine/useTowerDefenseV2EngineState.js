/**
 * Tower Defense V2 - Engine State
 */

import { useCallback } from 'react';

import useTowerDefenseGameEvents from '../../../../../hooks/towerDefense/engine/useTowerDefenseGameEvents';
import useTowerDefenseVictoryHandlers from '../../../../../hooks/towerDefense/engine/useTowerDefenseVictoryHandlers';
import useTowerDefenseV2Engine from '../../../../../hooks/towerDefense/engine/useTowerDefenseV2Engine';
import useTowerDefenseV2TowerPlacementHandler from './useTowerDefenseV2TowerPlacementHandler';
import audioManager from '../../../../../utils/audio/AudioManager';

export default function useTowerDefenseV2EngineState({
  pathNodes,
  gridCols,
  gridRows,
  cellSize,
  difficultyBaseStats,
  validatedGameSettings,
  problemDifficulty,
  playerLevel,
  isTowerUnlocked,
  isDeployableUnlocked,
  isSpecialUpgradeUnlocked,
  addTerminalMessage,
  towerPlacementLocked,
  isLearningMode,
  learningUnlockActive,
  livesRef,
  creditsRef,
  victoryOutputAppliedRef,
  initialLives,
  isDemo,
  isHomepageDemo,
  normalizeTerminalOutput,
  onEmbeddedVictory,
  setGameStats,
  setShowSuccessModal,
  setSuccessModalTimer,
  setTerminalOutput,
  submitTowerDefenseEndless,
  submitTowerDefenseWin,
  getGuestXpPreview,
  successModalTimer,
  timerSecondsRef,
  formattedTimeRef,
  functionTowerPlaced,
  objectTowerPlaced,
  initialCodeGenerated,
  effectiveInitialCodeGenerated,
  setFunctionTowerPlaced,
  setObjectTowerPlaced,
  setInitialCodeGenerated,
  setCode,
  code,
  addTowerCodeSnippet,
  getCodeSnippetForLanguage,
  language,
  problem,
  coreTowerRequirements,
  waveRef,
  codeSubmissionSuccess,
  totalWavesByDifficulty,
  rendererCosmetics,
}) {
  const {
    handleWaveStarted,
    handleEnemySpawned,
    handleEnemyDefeated,
    handleEnemyReachedEnd,
    handleTowerUpgraded,
    handleTowerSold,
    handleWaveComplete,
    handleEndlessModeStarted,
    handleEndlessWaveStarted,
    handleEndlessWaveComplete,
  } = useTowerDefenseGameEvents({
    addTerminalMessage,
    totalWavesByDifficulty,
    livesRef,
  });

  const handleTowerSpecialUpgraded = useCallback(
    (data) => {
      if (data?.tower) {
        addTerminalMessage(
          `[UPGRADE] ${data.tower.type} special module enhanced to tier ${data.tower.specialUpgradeLevel}.`
        );
        audioManager.playSoundEffect('tower-special-upgraded');
      }
    },
    [addTerminalMessage]
  );

  const { handleLevelComplete, handleGameOver } = useTowerDefenseVictoryHandlers({
    addTerminalMessage,
    creditsRef,
    livesRef,
    victoryOutputAppliedRef,
    codeSubmissionSuccess,
    initialLives,
    isDemo,
    normalizeTerminalOutput,
    onEmbeddedVictory,
    setGameStats,
    setShowSuccessModal,
    setSuccessModalTimer,
    setTerminalOutput,
    submitTowerDefenseEndless,
    submitTowerDefenseWin,
    getGuestXpPreview,
    successModalTimer,
    timerSecondsRef,
    formattedTimeRef,
  });

  const handleTowerPlaced = useTowerDefenseV2TowerPlacementHandler({
    addTerminalMessage,
    functionTowerPlaced,
    objectTowerPlaced,
    initialCodeGenerated,
    effectiveInitialCodeGenerated,
    isLearningMode,
    learningUnlockActive,
    setFunctionTowerPlaced,
    setObjectTowerPlaced,
    setInitialCodeGenerated,
    setCode,
    code,
    addTowerCodeSnippet,
    getCodeSnippetForLanguage,
    language,
    problem,
    coreTowerRequirements,
    waveRef,
    isHomepageDemo,
  });

  const engineState = useTowerDefenseV2Engine({
    pathNodes,
    gridCols,
    gridRows,
    cellSize,
    initialCredits: difficultyBaseStats.initialCredits,
    initialLives: difficultyBaseStats.initialLives,
    totalWaves: validatedGameSettings.totalWaves || difficultyBaseStats.totalWaves,
    problemDifficulty,
    playerLevel,
    showPlacementHints: isHomepageDemo,
    isTowerUnlocked,
    isDeployableUnlocked,
    isSpecialUpgradeUnlocked,
    addTerminalMessage,
    towerPlacementLocked,
    onWaveStarted: handleWaveStarted,
    onEnemySpawned: handleEnemySpawned,
    onEnemyDefeated: handleEnemyDefeated,
    onEnemyReachedEnd: handleEnemyReachedEnd,
    onTowerUpgraded: handleTowerUpgraded,
    onTowerSpecialUpgraded: handleTowerSpecialUpgraded,
    onTowerSold: handleTowerSold,
    onWaveComplete: handleWaveComplete,
    onLevelComplete: handleLevelComplete,
    onGameOver: handleGameOver,
    onTowerPlaced: handleTowerPlaced,
    onEndlessModeStarted: handleEndlessModeStarted,
    onEndlessWaveStarted: handleEndlessWaveStarted,
    onEndlessWaveComplete: handleEndlessWaveComplete,
    rendererCosmetics,
  });

  const resolveHasTowerType = useCallback(
    (towerType) => {
      if (!towerType) return false;
      const targetType = typeof towerType === 'string' ? towerType : towerType?.type;
      const normalizedTarget = String(targetType || towerType).toLowerCase();
      return Boolean(
        engineState?.gameState?.towers?.some((tower) => {
          const candidate = tower?.type || tower?.towerType || tower?.tower_type || '';
          return String(candidate).toLowerCase() === normalizedTarget;
        })
      );
    },
    [engineState?.gameState?.towers]
  );

  return {
    ...engineState,
    resolveHasTowerType,
  };
}
