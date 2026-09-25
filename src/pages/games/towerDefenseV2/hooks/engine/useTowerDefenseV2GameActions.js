import { useCallback } from 'react';

import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
} from '../../../../../utils/towerDefense/coreTowerRequirements';

export default function useTowerDefenseV2GameActions({
  addTerminalMessage,
  initialCodeGenerated,
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

  return { startWave };
}
