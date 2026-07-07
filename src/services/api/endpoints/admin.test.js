import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn() },
}));

import { fetchWithError } from '../fetcher';
import admin from './admin';

describe('admin endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ payload: {} });
  });

  describe('getSuccessModalPreview', () => {
    it('calls GET /api/admin/success-modal-preview with default params', async () => {
      await admin.getSuccessModalPreview();
      const [url] = fetchWithError.mock.calls[0];
      expect(url).toContain('/api/admin/success-modal-preview');
      expect(url).toContain('type=problem');
      expect(url).toContain('variant=level-up');
    });

    it('calls with provided type and variant', async () => {
      await admin.getSuccessModalPreview({ type: 'tower', variant: 'no-level-up' });
      const [url] = fetchWithError.mock.calls[0];
      expect(url).toContain('type=tower');
      expect(url).toContain('variant=no-level-up');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ payload: { xp: 100 } });
      const result = await admin.getSuccessModalPreview();
      expect(result.payload).toEqual({ xp: 100 });
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('forbidden'));
      await expect(admin.getSuccessModalPreview()).rejects.toThrow('forbidden');
    });
  });
});
