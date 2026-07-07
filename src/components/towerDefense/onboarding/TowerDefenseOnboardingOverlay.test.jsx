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
          step={{
            id: 'interwave-slot-switch',
            kind: 'callout',
            title: 'SLOT SWITCHING',
            message: 'Swap slots to continue.',
            targetSelector: "[data-tutorial-role='panel-switcher']",
            placement: 'bottom',
          }}
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
      .getByText('SLOT SWITCHING')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBeGreaterThan(70);
  });

  it('keeps the slot-switch ticker anchored below slot controls on mobile', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={{
            id: 'interwave-slot-switch',
            kind: 'callout',
            title: 'SLOT SWITCHING',
            message: 'Swap slots to continue.',
            targetSelector: "[data-tutorial-role='panel-switcher']",
            placement: 'bottom',
          }}
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
      .getByText('SLOT SWITCHING')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBeGreaterThan(220);
  });

  it('pins the slot-switch ticker near the bottom when the taskbar rect is not ready yet', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={{
            id: 'interwave-slot-switch',
            kind: 'callout',
            title: 'SLOT SWITCHING',
            message: 'Swap slots to continue.',
            targetSelector: "[data-tutorial='slot-switch-taskbar']",
            placement: 'bottom',
          }}
          targetRect={null}
          onCompleteStep={vi.fn()}
        />
      </ChakraProvider>
    );

    const tickerStrip = screen
      .getByText('SLOT SWITCHING')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();

    const topOffset = Number.parseInt(tickerStrip.style.top || '0', 10);
    expect(topOffset).toBeGreaterThan(200);
  });

  it('keeps default top ticker placement for non-slot callouts with room above target', () => {
    render(
      <ChakraProvider>
        <TowerDefenseOnboardingOverlay
          step={{
            id: 'verify-solution',
            kind: 'callout',
            title: 'VERIFY SOLUTION',
            message: 'Run tests when ready.',
            targetSelector: "[data-tutorial='learning-path-action-buttons']",
            placement: 'bottom',
          }}
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
      .getByText('VERIFY SOLUTION')
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
          step={{
            id: 'mission-objective',
            kind: 'callout',
            title: 'MISSION OBJECTIVE',
            message: 'Read the problem first.',
            targetSelector: "[data-tutorial='problem-panel-header']",
            panelFocus: { rightPanel: 'problem' },
            requireManualContinue: true,
            actionLabel: 'Got It - Continue',
            preserveFocusReadability: true,
          }}
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
      .getByText('MISSION OBJECTIVE')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");
    expect(tickerStrip).toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: 'Got It - Continue' });
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
          step={{
            id: 'mission-objective',
            kind: 'callout',
            title: 'MISSION OBJECTIVE',
            message: 'Read the problem first.',
            targetSelector: "[data-tutorial='problem-panel-header']",
            panelFocus: { rightPanel: 'problem' },
            preserveFocusReadability: true,
            preferMobileTicker: true,
          }}
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
      .getByText('MISSION OBJECTIVE')
      .closest("[data-tutorial='onboarding-mobile-ticker-strip']");

    expect(tickerStrip).toBeInTheDocument();
  });

  it('uses positioned callout on desktop when readability preservation is requested', async () => {
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
          step={{
            id: 'mission-objective',
            kind: 'callout',
            title: 'MISSION OBJECTIVE',
            message: 'Read the problem first.',
            targetSelector: "[data-tutorial='problem-panel-header']",
            panelFocus: { rightPanel: 'problem' },
            requireManualContinue: true,
            actionLabel: 'Got It - Continue',
            preserveFocusReadability: true,
          }}
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
    expect(await screen.findByText('Read the problem first.')).toBeInTheDocument();
  });
});
