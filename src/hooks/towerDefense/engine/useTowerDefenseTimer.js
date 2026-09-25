import { useEffect, useRef, useState } from 'react';
import { GAME_STATUS } from '../../../game-engine-v2';

export default function useTowerDefenseTimer(gameStatus) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerStartRef = useRef(null);

  useEffect(() => {
    const isRunning =
      gameStatus !== GAME_STATUS.GAME_OVER && gameStatus !== GAME_STATUS.LEVEL_COMPLETE;

    if (!isRunning) {
      return;
    }

    if (!timerStartRef.current) {
      timerStartRef.current = Date.now();
    }

    const intervalId = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - timerStartRef.current) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameStatus]);

  return timerSeconds;
}
