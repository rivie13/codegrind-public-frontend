import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import TowerDefenseOnboardingOverlay from './TowerDefenseOnboardingOverlay';
import { getHomepageLiteOnboardingScript } from './towerDefenseOnboardingScripts';

const liteSteps = getHomepageLiteOnboardingScript().steps;
const getLiteStep = (id) => ({ ...liteSteps.find((step) => step.id === id) });

const createMatchMediaResult = (query) => ({
  matches: query === '(pointer: coarse)' || query === '(max-width: 960px)',
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

describe('TowerDefenseOnboardingOverlay', () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
    window.matchMedia = vi.fn().mockImplementation((query) => createMatchMediaResult(query));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
    window.matchMedia = originalMatchMedia;
  });

  it('moves the mobile ticker below top controls when the target is near the top edge', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('lite-start-wave')}
          targetRect={{
            top: 28,
            left: 20,
            right: 270,
            bottom: 64,
            width: 250,
            height: 36,
            x: 20,
            y: 28,
          }}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('START WAVE')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBeGreaterThan(70);
  });

  it('keeps top ticker placement when the target has room above it on mobile', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('lite-submit')}
          targetRect={{
            top: 180,
            left: 24,
            right: 286,
            bottom: 220,
            width: 262,
            height: 40,
            x: 24,
            y: 180,
          }}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('SUBMIT')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBe(0);
  });

  it('defaults the ticker to the top when the target rect is not ready yet', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('lite-submit')}
          targetRect={null}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('SUBMIT')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBe(0);
  });

  it('keeps default top ticker placement for non-slot callouts with room above target', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('lite-submit')}
          targetRect={{
            top: 200,
            left: 24,
            right: 286,
            bottom: 240,
            width: 262,
            height: 40,
            x: 24,
            y: 200,
          }}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('SUBMIT')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBe(0);
  });

  it('uses ticker mode for panel-focused mobile callouts and supports manual continue', () => {
    const onCompleteStep = vi.fn();

    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('mission-objective')}
          targetRect={{
            top: 96,
            left: 20,
            right: 300,
            bottom: 140,
            width: 280,
            height: 44,
            x: 20,
            y: 96,
          }}
          onCompleteStep={onCompleteStep}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('READ THE BRIEF')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");
    expect(tickerStrip).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: 'I READ THE BRIEF' });
    expect(continueButton).toBeInTheDocument();

    fireEvent.click(continueButton);
    expect(onCompleteStep).toHaveBeenCalledWith('mission-objective');
  });

  it('uses ticker mode for preferred mobile callouts in narrow viewports without coarse pointer', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      ...createMatchMediaResult(query),
      matches: query === '(max-width: 960px)' ? true : false,
    }));

    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('mission-objective')}
          targetRect={{
            top: 96,
            left: 20,
            right: 300,
            bottom: 140,
            width: 280,
            height: 44,
            x: 20,
            y: 96,
          }}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('READ THE BRIEF')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();
  });

  it('uses positioned callout on desktop', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    // Simulate a desktop device: fine pointer, no coarse pointer, no touch
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      ...createMatchMediaResult(query),
      matches: query === '(pointer: fine)' ? true : false,
    }));

    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={getLiteStep('mission-objective')}
          targetRect={{
            top: 140,
            left: 760,
            right: 1180,
            bottom: 196,
            width: 420,
            height: 56,
            x: 760,
            y: 140,
          }}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Callout')).toBeInTheDocument();
    // TypedText renders via setInterval so we must wait for the typewriter to finish
    expect(
      await screen.findByText(
        'THIS IS WHERE YOU READ THE MISSION BRIEF. The problem panel shows the coding problem you are solving.',
        {},
        { timeout: 4000 }
      )
    ).toBeInTheDocument();
  });
});
