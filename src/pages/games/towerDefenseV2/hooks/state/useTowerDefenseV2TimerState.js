import { useEffect, useMemo } from 'react';

import useTowerDefenseTimer from '../../../../../hooks/towerDefense/engine/useTowerDefenseTimer';

export default function useTowerDefenseV2TimerState({
  gameStatus,
  timerSecondsRef,
  formattedTimeRef
}) {
  const timerSeconds = useTowerDefenseTimer(gameStatus);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timerSeconds]);

  useEffect(() => {
    if (timerSecondsRef) {
      timerSecondsRef.current = timerSeconds;
    }
    if (formattedTimeRef) {
      formattedTimeRef.current = formattedTime;
    }
  }, [formattedTime, formattedTimeRef, timerSeconds, timerSecondsRef]);

  return { timerSeconds, formattedTime };
}
