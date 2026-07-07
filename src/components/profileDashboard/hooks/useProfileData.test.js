import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadHook = async ({ userId = '42', options = {}, shouldFail = false } = {}) => {
  vi.resetModules();

  const toast = vi.fn();
  const getUserProfile = vi.fn();
  const getPublicProfile = vi.fn();
  const getProfileStats = vi.fn();
  const getActivityTimeline = vi.fn();
  const getCreatedAIProblems = vi.fn();
  const getWallet = vi.fn();
  const getEquipped = vi.fn();
  const getUserAchievements = vi.fn();

  const profilePayload = {
    id: Number(userId),
    username: 'coder',
    email: 'coder@example.com',
    hasPassword: true,
    isEmailVerified: true,
    bio: 'Build and ship.',
    avatarUrl: 'https://example.com/avatar.png',
    createdAt: '2026-01-01T00:00:00.000Z',
    membershipTier: 'PREMIUM',
    discordProfile: { linked: true, level: 12 },
  };

  if (shouldFail) {
    getUserProfile.mockRejectedValue(new Error('profile failed'));
    getPublicProfile.mockRejectedValue(new Error('profile failed'));
  } else {
    getUserProfile.mockResolvedValue(profilePayload);
    getPublicProfile.mockResolvedValue(profilePayload);
  }

  getProfileStats.mockResolvedValue({
    overallTotal: 15,
    easy: 5,
    medium: 7,
    hard: 3,
    easyProgress: 25,
    mediumProgress: 50,
    hardProgress: 75,
    overallSuccessRate: 80,
    streak: 9,
    towerDefenseStats: {
      wins: 2,
      highScore: 1440,
      perfectWins: 1,
    },
    leetcodeTD: { total: 1 },
    aiProblems: { total: 2 },
    aiProblemsTD: { total: 3 },
  });

  getActivityTimeline.mockResolvedValue([
    {
      id: 'act-1',
      description: 'Solved Two Sum',
      details: { status: 'accepted', mode: 'ranked', difficulty: 'easy' },
      timestamp: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'act-2',
      description: 'Solved Valid Parentheses',
      details: { status: 'accepted', mode: 'practice', difficulty: 'medium' },
      timestamp: '2026-02-02T00:00:00.000Z',
    },
  ]);
  getCreatedAIProblems.mockResolvedValue({
    problems: [{ id: 'ai-1', title: 'Generated Problem' }],
    total: 1,
  });
  getWallet.mockResolvedValue({
    balance: 88,
    events: [{ id: 1, reason: 'problem_solve', amount: 12 }],
  });
  getEquipped.mockResolvedValue({
    equipped: {
      'profile.badge': { slug: 'profile.badge.packet-architect.v1' },
    },
  });
  getUserAchievements.mockResolvedValue([{ id: 'ach-1', name: 'First Solve' }]);

  vi.doMock('@chakra-ui/react', () => ({
    useToast: () => toast,
  }));

  vi.doMock('../../../services/api', () => ({
    api: {
      auth: { getUserProfile },
      profile: { getPublicProfile },
      submissions: {
        getProfileStats,
        getActivityTimeline,
        getCreatedAIProblems,
      },
      store: {
        getWallet,
        getEquipped,
      },
    },
  }));

  vi.doMock('../../../services/achievementService', () => ({
    achievementService: {
      getUserAchievements,
    },
  }));

  vi.doMock('../../../utils/core/logger', () => ({
    default: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));

  const mod = await import('./useProfileData');
  const hook = renderHook(() => mod.default(userId, options));

  return {
    hook,
    toast,
    getUserProfile,
    getPublicProfile,
  };
};

describe('useProfileData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads private profile data, mapped stats, achievements, and activity timeline', async () => {
    const { hook, getUserProfile } = await loadHook();

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
    });

    expect(getUserProfile).toHaveBeenCalledWith('42');
    expect(hook.result.current.userData).toEqual(
      expect.objectContaining({
        id: 42,
        username: 'coder',
        membershipTier: 'PREMIUM',
        stats: expect.objectContaining({
          problemsSolved: 15,
          easySolved: 5,
          mediumSolved: 7,
          hardSolved: 3,
          towerDefenseWins: 2,
          towerDefenseHighScore: 1440,
          towerDefensePerfectWins: 1,
        }),
        createdAiProblemsTotal: 1,
      })
    );
    expect(hook.result.current.userData.recentActivity).toHaveLength(2);
    expect(hook.result.current.achievements).toEqual([{ id: 'ach-1', name: 'First Solve' }]);
  });

  it('uses the public profile endpoint when isPublicView is true', async () => {
    const { hook, getPublicProfile, getUserProfile } = await loadHook({
      userId: '7',
      options: { isPublicView: true },
    });

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
    });

    expect(getPublicProfile).toHaveBeenCalledWith('7');
    expect(getUserProfile).not.toHaveBeenCalled();
    expect(hook.result.current.userData?.id).toBe(7);
  });

  it('shows a toast and exits loading state when profile fetch fails', async () => {
    const { hook, toast } = await loadHook({ shouldFail: true });

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
    });

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Failed to load profile data',
        status: 'error',
      })
    );
  });
});
