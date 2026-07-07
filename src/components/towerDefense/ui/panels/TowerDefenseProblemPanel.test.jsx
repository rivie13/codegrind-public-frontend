import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TowerDefenseProblemPanel from './TowerDefenseProblemPanel';

const baseProblemDescription = {
  title: 'Mission 1: Hello Print',
  hackingContext: 'Breach the system by building a tower defense solution.',
};

function renderPanel(props = {}) {
  return render(
    <ChakraProvider>
      <TowerDefenseProblemPanel
        problemDescription={baseProblemDescription}
        currentWave={1}
        totalWaves={2}
        {...props}
      />
    </ChakraProvider>
  );
}

describe('TowerDefenseProblemPanel breach progress', () => {
  it('tracks completed mission waves instead of the current wave index', () => {
    const { rerender } = renderPanel();

    expect(screen.getByText('Breach Progress: 0%')).toBeInTheDocument();

    rerender(
      <ChakraProvider>
        <TowerDefenseProblemPanel
          problemDescription={baseProblemDescription}
          currentWave={2}
          totalWaves={2}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Breach Progress: 50%')).toBeInTheDocument();

    rerender(
      <ChakraProvider>
        <TowerDefenseProblemPanel
          problemDescription={baseProblemDescription}
          currentWave={2}
          totalWaves={2}
          isMissionComplete
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Breach Progress: 100%')).toBeInTheDocument();
  });

  it('renders the mission brief callout when the tutorial overlay is active', () => {
    renderPanel({
      shellTheme: 'retro-desktop',
      tutorialOverlay: {
        isVisible: true,
        isDismissed: false,
        isCompactMobileLayout: true,
      },
    });

    expect(screen.getByText(/Scroll this mission brief before continuing/i)).toBeInTheDocument();
    expect(screen.getByText('SCROLL')).toBeInTheDocument();
  });

  it('reports mount and user scroll updates separately for tutorial gating', () => {
    const onScrollStateChange = vi.fn();

    renderPanel({ onScrollStateChange });

    expect(onScrollStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'mount',
      })
    );

    const scrollContainer = document.querySelector(
      '[data-tutorial="problem-panel-header"]'
    )?.parentElement;

    expect(scrollContainer).toBeTruthy();

    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      value: 120,
      writable: true,
    });

    fireEvent.scroll(scrollContainer);

    expect(onScrollStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: 'scroll',
      })
    );
  });
});
