import { useCallback } from 'react';

export default function useTowerDefenseReset({
  resetEngineState,
  resetTowerCounts,
  setCode,
  setCodeSubmitted,
  setCodeSubmissionSuccess,
  setFunctionTowerPlaced,
  setInitialCodeGenerated,
  setObjectTowerPlaced,
  setPathOverride,
  setShowSuccessModal,
  setGameStats,
  setTerminalOutput,
  successModalTimer,
  setSuccessModalTimer,
  victoryOutputAppliedRef,
  triggerBootSequence
}) {
  const resetGame = useCallback(() => {
    console.log('[V2Test] Reset game called');
    resetEngineState();
    setPathOverride(null);

    // Reset tower tracking
    setFunctionTowerPlaced(false);
    setObjectTowerPlaced(false);
    setInitialCodeGenerated(false);
    resetTowerCounts();
    setCode('');
    setCodeSubmitted(false);
    setCodeSubmissionSuccess(null);

    // Clean up all state markers related to code generation (CRITICAL FIX for reset bug)
    try {
      console.log('[V2Test] Cleaning up persistent code generation state markers');

      // Clean up localStorage that persists code generation state
      localStorage.removeItem('_tower_defense_code_generated');

      // Remove CSS class from body that tracks code generation
      document.body.classList.remove('initial-code-generated');

      // Remove DOM marker element if it exists
      const stateTracker = document.getElementById('td-code-generated-flag');
      if (stateTracker && stateTracker.parentNode) {
        stateTracker.parentNode.removeChild(stateTracker);
      }

      // Dispatch events to notify components of reset
      document.dispatchEvent(new CustomEvent('codegen-reset'));
      document.dispatchEvent(new CustomEvent('game-completely-reset'));

      console.log('[V2Test] Code generation state markers cleared successfully');
    } catch (error) {
      console.error('[ERROR] Failed to clean up state markers during reset:', error);
    }

    // Reset success modal state
    setShowSuccessModal(false);
    setGameStats(null);
    if (successModalTimer) {
      clearTimeout(successModalTimer);
      setSuccessModalTimer(null);
    }

    // Reset terminal and show initial messages (matching page load)
    victoryOutputAppliedRef.current = false;
    console.log('[V2Test] Clearing terminal output');
    setTerminalOutput(''); // Clear immediately

    // Use setTimeout with longer delay to ensure terminal fully clears before showing new messages
    setTimeout(() => {
      console.log('[V2Test] Adding reset messages to terminal');
      if (typeof triggerBootSequence === 'function') {
        triggerBootSequence();
      }
    }, 100);
  }, [
    resetEngineState,
    resetTowerCounts,
    setCode,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setFunctionTowerPlaced,
    setInitialCodeGenerated,
    setObjectTowerPlaced,
    setPathOverride,
    setShowSuccessModal,
    setGameStats,
    setTerminalOutput,
    successModalTimer,
    setSuccessModalTimer,
    victoryOutputAppliedRef,
    triggerBootSequence
  ]);

  return resetGame;
}
