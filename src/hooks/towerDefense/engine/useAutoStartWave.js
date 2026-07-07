import { useEffect, useRef, useState } from 'react';

export default function useAutoStartWave({
  autoStartEnabled,
  autoStartWaveSeconds,
  gameStatus,
  currentWave,
  totalWaves,
  initialCodeGenerated,
  startWave,
  readyStatus,
  waveCompleteStatus
}) {
  const [autoStartCountdown, setAutoStartCountdown] = useState(null);
  const autoStartIntervalRef = useRef(null);
  const autoStartDeadlineRef = useRef(null);

  useEffect(() => {
    if (!autoStartEnabled) {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
      autoStartDeadlineRef.current = null;
      setAutoStartCountdown(null);
      return;
    }

    const canAutoStart =
      ((gameStatus === readyStatus && initialCodeGenerated) ||
        gameStatus === waveCompleteStatus) &&
      currentWave < totalWaves;

    if (!canAutoStart) {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
      autoStartDeadlineRef.current = null;
      setAutoStartCountdown(null);
      return;
    }

    const deadline = Date.now() + autoStartWaveSeconds * 1000;
    autoStartDeadlineRef.current = deadline;
    setAutoStartCountdown(autoStartWaveSeconds);

    if (autoStartIntervalRef.current) {
      clearInterval(autoStartIntervalRef.current);
    }

    autoStartIntervalRef.current = setInterval(() => {
      const remainingMs = (autoStartDeadlineRef.current || 0) - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      setAutoStartCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
        autoStartDeadlineRef.current = null;
        setAutoStartCountdown(null);
        startWave('normal');
      }
    }, 250);

    return () => {
      if (autoStartIntervalRef.current) {
        clearInterval(autoStartIntervalRef.current);
        autoStartIntervalRef.current = null;
      }
    };
  }, [
    autoStartEnabled,
    autoStartWaveSeconds,
    currentWave,
    gameStatus,
    initialCodeGenerated,
    readyStatus,
    startWave,
    totalWaves,
    waveCompleteStatus
  ]);

  return autoStartCountdown;
}
