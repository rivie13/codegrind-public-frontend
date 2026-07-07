import { useCallback, useEffect } from 'react';

export default function useTowerDefenseV2PlacementState({
  placementPalette,
  setPlacementPalette,
  cancelPlacementMode,
  isTowerPlacementMode,
  addTerminalMessage,
  handleTowerTypeSelect,
  handleDeployableTypeSelect,
  getClearSuggestionQueueForTower,
  resolveTypeKey,
  towerTypes,
  validatedGameSettings
}) {
  const handlePlacementPaletteChange = useCallback((nextPalette) => {
    if (nextPalette === placementPalette) return;
    cancelPlacementMode();
    setPlacementPalette(nextPalette);
  }, [cancelPlacementMode, placementPalette, setPlacementPalette]);

  const handleCancelPlacement = useCallback((source = 'ui') => {
    if (!isTowerPlacementMode) return;
    cancelPlacementMode();
    if (source === 'escape') {
      addTerminalMessage('[SYSTEM] Placement cancelled.');
    }
  }, [addTerminalMessage, cancelPlacementMode, isTowerPlacementMode]);

  const handleTowerSelection = useCallback((towerType) => {
    setPlacementPalette('towers');
    const resolvedKey = resolveTypeKey?.(towerType, towerTypes) || towerType;
    const clearQueue = getClearSuggestionQueueForTower?.();
    clearQueue?.(resolvedKey);
    handleTowerTypeSelect(towerType);
  }, [getClearSuggestionQueueForTower, handleTowerTypeSelect, resolveTypeKey, setPlacementPalette, towerTypes]);

  const handleDeployableSelection = useCallback((deployableType) => {
    setPlacementPalette('deployables');
    handleDeployableTypeSelect(deployableType);
  }, [handleDeployableTypeSelect, setPlacementPalette]);

  useEffect(() => {
    if (validatedGameSettings.deployableMenuEnabled === false && placementPalette === 'deployables') {
      setPlacementPalette('towers');
    }
    if (validatedGameSettings.towerSelectorEnabled === false && validatedGameSettings.deployableMenuEnabled) {
      setPlacementPalette('deployables');
    }
  }, [
    placementPalette,
    setPlacementPalette,
    validatedGameSettings.deployableMenuEnabled,
    validatedGameSettings.towerSelectorEnabled
  ]);

  return {
    handlePlacementPaletteChange,
    handleCancelPlacement,
    handleTowerSelection,
    handleDeployableSelection
  };
}
