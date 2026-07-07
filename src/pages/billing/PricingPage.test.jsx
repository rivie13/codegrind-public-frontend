import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockRefreshAuth = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../config/adSlots', () => ({
  default: { generic: { top: 'top-slot', bottom: 'bottom-slot' } },
}));

vi.mock('../../services/api', () => ({
  api: {
    payments: {
      createCheckoutSession: vi.fn(),
      createPortalSession: vi.fn(),
    },
  },
}));

vi.mock('../../components/layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../../components/ads/TopBannerAd', () => ({
  default: () => <div data-testid="top-banner-ad" />,
}));

vi.mock('../../components/ads/BottomBannerAd', () => ({
  default: () => <div data-testid="bottom-banner-ad" />,
}));

vi.mock('./components/BenefitsSection', () => ({
  default: () => <div>Benefits section</div>,
}));

vi.mock('./components/CallToAction', () => ({
  default: () => <div>CTA section</div>,
}));

vi.mock('./components/ComingSoonSection', () => ({
  default: () => <div>Coming soon</div>,
}));

vi.mock('./components/CurrentStatus', () => ({
  default: () => <div>Current status</div>,
}));

vi.mock('./components/FooterNote', () => ({
  default: () => <div>Footer note</div>,
}));

vi.mock('./components/PlanSelector', () => ({
  default: ({ onCheckout }) => <button onClick={() => onCheckout('PREMIUM')}>Upgrade now</button>,
}));

vi.mock('./components/PricingHeader', () => ({
  default: () => <div>Pricing header</div>,
}));

vi.mock('./components/StatusBanner', () => ({
  default: () => <div>Status banner</div>,
}));

import PricingPage from './PricingPage';

function renderPricingPage() {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        <PricingPage />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { membershipTier: 'FREE' },
      isAuthenticated: true,
      refreshAuth: mockRefreshAuth,
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { search: '', href: 'http://localhost/pricing' },
    });
  });

  it('shows billing and general support contact options on the upgrade page', () => {
    renderPricingPage();

    expect(screen.getByRole('link', { name: /Contact Support:/i })).toHaveAttribute(
      'href',
      'mailto:info@codegrind.online'
    );
    expect(screen.getByRole('link', { name: /Billing Help:/i })).toHaveAttribute(
      'href',
      'mailto:billing@codegrind.online'
    );
    expect(screen.getByText(/Subscription, invoices, and billing changes:/i)).toHaveTextContent(
      'billing@codegrind.online'
    );
  });

  it('shows a billing toast when checkout is requested without authentication', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      refreshAuth: mockRefreshAuth,
    });

    renderPricingPage();
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade now' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'billing-action-failed',
          title: 'Billing action failed',
          status: 'warning',
        })
      );
    });
  });
});
