import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../components/layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../../components/seo/PageSeo', () => ({
  default: () => null,
}));

vi.mock('../../components/ads/BottomBannerAd', () => ({
  default: () => null,
}));

vi.mock('../../components/ads/SidebarAd', () => ({
  default: () => null,
}));

vi.mock('../../components/ads/TopBannerAd', () => ({
  default: () => null,
}));

import GamesLandingPage from './GamesLandingPage';

describe('GamesLandingPage', () => {
  it('routes the browse CTA to the tower defense problem list', () => {
    render(
      <MemoryRouter>
        <ChakraProvider>
          <GamesLandingPage />
        </ChakraProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /browse code breach problems/i })).toHaveAttribute(
      'href',
      '/games/tower-defense'
    );
  });
});
