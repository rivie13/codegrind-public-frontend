import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUseGuestProgress = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());

vi.mock('../hooks/guest/useGuestProgress', () => ({
  default: mockUseGuestProgress,
}));

vi.mock('./AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

import { GuestProgressProvider } from './GuestProgressProvider';

const GUEST_ACHIEVEMENTS = {
  'hello-codegrind': {
    id: 'hello-codegrind',
    title: 'Hello CodeGrind',
    description: 'Cleared the homepage onboarding demo.',
  },
  'first-blood': {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Solved your first problem as a guest.',
  },
};

const buildGuestValue = (achievementIds = [], hydrated = true) => ({
  progress: {
    guestAchievements: achievementIds,
  },
  freeProblemsRemaining: 3,
  hasReachedProblemWall: false,
  unlockedGuestAchievements: achievementIds.map((id) => GUEST_ACHIEVEMENTS[id]).filter(Boolean),
  hydrated,
});

describe('GuestProgressProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
  });

  it('does not replay guest achievement toast on initial hydrate', () => {
    let guestValue = buildGuestValue(['hello-codegrind']);
    mockUseGuestProgress.mockImplementation(() => guestValue);

    render(
      <GuestProgressProvider>
        <div>child</div>
      </GuestProgressProvider>
    );

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not show a toast for achievements loaded during initial hydration', async () => {
    let guestValue = buildGuestValue(['hello-codegrind'], false);
    mockUseGuestProgress.mockImplementation(() => guestValue);

    const { rerender } = render(
      <GuestProgressProvider>
        <div>child</div>
      </GuestProgressProvider>
    );

    // Initial load, not hydrated yet: no toast
    expect(mockToast).not.toHaveBeenCalled();

    // Now hydration finishes on server with the pre-existing achievement
    guestValue = buildGuestValue(['hello-codegrind'], true);

    rerender(
      <GuestProgressProvider>
        <div>child</div>
      </GuestProgressProvider>
    );

    // Still no toast should have been triggered since it was loaded during hydration
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows a toast when a new guest achievement unlocks after hydration', async () => {
    let guestValue = buildGuestValue([]);
    mockUseGuestProgress.mockImplementation(() => guestValue);

    const { rerender } = render(
      <GuestProgressProvider>
        <div>child</div>
      </GuestProgressProvider>
    );

    guestValue = buildGuestValue(['hello-codegrind']);

    rerender(
      <GuestProgressProvider>
        <div>child</div>
      </GuestProgressProvider>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledTimes(1);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Guest Achievement Unlocked!',
        status: 'success',
      })
    );
  });
});
