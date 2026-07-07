import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import models from './models';

describe('models endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ tier: 'free', feature: 'chat', models: [] });
  });

  describe('getAvailable', () => {
    it('calls GET /api/models with feature query param', async () => {
      await models.getAvailable('chat');
      expect(fetchWithError).toHaveBeenCalledWith('/api/models?feature=chat');
    });

    it('defaults feature to chat', async () => {
      await models.getAvailable();
      expect(fetchWithError).toHaveBeenCalledWith('/api/models?feature=chat');
    });

    it('URL-encodes the feature parameter', async () => {
      await models.getAvailable('problem');
      expect(fetchWithError).toHaveBeenCalledWith('/api/models?feature=problem');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({
        tier: 'pro',
        feature: 'snippet',
        models: [{ id: 'openrouter/free', displayName: 'Auto (Free)', isDefault: true }],
      });
      const result = await models.getAvailable('snippet');
      expect(result.models).toHaveLength(1);
      expect(result.models[0].id).toBe('openrouter/free');
      expect(result.models[0].displayName).toBe('Auto (Free)');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('unauthorized'));
      await expect(models.getAvailable('chat')).rejects.toThrow('unauthorized');
    });
  });
});
