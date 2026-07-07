import { useCallback } from 'react';
import { DEPLOYABLE_TYPES, GAME_STATUS, TOWER_TYPES } from '../../../game-engine-v2';
import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
  isRequiredCoreTower,
} from '../../../utils/towerDefense/coreTowerRequirements';
import { TOWER_VERIFICATION_LOCK_MESSAGE } from '../../../utils/towerDefense/verificationLock';
import useTowerDefenseSuggestionQueue from './useTowerDefenseSuggestionQueue';
import useTowerDefenseTerminalHelp from './useTowerDefenseTerminalHelp';
import useTowerDefenseTerminalGameAndCode from './useTowerDefenseTerminalGameAndCode';

export default function useTowerDefenseTerminalCommands({
  addTerminalMessage,
  gameState,
  initialCodeGenerated,
  isLearningMode,
  functionTowerPlaced,
  objectTowerPlaced,
  totalWaves,
  isExecuting,
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
  handleStartWave,
  handleShortenPath,
  handleLengthenPath,
  handleCancelPlacement,
  handleRunCode,
  handleRunCodeOutput,
  handleSubmitSolution,
  shouldShowVerificationControls,
  isPlacementActive,
  towerPlacementLocked = false,
  allowedTowerTypes = null,
  coreTowerRequirements = { function: true, object: true },
  isDeployableUnlocked,
  isSpecialUpgradeUnlocked,
  isHomepageDemo = false,
}) {
  const addTerminalSystemMessage = useCallback(
    (level, message) => {
      addTerminalMessage(`[${level}] ${message}`);
    },
    [addTerminalMessage]
  );

  const toCommandId = useCallback((props, fallbackKey) => {
    if (props?.conceptKey === 'NON_CODE_BURST') {
      return 'Burst';
    }
    if (props?.conceptKey === 'NON_CODE_AOE') {
      return 'Blast';
    }
    if (props?.type) {
      return props.type.replace(/[^a-zA-Z0-9]/g, '');
    }
    return fallbackKey || '';
  }, []);

  const getAllowedTowerKeys = useCallback(() => {
    const normalize = (value) =>
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const allowedSet = Array.isArray(allowedTowerTypes)
      ? new Set(allowedTowerTypes.map(normalize))
      : null;
    const isTowerAllowed = (towerKey) => {
      if (!allowedSet || allowedSet.size === 0) return true;
      const tower = TOWER_TYPES[towerKey] || {};
      const typeKey = normalize(tower.type || towerKey);
      const conceptKey = normalize(tower.conceptKey);
      const rawKey = normalize(towerKey);
      return allowedSet.has(typeKey) || allowedSet.has(conceptKey) || allowedSet.has(rawKey);
    };

    if (gameState.status === GAME_STATUS.PREHACK) {
      return [];
    }

    if (towerPlacementLocked) {
      return [];
    }

    if (
      gameState.status === GAME_STATUS.PLAYING ||
      gameState.status === GAME_STATUS.WAVE_COMPLETE
    ) {
      return Object.keys(TOWER_TYPES).filter(isTowerAllowed);
    }

    if (!initialCodeGenerated) {
      return Object.keys(TOWER_TYPES).filter((key) => {
        const towerType = TOWER_TYPES[key]?.type;
        if (!isRequiredCoreTower(towerType, coreTowerRequirements)) return false;
        const missing = getMissingCoreTowerLabels(coreTowerRequirements, {
          functionTowerPlaced,
          objectTowerPlaced,
        });
        return missing.includes(towerType) && isTowerAllowed(key);
      });
    }

    return Object.keys(TOWER_TYPES).filter(isTowerAllowed);
  }, [
    allowedTowerTypes,
    coreTowerRequirements,
    functionTowerPlaced,
    gameState.status,
    initialCodeGenerated,
    objectTowerPlaced,
    towerPlacementLocked,
  ]);

  const getAllowedTowerLabels = useCallback(() => {
    const keys = getAllowedTowerKeys();
    return keys.map((key) => {
      const props = TOWER_TYPES[key];
      const label = toCommandId(props, key) || props?.type || key;
      return props?.isNonCode ? `${label} (non-code)` : label;
    });
  }, [getAllowedTowerKeys, toCommandId]);

  const getTowerAvailabilityMessage = useCallback(() => {
    if (gameState.status === GAME_STATUS.PREHACK) {
      return 'Towers locked. Jack in first with /game jack-in.';
    }
    if (towerPlacementLocked) {
      return TOWER_VERIFICATION_LOCK_MESSAGE;
    }
    if (!initialCodeGenerated) {
      const missing = getMissingCoreTowerLabels(coreTowerRequirements, {
        functionTowerPlaced,
        objectTowerPlaced,
      });
      if (missing.length === 0) {
        return 'Core architecture is compiling. Stand by.';
      }
      if (missing.length === 1) {
        return `${missing[0]} tower required next to complete core architecture.`;
      }
      return `Only ${formatCoreTowerList(missing)} towers are available until core code is compiled.`;
    }
    return null;
  }, [
    coreTowerRequirements,
    functionTowerPlaced,
    gameState.status,
    initialCodeGenerated,
    objectTowerPlaced,
    towerPlacementLocked,
  ]);

  const { clearSuggestionQueueForTower, handleCodeLineCommitted, handleSuggestionResponse } =
    useTowerDefenseSuggestionQueue({
      addTerminalSystemMessage,
      gameState,
      getAllowedTowerKeys,
      getReservedTowerCount,
      getTowerAvailabilityMessage,
      handleTowerTypeSelect,
      isHomepageDemo,
      isPlacementActive,
      reserveTowerPlacement,
      setPlacementPalette,
      toCommandId,
    });

  const {
    handleHelpOverview,
    handleTowerHelp,
    handleDeployableHelp,
    handleGameHelp,
    handleCodeHelp,
  } = useTowerDefenseTerminalHelp({
    addTerminalSystemMessage,
    allowStdStreams: Boolean(isLearningMode),
  });

  const { handleGameCommand, handleCodeCommand } = useTowerDefenseTerminalGameAndCode({
    addTerminalSystemMessage,
    gameState,
    totalWaves,
    initialCodeGenerated,
    selectedTower,
    handleJackIn,
    handleStartWave,
    handleShortenPath,
    handleLengthenPath,
    handleCancelPlacement,
    isPlacementActive,
    isExecuting,
    handleRunCode,
    handleRunCodeOutput,
    handleSubmitSolution,
    shouldShowVerificationControls,
    allowStdStreams: Boolean(isLearningMode),
    handleGameHelp,
    handleCodeHelp,
  });

  const handleSnippetResponse = useCallback((rawInput) => {
    if (typeof window === 'undefined') return false;
    const pending = window.__tdPendingSnippet;
    const actions = window.__tdPendingSnippetActions;
    if (!pending || !actions) return false;

    const input = rawInput.trim().toLowerCase();
    if (!input) return false;
    const token = input.startsWith('/') ? input.slice(1) : input;

    if (['accept', 'yes', 'y'].includes(token)) {
      actions.accept?.();
      return true;
    }

    if (['deny', 'no', 'n', 'reject'].includes(token)) {
      actions.deny?.();
      return true;
    }

    if (['retry', 'r', 'again', 'regen'].includes(token)) {
      actions.retry?.();
      return true;
    }

    return false;
  }, []);

  const handleTerminalCommand = useCallback(
    (rawInput) => {
      const input = rawInput.trim();
      if (!input) return;

      addTerminalSystemMessage('SYSTEM', `> ${input}`);

      const handledSnippet = handleSnippetResponse(input);
      if (handledSnippet) {
        return;
      }

      if (!input.startsWith('/')) {
        const handledSuggestion = handleSuggestionResponse(input);
        if (handledSuggestion) {
          return;
        }
      }

      if (!input.startsWith('/')) {
        addTerminalSystemMessage('WARNING', 'Commands must start with /. Try /tower help.');
        return;
      }

      const [root, firstArg = 'help', secondArg, ...rest] = input.split(/\s+/);
      const rootLower = root.toLowerCase();

      if (rootLower === '/help') {
        const target = (firstArg || 'overview').toLowerCase();
        const topic = secondArg || 'overview';
        if (target === 'tower') {
          handleTowerHelp(topic);
          return;
        }
        if (target === 'deployable') {
          handleDeployableHelp(topic);
          return;
        }
        if (target === 'game') {
          handleGameHelp();
          return;
        }
        if (target === 'code') {
          handleCodeHelp();
          return;
        }
        handleHelpOverview();
        return;
      }

      if (rootLower === '/game') {
        handleGameCommand(firstArg);
        return;
      }

      if (rootLower === '/code') {
        handleCodeCommand(firstArg);
        return;
      }

      if (rootLower !== '/tower' && rootLower !== '/deployable') {
        addTerminalSystemMessage('WARNING', 'Unknown command. Try /help.');
        return;
      }

      const isTower = rootLower === '/tower';
      const types = isTower ? TOWER_TYPES : DEPLOYABLE_TYPES;
      const noun = isTower ? 'tower' : 'deployable';
      const actionLower = firstArg.toLowerCase();

      let actionToken = actionLower;
      let targetToken = secondArg;
      let flags = rest;

      if (
        ![
          'help',
          'list',
          'info',
          'buy',
          'upgrade',
          'upgrade-special',
          'sell',
          'select',
          'selected',
          'placed',
        ].includes(actionToken)
      ) {
        if (
          secondArg &&
          ['info', 'buy', 'upgrade', 'sell', 'select'].includes(secondArg.toLowerCase())
        ) {
          actionToken = secondArg.toLowerCase();
          targetToken = firstArg;
          flags = rest;
        }
      }

      if (actionToken === 'help') {
        if (isTower) {
          handleTowerHelp(targetToken || 'overview');
        } else {
          handleDeployableHelp(targetToken || 'overview');
        }
        return;
      }

      if (actionToken === 'list') {
        if (isTower) {
          const labels = getAllowedTowerLabels();
          if (!labels.length) {
            addTerminalSystemMessage(
              'WARNING',
              getTowerAvailabilityMessage() || 'No towers available.'
            );
            return;
          }
          addTerminalSystemMessage('SYSTEM', `Available towers: ${labels.join(', ')}`);
          return;
        }

        if (gameState.status === GAME_STATUS.PREHACK) {
          addTerminalSystemMessage('WARNING', 'Deployables unlock after jack-in.');
          return;
        }

        const labels = Object.keys(types)
          .map((key) => types[key]?.type || key)
          .join(', ');
        addTerminalSystemMessage('SYSTEM', `Available deployables: ${labels}`);
        return;
      }

      if (actionToken === 'placed') {
        if (!isTower) {
          addTerminalSystemMessage('WARNING', 'Placed deployables are not tracked.');
          return;
        }
        if (!gameState.towers?.length) {
          addTerminalSystemMessage('SYSTEM', 'No towers placed yet.');
          return;
        }
        const summary = gameState.towers
          .map(
            (tower) =>
              `${tower.type || 'Tower'}#${tower.id}@${tower.position?.row ?? '?'}:${tower.position?.col ?? '?'}`
          )
          .join(' | ');
        addTerminalSystemMessage('SYSTEM', `Placed towers: ${summary}`);
        return;
      }

      if (actionToken === 'selected') {
        if (!isTower) {
          addTerminalSystemMessage('WARNING', 'Selected target is only available for towers.');
          return;
        }
        if (!selectedTower) {
          addTerminalSystemMessage(
            'SYSTEM',
            'No tower selected. Click a tower on the grid or use /tower select <id>.'
          );
          return;
        }
        addTerminalSystemMessage(
          'SYSTEM',
          `Selected tower: ${selectedTower.type || 'Tower'} #${selectedTower.id}`
        );
        return;
      }

      if (actionToken === 'cancel') {
        if (!handleCancelPlacement || !isPlacementActive) {
          addTerminalSystemMessage('WARNING', 'No active placement to cancel.');
          return;
        }
        handleCancelPlacement('terminal');
        addTerminalSystemMessage('SYSTEM', 'Placement cancelled.');
        return;
      }

      if (actionToken === 'select') {
        if (!isTower) {
          addTerminalSystemMessage('WARNING', 'Select is only available for towers.');
          return;
        }
        const targetId = parseInt(targetToken, 10);
        if (!targetId) {
          addTerminalSystemMessage('WARNING', 'Usage: /tower select <id> (Try /tower placed)');
          return;
        }
        const selected = selectTowerById?.(targetId);
        if (!selected) {
          addTerminalSystemMessage('WARNING', `Tower #${targetId} not found.`);
          return;
        }
        addTerminalSystemMessage('SYSTEM', `Selected tower #${targetId}.`);
        return;
      }

      if (actionToken === 'info') {
        if (isTower) {
          const allowedKeys = getAllowedTowerKeys();
          const targetKey = resolveTypeKey(targetToken, types);
          if (!targetKey || !allowedKeys.includes(targetKey)) {
            const availability = getTowerAvailabilityMessage();
            if (availability) {
              addTerminalSystemMessage('WARNING', availability);
              return;
            }
            addTerminalSystemMessage(
              'WARNING',
              'Unknown tower. Usage: /tower info <id> (Try /tower list)'
            );
            return;
          }
          const props = types[targetKey];
          const description = props?.description || 'No description available.';
          const nonCodeNote = props?.isNonCode ? ' (Non-code tower: no code generation.)' : '';
          addTerminalSystemMessage(
            'SYSTEM',
            `${props.type} (Cost: ${props.cost}) - ${description}${nonCodeNote}`
          );
          return;
        }

        if (gameState.status === GAME_STATUS.PREHACK) {
          addTerminalSystemMessage('WARNING', 'Deployables unlock after jack-in.');
          return;
        }
        const targetKey = resolveTypeKey(targetToken, types);
        if (!targetKey) {
          addTerminalSystemMessage(
            'WARNING',
            'Unknown deployable. Usage: /deployable info <id> (Try /deployable list)'
          );
          return;
        }
        const props = types[targetKey];
        const description = props?.description || 'No description available.';
        addTerminalSystemMessage('SYSTEM', `${props.type} (Cost: ${props.cost}) - ${description}`);
        return;
      }

      if (actionToken === 'buy') {
        if (gameState.status === GAME_STATUS.PLAYING) {
          addTerminalSystemMessage('WARNING', 'Commands are locked during active waves.');
          return;
        }

        if (gameState.status === GAME_STATUS.PREHACK) {
          addTerminalSystemMessage('WARNING', 'Jack in before purchasing. Use /game jack-in.');
          return;
        }

        const reservedCount = isTower ? getReservedTowerCount() : getReservedDeployableCount();
        if (reservedCount > 0) {
          addTerminalSystemMessage('WARNING', `Place your reserved ${noun} before buying another.`);
          return;
        }

        if (isPlacementActive) {
          addTerminalSystemMessage(
            'WARNING',
            `Finish your current ${noun} placement before buying another.`
          );
          return;
        }

        if (isTower) {
          const allowedKeys = getAllowedTowerKeys();
          const targetKey = resolveTypeKey(targetToken, types);
          if (!targetKey || !allowedKeys.includes(targetKey)) {
            const availability = getTowerAvailabilityMessage();
            if (availability) {
              addTerminalSystemMessage('WARNING', availability);
              return;
            }
            addTerminalSystemMessage('WARNING', 'Unknown tower. Try /tower list.');
            return;
          }

          const props = types[targetKey];
          const confirmed = flags.includes('--confirm');
          const commandId = toCommandId(props, targetKey);
          if (!confirmed) {
            addTerminalSystemMessage(
              'WARNING',
              `Confirm purchase: /tower buy ${commandId} --confirm (Cost: ${props.cost})`
            );
            return;
          }

          const result = reserveTowerPlacement(targetKey, 'terminal');

          if (!result?.success) {
            if (result?.reason === 'verification-lock') {
              addTerminalSystemMessage('WARNING', TOWER_VERIFICATION_LOCK_MESSAGE);
              return;
            }
            if (result?.reason === 'credits') {
              addTerminalSystemMessage(
                'FAILURE',
                `Insufficient credits. Need ${result.cost}, you have ${result.credits}.`
              );
            } else {
              addTerminalSystemMessage('FAILURE', 'Unable to reserve tower. Try again.');
            }
            return;
          }

          setPlacementPalette('towers');
          handleTowerTypeSelect(targetKey, 'terminal');
          addTerminalSystemMessage('SUCCESS', `Reserved ${props.type}. Place it on the map.`);
          return;
        }

        const targetKey = resolveTypeKey(targetToken, types);
        if (!targetKey) {
          addTerminalSystemMessage('WARNING', 'Unknown deployable. Try /deployable list.');
          return;
        }

        const props = types[targetKey];
        const confirmed = flags.includes('--confirm');
        const commandId = toCommandId(props, targetKey);
        if (!confirmed) {
          addTerminalSystemMessage(
            'WARNING',
            `Confirm purchase: /deployable buy ${commandId} --confirm (Cost: ${props.cost})`
          );
          return;
        }

        if (isDeployableUnlocked && !isDeployableUnlocked(targetKey)) {
          addTerminalSystemMessage(
            'WARNING',
            'Deployable locked: requires level and store purchase.'
          );
          return;
        }

        const result = reserveDeployablePlacement(targetKey, 'terminal');
        if (!result?.success) {
          if (result?.reason === 'credits') {
            addTerminalSystemMessage(
              'FAILURE',
              `Insufficient credits. Need ${result.cost}, you have ${result.credits}.`
            );
          } else {
            addTerminalSystemMessage('FAILURE', 'Unable to reserve deployable. Try again.');
          }
          return;
        }

        setPlacementPalette('deployables');
        handleDeployableTypeSelect(targetKey, 'terminal');
        addTerminalSystemMessage('SUCCESS', `Reserved ${props.type}. Place it on the map.`);
        return;
      }

      if (actionToken === 'upgrade' || actionToken === 'upgrade-special') {
        if (!isTower) {
          addTerminalSystemMessage('WARNING', 'Upgrade is only available for towers.');
          return;
        }
        if (!selectedTower) {
          addTerminalSystemMessage(
            'WARNING',
            'Select a tower on the grid or use /tower select <id> before upgrading.'
          );
          return;
        }
        const specialUpgrade =
          actionToken === 'upgrade-special' ||
          flags.includes('--special') ||
          targetToken?.toLowerCase() === 'special';
        if (specialUpgrade && isSpecialUpgradeUnlocked && selectedTower) {
          const nextTier = (selectedTower.specialUpgradeLevel ?? 0) + 1;
          if (!isSpecialUpgradeUnlocked(selectedTower.type, nextTier)) {
            addTerminalSystemMessage(
              'WARNING',
              `Special upgrade tier ${nextTier} is locked: requires level and store purchase.`
            );
            return;
          }
        }
        const success = specialUpgrade
          ? handleSpecialUpgradeSelectedTower?.()
          : handleUpgradeSelectedTower?.();
        if (success) {
          addTerminalSystemMessage(
            'SUCCESS',
            specialUpgrade ? 'Special upgrade applied.' : 'Upgrade applied.'
          );
        }
        return;
      }

      if (actionToken === 'sell') {
        if (!isTower) {
          addTerminalSystemMessage('WARNING', 'Sell is only available for towers.');
          return;
        }
        if (!selectedTower) {
          addTerminalSystemMessage(
            'WARNING',
            'Select a tower on the grid or use /tower select <id> before selling.'
          );
          return;
        }
        const success = handleSellSelectedTower?.();
        if (success) {
          addTerminalSystemMessage('SUCCESS', 'Tower sold.');
        }
        return;
      }

      addTerminalSystemMessage('WARNING', `Unknown ${noun} command. Try /${noun} help.`);
    },
    [
      addTerminalSystemMessage,
      handleSuggestionResponse,
      gameState,
      getAllowedTowerKeys,
      getAllowedTowerLabels,
      getTowerAvailabilityMessage,
      getReservedDeployableCount,
      getReservedTowerCount,
      handleCodeCommand,
      handleCodeHelp,
      handleDeployableHelp,
      handleGameHelp,
      handleGameCommand,
      handleHelpOverview,
      handleSnippetResponse,
      handleTowerHelp,
      handleDeployableTypeSelect,
      handleSellSelectedTower,
      handleSpecialUpgradeSelectedTower,
      handleCancelPlacement,
      handleTowerTypeSelect,
      handleUpgradeSelectedTower,
      isPlacementActive,
      reserveDeployablePlacement,
      reserveTowerPlacement,
      resolveTypeKey,
      selectedTower,
      selectTowerById,
      setPlacementPalette,
      toCommandId,
    ]
  );

  return {
    handleTerminalCommand,
    handleCodeLineCommitted,
    clearSuggestionQueueForTower,
  };
}
