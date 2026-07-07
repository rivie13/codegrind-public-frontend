import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { fetchWithError } from '../fetcher';
import aiProblems from './aiProblems';

describe('aiProblems endpoint wrapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('builds list and generation requests', () => {
    aiProblems.getAll('HARD', 3, 25);
    expect(fetchWithError).toHaveBeenLastCalledWith(
      '/api/ai-problems?difficulty=HARD&page=3&limit=25'
    );

    aiProblems.getAll(undefined, 1, 10);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems?page=1&limit=10');

    aiProblems.generate({
      step: 'description',
      problemType: 'array',
      difficulty: 'EASY',
      language: 'python',
      model: 'gpt',
      userId: 'u1',
      wackiness: 1,
      additionalInfo: 'extra',
    });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'description',
        data: {
          problemType: 'array',
          difficulty: 'EASY',
          language: 'python',
          model: 'gpt',
          userId: 'u1',
          wackiness: 1,
          additionalInfo: 'extra',
          previousData: {},
        },
      }),
    });
  });

  it('calls primary CRUD-like endpoints', async () => {
    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-long' })
      .mockResolvedValueOnce({ ok: true });

    await aiProblems.addGenerationCredit('long');
    expect(fetchWithError).toHaveBeenNthCalledWith(
      1,
      '/api/auth/ad-proof?placement=ai-problem-generation-credit&adType=long'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/ai-problems/add-generation-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType: 'long', adProofToken: 'proof-long' }),
    });

    aiProblems.getRateLimitStatus();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/rate-limit-status');

    aiProblems.saveProblem({ title: 'A' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'A' }),
    });

    aiProblems.getById('two-sum-ai');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/two-sum-ai');
  });

  it('runs code and handles temporary problem cache endpoints', () => {
    aiProblems.runCode('print(1)', 'slug-1', 'python', { python: 'print(1)' }, true);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/run-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'print(1)',
        titleSlug: 'slug-1',
        language: 'python',
        codeSnippets: { python: 'print(1)' },
        outputOnly: true,
      }),
    });

    aiProblems.saveTempProblem({ foo: 'bar' });
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/save-temp-problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });

    aiProblems.clearTempProblem('slug-1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/clear-temp-problem/slug-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    aiProblems.clearAllTempProblems();
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/clear-all-temp-problems', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('submits solutions, updates scores, and resolves next-problem URLs', () => {
    aiProblems.submit('code', 'slug', 'javascript', 'u1', 'ranked', 123, { js: 'const x = 1;' }, 4);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'code',
        titleSlug: 'slug',
        language: 'javascript',
        userId: 'u1',
        mode: 'ranked',
        newTime: 123,
        codeSnippets: { js: 'const x = 1;' },
        aiUsageCount: 4,
      }),
    });

    aiProblems.updateScore('u1', 'p1', 900, 77);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/update-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', problemId: 'p1', newScore: 900, newTime: 77 }),
    });

    aiProblems.getNextProblem('p1');
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/next/p1');

    aiProblems.getNextProblem('p2', 13);
    expect(fetchWithError).toHaveBeenLastCalledWith('/api/ai-problems/next/p2?displayNumber=13');
  });
});
