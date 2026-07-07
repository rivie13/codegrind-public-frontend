import { useCallback, useEffect, useRef } from 'react';
import { buildVictoryOutput, processGameEvent } from '@rivie13/premium-core/sync';
import audioManager from '../../../utils/audio/AudioManager';
import { normalizeDataPacketsPayload } from '../../../utils/economy/dataPackets';

const toTerminalText = (entry) => {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return '';
  if (typeof entry.text === 'string') return entry.text;
  if (typeof entry.message === 'string') return entry.message;
  return '';
};

const flattenTerminalLines = (entries) => {
  if (!Array.isArray(entries)) return '';
  return entries.map(toTerminalText).join('');
};

const mergeXpPayloads = (base, incoming) => {
  if (!incoming) return base || null;
  if (!base) return incoming;
  const baseAwards = Array.isArray(base.awards) ? base.awards : [];
  const incomingAwards = Array.isArray(incoming.awards) ? incoming.awards : [];
  const baseSummary = base.summary || null;
  const incomingSummary = incoming.summary || null;
  const baseXp = Number(baseSummary?.xp ?? NaN);
  const incomingXp = Number(incomingSummary?.xp ?? NaN);
  const summary =
    Number.isFinite(baseXp) && Number.isFinite(incomingXp) && incomingXp < baseXp
      ? baseSummary
      : incomingSummary || baseSummary || null;
  const levelUpCandidate =
    [base.levelUp, incoming.levelUp]
      .filter(Boolean)
      .sort((a, b) => (b?.newLevel || 0) - (a?.newLevel || 0))[0] || null;
  return {
    summary,
    awards: [...baseAwards, ...incomingAwards],
    levelUp: levelUpCandidate,
  };
};

