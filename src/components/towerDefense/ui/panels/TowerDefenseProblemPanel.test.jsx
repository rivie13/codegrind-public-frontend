import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TowerDefenseProblemPanel from './TowerDefenseProblemPanel';

vi.mock('../../../feedback/BugReportButton', () => ({
  default: () => <button>Report Bug</button>,
}));

const baseProblemDescription = {
  title: 'Mission 1: Hello Print',
};

function renderPanel(props = {}) {
  return render(
    <ChakraProvider>
      <TowerDefenseProblemPanel problemDescription={baseProblemDescription} {...props} />
    </ChakraProvider>
  );
}

describe('TowerDefenseProblemPanel mission header', () => {
  it('renders no breach progress copy', () => {
    renderPanel();

    expect(screen.queryByText(/breach progress/i)).toBeNull();
    expect(screen.queryByText(/mission progress/i)).toBeNull();
  });

  it('keeps report bug inside the mission title header', () => {
    renderPanel({
      shellTheme: 'retro-desktop',
    });

    expect(screen.getByText('Mission 1: Hello Print')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report bug/i })).toBeInTheDocument();
    expect(screen.queryByText(/lesson file/i)).toBeNull();
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
