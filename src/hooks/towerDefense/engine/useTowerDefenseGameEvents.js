import { useCallback } from 'react';
import { processGameEvent } from '@rivie13/premium-core/sync';
import audioManager from '../../../utils/audio/AudioManager';

export default function useTowerDefenseGameEvents({ addTerminalMessage, totalWavesByDifficulty }) {
  const handleWaveStarted = useCallback(
    (data) => {
      processGameEvent(
        'wave-start',
        {
          wave: data.wave,
          enemyCount: data.enemyCount,
        },
        { addTerminalMessage }
      );
    },
    [addTerminalMessage]
  );

  // Combat is terminal-silent: spawns, kills, and breaches play audio cues
  // only. Wave boundaries and player actions still print (see below).
  const handleEnemySpawned = useCallback(() => {}, []);

  const handleEnemyDefeated = useCallback(() => {
    audioManager.playSoundEffect('enemy-defeated');
  }, []);

  const handleEnemyReachedEnd = useCallback(() => {
    audioManager.playSoundEffect('enemy-reach-end');
  }, []);

  const handleTowerUpgraded = useCallback(
    (data) => {
      if (data?.tower) {
        processGameEvent(
          'tower-upgraded',
          {
            towerType: data.tower.type,
            position: data.tower.position,
            level: data.tower.upgradeLevel,
          },
          { addTerminalMessage }
        );
      }
    },
    [addTerminalMessage]
  );

  const handleTowerSold = useCallback(
    (data) => {
      if (data?.refund != null) {
        addTerminalMessage(`[SYSTEM] Module sold for ${data.refund} bits.`);
      }
    },
    [addTerminalMessage]
  );

  const handleWaveComplete = useCallback(
    (data) => {
      const isFinalWave = data.wave >= totalWavesByDifficulty;
      audioManager.playSoundEffect(isFinalWave ? 'level-complete' : 'wave-complete');

      if (data.wave === Math.max(1, totalWavesByDifficulty - 1)) {
        addTerminalMessage(
          `[SUCCESS] Security layer [${data.wave}] breached! CRITICAL: Matrix verification REQUIRED before final ICE wall.`
        );
        addTerminalMessage(
          `[SYSTEM] Wave ${data.wave} complete. Verification protocols REQUIRED for final breach attempt! Response will determine system countermeasures.`
        );
      } else {
        addTerminalMessage(
          `[SUCCESS] Wave ${data.wave} neutralized. System stability maintained. +${data.bonus} databits extracted.`
        );
      }
    },
    [addTerminalMessage, totalWavesByDifficulty]
  );

  const handleEndlessModeStarted = useCallback(
    (data) => {
      addTerminalMessage('[KERNEL] Endless mode engaged. Data fortress defense escalating...');
      addTerminalMessage(
        `[SYSTEM] Endless Wave ${data.wave} initializing (${data.enemyCount} threats detected).`
      );
    },
    [addTerminalMessage]
  );

  const handleEndlessWaveStarted = useCallback(
    (data) => {
      addTerminalMessage(`[SYSTEM] Endless Wave ${data.wave} online. Maintain breach integrity.`);
    },
    [addTerminalMessage]
  );

  const handleEndlessWaveComplete = useCallback(
    (data) => {
      addTerminalMessage(
        `[SUCCESS] Endless Wave ${data.wave} neutralized. Bonus +${data.bonus} breach score.`
      );
    },
    [addTerminalMessage]
  );

  return {
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
  };
}
