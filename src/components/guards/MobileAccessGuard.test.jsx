import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MobileAccessGuard, { isHandheldBlockedPath } from './MobileAccessGuard';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';

vi.mock('../../hooks/useIsMobileDevice', () => ({
  default: vi.fn(() => false),
}));

const mockedUseIsMobileDevice = vi.mocked(useIsMobileDevice);

const renderGuard = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ChakraProvider>
        <Routes>
          <Route element={<MobileAccessGuard />}>
            <Route path="*" element={<div data-testid="guard-outlet">Allowed Content</div>} />
          </Route>
        </Routes>
      </ChakraProvider>
    </MemoryRouter>
  );

afterEach(() => {
  mockedUseIsMobileDevice.mockReturnValue(false);
});

describe('MobileAccessGuard', () => {
  it('renders the outlet on desktop regardless of route', () => {
    mockedUseIsMobileDevice.mockReturnValue(false);
    renderGuard('/games/tower-defense/two-sum');

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
  });

  it.each([
    '/',
    '/about',
    '/faq',
    '/privacy-policy',
    '/blog',
    '/blog/codegrind/hello-world',
    '/updates',
    '/leaderboards',
    '/pricing',
    '/upgrade',
    '/profile',
    '/profile/some-user-id',
    '/verify-email',
  ])('handheld allows %s', (path) => {
    mockedUseIsMobileDevice.mockReturnValue(true);
    renderGuard(path);

    expect(screen.getByTestId('guard-outlet')).toBeInTheDocument();
    expect(screen.queryByText(/desktop required for this content/i)).not.toBeInTheDocument();
  });

  it.each([
    '/city',
    '/city/phaser-preview',
    '/games',
    '/games/clusters',
    '/games/tower-defense/two-sum',
    '/problems',
    '/problems/two-sum',
    '/learning',
    '/learning/python-path',
    '/learning/python-path/py-m0-hello',
    '/ai-problems',
    '/ai-problems/create',
    '/store',
    '/profile/submissions',
  ])('handheld blocks %s with the desktop-only notice', (path) => {
    mockedUseIsMobileDevice.mockReturnValue(true);
    renderGuard(path);

    expect(screen.queryByTestId('guard-outlet')).not.toBeInTheDocument();
    expect(screen.getByText(/desktop required for this content/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /go to profile/i })).toHaveAttribute(
      'href',
      '/profile'
    );
  });

  it('matches blocked paths without a trailing slash tripping the check', () => {
    expect(isHandheldBlockedPath('/city/')).toBe(true);
    expect(isHandheldBlockedPath('/profile/submissions/')).toBe(true);
    expect(isHandheldBlockedPath('/profile/')).toBe(false);
    expect(isHandheldBlockedPath('/')).toBe(false);
  });
});
