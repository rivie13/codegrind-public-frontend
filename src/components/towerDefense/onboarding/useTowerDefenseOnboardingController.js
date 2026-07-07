import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildResponsiveProfile } from '../../../utils/web/responsiveProfile';

const resolveValue = (value, context, manualCompletedSteps) => {
  if (typeof value === 'function') {
    return value(context, manualCompletedSteps);
  }
  return value;
};

const getStorageValue = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
};

const setStorageValue = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, '1');
  } catch {
    // Ignore storage failures.
  }
};

const detectMobileSinglePanelLayout = (context) => {
  if (context?.isMobileSinglePanelLayout != null) {
    return Boolean(context.isMobileSinglePanelLayout);
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return buildResponsiveProfile().isHandheldSinglePanelLayout;
};

const getStepAutoAdvanceDelayMs = (step, context) => {
  const baseDelayMs = Number(step?.autoAdvanceAfter);
  if (!Number.isFinite(baseDelayMs) || baseDelayMs <= 0) {
    return null;
  }

  if (!detectMobileSinglePanelLayout(context)) {
    return baseDelayMs;
  }

  const mobileDelayMs = Number(step?.autoAdvanceAfterMobile);
  if (Number.isFinite(mobileDelayMs) && mobileDelayMs > 0) {
    return mobileDelayMs;
  }

  return Math.round(Math.max(baseDelayMs * 1.7, baseDelayMs + 2200));
};

export default function useTowerDefenseOnboardingController({
  isActive,
  steps,
  context,
  storageKey = null,
  version = 'v1',
  onComplete,
  onStepReached,
  onStepCompleted,
}) {
  const persistedKey = storageKey ? `${storageKey}:${version}` : null;
  const [manualCompletedSteps, setManualCompletedSteps] = useState({});
  const [autoCompletedSteps, setAutoCompletedSteps] = useState({});
  const completionNotifiedRef = useRef(false);
  const lastReachedStepIdRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setManualCompletedSteps({});
      setAutoCompletedSteps({});
      completionNotifiedRef.current = false;
      lastReachedStepIdRef.current = null;
    }
  }, [isActive]);

  const isPersistedComplete = useMemo(() => getStorageValue(persistedKey), [persistedKey]);

  const normalizedSteps = useMemo(() => steps.filter(Boolean), [steps]);

  const completedSteps = useMemo(
    () => ({
      ...autoCompletedSteps,
      ...manualCompletedSteps,
    }),
    [autoCompletedSteps, manualCompletedSteps]
  );

  useEffect(() => {
    if (!isActive || isPersistedComplete || !normalizedSteps.length) return;

    const newlyAutoCompletedSteps = {};

    for (const step of normalizedSteps) {
      if (!step?.id || completedSteps[step.id] || !step.completeWhen) {
        continue;
      }

      const isAutoComplete = Boolean(step.completeWhen(context, completedSteps));
      if (isAutoComplete) {
        newlyAutoCompletedSteps[step.id] = true;
        onStepCompleted?.(step.id);
      }
    }

    if (!Object.keys(newlyAutoCompletedSteps).length) {
      return;
    }

    setAutoCompletedSteps((currentAutoCompletedSteps) => ({
      ...currentAutoCompletedSteps,
      ...newlyAutoCompletedSteps,
    }));
  }, [completedSteps, context, isActive, isPersistedComplete, normalizedSteps, onStepCompleted]);

  const areRequiredStepsComplete = useMemo(
    () =>
      normalizedSteps.every((step) => {
        if (step.optional) {
          return true;
        }

        const isPreviouslyComplete = Boolean(completedSteps[step.id]);
        const isAutoComplete = step.completeWhen
          ? Boolean(step.completeWhen(context, completedSteps))
          : false;

        return isPreviouslyComplete || isAutoComplete;
      }),
    [completedSteps, context, normalizedSteps]
  );

  const activeStep = useMemo(() => {
    if (!isActive || isPersistedComplete) return null;

    for (const step of normalizedSteps) {
      const shouldShow = step.showWhen ? step.showWhen(context, completedSteps) : true;
      if (!shouldShow) continue;

      const isPreviouslyComplete = Boolean(completedSteps[step.id]);
      const isAutoComplete = step.completeWhen
        ? Boolean(step.completeWhen(context, completedSteps))
        : false;

      if (isPreviouslyComplete || isAutoComplete) {
        continue;
      }

      return {
        ...step,
        title: resolveValue(step.title, context, completedSteps),
        message: resolveValue(step.message, context, completedSteps),
        subtext: resolveValue(step.subtext, context, completedSteps),
        targetSelector: resolveValue(step.targetSelector, context, completedSteps),
        placement: resolveValue(step.placement, context, completedSteps),
        highlightKey: resolveValue(step.highlightKey, context, completedSteps),
        panelFocus: resolveValue(step.panelFocus, context, completedSteps),
        bullets: resolveValue(step.bullets, context, completedSteps),
        icon: resolveValue(step.icon, context, completedSteps),
        example: resolveValue(step.example, context, completedSteps),
        exampleOutput: resolveValue(step.exampleOutput, context, completedSteps),
        answerLabel: resolveValue(step.answerLabel, context, completedSteps),
        answerCode: resolveValue(step.answerCode, context, completedSteps),
        missionReasonTitle: resolveValue(step.missionReasonTitle, context, completedSteps),
        missionReasonBody: resolveValue(step.missionReasonBody, context, completedSteps),
        actionLabel: resolveValue(step.actionLabel, context, completedSteps),
        preserveFocusReadability: resolveValue(
          step.preserveFocusReadability,
          context,
          completedSteps
        ),
        actionDisabled: resolveValue(step.actionDisabled, context, completedSteps),
      };
    }

    return null;
  }, [completedSteps, context, isActive, isPersistedComplete, normalizedSteps]);

  const completeStep = useCallback(
    (stepId) => {
      if (!stepId) return;
      setManualCompletedSteps((prev) => {
        if (prev[stepId]) return prev;
        onStepCompleted?.(stepId);
        return {
          ...prev,
          [stepId]: true,
        };
      });
    },
    [onStepCompleted]
  );

  useEffect(() => {
    if (!isActive || isPersistedComplete) return;
    if (completionNotifiedRef.current) return;
    if (activeStep) return;
    if (!normalizedSteps.length) return;
    if (!areRequiredStepsComplete) return;

    completionNotifiedRef.current = true;
    setStorageValue(persistedKey);
    onComplete?.();
  }, [
    activeStep,
    areRequiredStepsComplete,
    isActive,
    isPersistedComplete,
    normalizedSteps.length,
    onComplete,
    persistedKey,
  ]);

  useEffect(() => {
    const autoAdvanceDelayMs = getStepAutoAdvanceDelayMs(activeStep, context);
    if (!autoAdvanceDelayMs) return undefined;

    const timeoutId = window.setTimeout(() => {
      completeStep(activeStep.id);
    }, autoAdvanceDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeStep, completeStep, context]);

  useEffect(() => {
    if (activeStep?.id && activeStep.id !== lastReachedStepIdRef.current) {
      lastReachedStepIdRef.current = activeStep.id;
      onStepReached?.(activeStep.id);
    }
  }, [activeStep?.id, onStepReached]);

  return {
    activeStep,
    completeStep,
    manualCompletedSteps,
    isPersistedComplete,
  };
}
