import { useEffect, useState } from 'react';

export function useTimer(mode) {
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [timeLimit, setTimeLimit] = useState(null);

    useEffect(() => {
        let interval;
        if ((mode === 'ranked' || mode === 'challenge') && isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (timeLimit !== null) {
                        return prev - 1;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, mode, timeLimit]);

    const startTimer = () => {
        if (mode === 'ranked' || mode === 'challenge') {
            setIsTimerRunning(true);
            setHasStarted(true);
        }
    };

    const stopTimer = () => {
        setIsTimerRunning(false);
    };

    const restartTimer = () => {
        if (mode === 'ranked' || mode === 'challenge') {
            setIsTimerRunning(true);
        }
    };

    const setFreshTimer = (time, isCountDown = false) => {
        setTimer(time);
        setIsTimerRunning(false);
        setHasStarted(false);
        setTimeLimit(isCountDown ? time : null);
    };

    return {
        timer,
        isTimerRunning,
        hasStarted,
        startTimer,
        stopTimer,
        restartTimer,
        setFreshTimer
    };
} 