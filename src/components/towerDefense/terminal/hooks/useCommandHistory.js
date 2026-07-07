import { useCallback, useEffect, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

const useCommandHistory = ({
  storageKey,
  maxHistory = 50,
  onCommandSubmit,
  inputEnabled,
  isPlacementActive,
  onCancelPlacement
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [historyDraft, setHistoryDraft] = useState('');

  useEffect(() => {
    if (!isBrowser) return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setCommandHistory(parsed.slice(-maxHistory));
      }
    } catch (error) {
      console.warn('[TowerDefenseTerminal] Failed to parse command history', error);
    }
  }, [maxHistory, storageKey]);

  const persistCommandHistory = useCallback((nextHistory) => {
    if (!isBrowser) return;
    window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));
  }, [storageKey]);

  const submitCommand = useCallback(() => {
    if (!onCommandSubmit) return;
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    onCommandSubmit(trimmed);
    setCommandHistory((prev) => {
      const last = prev[prev.length - 1];
      const next = last === trimmed ? prev : [...prev, trimmed].slice(-maxHistory);
      persistCommandHistory(next);
      return next;
    });
    setHistoryIndex(null);
    setHistoryDraft('');
    setCommandInput('');
  }, [commandInput, maxHistory, onCommandSubmit, persistCommandHistory]);

  const handleInputChange = useCallback((event) => {
    setCommandInput(event.target.value);
    if (historyIndex !== null) {
      setHistoryIndex(null);
      setHistoryDraft('');
    }
  }, [historyIndex]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputEnabled) submitCommand();
      return;
    }

    if (event.key === 'Escape') {
      if (isPlacementActive && onCancelPlacement) {
        event.preventDefault();
        onCancelPlacement('escape');
      }
      return;
    }

    if (!inputEnabled) return;

    if (event.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;
      event.preventDefault();
      if (historyIndex === null) {
        setHistoryDraft(commandInput);
        const lastIndex = commandHistory.length - 1;
        setHistoryIndex(lastIndex);
        setCommandInput(commandHistory[lastIndex]);
      } else if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      if (commandHistory.length === 0 || historyIndex === null) return;
      event.preventDefault();
      const lastIndex = commandHistory.length - 1;
      if (historyIndex < lastIndex) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(null);
        setCommandInput(historyDraft || '');
        setHistoryDraft('');
      }
    }
  }, [commandHistory, commandInput, historyDraft, historyIndex, inputEnabled, isPlacementActive, onCancelPlacement, submitCommand]);

  return {
    commandInput,
    setCommandInput,
    handleInputChange,
    handleKeyDown,
    submitCommand,
    commandHistory
  };
};

export default useCommandHistory;
