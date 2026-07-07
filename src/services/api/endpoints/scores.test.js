import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn() },
}));

import { fetchWithError } from '../fetcher';
import scores from './scores';

describe('scores endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchWithError.mockResolvedValue({ score: 100 });
  });

  describe('update', () => {
    it('calls POST /api/scores/update', async () => {
      await scores.update('user-1', 'prob-1', 95, 120);
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/scores/update',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends all required fields in body', async () => {
      await scores.update('u1', 'p1', 80, 200, 'TOWER_DEFENSE');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({
        userId: 'u1',
        problemId: 'p1',
        newScore: 80,
        newTime: 200,
        problemType: 'TOWER_DEFENSE',
      });
    });

    it('defaults problemType to CODEGRIND', async () => {
      await scores.update('u1', 'p1', 100, 60);
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.problemType).toBe('CODEGRIND');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('server error'));
      await expect(scores.update('u1', 'p1', 100, 60)).rejects.toThrow('server error');
    });
  });

  describe('get', () => {
    it('calls GET /api/scores/:userId/:problemId/:problemType', async () => {
      await scores.get('u1', 'p1', 'LEETCODE');
      expect(fetchWithError).toHaveBeenCalledWith('/api/scores/u1/p1/LEETCODE');
    });

    it('defaults problemType to CODEGRIND', async () => {
      await scores.get('u1', 'p1');
      expect(fetchWithError).toHaveBeenCalledWith('/api/scores/u1/p1/CODEGRIND');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ score: 42 });
      const result = await scores.get('u1', 'p1');
      expect(result).toEqual({ score: 42 });
    });
  });

  describe('getBulk', () => {
    it('calls POST /api/scores/bulk', async () => {
      await scores.getBulk('u1', ['p1', 'p2']);
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/scores/bulk',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends userId, problemIds, and problemType in body', async () => {
      await scores.getBulk('u1', ['p1', 'p2'], 'TOWER_DEFENSE');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({
        userId: 'u1',
        problemIds: ['p1', 'p2'],
        problemType: 'TOWER_DEFENSE',
      });
    });

    it('defaults problemIds to empty array', async () => {
      await scores.getBulk('u1');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.problemIds).toEqual([]);
    });

    it('defaults problemType to CODEGRIND', async () => {
      await scores.getBulk('u1', ['p1']);
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.problemType).toBe('CODEGRIND');
    });
  });
});
