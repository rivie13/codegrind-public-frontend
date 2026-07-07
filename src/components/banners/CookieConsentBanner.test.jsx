import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateCookie = vi.hoisted(() => vi.fn());
const mockReadCookie = vi.hoisted(() => vi.fn());
const mockInitAnalytics = vi.hoisted(() => vi.fn());
const mockInitAdSense = vi.hoisted(() => vi.fn());

vi.mock('../../utils/web/cookieUtils', () => ({
  createCookie: mockCreateCookie,
  readCookie: mockReadCookie,
}));

vi.mock('../../services/analyticsService', () => ({
  initializeGoogleAnalytics: mockInitAnalytics,
  initializeAdSense: mockInitAdSense,
}));

import CookieConsentBanner from './CookieConsentBanner';

function renderBanner() {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        <CookieConsentBanner />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays hidden and initializes analytics when consent already accepted', () => {
    mockReadCookie.mockReturnValue('accepted');

    renderBanner();

    expect(mockInitAnalytics).toHaveBeenCalled();
    expect(screen.queryByText(/We would like to use cookies/i)).not.toBeInTheDocument();
  });

  it('stays hidden when consent denied', () => {
    mockReadCookie.mockReturnValue('denied');

    renderBanner();

    expect(mockInitAnalytics).not.toHaveBeenCalled();
    expect(screen.queryByText(/We would like to use cookies/i)).not.toBeInTheDocument();
  });

  it('shows banner when no consent and handles accept action', () => {
    mockReadCookie.mockReturnValue(undefined);

    renderBanner();

    expect(screen.getByText(/We would like to use cookies/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Accept/i }));
    expect(mockCreateCookie).toHaveBeenCalledWith('cookie-consent-status', 'accepted', 365);
    expect(mockInitAnalytics).toHaveBeenCalled();
  });

  it('shows banner when no consent and handles deny action', () => {
    mockReadCookie.mockReturnValue(undefined);

    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /Deny/i }));
    expect(mockCreateCookie).toHaveBeenCalledWith('cookie-consent-status', 'denied', 365);
  });
});
