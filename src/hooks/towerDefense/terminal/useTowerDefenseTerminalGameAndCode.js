import { useCallback } from 'react';
import { GAME_STATUS } from '../../../game-engine-v2';

export default function useTowerDefenseTerminalGameAndCode({
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
  allowStdStreams = false,
  handleGameHelp,
  handleCodeHelp
}) {
  const handleGameCommand = useCallback((action = 'help') => {
    const normalized = (action || 'help').toLowerCase();
    if (normalized === 'help') {
      handleGameHelp();
      return true;
    }

    if (normalized === 'jack-in') {
      if (gameState.status !== GAME_STATUS.PREHACK) {
        addTerminalSystemMessage('WARNING', 'Neural interface already established.');
        return true;
      }
      handleJackIn?.();
      return true;
    }

    if (normalized === 'start-wave') {
      if (gameState.status === GAME_STATUS.PREHACK) {
        addTerminalSystemMessage('WARNING', 'Jack in before starting a wave. Use /game jack-in.');
        return true;
      }
      if (gameState.status === GAME_STATUS.PLAYING) {
        addTerminalSystemMessage('WARNING', 'Wave already in progress.');
        return true;
      }
      const canStart = ((gameState.status === GAME_STATUS.READY && initialCodeGenerated)
        || gameState.status === GAME_STATUS.WAVE_COMPLETE)
        && gameState.wave < totalWaves;

      if (!canStart) {
        addTerminalSystemMessage('WARNING', 'Wave start unavailable. Deploy core towers or complete current wave first.');
        return true;
      }

      handleStartWave?.();
      return true;
    }

    if (normalized === 'status') {
      const selectedLabel = selectedTower
        ? `${selectedTower.type || selectedTower.key || 'Tower'} #${selectedTower.id}`
        : 'None';
      addTerminalSystemMessage('SYSTEM', `Status: ${gameState.status} | Wave: ${gameState.wave}/${totalWaves}`);
      addTerminalSystemMessage('SYSTEM', `Bits: ${gameState.credits} | Lives: ${gameState.lives} | Selected: ${selectedLabel}`);
      return true;
    }

    if (normalized === 'shorten-path') {
      if (!handleShortenPath) {
        addTerminalSystemMessage('WARNING', 'Path control unavailable.');
        return true;
      }
      handleShortenPath();
      return true;
    }

    if (normalized === 'lengthen-path') {
      if (!handleLengthenPath) {
        addTerminalSystemMessage('WARNING', 'Path control unavailable.');
        return true;
      }
      handleLengthenPath();
      return true;
    }

    if (normalized === 'cancel-placement') {
      if (!handleCancelPlacement || !isPlacementActive) {
        addTerminalSystemMessage('WARNING', 'No active placement to cancel.');
        return true;
      }
      handleCancelPlacement('terminal');
      addTerminalSystemMessage('SYSTEM', 'Placement cancelled.');
      return true;
    }

    addTerminalSystemMessage('WARNING', 'Unknown game command. Try /game help.');
    return true;
  }, [
    addTerminalSystemMessage,
    gameState,
    handleCancelPlacement,
    handleGameHelp,
    handleJackIn,
    handleLengthenPath,
    handleShortenPath,
    handleStartWave,
    initialCodeGenerated,
    isPlacementActive,
    selectedTower,
    totalWaves
  ]);

  const handleCodeCommand = useCallback((action = 'help') => {
    const normalized = (action || 'help').toLowerCase();
    if (normalized === 'help') {
      handleCodeHelp();
      return true;
    }

    if (isExecuting) {
      addTerminalSystemMessage('WARNING', 'Action already running. Please wait.');
      return true;
    }

    if (normalized === 'test') {
      if (gameState.status === GAME_STATUS.PREHACK) {
        addTerminalSystemMessage('WARNING', 'Jack in and deploy core towers before testing.');
        return true;
      }
      if (gameState.status === GAME_STATUS.PLAYING) {
        addTerminalSystemMessage('WARNING', 'Tests are locked during active waves.');
        return true;
      }
      if (!shouldShowVerificationControls) {
        addTerminalSystemMessage('WARNING', 'Code execution unlocks right before the final wave. Complete the current wave to proceed.');
        return true;
      }
      handleRunCode?.();
      return true;
    }

    if (['output', 'stdout', 'stderr'].includes(normalized)) {
      if ((normalized === 'stdout' || normalized === 'stderr') && !allowStdStreams) {
        addTerminalSystemMessage('WARNING', 'Stdout/stderr capture is only available in learning path mode. Use /code output instead.');
        return true;
      }
      if (gameState.status === GAME_STATUS.PREHACK) {
        addTerminalSystemMessage('WARNING', 'Jack in and deploy core towers before capturing output.');
        return true;
      }
      if (gameState.status === GAME_STATUS.PLAYING) {
        addTerminalSystemMessage('WARNING', 'Output capture is locked during active waves.');
        return true;
      }
      if (!shouldShowVerificationControls) {
        addTerminalSystemMessage('WARNING', 'Code output unlocks right before the final wave. Complete the current wave to proceed.');
        return true;
      }
      const filter = normalized === 'output' ? 'both' : normalized;
      handleRunCodeOutput?.(filter);
      return true;
    }

    if (normalized === 'submit') {
      if (!shouldShowVerificationControls) {
        addTerminalSystemMessage('WARNING', 'Verification is only available right before the final wave starts.');
        return true;
      }
      handleSubmitSolution?.();
      return true;
    }

    addTerminalSystemMessage('WARNING', 'Unknown code command. Try /code help.');
    return true;
  }, [
    addTerminalSystemMessage,
    gameState.status,
    handleCodeHelp,
    handleRunCode,
    handleRunCodeOutput,
    handleSubmitSolution,
    isExecuting,
    shouldShowVerificationControls,
    allowStdStreams
  ]);

  return {
    handleGameCommand,
    handleCodeCommand
  };
}
