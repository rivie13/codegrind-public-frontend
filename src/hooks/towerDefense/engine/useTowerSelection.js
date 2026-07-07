import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTowerSelection({ gameState, rendererRef }) {
  const [selectedTower, setSelectedTower] = useState(null);
  const selectedTowerIdRef = useRef(null);

  const clearSelectedTower = useCallback(() => {
    setSelectedTower(null);
    selectedTowerIdRef.current = null;
    if (rendererRef.current) {
      if (typeof rendererRef.current.setSelectedTower === 'function') {
        rendererRef.current.setSelectedTower(null);
      } else {
        rendererRef.current.selectedTowerId = null;
      }
    }
  }, [rendererRef]);

  const selectTowerById = useCallback((towerId) => {
    if (!towerId) return false;
    const targetTower = gameState.towers.find(t => t.id === towerId);
    if (!targetTower) return false;
    setSelectedTower(targetTower);
    selectedTowerIdRef.current = targetTower.id;
    if (rendererRef.current) {
      if (typeof rendererRef.current.setSelectedTower === 'function') {
        rendererRef.current.setSelectedTower(targetTower.id);
      } else {
        rendererRef.current.selectedTowerId = targetTower.id;
      }
    }
    return true;
  }, [gameState.towers, rendererRef]);

  const selectTower = useCallback((tower) => {
    if (!tower) return false;
    setSelectedTower(tower);
    selectedTowerIdRef.current = tower.id;
    if (rendererRef.current) {
      if (typeof rendererRef.current.setSelectedTower === 'function') {
        rendererRef.current.setSelectedTower(tower.id);
      } else {
        rendererRef.current.selectedTowerId = tower.id;
      }
    }
    return true;
  }, [rendererRef]);

  useEffect(() => {
    const selectedTowerId = selectedTowerIdRef.current;
    if (!selectedTowerId) return;
    const updatedTower = gameState.towers.find(t => t.id === selectedTowerId);
    if (updatedTower) {
      setSelectedTower(updatedTower);
      return;
    }
    clearSelectedTower();
  }, [gameState.towers, clearSelectedTower]);

  return {
    selectedTower,
    selectedTowerIdRef,
    clearSelectedTower,
    selectTower,
    selectTowerById
  };
}
