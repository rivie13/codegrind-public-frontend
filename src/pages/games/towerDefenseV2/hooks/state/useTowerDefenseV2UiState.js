import { useState } from 'react';

export default function useTowerDefenseV2UiState() {
  const [refinementLimitReached, setRefinementLimitReached] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [canRefineSolution, setCanRefineSolution] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isGeneratingAICode, setIsGeneratingAICode] = useState(false);
  const [currentTowerType, setCurrentTowerType] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTimer, setSuccessModalTimer] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [placementPalette, setPlacementPalette] = useState('towers');
  const [pathOverride, setPathOverride] = useState(null);
  const [lastTerminalCommand, setLastTerminalCommand] = useState('');

  return {
    refinementLimitReached,
    setRefinementLimitReached,
    isWatchingAd,
    setIsWatchingAd,
    isRefining,
    setIsRefining,
    canRefineSolution,
    setCanRefineSolution,
    showAdModal,
    setShowAdModal,
    isGeneratingAICode,
    setIsGeneratingAICode,
    currentTowerType,
    setCurrentTowerType,
    showSuccessModal,
    setShowSuccessModal,
    successModalTimer,
    setSuccessModalTimer,
    gameStats,
    setGameStats,
    placementPalette,
    setPlacementPalette,
    pathOverride,
    setPathOverride,
    lastTerminalCommand,
    setLastTerminalCommand,
  };
}
