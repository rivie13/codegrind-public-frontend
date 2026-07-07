import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockUseProfileData = vi.hoisted(() => vi.fn());
const mockUseProfileForm = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => {
  const fn = vi.fn();
  fn.isActive = vi.fn(() => false);
  return fn;
});

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
  default: { profileDashboard: { top: 'top-slot', bottom: 'bottom-slot' } },
}));

vi.mock('../../services/api', () => ({
  api: {
    payments: {
      createPortalSession: vi.fn(),
    },
    store: {
      getWallet: vi.fn().mockResolvedValue({ balance: 0, events: [] }),
    },
  },
}));

vi.mock('../layout/PageTemplate', () => ({
  default: ({ children }) => <div data-testid="page-template">{children}</div>,
}));

vi.mock('../ads/TopBannerAd', () => ({
  default: () => <div data-testid="top-banner-ad" />,
}));

vi.mock('../ads/BottomBannerAd', () => ({
  default: () => <div data-testid="bottom-banner-ad" />,
}));

vi.mock('./hooks/useProfileData', () => ({
  default: (...args) => mockUseProfileData(...args),
}));

vi.mock('./hooks/useProfileForm', () => ({
  default: (...args) => mockUseProfileForm(...args),
}));

vi.mock('./ClusterProgressWidget', () => ({
  default: () => <div>Cluster progress</div>,
}));

vi.mock('./DashboardWelcomeModal', () => ({
  default: () => null,
}));

vi.mock('./LearningPathProgressWidget', () => ({
  default: () => <div>Learning progress</div>,
}));

vi.mock('./LoadingProfile', () => ({
  default: () => <div>Loading profile</div>,
}));

vi.mock('./NextObjectiveWidget', () => ({
  default: () => <div>Next objective</div>,
}));

vi.mock('./ProfileEditModal', () => ({
  default: () => null,
}));

vi.mock('./ProfileHeader', () => ({
  default: ({ onManageBilling, billingError }) => (
    <div>
      <div>Profile header</div>
      {onManageBilling ? <button onClick={onManageBilling}>Manage billing</button> : null}
      {billingError ? <div>{billingError}</div> : null}
    </div>
  ),
}));

vi.mock('./ProfileTabs', () => ({
  default: () => <div>Profile tabs</div>,
}));

vi.mock('./StatsSummary', () => ({
  default: () => <div>Stats summary</div>,
}));

vi.mock('../feedback/BugReportButton', () => ({
  default: ({ buttonLabel = 'Report a Bug' }) => <button>{buttonLabel}</button>,
}));

import ProfileDashboard from './index.jsx';
import { api } from '../../services/api';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ChakraProvider>
        <ProfileDashboard />
      </ChakraProvider>
    </MemoryRouter>
  );
}

describe('ProfileDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.isActive.mockReturnValue(false);
    api.store.getWallet.mockResolvedValue({ balance: 0, events: [] });
    mockUseAuth.mockReturnValue({
      user: { id: 7, username: 'rivie' },
    });
    mockUseProfileData.mockReturnValue({
      userData: {
        id: 7,
        username: 'rivie',
        membershipTier: 'PREMIUM',
        subscriptionStatus: 'active',
        createdAiProblems: [],
        createdAiProblemsTotal: 0,
      },
      isLoading: false,
      achievements: [],
      refreshProfileData: vi.fn(),
    });
    mockUseProfileForm.mockReturnValue({
      formData: {},
      setFormData: vi.fn(),
      handleUpdateProfile: vi.fn(),
      error: '',
      isLoading: false,
      avatarLoading: false,
      avatarError: '',
      passwordErrors: [],
      passwordMatchError: '',
    });
  });

  it('shows billing, support, and bug report contact actions on the private dashboard', () => {
    renderDashboard();

    expect(screen.getByRole('link', { name: /Contact Support:/i })).toHaveAttribute(
      'href',
      'mailto:info@codegrind.online'
    );
    expect(screen.getByRole('link', { name: /Billing Help:/i })).toHaveAttribute(
      'href',
      'mailto:billing@codegrind.online'
    );
    expect(screen.getByRole('button', { name: /Report a Bug/i })).toBeInTheDocument();
  });

  it('shows a billing warning toast when the billing portal action fails', async () => {
    api.payments.createPortalSession.mockRejectedValueOnce(
      new Error('Unable to open billing portal.')
    );

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /Manage billing/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'billing-action-failed-profile',
          title: 'Billing action failed',
          status: 'warning',
        })
      );
    });

    expect(screen.getByText('Unable to open billing portal.')).toBeInTheDocument();
  });
});
