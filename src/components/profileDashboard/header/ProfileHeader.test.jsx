import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogout = vi.hoisted(() => vi.fn());
const mockApi = vi.hoisted(() => ({
  auth: {
    deleteAccount: vi.fn(),
  },
  discord: {
    unlink: vi.fn(),
    updateSolveOptIn: vi.fn(),
  },
}));
const detailsPropsRef = vi.hoisted(() => ({ current: null }));
const actionsPropsRef = vi.hoisted(() => ({ current: null }));
const dialogsPropsRef = vi.hoisted(() => ({ current: null }));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

vi.mock('../../../services/api', () => ({
  api: mockApi,
  getApiOrigin: () => 'https://api.example.com',
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./ProfileHeaderAvatar', () => ({
  default: (props) => (
    <button data-testid="avatar" onClick={props.onImageError}>
      Avatar
    </button>
  ),
}));

vi.mock('./ProfileHeaderDetails', () => ({
  default: (props) => {
    detailsPropsRef.current = props;
    return (
      <button data-testid="details-optin" onClick={() => props.handleSolveOptInChange?.(true)}>
        Details
      </button>
    );
  },
}));

vi.mock('./ProfileHeaderActions', () => ({
  default: (props) => {
    actionsPropsRef.current = props;
    return (
      <button data-testid="copy-link" onClick={() => props.handleCopyProfileLink?.()}>
        Actions
      </button>
    );
  },
}));

vi.mock('./ProfileHeaderDialogs', () => ({
  default: (props) => {
    dialogsPropsRef.current = props;
    return (
      <>
        <button data-testid="confirm-delete" onClick={() => props.handleConfirmDelete?.()}>
          Delete
        </button>
        <button data-testid="confirm-unlink" onClick={() => props.handleConfirmUnlink?.()}>
          Unlink
        </button>
      </>
    );
  },
}));

import ProfileHeader from './ProfileHeader';

function renderHeader(props = {}) {
  const defaults = {
    userData: {
      username: 'Neo',
      email: 'neo@example.com',
      hasPassword: true,
      membershipTier: 'PREMIUM',
      avatarUrl: 'https://cdn.example.com/neo.png',
      progress: {
        xpIntoLevel: 30,
        xpToNextLevel: 60,
      },
    },
    onEditProfile: vi.fn(),
    onManageBilling: vi.fn(),
    billingLoading: false,
    billingError: null,
    avatarLoading: false,
    avatarError: null,
    isPublicView: false,
    shareUrl: 'https://codegrind.example/u/neo',
  };

  return render(
    <ChakraProvider>
      <ProfileHeader {...defaults} {...props} />
    </ChakraProvider>
  );
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ linked: true, optInSolveAnnouncements: true }),
    });

    global.Image = class MockImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.crossOrigin = '';
      }

      set src(_value) {
        if (this.onload) this.onload();
      }
    };

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue() },
    });

    window.prompt = vi.fn();

    mockApi.auth.deleteAccount.mockResolvedValue({ refund: { refunded: true } });
    mockApi.discord.unlink.mockResolvedValue({ success: true });
    mockApi.discord.updateSolveOptIn.mockResolvedValue({ optInSolveAnnouncements: true });
    mockLogout.mockResolvedValue();
  });

  it('returns null when user data is missing', () => {
    renderHeader({ userData: null });
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });

  it('loads discord status, computes props, and supports copy + opt-in handlers', async () => {
    renderHeader();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/discord/oauth/status', {
        credentials: 'include',
      });
    });

    await waitFor(() => {
      expect(detailsPropsRef.current?.discordStatus?.linked).toBe(true);
    });

    expect(detailsPropsRef.current?.displayTier).toBe('PRO');
    expect(detailsPropsRef.current?.xpProgressValue).toBe(50);

    fireEvent.click(screen.getByTestId('copy-link'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://codegrind.example/u/neo');
    });

    fireEvent.click(screen.getByTestId('details-optin'));
    await waitFor(() => {
      expect(mockApi.discord.updateSolveOptIn).toHaveBeenCalledWith(true);
    });
  });

  it('handles copy fallback and public view discord bypass', async () => {
    renderHeader({ isPublicView: true, shareUrl: '' });

    await waitFor(() => {
      expect(detailsPropsRef.current?.discordStatus?.loading).toBe(false);
    });

    fireEvent.click(screen.getByTestId('copy-link'));
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('executes account delete and discord unlink handlers', async () => {
    renderHeader();

    fireEvent.click(screen.getByTestId('confirm-delete'));
    await waitFor(() => {
      expect(mockApi.auth.deleteAccount).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTestId('confirm-unlink'));
    await waitFor(() => {
      expect(mockApi.discord.unlink).toHaveBeenCalled();
    });
  });
});
