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

vi.mock('../config', () => ({
  API_URL: 'http://api.example.test',
}));

import { fetchWithError } from '../fetcher';
import problems from './problems';

describe('problems endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('builds paginated list query with and without difficulty', () => {
    problems.getAll('EASY', 2, 20);
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/problems?difficulty=EASY&page=2&limit=20'
    );

    problems.getAll(undefined, 1, 10);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/problems?page=1&limit=10');
  });

  it('includes source filter when provided', () => {
    problems.getAll('EASY', 2, 20, 'CODEGRIND');

    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/problems?difficulty=EASY&page=2&limit=20&source=CODEGRIND'
    );
  });

  it('gets problem by slug', () => {
    problems.getById('two-sum');

    expect(fetchWithError).toHaveBeenCalledWith('/api/problems/two-sum');
  });

  it('looks up problems by slugs', () => {
    problems.lookupBySlugs(['a', 'b']);

    expect(fetchWithError).toHaveBeenCalledWith('/api/problems/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: ['a', 'b'] }),
    });
  });

  it('runs code with expected payload mapping', async () => {
    await problems.runCode(
      'print(1)',
      'pid',
      'two-sum',
      { name: 'twoSum' },
      true,
      'u1',
      'ranked',
      'python',
      'HARD',
      123,
      2,
      true
    );

    const call = fetchWithError.mock.calls.at(-1);
    const [url, options] = call;
    const payload = JSON.parse(options.body);

    expect(url).toBe('/api/run-code');
    expect(options.method).toBe('POST');
    expect(payload).toEqual({
      code: 'print(1)',
      problemId: 'pid',
      titleSlug: 'two-sum',
      metaData: { name: 'twoSum' },
      isSubmission: true,
      userId: 'u1',
      mode: 'ranked',
      language: 'python',
      problem_difficulty: 'HARD',
      newTime: 123,
      aiUsageCount: 2,
      outputOnly: true,
    });
  });

  it('checks test cases and gets next problem', async () => {
    problems.checkTestCases('two-sum');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/problems/two-sum/test-cases');

    fetchWithError.mockResolvedValueOnce({ titleSlug: 'next-problem' });

    await problems.getNextProblem(77);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/problems/next/77');
  });

  it('falls back to list ordering when next endpoint fails', async () => {
    fetchWithError
      .mockRejectedValueOnce(new Error('legacy cursor mismatch'))
      .mockResolvedValueOnce({
        questions: [
          { titleSlug: 'alpha', questionId: '1' },
          { titleSlug: 'beta', questionId: '2' },
          { titleSlug: 'gamma', questionId: '3' },
        ],
      });

    const result = await problems.getNextProblem('beta');

    expect(fetchWithError).toHaveBeenNthCalledWith(1, '/api/problems/next/beta');
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/problems?page=1&limit=1000');
    expect(result).toMatchObject({ titleSlug: 'gamma' });
  });
});
