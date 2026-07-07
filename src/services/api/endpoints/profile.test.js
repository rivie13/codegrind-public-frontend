import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import profile from './profile';

describe('profile endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ user: { id: '1' } });
  });

  describe('getPublicProfile', () => {
    it('calls GET /api/profile/:userId', async () => {
      await profile.getPublicProfile('user-123');
      expect(fetchWithError).toHaveBeenCalledWith('/api/profile/user-123');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ username: 'alice' });
      const result = await profile.getPublicProfile('u1');
      expect(result).toEqual({ username: 'alice' });
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('not found'));
      await expect(profile.getPublicProfile('unknown')).rejects.toThrow('not found');
    });
  });
});
