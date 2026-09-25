/**
 * Tower Defense V2 - Game Controls
 */

import { useMemo } from 'react';

import useAutoStartWave from '../../../../../hooks/towerDefense/engine/useAutoStartWave';
import useTowerDefenseV2GameActions from './useTowerDefenseV2GameActions';
import { GAME_STATUS } from '../../../../../game-engine-v2';

export default function useTowerDefenseV2GameControls({
  addTerminalMessage,
  effectiveInitialCodeGenerated,
  startEngineWave,
  currentWave,
  cancelPlacementMode,
  autoStartEnabled,
  autoStartWaveSeconds,
  gameStatus,
  totalWaves,
  coreTowerRequirements,
}) {
  const { startWave } = useTowerDefenseV2GameActions({
    addTerminalMessage,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    startEngineWave,
    currentWave,
    cancelPlacementMode,
    coreTowerRequirements,
  });

  const autoStartCountdown = useAutoStartWave({
    autoStartEnabled,
    autoStartWaveSeconds,
    gameStatus,
    currentWave,
    totalWaves,
    initialCodeGenerated: effectiveInitialCodeGenerated,
    startWave,
    readyStatus: GAME_STATUS.READY,
    waveCompleteStatus: GAME_STATUS.WAVE_COMPLETE,
  });

  return useMemo(
    () => ({
      startWave,
      autoStartCountdown,
    }),
    [autoStartCountdown, startWave]
  );
}
