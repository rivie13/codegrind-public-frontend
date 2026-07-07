/**
 * Tower Defense V2 - Run Actions
 */

import { useMemo } from 'react';

import useTowerDefenseCodeActions from '../../../../../hooks/towerDefense/codeEditor/actions/useTowerDefenseCodeActions';
import useTowerDefenseRefinementAds from '../../../../../hooks/towerDefense/engine/ads/useTowerDefenseRefinementAds';
import useTowerDefenseV2EndlessMode from '../engine/useTowerDefenseV2EndlessMode';

export default function useTowerDefenseV2RunActions({
  addTerminalMessage,
  api,
  canRefineSolution,
  code,
  finalWaveStartDelayMs,
  effectiveInitialCodeGenerated,
  isDemo,
  isRefining,
  language,
  lockGameSettings,
  problem,
  runCodeTests,
  runCodeOutput,
  setCode,
  setCodeSubmitted,
  setCodeSubmissionSuccess,
  setIsExecuting,
  setIsRefining,
  setRefinementLimitReached,
  setShowAdModal,
  startEndlessMode,
  startEngineWave,
  submitSolution,
  setVerifyAttemptInProgress,
  terminalRef,
  setTerminalOutput,
  setTerminalResetKey,
  setShowSuccessModal,
  setCanRefineSolution,
  setIsWatchingAd,
  notifySolutionSuccess,
  coreTowerRequirements,
}) {
  const { handleRunCode, handleRunCodeOutput, handleSubmitSolution, handleRefineSolution } =
    useTowerDefenseCodeActions({
      addTerminalMessage,
      api,
      canRefineSolution,
      code,
      finalWaveStartDelayMs,
      initialCodeGenerated: effectiveInitialCodeGenerated,
      isDemo,
      isRefining,
      language,
      onSettingsLock: lockGameSettings,
      problem,
      runCodeTests,
      runCodeOutput,
      setCode,
      setCodeSubmitted,
      setCodeSubmissionSuccess,
      setIsExecuting,
      setIsRefining,
      setRefinementLimitReached,
      setShowAdModal,
      startEndlessMode,
      startEngineWave,
      submitSolution,
      setVerifyAttemptInProgress,
      notifySolutionSuccess,
      coreTowerRequirements,
    });

  const { handleWatchAdForRefinement } = useTowerDefenseRefinementAds({
    addTerminalMessage,
    api,
    setCanRefineSolution,
    setIsWatchingAd,
    setRefinementLimitReached,
    setShowAdModal,
  });

  const { handleEnterEndlessMode } = useTowerDefenseV2EndlessMode({
    terminalRef,
    setTerminalOutput,
    setTerminalResetKey,
    startEndlessMode,
    addTerminalMessage,
    setShowSuccessModal,
  });

  return useMemo(
    () => ({
      handleRunCode,
      handleRunCodeOutput,
      handleSubmitSolution,
      handleRefineSolution,
      handleWatchAdForRefinement,
      handleEnterEndlessMode,
    }),
    [
      handleEnterEndlessMode,
      handleRefineSolution,
      handleRunCode,
      handleRunCodeOutput,
      handleSubmitSolution,
      handleWatchAdForRefinement,
    ]
  );
}
