import { useCallback } from 'react';
import { recordClientIssue } from '../../../../utils/feedback/clientIssueReporter';
import { getUserFacingErrorMessage } from '../../../../utils/ui/userFacingErrors';

export default function useTowerDefenseRefinementAds({
  addTerminalMessage,
  api,
  setCanRefineSolution,
  setIsWatchingAd,
  setRefinementLimitReached,
  setShowAdModal,
}) {
  const handleWatchAdForRefinement = useCallback(async () => {
    const userIdString = localStorage.getItem('user_id');
    const userId = userIdString ? parseInt(userIdString) : null;
    const rawTier = (localStorage.getItem('membership_tier') || 'FREE').toUpperCase();
    const membershipTier = rawTier === 'PRO' ? 'PREMIUM' : rawTier;

    if (membershipTier === 'UNLIMITED') {
      addTerminalMessage('Unlimited members do not see terminal ads for refinements.');
      return;
    }

    if (!userId) {
      addTerminalMessage('You need to be logged in to watch ads for refinements.');
      return;
    }

    setIsWatchingAd(true);

    try {
      const response = await api.towerDefense.resetRefinementLimit(userId);
      if (response?.success) {
        setRefinementLimitReached(false);
        setShowAdModal(false);
        addTerminalMessage('Neural network enhanced. Refinement restored.');
        setCanRefineSolution(true);
      } else {
        addTerminalMessage('There was an issue resetting your refinement limit.');
      }
    } catch (error) {
      console.error('[V2Test] Ad reset error:', error);
      const message = getUserFacingErrorMessage(
        error,
        'We could not process the ad reward right now. Please try again.'
      );
      recordClientIssue({
        title: 'Tower defense refinement ad failed',
        description: message,
        source: 'tower-defense.refinement-ad',
        error,
      });
      addTerminalMessage(`Ad reward failed: ${message}`);
    } finally {
      setIsWatchingAd(false);
    }
  }, [
    addTerminalMessage,
    api,
    setCanRefineSolution,
    setIsWatchingAd,
    setRefinementLimitReached,
    setShowAdModal,
  ]);

  return {
    handleWatchAdForRefinement,
  };
}
