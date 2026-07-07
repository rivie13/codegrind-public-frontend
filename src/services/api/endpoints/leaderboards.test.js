import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import leaderboards from './leaderboards';

describe('leaderboards endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fetches top-level leaderboard datasets', async () => {
    fetchWithError.mockResolvedValueOnce({ all: true });
    fetchWithError.mockResolvedValueOnce({ td: true });
    fetchWithError.mockResolvedValueOnce({ problems: [] });

    await expect(leaderboards.getAll()).resolves.toEqual({ all: true });
    await expect(leaderboards.getTowerDefense()).resolves.toEqual({ td: true });
    await expect(leaderboards.getProblems()).resolves.toEqual({ problems: [] });

    expect(fetchWithError).toHaveBeenNthCalledWith(1, '/api/leaderboards');
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/leaderboards/tower-defense');
    expect(fetchWithError).toHaveBeenNthCalledWith(3, '/api/leaderboards/problems');
  });

  it('validates problem leaderboard keys before request', async () => {
    await expect(leaderboards.getProblemLeaderboard('bad-key')).rejects.toThrow(
      'Invalid problem key format. Expected format: SOURCE_ID'
    );
    await expect(leaderboards.getTowerDefenseProblemLeaderboard('')).rejects.toThrow(
      'Invalid problem key format. Expected format: SOURCE_ID'
    );
    expect(fetchWithError).not.toHaveBeenCalled();
  });

  it('fetches problem-specific leaderboards and rethrows upstream failures', async () => {
    fetchWithError.mockResolvedValueOnce({ rows: [1] });
    fetchWithError.mockResolvedValueOnce({ rows: [2] });
    fetchWithError.mockRejectedValueOnce(new Error('network down'));

    await expect(leaderboards.getProblemLeaderboard('INTERVIEW_123')).resolves.toEqual({
      rows: [1],
    });
    await expect(leaderboards.getTowerDefenseProblemLeaderboard('AI_9')).resolves.toEqual({
      rows: [2],
    });
    await expect(leaderboards.getAll()).rejects.toThrow('network down');

    expect(fetchWithError).toHaveBeenNthCalledWith(1, '/api/leaderboards/problem/INTERVIEW_123');
    expect(fetchWithError).toHaveBeenNthCalledWith(
      2,
      '/api/leaderboards/tower-defense/problem/AI_9'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(3, '/api/leaderboards');
  });
});
