import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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

  it('renders the mission brief with no scroll gate', () => {
    renderPanel({
      shellTheme: 'retro-desktop',
    });

    expect(screen.getByText('Mission 1: Hello Print')).toBeInTheDocument();
    expect(screen.queryByText(/Scroll this mission brief before continuing/i)).toBeNull();
    expect(screen.queryByText('SCROLL')).toBeNull();
  });
});
