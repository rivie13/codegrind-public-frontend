import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useBreakpointValue: () => false,
  };
});

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('../../../../game-engine-v2/renderer/enemies', () => ({
  drawEnemy: vi.fn(),
}));

import EnemyRevealOverlay from './EnemyRevealOverlay';

describe('EnemyRevealOverlay', () => {
  it('renders the retro desktop dossier copy for desktop overlays', () => {
    render(
      <ChakraProvider>
        <EnemyRevealOverlay
          reveal={{
            waveNumber: 4,
            playerLevel: 7,
            enemies: [
              {
                type: 'basic',
                codename: 'Crawler',
                description: 'A steady baseline threat.',
                health: 10,
                speed: 0.001,
                reward: 12,
                threat: 'Medium',
                color: '#0a3ca6',
                tactic: 'Keep basic towers on the lane early.',
              },
            ],
          }}
          onDismiss={vi.fn()}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/enemy dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/threat dossier updated/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acknowledge and launch/i })).toBeInTheDocument();
  });
});
