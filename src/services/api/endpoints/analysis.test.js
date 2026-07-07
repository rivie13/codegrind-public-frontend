import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

import { fetchWithError } from '../fetcher';
import analysis from './analysis';

describe('analysis endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({
      analysis: '',
      suggestions: [],
      model: 'gpt-4',
      cached: false,
    });
  });

  describe('analyzeSubmission', () => {
    it('calls POST /api/analysis/submission with submissionId', async () => {
      await analysis.analyzeSubmission(42);
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/analysis/submission',
        expect.objectContaining({ method: 'POST' })
      );
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.submissionId).toBe(42);
    });

    it('includes model in body when provided', async () => {
      await analysis.analyzeSubmission(1, 'gpt-4.1');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.model).toBe('gpt-4.1');
    });

    it('omits model from body when not provided', async () => {
      await analysis.analyzeSubmission(1);
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).not.toHaveProperty('model');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ analysis: 'Good code', suggestions: [] });
      const result = await analysis.analyzeSubmission(5);
      expect(result.analysis).toBe('Good code');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('analysis failed'));
      await expect(analysis.analyzeSubmission(99)).rejects.toThrow('analysis failed');
    });
  });

  describe('getUsage', () => {
    it('calls GET /api/analysis/usage', async () => {
      await analysis.getUsage();
      expect(fetchWithError).toHaveBeenCalledWith('/api/analysis/usage');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ tier: 'pro', used: 3, limit: 10, available: 7 });
      const result = await analysis.getUsage();
      expect(result).toEqual({ tier: 'pro', used: 3, limit: 10, available: 7 });
    });
  });
});
