import { useCallback, useEffect, useMemo, useState } from 'react';

const useExecutionAds = () => {
  const [executionRateLimit, setExecutionRateLimit] = useState(null);
  const [showExecutionAdModal, setShowExecutionAdModal] = useState(false);
  const [isApplyingExecutionCredit, setIsApplyingExecutionCredit] = useState(false);
  const [selectedExecutionAdType, setSelectedExecutionAdType] = useState(null);

  const executionAdOptions = useMemo(() => ({
    short: { label: 'Short', credits: 3, minViewMs: 6000 },
    medium: { label: 'Medium', credits: 6, minViewMs: 12000 },
    long: { label: 'Long', credits: 10, minViewMs: 20000 }
  }), []);

  const selectedExecutionAd = selectedExecutionAdType
    ? executionAdOptions[selectedExecutionAdType]
    : null;

  useEffect(() => {
    if (showExecutionAdModal) {
      setSelectedExecutionAdType(null);
    }
  }, [showExecutionAdModal]);

  const handleExecutionAdModalClose = useCallback(() => {
    setShowExecutionAdModal(false);
  }, []);

  return {
    executionRateLimit,
    setExecutionRateLimit,
    showExecutionAdModal,
    setShowExecutionAdModal,
    isApplyingExecutionCredit,
    setIsApplyingExecutionCredit,
    selectedExecutionAdType,
    setSelectedExecutionAdType,
    executionAdOptions,
    selectedExecutionAd,
    handleExecutionAdModalClose
  };
};

export default useExecutionAds;