export default function useTowerDefenseVictoryHandlers({
  addTerminalMessage,
  creditsRef,
  livesRef,
  victoryOutputAppliedRef,
  codeSubmissionSuccess,
  initialLives,
  isDemo,
  normalizeTerminalOutput,
  onEmbeddedVictory,
  setGameStats,
  setShowSuccessModal,
  setSuccessModalTimer,
  setTerminalOutput,
  submitTowerDefenseEndless,
  submitTowerDefenseWin,
  getGuestXpPreview,
  successModalTimer,
  timerSecondsRef,
  formattedTimeRef,
}) {
  const handleLevelCompleteRef = useRef(() => {});
  const handleGameOverRef = useRef(() => {});

  const handleLevelComplete = useCallback((...args) => handleLevelCompleteRef.current(...args), []);
  const handleGameOver = useCallback((...args) => handleGameOverRef.current(...args), []);

  const handleLevelCompleteImpl = useCallback(() => {
    if (victoryOutputAppliedRef.current) {
      return;
    }

    victoryOutputAppliedRef.current = true;
    audioManager.playSoundEffect('level-complete');

    const timerSeconds = timerSecondsRef?.current ?? 0;
    const formattedTime = formattedTimeRef?.current ?? '00:00';
    const { victoryOutput, totalScore } = buildVictoryOutput({
      finalCredits: creditsRef.current,
      finalLives: livesRef.current,
      timer: timerSeconds,
      formattedTime,
      codeSubmissionSuccess,
    });

    setTerminalOutput((prev) => {
      const normalizedPrev = normalizeTerminalOutput(prev);
      if (onEmbeddedVictory) {
        const previousText = flattenTerminalLines(normalizedPrev);
        const victoryText = flattenTerminalLines(victoryOutput);
        const separator = previousText && !previousText.endsWith('\n') ? '\n' : '';
        return `${previousText}${separator}${victoryText}`;
      }
      return [...normalizedPrev, ...victoryOutput];
    });

    if (!isDemo) {
      const stats = {
        score: totalScore,
        finalScore: totalScore,
        timeSpent: timerSeconds,
        formattedTime,
        finalCredits: creditsRef.current,
        finalLives: livesRef.current,
        codeSubmissionSuccess,
        hasNewHighScore: false,
        hasNewBestTime: false,
      };

      setGameStats(stats);

      // Homepage embedded demo — fire callback instead of success modal
      if (onEmbeddedVictory) {
        const userIdString =
          typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : null;
        const isAuthenticatedUser = Boolean(userIdString);

        if (isAuthenticatedUser && codeSubmissionSuccess === true) {
          submitTowerDefenseWin(totalScore, timerSeconds, {
            finalLives: livesRef.current,
            startingLives: initialLives,
          })
            .then((response) => {
              const guestXp = typeof getGuestXpPreview === 'function' ? getGuestXpPreview() : null;
              const xpPayload = response?.xp || guestXp;
              const fallbackXpAmount = Array.isArray(xpPayload?.awards)
                ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
                : 0;
              const dataPacketsPayload = normalizeDataPacketsPayload(response?.dataPackets, {
                fallbackXpAmount,
              });

              if (xpPayload) {
                setGameStats((prev) => ({
                  ...(prev || stats),
                  xp: mergeXpPayloads(prev?.xp || null, xpPayload),
                  dataPackets: dataPacketsPayload || prev?.dataPackets || null,
                }));
              } else if (dataPacketsPayload) {
                setGameStats((prev) => ({
                  ...(prev || stats),
                  dataPackets: dataPacketsPayload,
                }));
              }

              const updatedStats = {
                ...stats,
                xp: xpPayload ? mergeXpPayloads(stats.xp || null, xpPayload) : null,
                dataPackets: dataPacketsPayload || stats.dataPackets || null,
              };
              onEmbeddedVictory(updatedStats);
            })
            .catch((err) => {
              console.error('[TowerDefenseV2] Failed to submit embedded victory:', err);
              onEmbeddedVictory(stats);
            });
        } else {
          onEmbeddedVictory(stats);
        }
        return;
      }

      if (successModalTimer) {
        clearTimeout(successModalTimer);
      }

      const timerId = setTimeout(() => {
        setShowSuccessModal(true);
      }, 15000);

      setSuccessModalTimer(timerId);

      if (codeSubmissionSuccess === true) {
        // Snapshot guest XP preview BEFORE recordProblemSolved mutates progress
        // (recordProblemSolved fires later in a separate effect on TowerDefenseV2Page)
        const guestXp = typeof getGuestXpPreview === 'function' ? getGuestXpPreview() : null;

        submitTowerDefenseWin(totalScore, timerSeconds, {
          finalLives: livesRef.current,
          startingLives: initialLives,
        }).then((response) => {
          // Server XP is authoritative; guest local preview is fallback only when server
          // returns nothing (expected for unauthenticated guests).
          const xpPayload = response?.xp || guestXp;
          const fallbackXpAmount = Array.isArray(xpPayload?.awards)
            ? xpPayload.awards.reduce((sum, award) => sum + (award?.amount || 0), 0)
            : 0;
          const dataPacketsPayload = normalizeDataPacketsPayload(response?.dataPackets, {
            fallbackXpAmount,
          });
          if (xpPayload) {
            setGameStats((prev) => ({
              ...(prev || stats),
              xp: mergeXpPayloads(prev?.xp || null, xpPayload),
              dataPackets: dataPacketsPayload || prev?.dataPackets || null,
            }));
          } else if (dataPacketsPayload) {
            setGameStats((prev) => ({
              ...(prev || stats),
              dataPackets: dataPacketsPayload,
            }));
          }
        });
      }
    }
  }, [
    codeSubmissionSuccess,
    creditsRef,
    formattedTimeRef,
    initialLives,
    isDemo,
    livesRef,
    normalizeTerminalOutput,
    onEmbeddedVictory,
    setGameStats,
    setShowSuccessModal,
    setSuccessModalTimer,
    setTerminalOutput,
    submitTowerDefenseWin,
    getGuestXpPreview,
    successModalTimer,
    timerSecondsRef,
    victoryOutputAppliedRef,
  ]);

  const handleGameOverImpl = useCallback(
    (data) => {
      processGameEvent(
        'game-over',
        {
          wave: data.wave,
        },
        {
          addTerminalMessage,
          stopGameLoop: () => {},
          playBackgroundMusic: audioManager.playBackgroundMusic?.bind(audioManager) || (() => {}),
        }
      );

      if (data?.isEndlessMode && !isDemo) {
        const endlessWavesSurvived = Math.max(0, (data?.endlessWave || 1) - 1);
        const endlessSurvivalSeconds = Math.floor((data?.endlessSurvivalTime || 0) / 1000);
        const timerSeconds = timerSecondsRef?.current ?? 0;

        submitTowerDefenseEndless({
          finalScore: data?.totalScore ?? 0,
          finalTimeSeconds: timerSeconds,
          endlessScore: data?.endlessScore ?? 0,
          endlessWaves: endlessWavesSurvived,
          endlessSurvivalTime: endlessSurvivalSeconds,
        });
      }
    },
    [addTerminalMessage, isDemo, submitTowerDefenseEndless, timerSecondsRef]
  );

  useEffect(() => {
    handleLevelCompleteRef.current = handleLevelCompleteImpl;
  }, [handleLevelCompleteImpl]);

  useEffect(() => {
    handleGameOverRef.current = handleGameOverImpl;
  }, [handleGameOverImpl]);

  return {
    handleLevelComplete,
    handleGameOver,
  };
}

