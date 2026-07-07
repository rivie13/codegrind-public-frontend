/**
 * Tower Defense V2 - Terminal Handlers
 */

import { useMemo } from 'react';

import useTowerDefenseTerminalCommands from '../../../../../hooks/towerDefense/terminal/useTowerDefenseTerminalCommands';
import useTowerDefenseV2TerminalTracking from './useTowerDefenseV2TerminalTracking';

export default function useTowerDefenseV2TerminalHandlers({
  addTerminalMessage,
  gameState,
  effectiveInitialCodeGenerated,
  isLearningMode,
  effectiveFunctionTowerPlaced,
  effectiveObjectTowerPlaced,
  totalWaves,
  isExecuting,
  isTowerPlacementMode,
  getReservedTowerCount,
  getReservedDeployableCount,
  handleTowerTypeSelect,
  handleDeployableTypeSelect,
  reserveTowerPlacement,
  reserveDeployablePlacement,
  resolveTypeKey,
  setPlacementPalette,
  selectedTower,
  selectTowerById,
  handleUpgradeSelectedTower,
  handleSpecialUpgradeSelectedTower,
  handleSellSelectedTower,
  handleJackIn,
  startWave,
  adjustPath,
  handleCancelPlacement,
  handleRunCode,
  handleRunCodeOutput,
  handleSubmitSolution,
  shouldShowVerificationControls,
  towerPlacementLocked,
  allowedTowerTypes,
  coreTowerRequirements,
  isDeployableUnlocked,
  isSpecialUpgradeUnlocked,
  setLastTerminalCommand,
  isHomepageDemo = false,
}) {
  const { handleTerminalCommand, handleCodeLineCommitted, clearSuggestionQueueForTower } =
    useTowerDefenseTerminalCommands({
      addTerminalMessage,
      gameState,
      initialCodeGenerated: effectiveInitialCodeGenerated,
      isLearningMode,
      functionTowerPlaced: effectiveFunctionTowerPlaced,
      objectTowerPlaced: effectiveObjectTowerPlaced,
      totalWaves,
      isExecuting,
      isPlacementActive: isTowerPlacementMode,
      getReservedTowerCount,
      getReservedDeployableCount,
      handleTowerTypeSelect,
      handleDeployableTypeSelect,
      reserveTowerPlacement,
      reserveDeployablePlacement,
      resolveTypeKey,
      setPlacementPalette,
      selectedTower,
      selectTowerById,
      handleUpgradeSelectedTower,
      handleSpecialUpgradeSelectedTower,
      handleSellSelectedTower,
      handleJackIn,
      handleStartWave: () => startWave('normal'),
      handleShortenPath: () => adjustPath('shorten'),
      handleLengthenPath: () => adjustPath('lengthen'),
      handleCancelPlacement,
      handleRunCode,
      handleRunCodeOutput,
      handleSubmitSolution,
      shouldShowVerificationControls,
      towerPlacementLocked,
      allowedTowerTypes,
      coreTowerRequirements,
      isDeployableUnlocked,
      isSpecialUpgradeUnlocked,
      isHomepageDemo,
    });

  const { handleTerminalCommandTracked } = useTowerDefenseV2TerminalTracking({
    setLastTerminalCommand,
    handleTerminalCommand,
  });

  return useMemo(
    () => ({
      handleTerminalCommandTracked,
      handleCodeLineCommitted,
      clearSuggestionQueueForTower,
    }),
    [clearSuggestionQueueForTower, handleCodeLineCommitted, handleTerminalCommandTracked]
  );
}
