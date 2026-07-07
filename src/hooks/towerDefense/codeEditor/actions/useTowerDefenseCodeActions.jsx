import { useToast, Box, Text, Button } from '@chakra-ui/react';
import { useCallback } from 'react';
import TerminalManager from '../../../../utils/game/TerminalManager';
import { recordClientIssue } from '../../../../utils/feedback/clientIssueReporter';
import { getUserFacingErrorMessage } from '../../../../utils/ui/userFacingErrors';
import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
} from '../../../../utils/towerDefense/coreTowerRequirements';
import useGuestFunnel from '../../../guest/useGuestFunnel';

export default function useTowerDefenseCodeActions({
  addTerminalMessage,
  api,
  canRefineSolution,
  code,
  finalWaveStartDelayMs = 1500,
  initialCodeGenerated,
  isDemo,
  isRefining,
  language,
  onSettingsLock,
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
  notifySolutionSuccess = null,
  coreTowerRequirements = { function: true, object: true },
}) {
  const toast = useToast();
  const funnel = useGuestFunnel();
  const coreTowerLabelText = formatCoreTowerList(
    getMissingCoreTowerLabels(coreTowerRequirements, {
      functionTowerPlaced: false,
      objectTowerPlaced: false,
    })
  );

  const showExecutionUnavailableToast = useCallback(() => {
    if (typeof toast.isActive === 'function' && toast.isActive('td-code-execution-unavailable')) {
      return;
    }

    toast({
      id: 'td-code-execution-unavailable',
      title: 'Code execution unavailable',
      description: 'Code execution hit a temporary issue. Please try again.',
      status: 'warning',
      duration: 3500,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  const showCompilationFailedToast = useCallback(() => {
    if (typeof toast.isActive === 'function' && toast.isActive('td-compilation-failed')) {
      return;
    }

    toast({
      id: 'td-compilation-failed',
      duration: 8000,
      isClosable: true,
      position: 'top',
      render: ({ onClose }) => (
        <Box
          bg="rgba(20, 0, 0, 0.95)"
          border="2px solid #ff0000"
          borderRadius="8px"
          p={4}
          color="white"
          boxShadow="0 0 20px rgba(255, 0, 0, 0.4)"
          maxW="360px"
        >
          <Text
            fontFamily="'Orbitron', sans-serif"
            fontSize="md"
            fontWeight="bold"
            color="#ff0000"
            mb={2}
          >
            COMPILATION FAILED
          </Text>
          <Text
            fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
            fontSize="sm"
            color="#ff6666"
            mb={4}
          >
            Your tower code failed test execution.
          </Text>
          <Button
            w="100%"
            size="sm"
            variant="outline"
            color="#00ccff"
            borderColor="#00ccff"
            fontFamily="'Share Tech Mono', 'JetBrains Mono', monospace"
            _hover={{ bg: 'rgba(0, 204, 255, 0.1)', boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)' }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('td-focus-chat-panel'));
              onClose();
            }}
          >
            Run AI Diagnostic
          </Button>
        </Box>
      ),
    });
  }, [toast]);

  const showRefinementUnavailableToast = useCallback(() => {
    if (typeof toast.isActive === 'function' && toast.isActive('td-refinement-unavailable')) {
      return;
    }

    toast({
      id: 'td-refinement-unavailable',
      title: 'Refinement unavailable',
      description: 'AI refinement hit a temporary issue. Please try again.',
      status: 'warning',
      duration: 3500,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  const startNightmareEndless = useCallback(() => {
    if (startEndlessMode) {
      const started = startEndlessMode({ force: true, difficulty: 'nightmare' });
      if (started) {
        return true;
      }
    }
    return startEngineWave('nightmare');
  }, [startEndlessMode, startEngineWave]);

  const handleRunCode = useCallback(async () => {
    if (!initialCodeGenerated) {
      addTerminalMessage(`[SYSTEM] Deploy ${coreTowerLabelText} modules before running tests.`);
      return;
    }

    if (problem?.titleSlug === 'lp-m0-td-hello-print') {
      funnel.firstRun();
    }

    onSettingsLock?.();

    try {
      setIsExecuting(true);
      const result = await runCodeTests();

      if (result === 'rate_limited') {
        addTerminalMessage(
          '[SYSTEM] Execution limit reached. Watch an ad or wait for reset before verifying.'
        );
        return;
      }

      if (result === true) {
        addTerminalMessage('[SYSTEM] All test cases are passing. Verification available.');
      } else if (result === 'vm_timeout') {
        addTerminalMessage('[SYSTEM] Service is still starting up. Try again in a moment.');
        showExecutionUnavailableToast();
      } else {
        addTerminalMessage('[SYSTEM] Code failed tests. Review and fix errors before verifying.');
        showCompilationFailedToast();
      }
    } catch (error) {
      console.error('[V2Test] Run code error:', error);
      addTerminalMessage('[ERROR] Test execution failed. Try again.');
      showExecutionUnavailableToast();
    } finally {
      setIsExecuting(false);
    }
  }, [
    addTerminalMessage,
    coreTowerLabelText,
    initialCodeGenerated,
    onSettingsLock,
    runCodeTests,
    setIsExecuting,
    showExecutionUnavailableToast,
    showCompilationFailedToast,
  ]);

  const handleRunCodeOutput = useCallback(
    async (filter = 'stdout') => {
      if (!initialCodeGenerated) {
        addTerminalMessage(
          `[SYSTEM] Deploy ${coreTowerLabelText} ${
            coreTowerLabelText.includes(' and ') ? 'modules' : 'module'
          } before running output capture.`
        );
        return;
      }

      onSettingsLock?.();

      try {
        setIsExecuting(true);
        const result = await runCodeOutput?.();

        if (!result || result.status === 'vm_timeout') {
          addTerminalMessage('[SYSTEM] Service is still starting up. Try again in a moment.');
          showExecutionUnavailableToast();
          return;
        }

        if (result.status === 'rate_limited') {
          addTerminalMessage(
            '[SYSTEM] Execution limit reached. Watch an ad or wait for reset before capturing output.'
          );
          return;
        }

        const response = result.response || {};
        const testCases = response?.formatted?.testCases || response?.testResults || [];

        addTerminalMessage('[OUTPUT] Program output capture complete.');
        if (!testCases.length) {
          addTerminalMessage('[OUTPUT] No test case output returned.');
          return;
        }

        testCases.forEach((testCase, index) => {
          const stdout = (testCase.stdout ?? '').toString();
          const stderr = (testCase.stderr ?? '').toString();
          const compileOutput = (testCase.compile_output ?? '').toString();

          if (filter === 'stdout' || filter === 'both') {
            addTerminalMessage(`[STDOUT ${index + 1}]`);
            addTerminalMessage(stdout ? stdout : '(no stdout)');
          }

          if (filter === 'stderr' || filter === 'both') {
            const combinedError = [stderr, compileOutput].filter(Boolean).join('\n');
            addTerminalMessage(`[STDERR ${index + 1}]`);
            addTerminalMessage(combinedError ? combinedError : '(no stderr)');
          }

          addTerminalMessage('------------------');
        });
      } catch (error) {
        console.error('[V2Test] Output capture error:', error);
        addTerminalMessage('[ERROR] Output capture failed. Try again.');
        showExecutionUnavailableToast();
      } finally {
        setIsExecuting(false);
      }
    },
    [
      addTerminalMessage,
      coreTowerLabelText,
      initialCodeGenerated,
      onSettingsLock,
      runCodeOutput,
      setIsExecuting,
      showExecutionUnavailableToast,
    ]
  );

  const handleSubmitSolution = useCallback(async () => {
    if (!initialCodeGenerated) {
      addTerminalMessage(`[SYSTEM] Deploy ${coreTowerLabelText} modules before verification.`);
      return;
    }

    onSettingsLock?.();
    setVerifyAttemptInProgress?.(true);

    if (problem?.titleSlug === 'lp-m0-td-hello-print') {
      funnel.firstRun();
    }

    try {
      setIsExecuting(true);
      const result = await submitSolution();

      if (result === 'vm_timeout') {
        addTerminalMessage('[SYSTEM] Service is still starting up. Try verifying again shortly.');
        showExecutionUnavailableToast();
        return;
      }

      if (result === 'rate_limited') {
        addTerminalMessage(
          '[SYSTEM] Execution limit reached. Watch an ad or wait for reset before verifying.'
        );
        return;
      }

      const success = result === true;
      setCodeSubmitted(true);
      setCodeSubmissionSuccess(success);
      notifySolutionSuccess?.(success);

      if (problem?.titleSlug === 'lp-m0-td-hello-print' && success) {
        funnel.firstSuccess();
      }

      if (success) {
        const isSmallScreen = window.innerWidth < 768;
        const successAscii = TerminalManager.getVictoryAscii(isSmallScreen);
        successAscii.forEach((line) => addTerminalMessage(line));

        addTerminalMessage(
          '[VERIFY] Algorithm integrity confirmed. System vulnerabilities exposed.'
        );
        addTerminalMessage('[KERNEL] Zero-day exploits identified in security architecture.');
        addTerminalMessage('[SYSTEM] ICE protocols compromised. Backdoor access established.');
        addTerminalMessage('[KERNEL] Final security layer weakened. Breach efficiency maximized.');
      } else {
        const isSmallScreen = window.innerWidth < 768;
        const failureAscii = TerminalManager.getFailureAscii(isSmallScreen);
        failureAscii.forEach((line) => addTerminalMessage(line));

        addTerminalMessage(
          '[VERIFY] Fatal algorithm vulnerabilities detected! Code matrix unstable.'
        );
        addTerminalMessage('[ALERT] Intrusion signature identified! System trace initiated.');
        addTerminalMessage(
          '[KERNEL] Counter-intrusion protocols activating. Defense grid reinforced.'
        );
        addTerminalMessage(
          '[WARNING] Adaptive ICE deploying. Endless nightmare defenses activating.'
        );
      }

      setTimeout(() => {
        if (success) {
          addTerminalMessage('[SYSTEM] Initiating final breach sequence...');
        } else {
          addTerminalMessage(
            '[SYSTEM] Nightmare loop engaged. Endless breach sequence initiated...'
          );
        }

        const started = success ? startEngineWave('normal') : startNightmareEndless();
        if (!started) {
          addTerminalMessage(
            '[ERROR] Nightmare sequence initialization failed. Try verifying again.'
          );
        }
      }, finalWaveStartDelayMs);
    } catch (error) {
      console.error('[V2Test] Submit solution error:', error);
      addTerminalMessage('[ERROR] Verification failed. Please try again.');
      // Suppress execution unavailable toast on Verify Solution because we start the wave immediately
      setCodeSubmitted(true);
      setCodeSubmissionSuccess(false);

      setTimeout(() => {
        addTerminalMessage('[SYSTEM] Verification failure detected. Escalating to nightmare loop.');
        addTerminalMessage(
          '[WARNING] Maximum security response activated. Endless resistance imminent!'
        );
        const started = startNightmareEndless();
        if (!started) {
          addTerminalMessage(
            '[ERROR] Nightmare sequence initialization failed. Try verifying again.'
          );
        }
      }, finalWaveStartDelayMs);
    } finally {
      setVerifyAttemptInProgress?.(false);
      setIsExecuting(false);
    }
  }, [
    addTerminalMessage,
    coreTowerLabelText,
    finalWaveStartDelayMs,
    initialCodeGenerated,
    onSettingsLock,
    startNightmareEndless,
    setCodeSubmitted,
    setCodeSubmissionSuccess,
    setVerifyAttemptInProgress,
    notifySolutionSuccess,
    setIsExecuting,
    startEngineWave,
    submitSolution,
    showExecutionUnavailableToast,
  ]);

  const handleRefineSolution = useCallback(async () => {
    if (isDemo || !canRefineSolution || isRefining) return;
    if (!problem) {
      addTerminalMessage('[SYSTEM] No problem loaded for refinement.');
      return;
    }

    onSettingsLock?.();

    setIsRefining(true);
    setRefinementLimitReached(false);

    try {
      const userIdString = localStorage.getItem('user_id');
      const userId = userIdString ? parseInt(userIdString) : null;
      const rawTier = localStorage.getItem('membership_tier') || 'FREE';
      const userMembershipTier = rawTier?.toUpperCase() === 'PRO' ? 'PREMIUM' : rawTier;

      const response = await api.towerDefense.refineSolution({
        code,
        problem: {
          id: problem.id,
          titleSlug: problem.titleSlug,
        },
        language,
        userId: userId || null,
        membershipTier: userMembershipTier || 'FREE',
      });

      if (response?.showAd) {
        setRefinementLimitReached(true);
        addTerminalMessage(
          "You've reached your daily limit for refinements. Watch an ad to get more!"
        );
        setShowAdModal(true);
      } else if (response?.refinedCode) {
        setCode(response.refinedCode);
        addTerminalMessage('Solution refined successfully. Test it before the next wave.');
      } else {
        addTerminalMessage('Refinement failed. Adjust your code and try again.');
        showRefinementUnavailableToast();
      }
    } catch (error) {
      console.error('[V2Test] Refine solution error:', error);
      const errorMessage = getUserFacingErrorMessage(
        error,
        'We could not refine the solution right now. Please try again.'
      );
      const isFiltered =
        error?.data?.error === 'content_filter' ||
        (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('filtered'));

      if (errorMessage && errorMessage.includes('Rate limit exceeded')) {
        setRefinementLimitReached(true);
        addTerminalMessage(
          "You've reached your daily limit for refinements. Watch an ad to get more!"
        );
        setShowAdModal(true);
      } else if (isFiltered) {
        addTerminalMessage(
          'Refinement blocked by safety filters. Try removing sensitive terms or summarize the issue.'
        );
      } else {
        recordClientIssue({
          title: 'Tower defense refinement failed',
          description: errorMessage,
          source: 'tower-defense.refine-solution',
          error,
          metadata: { titleSlug: problem?.titleSlug, language },
        });
        addTerminalMessage(`Refinement failed: ${errorMessage}`);
        showRefinementUnavailableToast();
      }
    } finally {
      setIsRefining(false);
    }
  }, [
    addTerminalMessage,
    api,
    canRefineSolution,
    code,
    isDemo,
    isRefining,
    language,
    onSettingsLock,
    problem,
    setCode,
    setIsRefining,
    setRefinementLimitReached,
    setShowAdModal,
    showRefinementUnavailableToast,
  ]);

  return {
    handleRunCode,
    handleRunCodeOutput,
    handleSubmitSolution,
    handleRefineSolution,
  };
}
