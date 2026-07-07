import { useCallback } from 'react';

import audioManager from '../../../../../utils/audio/AudioManager';
import { GAME_STATUS } from '../../../../../game-engine-v2';
import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
} from '../../../../../utils/towerDefense/coreTowerRequirements';

export default function useTowerDefenseV2GameActions({
  addTerminalMessage,
  initialCodeGenerated,
  setStatus,
  startEngineWave,
  currentWave,
  cancelPlacementMode,
  coreTowerRequirements = { function: true, object: true },
}) {
  const coreTowerLabelText = formatCoreTowerList(
    getMissingCoreTowerLabels(coreTowerRequirements, {
      functionTowerPlaced: false,
      objectTowerPlaced: false,
    })
  );
  const coreTowerModuleWord = coreTowerLabelText.includes(' and ') ? 'modules' : 'module';

  const handleJackIn = useCallback(() => {
    setStatus(GAME_STATUS.READY);
    audioManager.playSoundEffect('jack-in');
    addTerminalMessage('[KERNEL] _/// NEURAL INTERFACE ESTABLISHED ////_');
    addTerminalMessage('[SYSTEM] Cyberspace intrusion protocols initializing...');
    addTerminalMessage(
      `[ALERT] Deploy ${coreTowerLabelText} ${coreTowerModuleWord} to compile core system architecture.`
    );
  }, [addTerminalMessage, coreTowerLabelText, coreTowerModuleWord, setStatus]);

  const startWave = useCallback(
    (difficulty = 'normal') => {
      if (!initialCodeGenerated) {
        addTerminalMessage(
          `[CRITICAL] Core system architecture not compiled. Deploy ${coreTowerLabelText} ${coreTowerModuleWord} first.`
        );
        return;
      }

      cancelPlacementMode?.();

      const result = startEngineWave(difficulty);
      if (result) {
        addTerminalMessage('[KERNEL] _/// WAVE INITIALIZATION ////_');
        addTerminalMessage(
          `[SYSTEM] Preparing cyberspace defense matrix for Wave ${currentWave}...`
        );
      }
    },
    [
      addTerminalMessage,
      cancelPlacementMode,
      coreTowerLabelText,
      coreTowerModuleWord,
      currentWave,
      initialCodeGenerated,
      startEngineWave,
    ]
  );

  return { handleJackIn, startWave };
}
