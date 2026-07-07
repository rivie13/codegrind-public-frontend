import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn() },
}));

import { fetchWithError } from '../fetcher';
import achievements from './achievements';

describe('achievements endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ data: [] });
  });

  describe('getAvailable', () => {
    it('calls GET /api/achievements/available', async () => {
      await achievements.getAvailable();
      expect(fetchWithError).toHaveBeenCalledWith('/api/achievements/available');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ items: [{ id: 1 }] });
      const result = await achievements.getAvailable();
      expect(result).toEqual({ items: [{ id: 1 }] });
    });
  });

  describe('getUserAchievements', () => {
    it('calls GET /api/achievements/user/:userId', async () => {
      await achievements.getUserAchievements('user-42');
      expect(fetchWithError).toHaveBeenCalledWith('/api/achievements/user/user-42');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ achievements: [] });
      const result = await achievements.getUserAchievements('u1');
      expect(result).toEqual({ achievements: [] });
    });
  });

  describe('createTestAchievement', () => {
    it('calls POST /api/achievements/test-create with userId', async () => {
      await achievements.createTestAchievement('user-99');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/achievements/test-create',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"userId":"user-99"'),
        })
      );
    });

    it('includes title and icon in the body', async () => {
      await achievements.createTestAchievement('u1');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('icon');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('network'));
      await expect(achievements.createTestAchievement('u1')).rejects.toThrow('network');
    });
  });
});
