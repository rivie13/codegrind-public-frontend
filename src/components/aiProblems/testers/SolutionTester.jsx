import { Box, Button, Text, VStack } from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlay } from 'react-icons/fi';
import { api } from '../../../services/api';
import AdModal from '../../towerDefense/AdModal';
import CodeExecutionRateLimitBadge from '../../limits/CodeExecutionRateLimitBadge';
import { executeCodeWithTestCasesClient } from '@rivie13/premium-core/compiler';

/**
 * Component for testing a problem solution against test cases
 *
 * @param {Object} props
 * @param {Object} props.problem - The problem data
 * @param {string} props.solution - The solution code to test
 * @param {string} props.language - Programming language
 * @param {Function} props.onTestComplete - Callback when test completes (passed true/false)
 * @param {Function} props.onResultsUpdate - Callback with the test results
 * @param {boolean} props.isRunningTest - Whether a test is currently running
 * @param {Function} props.setIsRunningTest - Setter for isRunning state
 */
const SolutionTester = ({
  problem,
  solution,
  language,
  onTestComplete,
  onResultsUpdate,
  editorRef,
  isRunningTest,
  setIsRunningTest,
}) => {
  const [executionRateLimit, setExecutionRateLimit] = useState(null);
  const [showExecutionAdModal, setShowExecutionAdModal] = useState(false);
  const [isApplyingExecutionCredit, setIsApplyingExecutionCredit] = useState(false);
  const [selectedExecutionAdType, setSelectedExecutionAdType] = useState(null);

  const executionAdOptions = useMemo(
    () => ({
      short: { label: 'Short', credits: 3, minViewMs: 6000 },
      medium: { label: 'Medium', credits: 6, minViewMs: 12000 },
      long: { label: 'Long', credits: 10, minViewMs: 20000 },
    }),
    []
  );

  const selectedExecutionAd = selectedExecutionAdType
    ? executionAdOptions[selectedExecutionAdType]
    : null;

  useEffect(() => {
    if (showExecutionAdModal) {
      setSelectedExecutionAdType(null);
    }
  }, [showExecutionAdModal]);

  const refreshExecutionRateLimit = useCallback(async () => {
    try {
      const response = await api.codeExecution.getRateLimitStatus();
      const nextRateLimit = response?.rateLimit || null;
      if (nextRateLimit) {
        setExecutionRateLimit(nextRateLimit);
      }
      return nextRateLimit;
    } catch {
      return null;
    }
  }, [setExecutionRateLimit]);

  useEffect(() => {
    refreshExecutionRateLimit();
  }, [refreshExecutionRateLimit]);

  const handleExecutionAdComplete = useCallback(async () => {
    if (isApplyingExecutionCredit) return;

    setIsApplyingExecutionCredit(true);
    try {
      const response = await api.codeExecution.addCredit(selectedExecutionAdType);
      setExecutionRateLimit(response?.rateLimit || null);
    } catch (error) {
      console.error('Error adding execution credits:', error);
    } finally {
      setIsApplyingExecutionCredit(false);
      setShowExecutionAdModal(false);
    }
  }, [isApplyingExecutionCredit, selectedExecutionAdType]);
  const runSolution = async () => {
    try {
      // Clear previous results first
      onResultsUpdate(null, null);

      // Check if setIsRunningTest is a function before calling it
      if (typeof setIsRunningTest === 'function') {
        setIsRunningTest(true);
      }

      // Get the most up-to-date solution from the editor if available
      let currentSolution = solution;
      if (editorRef?.current) {
        currentSolution = editorRef.current.getValue();
        // Force blur to update parent state
        try {
          const activeElement = document.activeElement;
          if (activeElement) {
            activeElement.blur();
          }
        } catch (e) {
          // Ignore errors
        }
      }

      const currentRateLimit = await refreshExecutionRateLimit();
      if (currentRateLimit && !currentRateLimit.unlimited) {
        const totalRemaining = currentRateLimit.totalRemaining ?? currentRateLimit.remaining ?? 0;
        if (totalRemaining <= 0) {
          const cooldownRemaining = currentRateLimit.adCooldownRemaining || 0;
          if (cooldownRemaining > 0) {
            onResultsUpdate(
              null,
              `Execution ad cooldown active. Please wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.`
            );
          } else {
            setShowExecutionAdModal(true);
            onResultsUpdate(null, 'Rate limit reached. Watch an ad to unlock more executions.');
          }
          if (onTestComplete) {
            onTestComplete(false);
          }
          return;
        }
      }

      // Import dynamically or use the import at top. Let's import it at the top or dynamically here.
      // Since it's an async function, we can import it dynamically or at the top. Let's do it via the top level import we will add.
      const testCases = problem.testCases || [];
      const expectedOutputs = problem.expectedOutputs || [];
      const formattedTestCases = testCases.map((tc, index) => {
        return {
          input: tc,
          expected: expectedOutputs[index] ?? (tc.expected ?? tc.expectedOutput ?? null),
          metadata: {
            name: problem.functionName,
            params: problem.functionParams,
            returnType: problem.returnType,
          },
        };
      });

      const evalResult = await executeCodeWithTestCasesClient(
        currentSolution,
        formattedTestCases,
        language
      );

      const response = {
        success: evalResult.success,
        executionTime: evalResult.executionTime,
        memoryUsed: evalResult.memoryUsed,
        testResults: evalResult.results,
        formatted: {
          testCases: evalResult.results,
        },
      };

      await refreshExecutionRateLimit();

      // Update the parent with results
      onResultsUpdate(response, null);

      // Call the onTestComplete callback with the results if provided
      if (onTestComplete) {
        onTestComplete(response.success);
      }
    } catch (error) {
      console.error('Error running solution:', error);
      if (error?.data?.error_code === 'CODE_EXECUTION_RATE_LIMIT' || error?.data?.showAd) {
        const nextRateLimit = error?.data?.rateLimit || null;
        const cooldownRemaining = nextRateLimit?.adCooldownRemaining || 0;
        setExecutionRateLimit(nextRateLimit);
        if (cooldownRemaining > 0) {
          setShowExecutionAdModal(false);
          onResultsUpdate(
            null,
            `Execution ad cooldown active. Please wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.`
          );
        } else {
          setShowExecutionAdModal(true);
          onResultsUpdate(null, error?.data?.message || 'Rate limit exceeded.');
        }
      } else {
        onResultsUpdate(null, error.message || 'Failed to run solution');
      }

      // Call the onTestComplete callback with false if provided
      if (onTestComplete) {
        onTestComplete(false);
      }
    } finally {
      // Check if setIsRunningTest is a function before calling it
      if (typeof setIsRunningTest === 'function') {
        setIsRunningTest(false);
      }
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <CodeExecutionRateLimitBadge rateLimit={executionRateLimit} />
      </Box>
      <Box
        mb={4}
        p={4}
        bg="var(--cg-window)"
        border="1px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-inset)"
      >
        <VStack align="stretch" spacing={3}>
          <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
            Run the current solution against the generated example set before saving the problem.
          </Text>
          <Button
            color="var(--cg-accent-blue)"
            size="md"
            onClick={runSolution}
            onMouseDown={() => {
              // Force editor to blur and sync state before the click handler runs.
              if (editorRef?.current) {
                try {
                  document.activeElement?.blur();
                  editorRef.current.blur();
                } catch {
                  // Ignore editor blur failures and continue with execution.
                }
              }
            }}
            isLoading={isRunningTest}
            loadingText="Running..."
            leftIcon={<FiPlay />}
            width={{ base: '100%', sm: 'auto' }}
            alignSelf="flex-start"
            fontWeight="700"
          >
            Test Solution
          </Button>
        </VStack>
      </Box>

      <AdModal
        isOpen={showExecutionAdModal}
        onClose={() => setShowExecutionAdModal(false)}
        onAdComplete={handleExecutionAdComplete}
        title="Execution Boost"
        minViewMs={selectedExecutionAd?.minViewMs || executionAdOptions.short.minViewMs}
        ctaLabel={
          selectedExecutionAd
            ? `Unlock +${selectedExecutionAd.credits} Execution${selectedExecutionAd.credits > 1 ? 's' : ''}`
            : 'Select ad length to unlock executions'
        }
        footerText={
          executionRateLimit?.resetIn
            ? `Limit resets in ${Math.max(0, Math.floor(executionRateLimit.resetIn / 60))} minutes. Watching this ad adds extra executions now.`
            : 'Watching this ad adds extra code executions.'
        }
        processingText="Syncing sponsor link..."
        adTypeOptions={executionAdOptions}
        selectedAdType={selectedExecutionAdType}
        onAdTypeChange={setSelectedExecutionAdType}
        adTypeSelectionDisabled={isApplyingExecutionCredit}
        adTypeLabel="Select ad length (required to start the ad)"
        requireAdTypeSelection
        adTypeRequiredText="Choose an ad length to start the sponsor video."
        showSkipButton
        skipLabel="Maybe later"
        onSkip={() => setShowExecutionAdModal(false)}
      />
    </Box>
  );
};

export default SolutionTester;

