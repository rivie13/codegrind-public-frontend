import { useCallback, useEffect, useRef } from 'react';
import { GAME_STATUS, TOWER_TYPES } from '../../../game-engine-v2';
import { analyzeCode } from '../../../utils/code/codeParser';

export default function useTowerDefenseSuggestionQueue({
  addTerminalSystemMessage,
  gameState,
  getAllowedTowerKeys,
  getReservedTowerCount,
  getTowerAvailabilityMessage,
  handleTowerTypeSelect,
  isPlacementActive,
  reserveTowerPlacement,
  setPlacementPalette,
  toCommandId,
}) {
  const SUGGESTION_TIMEOUT_MS = 30000;
  const suggestionQueueRef = useRef([]);
  const approvedQueueRef = useRef([]);
  const pendingSuggestionRef = useRef(null);
  const lastSuggestionRef = useRef({ lineText: null, conceptKey: null });
  const lastQueueNoticeWaveRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const suggestionIdRef = useRef(0);

  const getTowerKeyByConcept = useCallback((conceptKey) => {
    if (!conceptKey) return null;
    return (
      Object.keys(TOWER_TYPES).find((key) => TOWER_TYPES[key]?.conceptKey === conceptKey) || null
    );
  }, []);

  const getSuggestionLabel = useCallback(
    (towerKey) => {
      const props = TOWER_TYPES[towerKey];
      return toCommandId(props, towerKey) || props?.type || towerKey;
    },
    [toCommandId]
  );

  const getQueuedSuggestionLabels = useCallback(() => {
    return suggestionQueueRef.current.map((item) => item.label);
  }, []);

  const clearSuggestionTimeout = useCallback(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }
  }, []);

  const purgeExpiredQueuedSuggestions = useCallback(() => {
    const now = Date.now();
    const expired = [];
    suggestionQueueRef.current = suggestionQueueRef.current.filter((item) => {
      if (item.expiresAt && item.expiresAt <= now) {
        expired.push(item.label);
        return false;
      }
      return true;
    });
    if (expired.length) {
      const labelText = expired.length === 1 ? expired[0] : expired.join(', ');
      addTerminalSystemMessage(
        'SYSTEM',
        `Suggestion${expired.length === 1 ? '' : 's'} for ${labelText} dismissed due to no response.`
      );
    }
  }, [addTerminalSystemMessage]);

  const clearSuggestionQueueForTower = useCallback(
    (towerKey) => {
      if (!towerKey) return false;
      const pending = pendingSuggestionRef.current;
      const matchesPending = pending?.towerKey === towerKey;
      const matchesQueue = suggestionQueueRef.current.some((item) => item.towerKey === towerKey);
      const matchesApproved = approvedQueueRef.current.some((item) => item.towerKey === towerKey);
      if (!matchesPending && !matchesQueue && !matchesApproved) return false;

      suggestionQueueRef.current = [];
      approvedQueueRef.current = [];
      pendingSuggestionRef.current = null;

      const label = getSuggestionLabel(towerKey);
      addTerminalSystemMessage('SYSTEM', `Suggestion queue cleared after selecting ${label}.`);
      return true;
    },
    [addTerminalSystemMessage, getSuggestionLabel]
  );

  const promptNextSuggestion = useCallback(() => {
    if (pendingSuggestionRef.current) return;
    purgeExpiredQueuedSuggestions();
    const next = suggestionQueueRef.current.shift();
    if (!next) return;
    pendingSuggestionRef.current = next;
    clearSuggestionTimeout();
    suggestionTimeoutRef.current = setTimeout(() => {
      const pending = pendingSuggestionRef.current;
      if (!pending || pending.id !== next.id) return;
      pendingSuggestionRef.current = null;
      addTerminalSystemMessage(
        'SYSTEM',
        `Suggestion for ${pending.label} dismissed due to no response.`
      );
      promptNextSuggestion();
    }, SUGGESTION_TIMEOUT_MS);
    const queuedLabels = getQueuedSuggestionLabels();
    const queueNote = queuedLabels.length ? ` (${queuedLabels.length} more queued)` : '';
    addTerminalSystemMessage(
      'SYSTEM',
      `Are you trying to purchase a ${next.label} tower? Reply yes/no (or "yes all" to approve the queue) in the terminal below the editor.${queueNote}`
    );
  }, [
    addTerminalSystemMessage,
    clearSuggestionTimeout,
    getQueuedSuggestionLabels,
    purgeExpiredQueuedSuggestions,
  ]);

  const tryReserveFromApprovedQueue = useCallback(() => {
    if (gameState.status === GAME_STATUS.PLAYING) {
      return false;
    }

    if (isPlacementActive || getReservedTowerCount() > 0) {
      return false;
    }

    while (approvedQueueRef.current.length > 0) {
      const next = approvedQueueRef.current.shift();
      const allowedKeys = getAllowedTowerKeys();
      if (!allowedKeys.includes(next.towerKey)) {
        const availability = getTowerAvailabilityMessage();
        if (availability) {
          addTerminalSystemMessage('WARNING', availability);
        }
        continue;
      }

      const props = TOWER_TYPES[next.towerKey];
      const result = reserveTowerPlacement(next.towerKey, 'terminal');
      if (!result?.success) {
        if (result?.reason === 'credits') {
          addTerminalSystemMessage(
            'FAILURE',
            `Insufficient credits. Need ${result.cost}, you have ${result.credits}.`
          );
        } else {
          addTerminalSystemMessage('FAILURE', 'Unable to reserve tower. Try again.');
        }
        continue;
      }

      setPlacementPalette('towers');
      handleTowerTypeSelect(next.towerKey, 'terminal');
      addTerminalSystemMessage(
        'SUCCESS',
        `Reserved ${props?.type || next.label}. Place it on the map.`
      );
      return true;
    }

    return false;
  }, [
    addTerminalSystemMessage,
    gameState.status,
    getAllowedTowerKeys,
    getReservedTowerCount,
    getTowerAvailabilityMessage,
    handleTowerTypeSelect,
    isPlacementActive,
    reserveTowerPlacement,
    setPlacementPalette,
  ]);

  const handleSuggestionResponse = useCallback(
    (rawInput) => {
      const input = rawInput.trim().toLowerCase();
      if (!input) return false;
      const isYes = input === 'yes' || input === 'y' || input === 'yes all' || input === 'y all';
      const isNo = input === 'no' || input === 'n' || input === 'no all' || input === 'n all';
      if (!isYes && !isNo) return false;

      const pending = pendingSuggestionRef.current;
      if (!pending) {
        return true;
      }

      clearSuggestionTimeout();

      if (isNo) {
        if (input.includes('all')) {
          suggestionQueueRef.current = [];
        }
        pendingSuggestionRef.current = null;
        addTerminalSystemMessage('SYSTEM', 'Suggestion dismissed.');
        if (input.includes('all')) {
          return true;
        }
        promptNextSuggestion();
        return true;
      }

      approvedQueueRef.current.push(pending);
      pendingSuggestionRef.current = null;

      if (input.includes('all') && suggestionQueueRef.current.length > 0) {
        approvedQueueRef.current.push(...suggestionQueueRef.current);
        suggestionQueueRef.current = [];
        addTerminalSystemMessage('SYSTEM', 'Queued all suggested towers for reservation.');
      } else {
        addTerminalSystemMessage('SYSTEM', `Queued ${pending.label} for reservation.`);
      }

      promptNextSuggestion();

      if (gameState.status === GAME_STATUS.PLAYING) {
        addTerminalSystemMessage(
          'WARNING',
          'Purchases are locked during active waves. Queue will resume between waves.'
        );
        return true;
      }

      if (isPlacementActive || getReservedTowerCount() > 0) {
        addTerminalSystemMessage(
          'SYSTEM',
          'Place your reserved tower before the next queued purchase.'
        );
        return true;
      }

      tryReserveFromApprovedQueue();
      return true;
    },
    [
      addTerminalSystemMessage,
      clearSuggestionTimeout,
      gameState.status,
      getReservedTowerCount,
      isPlacementActive,
      promptNextSuggestion,
      tryReserveFromApprovedQueue,
    ]
  );

  const handleCodeLineCommitted = useCallback(
    (payload) => {
      const lineText = payload?.lineText || '';
      const language = payload?.language || 'javascript';
      const trimmed = lineText.trim();
      if (!trimmed) return;
      if (/^(\/\/|#|\/\*|\*|\*\/)/.test(trimmed)) return;
      if (typeof window !== 'undefined' && window.__tdSuppressTowerSuggestionsUntil) {
        if (Date.now() < window.__tdSuppressTowerSuggestionsUntil) {
          return;
        }
      }
      if (typeof window !== 'undefined' && window.__tdAiSnippetCooldownUntil) {
        if (Date.now() < window.__tdAiSnippetCooldownUntil) {
          return;
        }
      }
      if (typeof window !== 'undefined' && window.__tdGeneratedLineSuppressions) {
        const normalize = (line) => line.replace(/\s+/g, '').replace(/;$/, '');
        const consumeSuppression = (key) => {
          const entry = window.__tdGeneratedLineSuppressions[key];
          if (!entry) return false;
          if (typeof entry === 'number') {
            const next = entry - 1;
            if (next <= 0) {
              delete window.__tdGeneratedLineSuppressions[key];
            } else {
              window.__tdGeneratedLineSuppressions[key] = next;
            }
            return true;
          }
          const now = Date.now();
          if (entry.expiresAt && entry.expiresAt < now) {
            delete window.__tdGeneratedLineSuppressions[key];
            return false;
          }
          const remaining = Number(entry.remaining || 0);
          if (remaining <= 0) return false;
          const next = remaining - 1;
          if (next <= 0) {
            delete window.__tdGeneratedLineSuppressions[key];
          } else {
            window.__tdGeneratedLineSuppressions[key] = {
              remaining: next,
              expiresAt: entry.expiresAt,
            };
          }
          return true;
        };

        if (consumeSuppression(trimmed)) return;
        const normalized = normalize(trimmed);
        if (normalized !== trimmed && consumeSuppression(normalized)) return;
      }

      const languageKey = language === 'cpp' ? 'cpp' : String(language).toLowerCase();
      const concepts = analyzeCode(trimmed, languageKey);
      const priority = [
        'FUNCTION',
        'FOR_LOOP',
        'WHILE_LOOP',
        'IF_CONDITION',
        'SWITCH',
        'TRY_CATCH',
        'RETURN_STATEMENT',
        'ARRAY',
        'OBJECT',
        'VARIABLE',
        'LOG',
      ];
      const conceptKeys = priority.filter((key) => concepts[key]);
      if (!conceptKeys.length) return;

      const pending = pendingSuggestionRef.current;
      const allowedKeys = getAllowedTowerKeys();
      let chosenConcept = null;
      let chosenTowerKey = null;

      for (const key of conceptKeys) {
        const towerKey = getTowerKeyByConcept(key);
        if (!towerKey) continue;
        if (!allowedKeys.includes(towerKey)) continue;
        if (pending?.towerKey === towerKey) continue;
        if (suggestionQueueRef.current.some((item) => item.towerKey === towerKey)) continue;
        chosenConcept = key;
        chosenTowerKey = towerKey;
        break;
      }

      if (!chosenConcept || !chosenTowerKey) return;

      if (
        lastSuggestionRef.current.lineText === trimmed &&
        lastSuggestionRef.current.conceptKey === chosenConcept
      ) {
        return;
      }
      lastSuggestionRef.current = { lineText: trimmed, conceptKey: chosenConcept };

      const label = getSuggestionLabel(chosenTowerKey);
      const now = Date.now();
      const suggestionId = suggestionIdRef.current + 1;
      suggestionIdRef.current = suggestionId;
      suggestionQueueRef.current.push({
        id: suggestionId,
        towerKey: chosenTowerKey,
        label,
        conceptKey: chosenConcept,
        lineText: trimmed,
        createdAt: now,
        expiresAt: now + SUGGESTION_TIMEOUT_MS,
      });

      // Signal to onboarding that a code line was committed with a tower concept match
      if (typeof window !== 'undefined') {
        window.__tdCodeLineCommitted = true;
      }

      if (pending) {
        const queuedLabels = getQueuedSuggestionLabels();
        addTerminalSystemMessage(
          'SYSTEM',
          `Queued ${label} suggestion. Pending: ${pending.label}.${queuedLabels.length ? ` Queue: ${queuedLabels.join(', ')}.` : ''}`
        );
        return;
      }
      promptNextSuggestion();
    },
    [
      addTerminalSystemMessage,
      getAllowedTowerKeys,
      getQueuedSuggestionLabels,
      getSuggestionLabel,
      getTowerKeyByConcept,
      promptNextSuggestion,
    ]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      purgeExpiredQueuedSuggestions();
    }, 5000);
    return () => clearInterval(interval);
  }, [purgeExpiredQueuedSuggestions]);

  useEffect(() => {
    return () => {
      clearSuggestionTimeout();
    };
  }, [clearSuggestionTimeout]);

  useEffect(() => {
    if (gameState.status === GAME_STATUS.PLAYING) return;
    if (isPlacementActive || getReservedTowerCount() > 0) return;
    if (approvedQueueRef.current.length === 0) return;
    tryReserveFromApprovedQueue();
  }, [gameState.status, getReservedTowerCount, isPlacementActive, tryReserveFromApprovedQueue]);

  useEffect(() => {
    if (gameState.status !== GAME_STATUS.WAVE_COMPLETE) return;
    if (lastQueueNoticeWaveRef.current === gameState.wave) return;

    const pending = pendingSuggestionRef.current;
    const queued = suggestionQueueRef.current;
    const approved = approvedQueueRef.current;
    if (!pending && queued.length === 0 && approved.length === 0) return;

    const parts = [];
    if (pending?.label) parts.push(`Pending: ${pending.label}`);
    if (approved.length) parts.push(`Approved: ${approved.map((item) => item.label).join(', ')}`);
    if (queued.length) parts.push(`Queue: ${queued.map((item) => item.label).join(', ')}`);

    addTerminalSystemMessage(
      'SYSTEM',
      `Tower suggestion queue remains after Wave ${gameState.wave}. ${parts.join(' | ')}`
    );
    addTerminalSystemMessage(
      'SYSTEM',
      'You can respond to the pending suggestion with yes, no or yes all.'
    );
    lastQueueNoticeWaveRef.current = gameState.wave;
  }, [addTerminalSystemMessage, gameState.status, gameState.wave]);

  return {
    clearSuggestionQueueForTower,
    handleCodeLineCommitted,
    handleSuggestionResponse,
  };
}
