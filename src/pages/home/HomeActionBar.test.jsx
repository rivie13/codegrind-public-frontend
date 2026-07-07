import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

vi.mock('../../hooks/useHasHydrated', () => ({
  default: () => true,
}));

vi.mock('../../components/auth/AuthForms', () => ({
  default: () => <div>mock auth form</div>,
}));

import HomeActionBar from './HomeActionBar';

describe('HomeActionBar', () => {
  it('shows the updated helper copy inside the auth modal', async () => {
    render(
      <ChakraProvider>
        <MemoryRouter>
          <HomeActionBar />
        </MemoryRouter>
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign up \/ login/i }));

    expect(
      await screen.findByText(
        /create a free account to save progress, keep your wins, and track your coding journey/i
      )
    ).toBeInTheDocument();
  });
});
