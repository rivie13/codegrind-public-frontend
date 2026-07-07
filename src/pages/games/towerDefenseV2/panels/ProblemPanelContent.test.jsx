import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseInlineTowerDefenseOnboardingStep = vi.hoisted(() => vi.fn());
const mockTowerDefenseProblemPanel = vi.hoisted(() =>
  vi.fn(() => <div data-testid="problem-panel" />)
);

vi.mock(
  '../../../../components/towerDefense/onboarding/useInlineTowerDefenseOnboardingStep',
  () => ({
    default: (...args) => mockUseInlineTowerDefenseOnboardingStep(...args),
  })
);

vi.mock('../../../../components/towerDefense/ui', () => ({
  TowerDefenseProblemPanel: (props) => mockTowerDefenseProblemPanel(props),
}));

import ProblemPanelContent from './ProblemPanelContent';

const missionObjectiveStep = {
  id: 'mission-objective',
  requireManualContinue: true,
  requireScrollProgress: 0.35,
  actionLabel: 'I READ THE BRIEF',
  blockedActionLabel: 'SCROLL THE BRIEF',
  lockedActionLabel: 'READING BRIEF...',
  manualContinueDelayMs: 0,
  manualContinueDelayMobileMs: 0,
};

function renderContent(props = {}) {
  return render(
    <ChakraProvider>
      <ProblemPanelContent
        problemDescription={{ title: 'Mission 1: Hello Print' }}
        currentWave={1}
        totalWaves={2}
        shellTheme="retro-desktop"
        isMobileSlotLayout
        {...props}
      />
    </ChakraProvider>
  );
}

describe('ProblemPanelContent mission brief overlay gating', () => {
  it('keeps the mission brief prompt visible until the user actually scrolls', () => {
    mockUseInlineTowerDefenseOnboardingStep.mockReturnValue(missionObjectiveStep);

    renderContent();

    let latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];

    expect(latestProps.tutorialOverlay).toEqual(
      expect.objectContaining({
        isVisible: true,
        isDismissed: false,
        isCompactMobileLayout: true,
      })
    );

    act(() => {
      latestProps.onScrollStateChange({
        progress: 0.12,
        hasScrollableOverflow: true,
        hasScrolled: true,
        currentScrollPx: 0,
        source: 'mount',
      });
    });

    latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];
    expect(latestProps.tutorialOverlay.isDismissed).toBe(false);

    act(() => {
      latestProps.onScrollStateChange({
        progress: 0.03,
        hasScrollableOverflow: true,
        hasScrolled: true,
        currentScrollPx: 18,
        source: 'scroll',
      });
    });

    latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];
    expect(latestProps.tutorialOverlay.isDismissed).toBe(false);

    act(() => {
      latestProps.onScrollStateChange({
        progress: 0.12,
        hasScrollableOverflow: true,
        hasScrolled: true,
        currentScrollPx: 56,
        source: 'scroll',
      });
    });

    latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];
    expect(latestProps.tutorialOverlay.isDismissed).toBe(true);
  });

  it('does not auto-hide the brief prompt when the panel reports no overflow on mount', () => {
    mockUseInlineTowerDefenseOnboardingStep.mockReturnValue(missionObjectiveStep);

    renderContent();

    let latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];

    act(() => {
      latestProps.onScrollStateChange({
        progress: 1,
        hasScrollableOverflow: false,
        hasScrolled: false,
        currentScrollPx: 0,
        source: 'mount',
      });
    });

    latestProps = mockTowerDefenseProblemPanel.mock.calls.at(-1)?.[0];
    expect(latestProps.tutorialOverlay.isDismissed).toBe(false);
  });
});
