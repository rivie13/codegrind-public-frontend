import { useCallback, useEffect, useRef, useState } from 'react';

export default function useProblemAutoSwitch({
  activeTitleSlug,
  rightPanel,
  setLeftPanel,
  setRightPanel,
  problemDescription,
  problem,
  defaultLeftPanel,
  defaultRightPanel,
  autoSwitchSeconds = 90,
  onAutoSwitch,
  preservePanelsOnSlugChange = false
}) {
  const [problemAutoSwitchRemaining, setProblemAutoSwitchRemaining] = useState(null);
  const [problemAutoSwitchActive, setProblemAutoSwitchActive] = useState(false);
  const [showProblemIntroNote, setShowProblemIntroNote] = useState(true);
  const problemAutoSwitchIntervalRef = useRef(null);
  const problemAutoSwitchTimeoutRef = useRef(null);
  const problemAutoSwitchCancelledRef = useRef(false);
  const problemAutoSwitchStartedRef = useRef(false);

  const clearProblemAutoSwitchTimers = useCallback(() => {
    if (problemAutoSwitchIntervalRef.current) {
      clearInterval(problemAutoSwitchIntervalRef.current);
      problemAutoSwitchIntervalRef.current = null;
    }
    if (problemAutoSwitchTimeoutRef.current) {
      clearTimeout(problemAutoSwitchTimeoutRef.current);
      problemAutoSwitchTimeoutRef.current = null;
    }
  }, []);

  const cancelProblemAutoSwitch = useCallback(() => {
    problemAutoSwitchCancelledRef.current = true;
    setProblemAutoSwitchActive(false);
    setProblemAutoSwitchRemaining(null);
    clearProblemAutoSwitchTimers();
  }, [clearProblemAutoSwitchTimers]);

  const startProblemAutoSwitch = useCallback(() => {
    if (problemAutoSwitchStartedRef.current || problemAutoSwitchCancelledRef.current) return;
    problemAutoSwitchStartedRef.current = true;
    setProblemAutoSwitchActive(true);
    setProblemAutoSwitchRemaining(autoSwitchSeconds);

    problemAutoSwitchIntervalRef.current = setInterval(() => {
      setProblemAutoSwitchRemaining((prev) => {
        if (prev === null || prev === undefined) return prev;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    problemAutoSwitchTimeoutRef.current = setTimeout(() => {
      if (problemAutoSwitchCancelledRef.current) return;
      clearProblemAutoSwitchTimers();
      if (onAutoSwitch) {
        onAutoSwitch();
      }
      setProblemAutoSwitchActive(false);
      setProblemAutoSwitchRemaining(0);
      setShowProblemIntroNote(false);
    }, autoSwitchSeconds * 1000);
  }, [autoSwitchSeconds, clearProblemAutoSwitchTimers, onAutoSwitch]);

  useEffect(() => {
    if (!preservePanelsOnSlugChange) {
      if (setLeftPanel) {
        setLeftPanel(defaultLeftPanel);
      }
      if (setRightPanel) {
        setRightPanel(defaultRightPanel);
      }
    }
    problemAutoSwitchCancelledRef.current = false;
    problemAutoSwitchStartedRef.current = false;
    setProblemAutoSwitchActive(false);
    setProblemAutoSwitchRemaining(null);
    setShowProblemIntroNote(true);
    clearProblemAutoSwitchTimers();
  }, [activeTitleSlug, clearProblemAutoSwitchTimers, defaultLeftPanel, defaultRightPanel, preservePanelsOnSlugChange, setLeftPanel, setRightPanel]);

  useEffect(() => () => {
    clearProblemAutoSwitchTimers();
  }, [clearProblemAutoSwitchTimers]);

  useEffect(() => {
    if (problemAutoSwitchCancelledRef.current || problemAutoSwitchStartedRef.current) return;
    if (rightPanel !== defaultRightPanel) return;
    if (!problemDescription && !problem) return;
    startProblemAutoSwitch();
  }, [defaultRightPanel, problemDescription, problem, rightPanel, startProblemAutoSwitch]);

  return {
    problemAutoSwitchRemaining,
    problemAutoSwitchActive,
    showProblemIntroNote,
    setShowProblemIntroNote,
    cancelProblemAutoSwitch
  };
}
