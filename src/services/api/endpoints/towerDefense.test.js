import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../fetcher', () => ({
  fetchWithError: vi.fn(),
}));

vi.mock('../../../utils/core/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  API_URL: 'https://api.example.test',
}));

import { fetchWithError } from '../fetcher';
import towerDefense from './towerDefense';

const mockResponse = ({ ok = true, status = 200, statusText = 'OK', jsonData = {} } = {}) => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(jsonData),
});

describe('towerDefense endpoint wrapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    fetchWithError.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('submits and fetches score records with expected endpoint payloads', async () => {
    fetchWithError.mockResolvedValueOnce({ saved: true });
    fetchWithError.mockResolvedValueOnce({ scores: [] });
    fetchWithError.mockResolvedValueOnce({ bulk: true });

    const submitResult = await towerDefense.submitScore(
      'u-1',
      'p-1',
      'PASSED',
      'won',
      999,
      123,
      'LEETCODE',
      { wave: 5 }
    );
    const getResult = await towerDefense.getScores('u-1');
    const bulkResult = await towerDefense.getScoresBulk('u-1', ['p-1', 'p-2'], 'AI');

    expect(submitResult).toEqual({ saved: true });
    expect(getResult).toEqual({ scores: [] });
    expect(bulkResult).toEqual({ bulk: true });

    expect(fetchWithError).toHaveBeenNthCalledWith(1, '/api/tower-defense/scores', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'u-1',
        problemId: 'p-1',
        solutionStatus: 'PASSED',
        gameStatus: 'won',
        score: 999,
        time: 123,
        problemType: 'LEETCODE',
        wave: 5,
      }),
    });
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/tower-defense/scores/u-1');
    expect(fetchWithError).toHaveBeenNthCalledWith(3, '/api/tower-defense/scores/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u-1', problemIds: ['p-1', 'p-2'], problemType: 'AI' }),
    });
  });

  it('generates snippets with derived user/session data and stores rate-limit state', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    localStorage.setItem('user_id', '42');
    localStorage.setItem('email_verified', 'true');
    localStorage.setItem('membership_tier', 'pro');

    fetchWithError.mockResolvedValue({
      snippet: 'for i in range(10): pass',
      rateLimit: {
        limit: 20,
        remaining: 19,
        reset: 'later',
        resetIn: 120,
        resetPeriod: 86_400,
      },
    });

    const context = { language: 'python', code: 'print(1)', problem: 'two sum', towerCount: 2 };
    const data = await towerDefense.generateSnippet(context, 'ForLoop');

    expect(data.snippet).toContain('for i');
    expect(fetchWithError).toHaveBeenCalledWith('/api/tower-defense/generate-snippet', {
      method: 'POST',
      body: expect.stringContaining('"towerType":"ForLoop"'),
    });

    const body = JSON.parse(fetchWithError.mock.calls[0][1].body);
    expect(body.userInfo).toEqual(
      expect.objectContaining({
        status: 'verified',
        userId: '42',
        membershipTier: 'PREMIUM',
      })
    );
    expect(body.userInfo.sessionToken).toContain('session_1700000000000_');

    const stored = JSON.parse(localStorage.getItem('snippet_rate_42'));
    expect(stored).toEqual(
      expect.objectContaining({
        limit: 20,
        remaining: 19,
        resetIn: 120,
      })
    );
  });

  it('returns explicit rate-limited payload for snippet generation 429s', async () => {
    fetchWithError.mockRejectedValue({
      status: 429,
      data: {
        error: 'Rate limit exceeded',
        message: 'Too many requests',
        rateLimit: { remaining: 0, limit: 5 },
      },
      message: '429',
    });

    const result = await towerDefense.generateSnippet({ language: 'javascript' }, 'Function');

    expect(result).toEqual({
      rateLimited: true,
      rateLimit: { remaining: 0, limit: 5 },
      error: 'Rate limit exceeded',
      message: 'Too many requests',
    });
  });

  it('checks rate limits via direct fetch and persists normalized values', async () => {
    fetchWithError.mockResolvedValue({
      limit: 10,
      remaining: 7,
      reset: 123456,
      resetIn: 300,
      resetPeriod: 600,
    });

    const data = await towerDefense.checkRateLimit({
      status: 'anonymous',
      sessionToken: 'session-1',
      membershipTier: 'FREE',
    });

    expect(data).toEqual({
      limit: 10,
      remaining: 7,
      reset: 123456,
      resetIn: 300,
      resetPeriod: 600,
    });
    expect(fetchWithError).toHaveBeenCalledTimes(1);

    const calledUrl = new URL(`https://api.example.test${fetchWithError.mock.calls[0][0]}`);
    expect(calledUrl.origin).toBe('https://api.example.test');
    expect(calledUrl.pathname).toBe('/api/tower-defense/rate-limit-status');
    expect(calledUrl.searchParams.get('status')).toBe('anonymous');
    expect(calledUrl.searchParams.get('sessionToken')).toBe('session-1');
    expect(calledUrl.searchParams.get('membershipTier')).toBe('FREE');

    expect(fetchWithError).toHaveBeenCalledWith(
      expect.stringContaining('/api/tower-defense/rate-limit-status?'),
      {
        method: 'GET',
      }
    );

    expect(JSON.parse(localStorage.getItem('snippet_rate_anonymous'))).toEqual(
      expect.objectContaining({
        limit: 10,
        remaining: 7,
        resetIn: 300,
      })
    );
  });

  it('falls back to tier-based limits when rate status check fails', async () => {
    global.fetch.mockRejectedValue(new Error('upstream unavailable'));

    localStorage.setItem('user_id', '88');
    localStorage.setItem('email_verified', 'true');
    expect(await towerDefense.checkRateLimit()).toEqual(
      expect.objectContaining({ limit: 20, remaining: 20, resetPeriod: 86_400 })
    );

    localStorage.setItem('email_verified', 'false');
    expect(await towerDefense.checkRateLimit()).toEqual(
      expect.objectContaining({ limit: 10, remaining: 10, resetPeriod: 600 })
    );

    localStorage.removeItem('user_id');
    expect(await towerDefense.checkRateLimit()).toEqual(
      expect.objectContaining({ limit: 5, remaining: 5, resetPeriod: 600 })
    );
  });

  it('adds snippet credits with normalized user payload', async () => {
    localStorage.setItem('user_id', '77');
    localStorage.setItem('email_verified', 'true');
    localStorage.setItem('membership_tier', 'free');

    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-long' })
      .mockResolvedValueOnce({ ok: true });
    const result = await towerDefense.addSnippetCredit(null, 'long');

    expect(result).toEqual({ ok: true });
    expect(fetchWithError).toHaveBeenNthCalledWith(
      1,
      '/api/auth/ad-proof?placement=tower-defense-snippet-credit&adType=long'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/tower-defense/add-snippet-credit', {
      method: 'POST',
      body: expect.any(String),
    });

    const body = JSON.parse(fetchWithError.mock.calls[1][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        status: 'verified',
        userId: '77',
        adType: 'long',
        adProofToken: 'proof-long',
        membershipTier: 'free',
      })
    );
    expect(body.sessionToken).toContain('session_');
  });

  it('refines solutions by forwarding direct responses or extracting code from raw AI output', async () => {
    fetchWithError.mockResolvedValueOnce({ error: 'rate-limited', showAd: true });
    fetchWithError.mockResolvedValueOnce({ refinedCode: 'return 42;', meta: true });
    fetchWithError.mockResolvedValueOnce({ response: '```python\nprint(42)\n```' });
    fetchWithError.mockResolvedValueOnce({
      response:
        "Here's the refined code:\nfunction solve() { return 1; }\n\nImprovements: simplified flow",
    });

    const params = {
      code: 'old',
      language: 'javascript',
      userId: 'u',
      membershipTier: 'FREE',
      problem: { id: 1, titleSlug: 'two-sum' },
    };

    expect(await towerDefense.refineSolution(params)).toEqual({
      error: 'rate-limited',
      showAd: true,
    });
    expect(await towerDefense.refineSolution(params)).toEqual({
      refinedCode: 'return 42;',
      meta: true,
    });

    const markdownExtracted = await towerDefense.refineSolution(params);
    expect(markdownExtracted.refinedCode).toBe('print(42)');

    const cleaned = await towerDefense.refineSolution(params);
    expect(cleaned.refinedCode).toContain('function solve() { return 1; }');
    expect(cleaned.refinedCode.toLowerCase()).not.toContain('improvements');
  });

  it('resets refinement limits through the expected endpoint and rethrows failures', async () => {
    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-reset' })
      .mockResolvedValueOnce({ reset: true });
    await expect(towerDefense.resetRefinementLimit('u-100')).resolves.toEqual({ reset: true });
    expect(fetchWithError).toHaveBeenNthCalledWith(
      1,
      '/api/auth/ad-proof?placement=tower-defense-reset-refinement&adType=full'
    );
    expect(fetchWithError).toHaveBeenNthCalledWith(2, '/api/tower-defense/reset-refinement-limit', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u-100', adProofToken: 'proof-reset' }),
    });

    fetchWithError
      .mockResolvedValueOnce({ proofToken: 'proof-reset-2' })
      .mockRejectedValueOnce(new Error('reset failed'));
    await expect(towerDefense.resetRefinementLimit('u-100')).rejects.toThrow('reset failed');
  });
});
