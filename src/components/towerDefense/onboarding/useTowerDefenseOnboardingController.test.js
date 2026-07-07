import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useTowerDefenseOnboardingController from './useTowerDefenseOnboardingController';

describe('useTowerDefenseOnboardingController', () => {
  it('keeps auto-completed steps complete when context temporarily regresses', async () => {
    const steps = [
      {
        id: 'write-code',
        completeWhen: ({ isCodeReady }) => Boolean(isCodeReady),
      },
      {
        id: 'start-wave',
        completeWhen: ({ hasStartedWave }) => Boolean(hasStartedWave),
      },
    ];

    const { result, rerender } = renderHook(
      ({ context }) =>
        useTowerDefenseOnboardingController({
          isActive: true,
          steps,
          context,
        }),
      {
        initialProps: {
          context: {
            isCodeReady: false,
            hasStartedWave: false,
          },
        },
      }
    );

    expect(result.current.activeStep?.id).toBe('write-code');

    rerender({
      context: {
        isCodeReady: true,
        hasStartedWave: false,
      },
    });

    await waitFor(() => {
      expect(result.current.activeStep?.id).toBe('start-wave');
    });

    rerender({
      context: {
        isCodeReady: false,
        hasStartedWave: false,
      },
    });

    await waitFor(() => {
      expect(result.current.activeStep?.id).toBe('start-wave');
    });
  });
});
