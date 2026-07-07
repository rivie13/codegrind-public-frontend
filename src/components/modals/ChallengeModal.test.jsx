import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockToast = vi.hoisted(() => vi.fn());

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

import ChallengeModal from './ChallengeModal';

describe('ChallengeModal', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('requires at least one challenge and preserves the existing conflict guard', () => {
    render(
      <ChakraProvider>
        <ChallengeModal
          isOpen
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          problem={{ title: 'Two Sum' }}
        />
      </ChakraProvider>
    );

    const startButton = screen.getByRole('button', { name: /start challenge/i });
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /auto timer/i }));
    expect(startButton).toBeEnabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /time attack/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Challenge Conflict',
        status: 'warning',
      })
    );
  });
});
