import { useEffect, useMemo } from 'react';

import { GAME_STATUS } from '../../../../../game-engine-v2';

export default function useTowerDefenseV2SettingsEffects({
  applyGameSettings,
  gameStateStatus,
  initialCodeGenerated,
  settingsLocked,
  setSettingsLocked,
  validatedGameSettings,
}) {
  const canEditGameSettings = useMemo(
    () =>
      !settingsLocked &&
      (gameStateStatus === GAME_STATUS.READY || gameStateStatus === GAME_STATUS.WAVE_COMPLETE),
    [gameStateStatus, settingsLocked]
  );

  useEffect(() => {
    if (gameStateStatus === GAME_STATUS.READY && !initialCodeGenerated) {
      setSettingsLocked(false);
    }
  }, [gameStateStatus, initialCodeGenerated, setSettingsLocked]);

  useEffect(() => {
    if (!canEditGameSettings) return;
    if (!applyGameSettings) return;

    applyGameSettings(validatedGameSettings, {
      applyToState: gameStateStatus === GAME_STATUS.READY,
    });
  }, [applyGameSettings, canEditGameSettings, gameStateStatus, validatedGameSettings]);

  return { canEditGameSettings };
}
