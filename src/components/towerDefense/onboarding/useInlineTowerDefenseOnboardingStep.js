import { useEffect, useState } from 'react';

import { TD_ONBOARDING_STEP_CHANGE_EVENT } from './inlineOnboardingEvents';

const getMatchingStep = (surface) => {
  if (typeof window === 'undefined') return null;

  const detail = window.__tdInlineOnboardingStepDetail;
  if (!detail || detail.surface !== surface) {
    return null;
  }

  return detail.step || null;
};

export default function useInlineTowerDefenseOnboardingStep(surface) {
  const [step, setStep] = useState(() => getMatchingStep(surface));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStepChange = (event) => {
      const detail = event?.detail;
      if (!detail || detail.surface !== surface) {
        setStep(null);
        return;
      }

      setStep(detail.step || null);
    };

    window.addEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleStepChange);

    return () => {
      window.removeEventListener(TD_ONBOARDING_STEP_CHANGE_EVENT, handleStepChange);
    };
  }, [surface]);

  return step;
}
