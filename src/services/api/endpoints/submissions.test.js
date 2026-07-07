import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { fetchWithError } from '../fetcher';
import submissions from './submissions';

describe('submissions endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('maps profile stats with defaults and tower-defense projections', async () => {
    fetchWithError.mockResolvedValue({
      total: 5,
      medium: 2,
      towerDefenseStats: {
        wins: 3,
        perfectWins: 1,
        highScore: 999,
        totalGames: 8,
      },
      aiProblemsTD: { total: 4 },
    });

    const stats = await submissions.getProfileStats('u-1');

    expect(fetchWithError).toHaveBeenCalledWith('/api/profile/stats/u-1');
    expect(stats).toEqual(
      expect.objectContaining({
        total: 5,
        easy: 0,
        medium: 2,
        hard: 0,
        towerDefenseWins: 3,
        towerDefenseHighScore: 999,
        towerDefensePerfectWins: 1,
        totalTowerDefenseGames: 8,
        interviewTD: expect.objectContaining({ total: 0 }),
        aiProblems: expect.objectContaining({ total: 0 }),
        aiProblemsTD: { total: 4 },
      })
    );
  });

  it('builds submissions list queries and maps profile submission items', async () => {
    fetchWithError.mockResolvedValueOnce({ submissions: ['one'] });
    fetchWithError.mockResolvedValueOnce({
      submissions: [
        {
          id: 9,
          problemId: 'two-sum',
          status: 'ACCEPTED',
          submission_date: '2026-01-01',
          problem_difficulty: 'EASY',
        },
      ],
    });

    const list = await submissions.getSubmissions('u-2', {
      page: 2,
      limit: 15,
      difficulty: 'HARD',
    });
    const profileList = await submissions.getProfileSubmissions('u-2', 3);

    expect(list).toEqual({ submissions: ['one'] });
    expect(fetchWithError).toHaveBeenNthCalledWith(
      1,
      '/api/submissions/u-2?page=2&limit=15&difficulty=HARD'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/profile/submissions/u-2?limit=3');
    expect(profileList).toEqual([
      {
        id: 9,
        problem: 'two-sum',
        status: 'ACCEPTED',
        date: '2026-01-01',
        difficulty: 'EASY',
      },
    ]);
  });

  it('returns safe fallbacks for timeline and created AI problems failures', async () => {
    fetchWithError.mockResolvedValueOnce([{ date: '2026-01-01' }]);
    fetchWithError.mockRejectedValueOnce(new Error('timeline down'));
    fetchWithError.mockResolvedValueOnce({ problems: [{ id: 1 }], total: 1 });
    fetchWithError.mockRejectedValueOnce(new Error('ai list down'));

    await expect(submissions.getActivityTimeline('u-3')).resolves.toEqual([{ date: '2026-01-01' }]);
    await expect(submissions.getActivityTimeline('u-3')).resolves.toEqual([]);
    await expect(submissions.getCreatedAIProblems('u-3', 12)).resolves.toEqual({
      problems: [{ id: 1 }],
      total: 1,
    });
    await expect(submissions.getCreatedAIProblems('u-3', 12)).resolves.toEqual({
      problems: [],
      total: 0,
    });
  });

  it('maps dashboard stats and paginated dashboard submissions', async () => {
    fetchWithError.mockResolvedValueOnce({
      easySolved: 1,
      mediumSolved: 2,
      hardSolved: 3,
      totalSolved: 6,
      totalSubmissions: 20,
      submissions: [{ id: 'r1' }],
    });
    fetchWithError.mockResolvedValueOnce({
      submissions: [{ id: 'p1' }],
      currentPage: 4,
      totalPages: 7,
    });

    const stats = await submissions.getDashboardStats('u-4');
    const page = await submissions.getDashboardSubmissions('u-4', 4, 25, 'MEDIUM');

    expect(fetchWithError).toHaveBeenNthCalledWith(1, '/api/submissions/dashboard/u-4');
    expect(fetchWithError).toHaveBeenNthCalledWith(
      2,
      '/api/submissions/dashboard/u-4/list?page=4&limit=25&difficulty=MEDIUM'
    );
    expect(stats).toEqual({
      easySolved: 1,
      mediumSolved: 2,
      hardSolved: 3,
      totalSolved: 6,
      totalSubmissions: 20,
      recentSubmissions: [{ id: 'r1' }],
    });
    expect(page).toEqual({
      submissions: [{ id: 'p1' }],
      currentPage: 4,
      totalPages: 7,
    });
  });
});
