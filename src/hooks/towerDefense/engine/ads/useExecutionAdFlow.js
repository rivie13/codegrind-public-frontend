import { useCallback, useEffect, useMemo, useState } from 'react';
import { recordClientIssue } from '../../../../utils/feedback/clientIssueReporter';
import { getUserFacingErrorMessage } from '../../../../utils/ui/userFacingErrors';

export default function useExecutionAdFlow({ api, addTerminalMessage }) {
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

  const handleExecutionRateLimit = useCallback(
    (data) => {
      const nextRateLimit = data?.rateLimit || null;
      const cooldownRemaining = nextRateLimit?.adCooldownRemaining || 0;
      setExecutionRateLimit(nextRateLimit);
      if (cooldownRemaining > 0) {
        addTerminalMessage(
          `⏳ Execution ad cooldown active. Wait ${Math.ceil(cooldownRemaining / 60)}m before watching another ad.`
        );
        setShowExecutionAdModal(false);
        return;
      }
      setShowExecutionAdModal(true);
    },
    [addTerminalMessage]
  );

  const handleExecutionAdComplete = useCallback(async () => {
    if (isApplyingExecutionCredit) return;
    if (executionRateLimit?.adCooldownRemaining > 0) {
      addTerminalMessage(
        `⏳ Execution ad cooldown active. Wait ${Math.ceil(executionRateLimit.adCooldownRemaining / 60)}m before watching another ad.`
      );
      setShowExecutionAdModal(false);
      return;
    }

    setIsApplyingExecutionCredit(true);
    try {
      const response = await api.codeExecution.addCredit(selectedExecutionAdType);
      setExecutionRateLimit(response?.rateLimit || null);
      addTerminalMessage(`✅ Added ${response?.creditsEarned || 0} execution credit(s).`);
    } catch (error) {
      const message = getUserFacingErrorMessage(error, 'Failed to add execution credits.');
      recordClientIssue({
        title: 'Tower defense execution credits failed',
        description: message,
        source: 'tower-defense.execution-ad',
        error,
      });
      addTerminalMessage(`❌ ${message}`);
    } finally {
      setIsApplyingExecutionCredit(false);
      setShowExecutionAdModal(false);
    }
  }, [
    addTerminalMessage,
    api,
    executionRateLimit?.adCooldownRemaining,
    isApplyingExecutionCredit,
    selectedExecutionAdType,
  ]);

  return {
    executionAdOptions,
    executionRateLimit,
    showExecutionAdModal,
    setShowExecutionAdModal,
    isApplyingExecutionCredit,
    selectedExecutionAdType,
    setSelectedExecutionAdType,
    selectedExecutionAd,
    handleExecutionAdComplete,
    handleExecutionRateLimit,
  };
}
