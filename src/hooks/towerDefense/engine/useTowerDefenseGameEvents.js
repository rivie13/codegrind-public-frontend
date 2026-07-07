import { useCallback, useEffect, useRef } from 'react';
import { processGameEvent } from '@rivie13/premium-core/sync';
import audioManager from '../../../utils/audio/AudioManager';

const COMBAT_EVENT_FLUSH_MS = 180;

const ENEMY_TYPE_LABELS = {
  basic: 'Security daemon',
  edge: 'Edge-case scanner',
  complex: 'Black ICE construct',
  timeLimit: 'Neural hunter',
  spaceComplex: 'Elite ICE construct',
  hijacker: 'System hijacker',
  buffer: 'Aura buffer node',
  pathShaper: 'Path shaper',
};

const formatEnemyTypeSummary = (typeCounts) => {
  const entries = Object.entries(typeCounts || {}).filter(([, count]) => count > 0);
  if (!entries.length) return 'Security daemon';

  return entries
    .map(([type, count]) => {
      const label = ENEMY_TYPE_LABELS[type] || `${type} protocol`;
      return count === 1 ? `1 ${label}` : `${count} ${label}${label.endsWith('s') ? '' : 's'}`;
    })
    .join(', ');
};

export default function useTowerDefenseGameEvents({
  addTerminalMessage,
  totalWavesByDifficulty,
  livesRef,
}) {
  const combatQueueRef = useRef({
    spawnCount: 0,
    spawnTypes: {},
    defeatedCount: 0,
    defeatedCredits: 0,
    breachCount: 0,
    breachDamage: 0,
    flushTimer: null,
  });

  const flushCombatEvents = useCallback(() => {
    const queue = combatQueueRef.current;
    if (queue.flushTimer) {
      clearTimeout(queue.flushTimer);
      queue.flushTimer = null;
    }

    if (queue.spawnCount > 0) {
      const typeSummary = formatEnemyTypeSummary(queue.spawnTypes);
      addTerminalMessage(
        `[SECURITY] ${typeSummary} deployed. Intrusion countermeasure${queue.spawnCount > 1 ? 's' : ''} activated.`
      );
    }

    if (queue.defeatedCount > 0) {
      audioManager.playSoundEffect('enemy-defeated');
      addTerminalMessage(
        queue.defeatedCount === 1
          ? `[BREACH] Security protocol neutralized. [${queue.defeatedCredits}] databits extracted.`
          : `[BREACH] ${queue.defeatedCount} security protocols neutralized. [${queue.defeatedCredits}] databits extracted.`
      );
    }

    if (queue.breachCount > 0) {
      audioManager.playSoundEffect('enemy-reach-end');
      const remainingLives = Math.max(0, Number(livesRef.current) || 0);
      let breachMessage;
      if (remainingLives <= 3) {
        breachMessage = `[CRITICAL] NEURAL BREACH! ${queue.breachCount} intrusion countermeasure${queue.breachCount > 1 ? 's' : ''} penetrated defenses. ${queue.breachDamage} neural pathway${queue.breachDamage > 1 ? 's' : ''} corrupted. System stability at ${remainingLives * 10}%!`;
      } else if (remainingLives <= 6) {
        breachMessage = `[ALERT] SYSTEM BREACH! ${queue.breachCount} intrusion countermeasure${queue.breachCount > 1 ? 's' : ''} bypassed defenses. ${queue.breachDamage} neural connection${queue.breachDamage > 1 ? 's' : ''} lost. System integrity compromised!`;
      } else {
        breachMessage = `[WARNING] ${queue.breachCount} intrusion countermeasure${queue.breachCount > 1 ? 's' : ''} penetrated security. ${queue.breachDamage} connection${queue.breachDamage > 1 ? 's' : ''} lost. Neural interface destabilizing.`;
      }
      addTerminalMessage(breachMessage);
    }

    queue.spawnCount = 0;
    queue.spawnTypes = {};
    queue.defeatedCount = 0;
    queue.defeatedCredits = 0;
    queue.breachCount = 0;
    queue.breachDamage = 0;
  }, [addTerminalMessage, livesRef]);

  const scheduleCombatFlush = useCallback(() => {
    const queue = combatQueueRef.current;
    if (queue.flushTimer) return;
    queue.flushTimer = setTimeout(() => {
      flushCombatEvents();
    }, COMBAT_EVENT_FLUSH_MS);
  }, [flushCombatEvents]);

  useEffect(() => {
    return () => {
      if (combatQueueRef.current.flushTimer) {
        clearTimeout(combatQueueRef.current.flushTimer);
      }
    };
  }, []);

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

  const handleEnemySpawned = useCallback(
    (data) => {
      const queue = combatQueueRef.current;
      const enemyType = data.enemy?.type || 'basic';
      queue.spawnCount += 1;
      queue.spawnTypes[enemyType] = (queue.spawnTypes[enemyType] || 0) + 1;
      scheduleCombatFlush();
    },
    [scheduleCombatFlush]
  );

  const handleEnemyDefeated = useCallback(
    (data) => {
      const queue = combatQueueRef.current;
      queue.defeatedCount += 1;
      queue.defeatedCredits += Math.max(0, Number(data.reward) || 0);
      scheduleCombatFlush();
    },
    [scheduleCombatFlush]
  );

  const handleEnemyReachedEnd = useCallback(
    (data) => {
      const queue = combatQueueRef.current;
      queue.breachCount += 1;
      queue.breachDamage += Math.max(0, Number(data.damage) || 0);
      scheduleCombatFlush();
    },
    [scheduleCombatFlush]
  );

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
      flushCombatEvents();
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
    [addTerminalMessage, flushCombatEvents, totalWavesByDifficulty]
  );

  const handleEndlessModeStarted = useCallback(
    (data) => {
      flushCombatEvents();
      addTerminalMessage('[KERNEL] Endless mode engaged. Data fortress defense escalating...');
      addTerminalMessage(
        `[SYSTEM] Endless Wave ${data.wave} initializing (${data.enemyCount} threats detected).`
      );
    },
    [addTerminalMessage, flushCombatEvents]
  );

  const handleEndlessWaveStarted = useCallback(
    (data) => {
      flushCombatEvents();
      addTerminalMessage(`[SYSTEM] Endless Wave ${data.wave} online. Maintain breach integrity.`);
    },
    [addTerminalMessage, flushCombatEvents]
  );

  const handleEndlessWaveComplete = useCallback(
    (data) => {
      flushCombatEvents();
      addTerminalMessage(
        `[SUCCESS] Endless Wave ${data.wave} neutralized. Bonus +${data.bonus} breach score.`
      );
    },
    [addTerminalMessage, flushCombatEvents]
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

