import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn() },
}));

import { fetchWithError } from '../fetcher';
import learningProblems from './learningProblems';

describe('learningProblems endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    learningProblems._clearCache();
    fetchWithError.mockResolvedValue({ problem: {} });
  });

  describe('getById', () => {
    it('calls GET /api/learning-problems/:titleSlug', async () => {
      await learningProblems.getById('two-sum');
      expect(fetchWithError).toHaveBeenCalledWith('/api/learning-problems/two-sum');
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ title: 'Two Sum', difficulty: 'easy' });
      const result = await learningProblems.getById('two-sum');
      expect(result.title).toBe('Two Sum');
    });

    it('propagates errors', async () => {
      fetchWithError.mockRejectedValue(new Error('not found'));
      await expect(learningProblems.getById('missing')).rejects.toThrow('not found');
    });
  });

  describe('runCode', () => {
    it('calls POST /api/learning-problems/run-code', async () => {
      await learningProblems.runCode('print("hi")', 'hello-world', 'python');
      expect(fetchWithError).toHaveBeenCalledWith(
        '/api/learning-problems/run-code',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('sends code, titleSlug, language, and outputOnly in body', async () => {
      await learningProblems.runCode('x = 1', 'variables', 'python', true);
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body).toEqual({
        code: 'x = 1',
        titleSlug: 'variables',
        language: 'python',
        outputOnly: true,
      });
    });

    it('defaults outputOnly to false', async () => {
      await learningProblems.runCode('x = 1', 'variables', 'python');
      const [, opts] = fetchWithError.mock.calls[0];
      const body = JSON.parse(opts.body);
      expect(body.outputOnly).toBe(false);
    });

    it('returns the response', async () => {
      fetchWithError.mockResolvedValue({ output: 'hi', passed: true });
      const result = await learningProblems.runCode('print("hi")', 'hello-world', 'python');
      expect(result.passed).toBe(true);
    });
  });
});
