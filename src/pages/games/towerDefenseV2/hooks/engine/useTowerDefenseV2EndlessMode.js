import { useCallback } from 'react';

export default function useTowerDefenseV2EndlessMode({
  terminalRef,
  setTerminalOutput,
  setTerminalResetKey,
  startEndlessMode,
  addTerminalMessage,
  setShowSuccessModal
}) {
  const handleEnterEndlessMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      window._victoryScreenDisplayed = false;
      window._gameEventsLocked = false;
    }

    if (typeof document !== 'undefined') {
      document.body.classList.remove('victory-screen-displayed');
      document.dispatchEvent(new CustomEvent('victory-screen-ended', {
        detail: { timestamp: Date.now() }
      }));
    }

    if (terminalRef.current) {
      terminalRef.current._victoryDisplayed = false;
      terminalRef.current.removeAttribute('data-victory-displayed');
      delete terminalRef.current._victoryScreenContent;
    }

    setTerminalOutput('');
    setTerminalResetKey((prev) => prev + 1);
    const started = startEndlessMode?.({ tuning: 'victory' });
    if (!started) {
      addTerminalMessage('[ERROR] Endless mode could not be initialized.');
      return;
    }
    setShowSuccessModal(false);
    addTerminalMessage('[KERNEL] Endless breach protocol engaged. Waves will continue indefinitely.');
  }, [
    addTerminalMessage,
    setShowSuccessModal,
    setTerminalOutput,
    setTerminalResetKey,
    startEndlessMode,
    terminalRef
  ]);

  return { handleEnterEndlessMode };
}
